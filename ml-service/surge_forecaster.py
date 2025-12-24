import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict

class SurgeForecaster:
    def __init__(self):
        self.model_loaded = True
        self.model_version = "1.0.0"
    
    def is_loaded(self):
        return self.model_loaded
    
    def forecast(self, historical_data: List[Dict], hours_ahead: int = 6) -> Dict:
        """
        Forecast patient surge
        
        Args:
            historical_data: List of dicts with 'timestamp' and 'patient_count'
            hours_ahead: Number of hours to forecast
        
        Returns:
            Dictionary with forecast data
        """
        if not historical_data or len(historical_data) < 10:
            # Not enough data, return baseline forecast
            return self._baseline_forecast(hours_ahead)
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate hourly averages
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        
        hourly_avg = df.groupby('hour')['patient_count'].mean().to_dict()
        
        # Generate forecast
        now = datetime.now()
        forecasts = []
        
        for i in range(hours_ahead):
            target_time = now + timedelta(hours=i+1)
            target_hour = target_time.hour
            
            # Base prediction on historical hourly average
            base_prediction = hourly_avg.get(target_hour, df['patient_count'].mean())
            
            # Add some variation
            variation = np.random.normal(0, base_prediction * 0.15)
            predicted_count = max(0, int(base_prediction + variation))
            
            forecasts.append({
                'timestamp': target_time.isoformat(),
                'hour': target_hour,
                'predicted_patient_count': predicted_count,
                'confidence_lower': int(predicted_count * 0.8),
                'confidence_upper': int(predicted_count * 1.2)
            })
        
        # Detect surge
        avg_patients = df['patient_count'].mean()
        std_patients = df['patient_count'].std()
        surge_threshold = avg_patients + (1.5 * std_patients)
        
        surge_detected = any(f['predicted_patient_count'] > surge_threshold for f in forecasts)
        peak_hour = max(forecasts, key=lambda x: x['predicted_patient_count'])
        
        # Generate recommendations
        recommendations = self._generate_recommendations(forecasts, surge_detected, avg_patients)
        
        return {
            'hourly_forecast': forecasts,
            'surge_detected': surge_detected,
            'surge_threshold': int(surge_threshold),
            'current_average': int(avg_patients),
            'peak_hour': peak_hour,
            'recommendations': recommendations,
            'confidence': 0.75,
            'model_version': self.model_version
        }
    
    def _baseline_forecast(self, hours_ahead: int) -> Dict:
        """Generate baseline forecast when insufficient data"""
        now = datetime.now()
        current_hour = now.hour
        
        # Simple hourly pattern (higher during day, lower at night)
        hourly_pattern = {
            0: 5, 1: 3, 2: 2, 3: 2, 4: 3, 5: 5,
            6: 8, 7: 12, 8: 15, 9: 18, 10: 20, 11: 22,
            12: 20, 13: 18, 14: 19, 15: 21, 16: 23, 17: 25,
            18: 22, 19: 18, 20: 15, 21: 12, 22: 10, 23: 7
        }
        
        forecasts = []
        for i in range(hours_ahead):
            target_time = now + timedelta(hours=i+1)
            target_hour = target_time.hour
            predicted_count = hourly_pattern.get(target_hour, 15)
            
            forecasts.append({
                'timestamp': target_time.isoformat(),
                'hour': target_hour,
                'predicted_patient_count': predicted_count,
                'confidence_lower': int(predicted_count * 0.7),
                'confidence_upper': int(predicted_count * 1.3)
            })
        
        peak_hour = max(forecasts, key=lambda x: x['predicted_patient_count'])
        surge_detected = peak_hour['predicted_patient_count'] > 20
        
        return {
            'hourly_forecast': forecasts,
            'surge_detected': surge_detected,
            'surge_threshold': 20,
            'current_average': 15,
            'peak_hour': peak_hour,
            'recommendations': self._generate_recommendations(forecasts, surge_detected, 15),
            'confidence': 0.60,
            'model_version': self.model_version
        }
    
    def _generate_recommendations(self, forecasts: List[Dict], surge_detected: bool, avg_patients: float) -> List[Dict]:
        """Generate actionable recommendations based on forecast"""
        recommendations = []
        
        if surge_detected:
            peak = max(forecasts, key=lambda x: x['predicted_patient_count'])
            peak_time = datetime.fromisoformat(peak['timestamp'])
            peak_count = peak['predicted_patient_count']
            
            recommendations.append({
                'type': 'staffing',
                'priority': 'high',
                'action': f"Schedule additional staff for {peak_time.strftime('%H:%M')}",
                'details': f"Expected surge of {peak_count} patients",
                'icon': 'users'
            })
            
            if peak_count > avg_patients * 1.5:
                recommendations.append({
                    'type': 'beds',
                    'priority': 'high',
                    'action': 'Prepare additional emergency beds',
                    'details': f"Prepare {int((peak_count - avg_patients) * 0.7)} extra beds",
                    'icon': 'bed'
                })
            
            recommendations.append({
                'type': 'communication',
                'priority': 'medium',
                'action': 'Alert neighboring hospitals',
                'details': 'Coordinate potential patient transfers',
                'icon': 'phone'
            })
            
            recommendations.append({
                'type': 'resources',
                'priority': 'medium',
                'action': 'Stock critical supplies',
                'details': 'Ensure adequate medication and equipment',
                'icon': 'package'
            })
        else:
            recommendations.append({
                'type': 'normal',
                'priority': 'low',
                'action': 'Normal operations',
                'details': 'No surge expected - maintain standard staffing',
                'icon': 'check'
            })
        
        return recommendations
