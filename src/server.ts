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
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
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
