import re
from typing import Dict, List
from langdetect import detect
import os

class NLPExtractor:
    def __init__(self):
        self.model_loaded = True
        
        # Medical term dictionaries
        self.symptom_keywords = {
            'chest pain': {'severity': 'critical', 'category': 'cardiac'},
            'chest discomfort': {'severity': 'severe', 'category': 'cardiac'},
            'heart': {'severity': 'severe', 'category': 'cardiac'},
            'shortness of breath': {'severity': 'severe', 'category': 'respiratory'},
            'difficulty breathing': {'severity': 'severe', 'category': 'respiratory'},
            'can\'t breathe': {'severity': 'critical', 'category': 'respiratory'},
            'breathe': {'severity': 'moderate', 'category': 'respiratory'},
            'dyspnea': {'severity': 'severe', 'category': 'respiratory'},
            'headache': {'severity': 'moderate', 'category': 'neurological'},
            'severe headache': {'severity': 'severe', 'category': 'neurological'},
            'dizzy': {'severity': 'moderate', 'category': 'neurological'},
            'dizziness': {'severity': 'moderate', 'category': 'neurological'},
            'nausea': {'severity': 'mild', 'category': 'gastrointestinal'},
            'vomit': {'severity': 'moderate', 'category': 'gastrointestinal'},
            'abdominal pain': {'severity': 'moderate', 'category': 'gastrointestinal'},
            'stomach pain': {'severity': 'moderate', 'category': 'gastrointestinal'},
            'bleeding': {'severity': 'critical', 'category': 'trauma'},
            'blood': {'severity': 'severe', 'category': 'trauma'},
            'fever': {'severity': 'moderate', 'category': 'infectious'},
            'high fever': {'severity': 'severe', 'category': 'infectious'},
            'seizure': {'severity': 'critical', 'category': 'neurological'},
            'unconscious': {'severity': 'critical', 'category': 'neurological'},
            'weak': {'severity': 'moderate', 'category': 'general'},
            'weakness': {'severity': 'moderate', 'category': 'general'},
            'pain': {'severity': 'moderate', 'category': 'general'},
            'severe pain': {'severity': 'severe', 'category': 'general'},
            'cough': {'severity': 'mild', 'category': 'respiratory'},
            'stroke': {'severity': 'critical', 'category': 'neurological'},
            'trauma': {'severity': 'severe', 'category': 'trauma'},
            'injury': {'severity': 'moderate', 'category': 'trauma'},
            'fracture': {'severity': 'severe', 'category': 'trauma'},
            'burn': {'severity': 'severe', 'category': 'trauma'},
        }
        
        self.condition_keywords = {
            'heart attack': 'cardiac_emergency',
            'stroke': 'neurological_emergency',
            'anaphylaxis': 'allergic_emergency',
            'sepsis': 'infectious_emergency',
            'pneumonia': 'respiratory_infection',
            'asthma': 'respiratory_chronic',
            'copd': 'respiratory_chronic',
            'diabetes': 'metabolic_chronic',
            'hypertension': 'cardiovascular_chronic',
        }
        
        self.specialty_map = {
            'cardiac': 'Cardiology',
            'respiratory': 'Pulmonology',
            'neurological': 'Neurology',
            'trauma': 'Trauma',
            'gastrointestinal': 'General',
            'infectious': 'General',
            'general': 'General'
        }
    
    def is_loaded(self):
        return self.model_loaded
    
    def extract(self, text: str) -> Dict:
        """
        Extract symptoms, conditions, and metadata from chief complaint text
        """
        text_lower = text.lower()
        
        # Detect language
        try:
            language = detect(text)
        except:
            language = 'en'
        
        # Extract symptoms
        extracted_symptoms = []
        symptom_categories = set()
        max_severity = 'mild'
        
        severity_order = ['mild', 'moderate', 'severe', 'critical']
        
        # 1. Extract from keyword dictionary
        for keyword, info in self.symptom_keywords.items():
            if keyword in text_lower:
                extracted_symptoms.append({
                    'symptom': keyword.title(),
                    'severity': info['severity'],
                    'category': info['category'],
                    'confidence': 0.85 if len(keyword.split()) > 1 else 0.70
                })
                symptom_categories.add(info['category'])
                
                # Update max severity
                if severity_order.index(info['severity']) > severity_order.index(max_severity):
                    max_severity = info['severity']
        
        # 2. NEW: Extract potential symptoms from text using word patterns
        # Look for medical-sounding words not in dictionary
        words = text_lower.split()
        potential_symptoms = []
        
        # Common symptom patterns
        symptom_patterns = [
            'pain', 'ache', 'sore', 'hurt', 'discomfort',
            'swelling', 'swollen', 'inflammation', 'inflamed',
            'rash', 'itching', 'burning', 'tingling',
            'discharge', 'bleeding', 'bruising',
            'numbness', 'stiffness', 'cramping'
        ]
        
        for i, word in enumerate(words):
            # Check if word matches symptom patterns
            for pattern in symptom_patterns:
                if pattern in word or word in pattern:
                    # Try to get context (body part or descriptor)
                    context = []
                    if i > 0:
                        context.append(words[i-1])
                    if i < len(words) - 1:
                        context.append(words[i+1])
                    
                    symptom_text = ' '.join(context + [word]).strip()
                    
                    # Only add if not already in extracted symptoms
                    if not any(symptom_text.lower() in s['symptom'].lower() for s in extracted_symptoms):
                        potential_symptoms.append({
                            'symptom': symptom_text.title(),
                            'severity': 'moderate',  # Default to moderate
                            'category': 'general',
                            'confidence': 0.50  # Lower confidence for auto-detected
                        })
        
        # 3. Add potential symptoms that aren't already captured
        for ps in potential_symptoms[:5]:  # Limit to 5 auto-detected symptoms
            if not any(ps['symptom'].lower() in s['symptom'].lower() for s in extracted_symptoms):
                extracted_symptoms.append(ps)
                symptom_categories.add(ps['category'])
        
        # Extract conditions
        extracted_conditions = []
        for keyword, condition_type in self.condition_keywords.items():
            if keyword in text_lower:
                extracted_conditions.append({
                    'condition': keyword.title(),
                    'type': condition_type,
                    'confidence': 0.90
                })
        
        # Determine specialty
        if symptom_categories:
            # Get most critical category
            category_priority = ['cardiac', 'respiratory', 'neurological', 'trauma', 'gastrointestinal', 'infectious', 'general']
            for cat in category_priority:
                if cat in symptom_categories:
                    predicted_specialty = self.specialty_map.get(cat, 'General')
                    break
            else:
                predicted_specialty = 'General'
        else:
            predicted_specialty = 'General'
        
        # Calculate overall confidence
        if extracted_symptoms:
            avg_confidence = sum(s['confidence'] for s in extracted_symptoms) / len(extracted_symptoms)
        else:
            avg_confidence = 0.3  # Low confidence if nothing extracted
        
        # Generate smart suggestions
        suggestions = self._generate_suggestions(extracted_symptoms, extracted_conditions, text_lower)
        
        return {
            'extracted_symptoms': extracted_symptoms,
            'extracted_conditions': extracted_conditions,
            'predicted_specialty': predicted_specialty,
            'predicted_severity': max_severity,
            'confidence': round(avg_confidence, 2),
            'language_detected': language,
            'suggestions': suggestions,
            'raw_text': text
        }
    
    def _generate_suggestions(self, symptoms: List, conditions: List, text: str) -> Dict:
        """Generate additional suggestions based on extracted information"""
        suggestions = {
            'additional_symptoms_to_check': [],
            'recommended_tests': [],
            'risk_factors_to_assess': []
        }
        
        # Cardiac-related
        if any('cardiac' in s.get('category', '') for s in symptoms):
            suggestions['additional_symptoms_to_check'].extend([
                'Radiation of pain to arm/jaw',
                'Sweating',
                'Shortness of breath'
            ])
            suggestions['recommended_tests'].extend(['ECG', 'Troponin levels'])
            suggestions['risk_factors_to_assess'].extend(['Diabetes', 'Hypertension', 'Smoking history'])
        
        # Respiratory
        if any('respiratory' in s.get('category', '') for s in symptoms):
            suggestions['additional_symptoms_to_check'].extend([
                'Wheezing',
                'Cough',
                'Sputum production'
            ])
            suggestions['recommended_tests'].extend(['Oxygen saturation', 'Chest X-ray'])
            suggestions['risk_factors_to_assess'].extend(['Asthma', 'COPD', 'Smoking history'])
        
        # Neurological
        if any('neurological' in s.get('category', '') for s in symptoms):
            suggestions['additional_symptoms_to_check'].extend([
                'Vision changes',
                'Speech difficulty',
                'Facial drooping',
                'Limb weakness'
            ])
            suggestions['recommended_tests'].extend(['CT scan', 'Neurological assessment'])
        
        # Trauma
        if any('trauma' in s.get('category', '') for s in symptoms):
            suggestions['additional_symptoms_to_check'].extend([
                'Mechanism of injury',
                'Loss of consciousness',
                'Range of motion'
            ])
            suggestions['recommended_tests'].extend(['X-ray', 'Physical examination'])
        
        return suggestions
