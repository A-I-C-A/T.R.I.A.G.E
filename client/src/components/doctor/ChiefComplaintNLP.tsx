import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Simple debounce function (no lodash dependency needed)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ExtractedSymptom {
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  category: string;
  confidence: number;
}

interface NLPExtraction {
  extractedSymptoms: ExtractedSymptom[];
  predictedSpecialty: string;
  predictedSeverity: string;
  confidence: number;
  suggestions: {
    additionalSymptomsToCheck: string[];
    recommendedTests: string[];
    riskFactorsToAssess: string[];
  };
}

interface ChiefComplaintNLPProps {
  value: string;
  onChange: (value: string) => void;
  onSymptomsExtracted?: (symptoms: ExtractedSymptom[]) => void;
  onSpecialtyDetected?: (specialty: string) => void;
}

export const ChiefComplaintNLP: React.FC<ChiefComplaintNLPProps> = ({
  value,
  onChange,
  onSymptomsExtracted,
  onSpecialtyDetected
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extraction, setExtraction] = useState<NLPExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = async (text: string) => {
    if (!text || text.length < 3) {
      setExtraction(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/nlp/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('NLP service unavailable');
      }

      const data = await response.json();

      if (data.success && data.extraction) {
        const extractionData: NLPExtraction = {
          extractedSymptoms: data.extraction.extracted_symptoms.map((s: any) => ({
            symptom: s.symptom,
            severity: s.severity as 'mild' | 'moderate' | 'severe' | 'critical',
            category: s.category,
            confidence: s.confidence
          })),
          predictedSpecialty: data.extraction.predicted_specialty,
          predictedSeverity: data.extraction.predicted_severity,
          confidence: data.extraction.confidence,
          suggestions: {
            additionalSymptomsToCheck: data.extraction.suggestions.additional_symptoms_to_check || [],
            recommendedTests: data.extraction.suggestions.recommended_tests || [],
            riskFactorsToAssess: data.extraction.suggestions.risk_factors_to_assess || []
          }
        };

        setExtraction(extractionData);

        // Notify parent components
        if (onSymptomsExtracted && extractionData.extractedSymptoms.length > 0) {
          onSymptomsExtracted(extractionData.extractedSymptoms);
        }
        if (onSpecialtyDetected) {
          onSpecialtyDetected(extractionData.predictedSpecialty);
        }
      }
    } catch (err) {
      console.error('NLP extraction failed:', err);
      setError('AI assistant unavailable');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounced analysis
  const debouncedAnalyze = useCallback(
    debounce((text: string) => analyzeText(text), 800),
    []
  );

  useEffect(() => {
    debouncedAnalyze(value);
  }, [value, debouncedAnalyze]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400';
      case 'severe':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const addSymptom = (symptom: ExtractedSymptom) => {
    if (onSymptomsExtracted) {
      onSymptomsExtracted([symptom]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Label htmlFor="chief-complaint" className="flex items-center gap-2">
          Chief Complaint
          {isAnalyzing && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </Label>
        <div className="relative mt-2">
          <Input
            id="chief-complaint"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g., Patient complains of chest pain and difficulty breathing..."
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : extraction ? (
              <Sparkles className="h-4 w-4 text-blue-600" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {/* AI Extraction Results */}
      <AnimatePresence>
        {extraction && extraction.extractedSymptoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      AI Extracted Information
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(extraction.confidence * 100).toFixed(0)}% confident
                  </Badge>
                </div>

                {/* Extracted Symptoms */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Detected Symptoms:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extraction.extractedSymptoms.map((symptom, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Badge
                          className={`${getSeverityColor(symptom.severity)} cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() => addSymptom(symptom)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {symptom.symptom} ({symptom.severity})
                          <Plus className="h-3 w-3 ml-1" />
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Specialty & Severity */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Specialty:</p>
                    <p className="font-semibold text-blue-900 dark:text-blue-300">
                      {extraction.predictedSpecialty}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Max Severity:</p>
                    <Badge className={getSeverityColor(extraction.predictedSeverity)}>
                      {extraction.predictedSeverity}
                    </Badge>
                  </div>
                </div>

                {/* Suggestions */}
                {extraction.suggestions.additionalSymptomsToCheck.length > 0 && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      💡 Suggested Follow-up Questions:
                    </p>
                    <ul className="space-y-1">
                      {extraction.suggestions.additionalSymptomsToCheck.slice(0, 3).map((suggestion, idx) => (
                        <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
