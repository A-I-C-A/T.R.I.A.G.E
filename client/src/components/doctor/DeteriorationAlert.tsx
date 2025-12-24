import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Clock, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface AIPrediction {
  riskScore: number;
  deteriorationProbability: number;
  predictedEscalationTime: string | null;
  confidence: number;
  predictedPriority: string;
  aiReasoning: string[];
  shapValues: Record<string, number>;
}

interface DeteriorationAlertProps {
  prediction: AIPrediction;
  currentPriority: string;
  patientName: string;
}

export const DeteriorationAlert: React.FC<DeteriorationAlertProps> = ({
  prediction,
  currentPriority,
  patientName
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timeToEscalation, setTimeToEscalation] = useState<string>('');

  useEffect(() => {
    if (prediction.predictedEscalationTime) {
      const updateTimer = () => {
        const now = new Date();
        const escalationTime = new Date(prediction.predictedEscalationTime!);
        const diff = escalationTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeToEscalation(`${minutes}m ${seconds}s`);
        } else {
          setTimeToEscalation('NOW');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [prediction.predictedEscalationTime]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    if (score >= 60) return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
  };

  const showWarning = prediction.predictedPriority !== currentPriority || prediction.riskScore >= 60;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4"
        >
          <Card className={`border-2 ${getRiskBgColor(prediction.riskScore)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Brain className={`h-5 w-5 ${getRiskColor(prediction.riskScore)}`} />
                  <CardTitle className="text-lg">AI Early Warning System</CardTitle>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Brain className="h-3 w-3" />
                  {(prediction.confidence * 100).toFixed(0)}% confident
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Risk Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deterioration Risk</span>
                  <span className={`text-xl font-bold ${getRiskColor(prediction.riskScore)}`}>
                    {prediction.riskScore}%
                  </span>
                </div>
                <Progress value={prediction.riskScore} className="h-2" />
              </div>

              {/* Escalation Warning */}
              {prediction.predictedEscalationTime && (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Predicted Escalation: {currentPriority} → {prediction.predictedPriority}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Estimated time: <span className="font-mono font-bold">{timeToEscalation}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Reasoning */}
              {prediction.aiReasoning.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">AI Analysis:</p>
                  <ul className="space-y-1">
                    {prediction.aiReasoning.slice(0, showDetails ? undefined : 3).map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Toggle Details */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Feature Importance
                  </>
                )}
              </Button>

              {/* SHAP Values (Feature Importance) */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2 border-t"
                  >
                    <p className="text-sm font-medium">Why AI predicted this risk:</p>
                    {Object.entries(prediction.shapValues)
                      .filter(([_, value]) => value > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .map(([feature, value]) => (
                        <div key={feature} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-xs">+{value} pts</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-orange-600 dark:bg-orange-400 h-1.5 rounded-full"
                              style={{ width: `${Math.min((value / 40) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
