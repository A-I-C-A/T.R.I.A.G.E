import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { initializeWebSocket } from './websocket/handler';
import { errorHandler } from './middleware/errorHandler';
import { SchedulerService } from './services/schedulerService';
import logger from './utils/logger';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import hospitalRoutes from './routes/hospitals';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:",
        "https://*.tile.openstreetmap.org",
        "https://unpkg.com"
      ],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- ML Service Proxy Routes ---
import { aiService } from './services/aiService';

app.post('/api/nlp/extract', async (req, res) => {
  try {
    const extraction = await aiService.extractFromChiefComplaint(req.body.text);
    if (extraction) {
      res.json({ success: true, extraction });
    } else {
      res.status(500).json({ success: false, error: 'ML extraction failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/predict/deterioration', async (req, res) => {
  try {
    const prediction = await aiService.predictDeterioration(req.body);
    console.log('[AI DEBUG] /api/predict/deterioration request:', req.body);
    console.log('[AI DEBUG] /api/predict/deterioration response:', prediction);
    if (prediction) {
      res.json({ success: true, prediction });
    } else {
      res.status(500).json({ success: false, error: 'ML prediction failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/forecast/surge', async (req, res) => {
  try {
    const { hospitalId, historicalData, hoursAhead = 6 } = req.body;
    let forecast = await aiService.forecastSurge(hospitalId, historicalData, hoursAhead);

    // If AI service returned null, provide a deterministic demo forecast so frontend can render charts
    if (!forecast) {
      const now = new Date();
      const hourlyPattern: Record<number, number> = {
        0: 5,1:3,2:2,3:2,4:3,5:5,6:8,7:12,8:15,9:18,10:20,11:22,12:20,13:18,14:19,15:21,16:23,17:25,18:22,19:18,20:15,21:12,22:10,23:7
      };

      const hourly_forecast: any[] = [];
      const baseValues: number[] = [];

      for (let i = 0; i < hoursAhead; i++) {
        const target = new Date(now.getTime() + (i + 1) * 3600 * 1000);
        const hour = target.getHours();
        const base = hourlyPattern[hour] || 15;
        // small deterministic variation for demo visualization
        const variation = (i % 3 === 0) ? 5 : (i % 5 === 0) ? -3 : 0;
        const predicted = Math.max(0, Math.round(base + variation));
        hourly_forecast.push({
          timestamp: target.toISOString(),
          hour,
          predicted_patient_count: predicted,
          confidence_lower: Math.max(0, Math.floor(predicted * 0.8)),
          confidence_upper: Math.ceil(predicted * 1.25)
        });
        baseValues.push(base);
      }

      const avg = Math.round(baseValues.reduce((a, b) => a + b, 0) / baseValues.length || 0);
      const variance = baseValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / baseValues.length || 0;
      const std = Math.sqrt(variance);
      const surge_threshold = Math.max(20, Math.round(avg + 1.5 * std));
      const surge_detected = hourly_forecast.some(f => f.predicted_patient_count > surge_threshold);
      const peak_hour = hourly_forecast.reduce((p, c) => (c.predicted_patient_count > (p.predicted_patient_count || 0) ? c : p), hourly_forecast[0]);

      const recommendations: any[] = [];
      if (surge_detected) {
        const peak_count = peak_hour.predicted_patient_count;
        recommendations.push({ type: 'staffing', priority: 'high', action: `Call in extra staff for ${new Date(peak_hour.timestamp).toLocaleTimeString()}`, details: `Expected ${peak_count} patients`, icon: 'users' });
        recommendations.push({ type: 'beds', priority: 'high', action: 'Prepare extra beds', details: `Prepare ${Math.max(1, Math.round((peak_count - avg) * 0.6))} extra beds`, icon: 'bed' });
        recommendations.push({ type: 'communication', priority: 'medium', action: 'Alert neighboring hospitals', details: 'Coordinate potential patient transfers', icon: 'phone' });
      } else {
        recommendations.push({ type: 'normal', priority: 'low', action: 'Maintain standard staffing', details: 'No surge expected', icon: 'package' });
      }

      forecast = {
        hourly_forecast,
        surge_detected,
        surge_threshold,
        current_average: avg,
        peak_hour,
        recommendations,
        confidence: 0.65,
        model_version: 'fallback'
      };
    }

    res.json({ success: true, forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// Health check for AI service (for doctor panel)
app.get('/api/nlp/extract/health', async (req, res) => {
  try {
    const response = await aiService.checkHealth();
    res.json({ status: response ? 'healthy' : 'unavailable' });
  } catch (err) {
    res.status(500).json({ status: 'unavailable', error: err.message });
  }
});
// --- END ML Service Proxy Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.use(errorHandler);

const startServer = async () => {
  try {
    // Redis disabled - not needed for core functionality
    console.log('ℹ️  Redis disabled - running without cache');

    initializeWebSocket(server);
    logger.info('WebSocket initialized');

    SchedulerService.startScheduledJobs();
    logger.info('Background jobs scheduled');

    server.listen(PORT, () => {
      logger.info(`🏥 TRIAGELOCK Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n✅ Server ready! You can now test the API');
      console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
