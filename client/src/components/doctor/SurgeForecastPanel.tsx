import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, Bed, Phone, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface SurgeRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  details: string;
  icon: string;
}

interface SurgeForecast {
  hourlyForecast: Array<{
    timestamp: string;
    hour: number;
    predictedPatientCount: number;
    confidenceLower: number;
    confidenceUpper: number;
  }>;
  surgeDetected: boolean;
  surgeThreshold: number;
  currentAverage: number;
  peakHour: any;
  recommendations: SurgeRecommendation[];
  confidence: number;
}

interface SurgeForecastPanelProps {
  hospitalId: number;
}

export const SurgeForecastPanel: React.FC<SurgeForecastPanelProps> = ({ hospitalId }) => {
  const [forecast, setForecast] = useState<SurgeForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
    const interval = setInterval(fetchForecast, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [hospitalId]);

  const fetchForecast = async () => {
    try {
      // Fetch historical data from backend
      const historicalResponse = await fetch(`/api/hospitals/${hospitalId}/patient-history`);
      const historicalData = await historicalResponse.json();

      // Get forecast from ML service
      const response = await fetch(`/api/forecast/surge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          historicalData: historicalData.data || [],
          hoursAhead: 6
        })
      });

      const data = await response.json();
      if (data.success) {
        setForecast({
          hourlyForecast: data.forecast.hourly_forecast,
          surgeDetected: data.forecast.surge_detected,
          surgeThreshold: data.forecast.surge_threshold,
          currentAverage: data.forecast.current_average,
          peakHour: data.forecast.peak_hour,
          recommendations: data.forecast.recommendations,
          confidence: data.forecast.confidence
        });
      }
    } catch (error) {
      console.error('Failed to fetch surge forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      users: Users,
      bed: Bed,
      phone: Phone,
      package: Package
    };
    return icons[iconName] || AlertTriangle;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      default:
        return 'border-green-500 bg-green-50 dark:bg-green-950/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading AI forecast...</p>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) return null;

  const chartData = forecast.hourlyForecast.map(f => ({
    time: new Date(f.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    patients: f.predictedPatientCount,
    lower: f.confidenceLower,
    upper: f.confidenceUpper
  }));

  return (
    <div className="space-y-4">
      {/* Surge Alert */}
      {forecast.surgeDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-bold text-lg">⚠️ SURGE ALERT</h3>
              <p className="text-sm opacity-90">
                Patient surge predicted at {new Date(forecast.peakHour.timestamp).toLocaleTimeString()} 
                ({forecast.peakHour.predictedPatientCount} patients expected)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              6-Hour Patient Surge Forecast
            </CardTitle>
            <Badge variant="outline">
              {(forecast.confidence * 100).toFixed(0)}% Confident
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="#93c5fd"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="patients"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={forecast.surgeThreshold}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Surge Threshold"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Average</p>
              <p className="text-2xl font-bold">{forecast.currentAverage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peak Expected</p>
              <p className="text-2xl font-bold text-orange-600">
                {forecast.peakHour.predictedPatientCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Surge Threshold</p>
              <p className="text-2xl font-bold text-red-600">{forecast.surgeThreshold}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🤖 AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {forecast.recommendations.map((rec, idx) => {
            const Icon = getIconComponent(rec.icon);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{rec.action}</p>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rec.details}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
