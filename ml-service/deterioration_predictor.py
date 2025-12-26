import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib
import os

class DeteriorationPredictor:
    def __init__(self):
        self.model = None
        self.model_version = "1.0.0"
        self.consciousness_map = {
            'alert': 0,
            'verbal': 1,
            'pain': 2,
            'unresponsive': 3
        }
        self.priority_map = {
            'GREEN': 0,
            'YELLOW': 1,
            'RED': 2
        }
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize or load the deterioration prediction model"""
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'deterioration_model.pkl')
        
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                print(f"Loaded deterioration model from {model_path}")
            except Exception as e:
                print(f"Error loading model: {e}")
                self._create_mock_model()
        else:
            self._create_mock_model()
    
    def _create_mock_model(self):
        """Create a rule-based mock model for demonstration"""
        print("Using rule-based mock deterioration model")
        self.model = "MOCK"
    
    def is_loaded(self):
        return self.model is not None
    
    def predict(self, features):
        """
        Predict deterioration risk
        Returns: {
            'risk_score': float (0-100),
            'deterioration_probability': float (0-1),
            'predicted_escalation_time': datetime or None,
            'confidence': float (0-1),
            'predicted_priority': str,
            'ai_reasoning': list of strings,
            'shap_values': dict (feature importance)
        }
        """
        # Extract and normalize features
        hr = features.get('heart_rate', 80)
        rr = features.get('respiratory_rate', 16)
        bp = features.get('systolic_bp', 120)
        spo2 = features.get('oxygen_saturation', 98)
        temp = features.get('temperature', 37.0)
        consciousness = features.get('consciousness', 'alert')
        age = features.get('age', 40)
        current_priority = features.get('current_priority', 'GREEN')
        waiting_time = features.get('waiting_time', 0)
        symptom_count = features.get('symptom_count', 0)
        risk_factor_count = features.get('risk_factor_count', 0)
        
        # Calculate risk score (rule-based for demo)
        risk_score = 0
        reasoning = []
        shap_values = {}
        
        # Heart rate analysis
        if hr < 40 or hr > 140:
            contribution = 30
            risk_score += contribution
            shap_values['heart_rate'] = contribution
            reasoning.append(f"Critical heart rate detected: {hr} bpm")
        elif hr < 50 or hr > 120:
            contribution = 20
            risk_score += contribution
            shap_values['heart_rate'] = contribution
            reasoning.append(f"Abnormal heart rate: {hr} bpm")
        elif hr < 60 or hr > 100:
            contribution = 10
            risk_score += contribution
            shap_values['heart_rate'] = contribution
            reasoning.append(f"Elevated heart rate: {hr} bpm")
        else:
            shap_values['heart_rate'] = 0
        
        # Oxygen saturation analysis
        if spo2 < 90:
            contribution = 30
            risk_score += contribution
            shap_values['oxygen_saturation'] = contribution
            reasoning.append(f"Critical oxygen saturation: {spo2}%")
        elif spo2 < 94:
            contribution = 20
            risk_score += contribution
            shap_values['oxygen_saturation'] = contribution
            reasoning.append(f"Low oxygen saturation: {spo2}%")
        elif spo2 < 96:
            contribution = 10
            risk_score += contribution
            shap_values['oxygen_saturation'] = contribution
            reasoning.append(f"Reduced oxygen saturation: {spo2}%")
        else:
            shap_values['oxygen_saturation'] = 0
        
        # Blood pressure analysis
        # Assuming only systolic is used for simplicity, matching TriageEngine's direct systolic contributions
        if bp < 90 or bp > 200:
            contribution = 30
            risk_score += contribution
            shap_values['systolic_bp'] = contribution
            reasoning.append(f"Critical blood pressure: {bp} mmHg")
        elif bp < 100 or bp > 180:
            contribution = 20
            risk_score += contribution
            shap_values['systolic_bp'] = contribution
            reasoning.append(f"Abnormal blood pressure: {bp} mmHg")
        elif bp > 140: # This specific rule is present in TriageEngine
            contribution = 12
            risk_score += contribution
            shap_values['systolic_bp'] = contribution
            reasoning.append(f"Elevated blood pressure: {bp} mmHg")
        else:
            shap_values['systolic_bp'] = 0
        
        # Respiratory rate
        if rr < 8 or rr > 30:
            contribution = 30
            risk_score += contribution
            shap_values['respiratory_rate'] = contribution
            reasoning.append(f"Critical respiratory rate: {rr}/min")
        elif rr < 10 or rr > 24:
            contribution = 20
            risk_score += contribution
            shap_values['respiratory_rate'] = contribution
            reasoning.append(f"Abnormal respiratory rate: {rr}/min")
        elif rr < 12 or rr > 20:
            contribution = 10
            risk_score += contribution
            shap_values['respiratory_rate'] = contribution
            reasoning.append(f"Elevated respiratory rate: {rr}/min")
        else:
            shap_values['respiratory_rate'] = 0
        
        # Temperature
        if temp < 35 or temp > 40:
            contribution = 25
            risk_score += contribution
            shap_values['temperature'] = contribution
            reasoning.append(f"Critical temperature: {temp}°C")
        elif temp < 36 or temp > 39:
            contribution = 15
            risk_score += contribution
            shap_values['temperature'] = contribution
            reasoning.append(f"Abnormal temperature: {temp}°C")
        elif temp > 38: # This specific rule is present in TriageEngine
            contribution = 8
            risk_score += contribution
            shap_values['temperature'] = contribution
            reasoning.append(f"Fever: {temp}°C")
        else:
            shap_values['temperature'] = 0
        
        # Consciousness level
        if consciousness == 'unresponsive':
            contribution = 40
            risk_score += contribution
            shap_values['consciousness'] = contribution
            reasoning.append('Patient unresponsive - CRITICAL')
        elif consciousness == 'pain':
            contribution = 25
            risk_score += contribution
            shap_values['consciousness'] = contribution
            reasoning.append('Responds only to pain')
        elif consciousness == 'verbal':
            contribution = 15
            risk_score += contribution
            shap_values['consciousness'] = contribution
            reasoning.append('Responds to verbal stimuli')
        else: # 'alert'
            shap_values['consciousness'] = 0
        
        # Age factor
        if age < 1:
            contribution = 15
            risk_score += contribution
            shap_values['age'] = contribution
            reasoning.append("Infant - high risk")
        elif age >= 75:
            contribution = 10
            risk_score += contribution
            shap_values['age'] = contribution
            reasoning.append(f"Age-related risk: {age} years")
        elif age < 5:
            contribution = 8
            risk_score += contribution
            shap_values['age'] = contribution
            reasoning.append(f"Young child: {age} years")
        elif age > 65:
            contribution = 5
            risk_score += contribution
            shap_values['age'] = contribution
            reasoning.append(f"Elderly patient: {age} years")
        else:
            shap_values['age'] = 0
        
        # Waiting time factor (deterioration risk increases with wait)
        # TriageEngine uses waiting time for escalation, not initial scoring.
        # This is a place where AI can add value by predicting deterioration due to wait.
        if waiting_time > 120: # Example: more than 2 hours
            contribution = 15
            risk_score += contribution
            shap_values['waiting_time'] = contribution
            reasoning.append(f"Extended wait time: {waiting_time} minutes")
        elif waiting_time > 60: # Example: more than 1 hour
            contribution = 8
            risk_score += contribution
            shap_values['waiting_time'] = contribution
        else:
            shap_values['waiting_time'] = 0
        
        # Symptom burden (approximated from TriageEngine's detailed symptom scoring)
        if symptom_count >= 3: # Backend has critical symptoms contributing 30-40, urgent 15-25
            contribution = 20
            risk_score += contribution
            shap_values['symptom_count'] = contribution
            reasoning.append(f"Multiple severe symptoms: {symptom_count}")
        elif symptom_count >= 1:
            contribution = 10
            risk_score += contribution
            shap_values['symptom_count'] = contribution
            reasoning.append(f"Presence of symptoms: {symptom_count}")
        else:
            shap_values['symptom_count'] = 0
        
        # Risk factors (approximated from TriageEngine's detailed risk factor scoring)
        if risk_factor_count >= 2: # Backend has high-risk conditions contributing 20
            contribution = 15
            risk_score += contribution
            shap_values['risk_factors'] = contribution
            reasoning.append(f"Multiple significant risk factors: {risk_factor_count}")
        elif risk_factor_count >= 1:
            contribution = 8
            risk_score += contribution
            shap_values['risk_factors'] = contribution
            reasoning.append(f"Presence of risk factors: {risk_factor_count}")
        else:
            shap_values['risk_factors'] = 0
        
        # Cap at 100
        risk_score = min(risk_score, 100)
        
        # Calculate deterioration probability
        deterioration_probability = risk_score / 100.0
        
        # Predict if escalation will occur (aligned with backend TriageEngine thresholds)
        predicted_priority = current_priority
        predicted_escalation_time = None
        
        # Adjust priority_level based on the new self.priority_map where GREEN is 0, YELLOW 1, RED 2
        priority_level = self.priority_map.get(current_priority, 0) # Default to GREEN (0)
        
        if risk_score >= 40 and priority_level < self.priority_map['RED']:
            predicted_priority = 'RED'
            predicted_escalation_time = datetime.now() + timedelta(minutes=8)
            reasoning.insert(0, "⚠️ CRITICAL: Immediate escalation to RED predicted")
        elif risk_score >= 25 and priority_level < self.priority_map['YELLOW']:
            predicted_priority = 'YELLOW'
            predicted_escalation_time = datetime.now() + timedelta(minutes=12)
            reasoning.insert(0, "⚠️ WARNING: Escalation to YELLOW predicted")
        # No explicit condition for GREEN, as it's the base case. If risk_score is below YELLOW threshold, it stays/becomes GREEN.

        
        # Calculate confidence (based on data quality)
        confidence = 0.85  # Base confidence
        if hr == 0 or spo2 == 0:
            confidence -= 0.2
        if age == 0:
            confidence -= 0.1
        
        confidence = max(0.5, min(1.0, confidence))
        
        return {
            'risk_score': round(risk_score, 2),
            'deterioration_probability': round(deterioration_probability, 3),
            'predicted_escalation_time': predicted_escalation_time.isoformat() if predicted_escalation_time else None,
            'confidence': round(confidence, 2),
            'predicted_priority': predicted_priority,
            'ai_reasoning': reasoning,
            'shap_values': shap_values,
            'model_version': self.model_version
        }
