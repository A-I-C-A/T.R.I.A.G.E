import axios from 'axios';
import logger from '../utils/logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export interface DeteriorationPrediction {
  risk_score: number;
  deterioration_probability: number;
  predicted_escalation_time: string | null;
  confidence: number;
  predicted_priority: string;
  ai_reasoning: string[];
  shap_values: Record<string, number>;
  model_version: string;
}

export interface NLPExtraction {
  extracted_symptoms: Array<{
    symptom: string;
    severity: string;
    category: string;
    confidence: number;
  }>;
  extracted_conditions: Array<{
    condition: string;
    type: string;
    confidence: number;
  }>;
  predicted_specialty: string;
  predicted_severity: string;
  confidence: number;
  language_detected: string;
  suggestions: {
    additional_symptoms_to_check: string[];
    recommended_tests: string[];
    risk_factors_to_assess: string[];
  };
  raw_text: string;
}

export interface SurgeForecast {
  hourly_forecast: Array<{
    timestamp: string;
    hour: number;
    predicted_patient_count: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
  surge_detected: boolean;
  surge_threshold: number;
  current_average: number;
  peak_hour: any;
  recommendations: Array<{
    type: string;
    priority: string;
    action: string;
    details: string;
    icon: string;
  }>;
  confidence: number;
  model_version: string;
}

class AIService {
  private isAvailable: boolean = false;

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, {
        timeout: 3000
      });
      this.isAvailable = response.data.status === 'healthy';
      return this.isAvailable;
    } catch (error) {
      logger.warn('ML service unavailable', { error });
      this.isAvailable = false;
      return false;
    }
  }

  async predictDeterioration(patientData: {
    vitalSigns: any;
    age?: number;
    currentPriority: string;
    waitingTime: number;
    symptoms: any[];
    riskFactors: any[];
  }): Promise<DeteriorationPrediction | null> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/predict/deterioration`, patientData, {
        timeout: 5000
      });
      
      if (response.data.success) {
        return response.data.prediction;
      }
      return null;
    } catch (error: any) {
      logger.error('Deterioration prediction failed', { 
        error: error.message,
        patientData 
      });
      return null;
    }
  }

  async extractFromChiefComplaint(text: string): Promise<NLPExtraction | null> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/nlp/extract`, { text }, {
        timeout: 3000
      });
      
      if (response.data.success) {
        return response.data.extraction;
      }
      return null;
    } catch (error: any) {
      logger.error('NLP extraction failed', { 
        error: error.message,
        text 
      });
      return null;
    }
  }

  async forecastSurge(hospitalId: number, historicalData: any[], hoursAhead: number = 6): Promise<SurgeForecast | null> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/forecast/surge`, {
        hospitalId,
        historicalData,
        hoursAhead
      }, {
        timeout: 5000
      });
      
      if (response.data.success) {
        return response.data.forecast;
      }
      return null;
    } catch (error: any) {
      logger.error('Surge forecast failed', { 
        error: error.message,
        hospitalId 
      });

      // Fallback: return a deterministic default 6-hour forecast so frontend charts always render
      try {
        const now = new Date();
        const hourlyPattern: Record<number, number> = {
          0: 5,1:3,2:2,3:2,4:3,5:5,6:8,7:12,8:15,9:18,10:20,11:22,12:20,13:18,14:19,15:21,16:23,17:25,18:22,19:18,20:15,21:12,22:10,23:7
        };
        const forecasts: any[] = [];
        const baseValues: number[] = [];
        for (let i = 0; i < hoursAhead; i++) {
          const target = new Date(now.getTime() + (i+1) * 3600 * 1000);
          const hour = target.getHours();
          const base = hourlyPattern[hour] || 15;
          baseValues.push(base);
          const predicted = Math.max(0, Math.round(base));
          forecasts.push({
            timestamp: target.toISOString(),
            hour,
            predicted_patient_count: predicted,
            confidence_lower: Math.max(0, Math.floor(predicted * 0.8)),
            confidence_upper: Math.ceil(predicted * 1.25)
          });
        }

        const avg = Math.round(baseValues.reduce((a,b)=>a+b,0)/baseValues.length || 0);
        const variance = baseValues.reduce((s,v)=>s+Math.pow(v-avg,2),0)/baseValues.length || 0;
        const std = Math.sqrt(variance);
        const surge_threshold = Math.max(20, Math.round(avg + 1.5 * std));
        const surge_detected = forecasts.some(f => f.predicted_patient_count > surge_threshold);
        const peak_hour = forecasts.reduce((p,c)=> c.predicted_patient_count > (p.predicted_patient_count||0) ? c : p, forecasts[0]);

        const recommendations: any[] = [];
        if (surge_detected) {
          const peak_count = peak_hour.predicted_patient_count;
          recommendations.push({ type: 'staffing', priority: 'high', action: `Call in extra staff for ${new Date(peak_hour.timestamp).toLocaleTimeString()}`, details: `Expected ${peak_count} patients`, icon: 'users' });
          recommendations.push({ type: 'beds', priority: 'high', action: 'Prepare extra beds', details: `Prepare ${Math.max(1, Math.round((peak_count - avg) * 0.6))} extra beds`, icon: 'bed' });
        } else {
          recommendations.push({ type: 'normal', priority: 'low', action: 'Maintain standard staffing', details: 'No surge expected', icon: 'package' });
        }

        return {
          hourly_forecast: forecasts,
          surge_detected,
          surge_threshold,
          current_average: avg,
          peak_hour,
          recommendations,
          confidence: 0.65,
          model_version: 'fallback'
        };
      } catch (e) {
        logger.error('Fallback forecast failed', { error: e });
        return null;
      }
    }
  }

  getServiceStatus(): boolean {
    return this.isAvailable;
  }
}

export const aiService = new AIService();

// Initialize health check
aiService.checkHealth();

// Periodic health check every 60 seconds
setInterval(() => {
  aiService.checkHealth();
}, 60000);
