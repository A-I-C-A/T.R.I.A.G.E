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
      return null;
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
