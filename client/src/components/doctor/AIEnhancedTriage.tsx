import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeteriorationAlert } from './DeteriorationAlert';
import { ChiefComplaintNLP } from './ChiefComplaintNLP';

interface AIEnhancedTriageProps {
  patientId?: number;
  vitalSigns: any;
  symptoms: any[];
  riskFactors: any[];
  age?: number;
  currentPriority: string;
  waitingTime: number;
  onAIPredictionReceived?: (prediction: any) => void;
}

export const AIEnhancedTriage: React.FC<AIEnhancedTriageProps> = ({
  patientId,
  vitalSigns,
  symptoms,
  riskFactors,
  age,
  currentPriority,
  waitingTime,
  onAIPredictionReceived
}) => {
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiServiceAvailable, setAiServiceAvailable] = useState(false);

  useEffect(() => {
    checkAIService();
  }, []);

  useEffect(() => {
    if (aiServiceAvailable && vitalSigns) {
      fetchAIPrediction();
    }
  }, [vitalSigns, symptoms, riskFactors, waitingTime, aiServiceAvailable]);

  const checkAIService = async () => {
    try {
      const response = await fetch(`/api/nlp/extract/health`);
      const data = await response.json();
      setAiServiceAvailable(data.status === 'healthy');
    } catch (error) {
      setAiServiceAvailable(false);
    }
  };

  const fetchAIPrediction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/predict/deterioration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitalSigns,
          age,
          currentPriority,
          waitingTime,
          symptoms,
          riskFactors
        })
      });

      const data = await response.json();
      if (data.success) {
        const prediction = {
          riskScore: data.prediction.risk_score,
          deteriorationProbability: data.prediction.deterioration_probability,
          predictedEscalationTime: data.prediction.predicted_escalation_time,
          confidence: data.prediction.confidence,
          predictedPriority: data.prediction.predicted_priority,
          aiReasoning: data.prediction.ai_reasoning,
          shapValues: data.prediction.shap_values
        };
        setAiPrediction(prediction);
        if (onAIPredictionReceived) {
          onAIPredictionReceived(prediction);
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!aiServiceAvailable) {
    return (
      <Card className="border-gray-300 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Brain className="h-5 w-5" />
            <span className="text-sm">AI features offline - using rule-based triage only</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Service Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold">AI-Enhanced Triage</span>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          AI Active
        </Badge>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-600">Analyzing patient data...</p>
          </CardContent>
        </Card>
      )}

      {/* Deterioration Alert */}
      {aiPrediction && !isLoading && (
        <DeteriorationAlert
          prediction={aiPrediction}
          currentPriority={currentPriority}
          patientName={patientId ? `Patient #${patientId}` : 'Patient'}
        />
      )}

      {/* Refresh Button */}
      <Button
        onClick={fetchAIPrediction}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="w-full"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        {isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}
      </Button>
    </div>
  );
};
