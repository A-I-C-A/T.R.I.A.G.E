# AI/ML Services - Complete Technical Guide
**TRIAGELOCK Machine Learning Componen1ts**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Service 1: Deterioration Predictor](#service-1-deterioration-predictor)
4. [Service 2: NLP Symptom Extractor](#service-2-nlp-symptom-extractor)
5. [Service 3: Surge Forecaster](#service-3-surge-forecaster)
6. [Technology Stack](#technology-stack)
7. [API Reference](#api-reference)
8. [Algorithms Deep Dive](#algorithms-deep-dive)
9. [Model Explainability (SHAP)](#model-explainability-shap)
10. [Setup & Deployment](#setup--deployment)
11. [Extending with Real ML Models](#extending-with-real-ml-models)

---

## 🎯 Overview

The TRIAGELOCK ML Service is a **Python Flask microservice** that provides three core AI/ML capabilities:

1. **Deterioration Predictor** - Predicts if patient will deteriorate
2. **NLP Symptom Extractor** - Extracts structured data from free text
3. **Surge Forecaster** - Forecasts patient arrivals for next 6 hours

### Why Separate ML Service?

```
✅ Language Specialization: Python excels at ML/data science
✅ Independent Scaling: Scale ML service separately from API
✅ Model Isolation: Update models without touching main backend
✅ Fallback Support: Backend works even if ML service is down
✅ Technology Freedom: Use best ML tools (NumPy, Pandas, scikit-learn)
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│           FLASK ML SERVICE (Port 5001)           │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  /health - Health Check                 │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  /api/predict/deterioration             │    │
│  │  • DeteriorationPredictor class         │    │
│  │  • Rule-based risk scoring              │    │
│  │  • SHAP explainability                  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  /api/nlp/extract                       │    │
│  │  • NLPExtractor class                   │    │
│  │  • Keyword pattern matching             │    │
│  │  • Medical terminology extraction       │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  /api/forecast/surge                    │    │
│  │  • SurgeForecaster class                │    │
│  │  • Time-series analysis                 │    │
│  │  • Hourly pattern detection             │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
         ↑
         │ HTTP Requests (from Backend)
         │
┌────────┴──────────────────────────────────────┐
│    Express Backend (Port 3000)                │
│    Proxies all ML requests                    │
└───────────────────────────────────────────────┘
```

---

## 🧠 Service 1: Deterioration Predictor

**File:** `ml-service/deterioration_predictor.py`

### Purpose

Predict if a patient is likely to deteriorate and require escalation to higher priority.

### Key Features

```python
✅ Risk Score (0-100): Overall deterioration risk
✅ Deterioration Probability (0-1): Likelihood of worsening
✅ Predicted Escalation Time: When patient might need escalation
✅ Predicted Priority: RED/YELLOW/GREEN
✅ AI Reasoning: Human-readable explanations
✅ SHAP Values: Feature importance for explainability
✅ Confidence Score: Model confidence level
```

---

### Input Features

```python
{
    # Vital Signs
    'heart_rate': 120,              # bpm
    'respiratory_rate': 24,         # breaths/min
    'systolic_bp': 160,             # mmHg
    'oxygen_saturation': 94,        # %
    'temperature': 38.5,            # °C
    'consciousness': 'alert',       # alert|verbal|pain|unresponsive
    
    # Patient Demographics
    'age': 62,                      # years
    
    # Triage Context
    'current_priority': 'YELLOW',   # Current triage level
    'waiting_time': 25,             # minutes
    
    # Clinical Burden
    'symptom_count': 2,             # Number of symptoms
    'risk_factor_count': 1          # Number of risk factors
}
```

---

### Algorithm Breakdown

#### 1. Feature Encoding

```python
# Consciousness levels (categorical → numerical)
consciousness_map = {
    'alert': 0,        # Normal
    'verbal': 1,       # Responds to voice only
    'pain': 2,         # Responds to pain only  
    'unresponsive': 3  # No response - CRITICAL
}

# Priority levels (categorical → numerical)
priority_map = {
    'GREEN': 0,    # Standard
    'YELLOW': 1,   # Urgent
    'RED': 2       # Critical
}
```

---

#### 2. Risk Scoring Rules

**Heart Rate Contribution:**
```python
if hr < 40 or hr > 140:     # Critical range
    risk_score += 30
    reasoning.append("Critical heart rate detected")
    
elif hr < 50 or hr > 120:   # Abnormal range
    risk_score += 20
    reasoning.append("Abnormal heart rate")
    
elif hr < 60 or hr > 100:   # Elevated range
    risk_score += 10
    reasoning.append("Elevated heart rate")
```

**Oxygen Saturation Contribution:**
```python
if spo2 < 90:               # Critical
    risk_score += 30
    reasoning.append("Critical oxygen saturation")
    
elif spo2 < 94:             # Low
    risk_score += 20
    reasoning.append("Low oxygen saturation")
    
elif spo2 < 96:             # Reduced
    risk_score += 10
    reasoning.append("Reduced oxygen saturation")
```

**Blood Pressure Contribution:**
```python
if bp < 90 or bp > 200:     # Critical
    risk_score += 30
    
elif bp < 100 or bp > 180:  # Abnormal
    risk_score += 20
    
elif bp > 140:              # Elevated (hypertension)
    risk_score += 12
```

**Respiratory Rate Contribution:**
```python
if rr < 8 or rr > 30:       # Critical
    risk_score += 30
    
elif rr < 10 or rr > 24:    # Abnormal
    risk_score += 20
    
elif rr < 12 or rr > 20:    # Elevated
    risk_score += 10
```

**Temperature Contribution:**
```python
if temp < 35 or temp > 40:  # Critical (hypothermia/hyperthermia)
    risk_score += 25
    
elif temp < 36 or temp > 39: # Abnormal
    risk_score += 15
    
elif temp > 38:             # Fever
    risk_score += 8
```

**Consciousness Contribution:**
```python
if consciousness == 'unresponsive':  # CRITICAL
    risk_score += 40
    reasoning.append("Patient unresponsive - CRITICAL")
    
elif consciousness == 'pain':        # Severe
    risk_score += 25
    reasoning.append("Responds only to pain")
    
elif consciousness == 'verbal':      # Moderate
    risk_score += 15
    reasoning.append("Responds to verbal stimuli")
```

---

#### 3. Demographic & Context Factors

**Age Factor:**
```python
if age < 1:                 # Infant - very high risk
    risk_score += 15
    
elif age >= 75:             # Elderly - high risk
    risk_score += 10
    
elif age < 5:               # Young child
    risk_score += 8
    
elif age > 65:              # Senior
    risk_score += 5
```

**Waiting Time Factor:**
```python
if waiting_time > 120:      # Over 2 hours
    risk_score += 15
    reasoning.append("Extended wait time increases risk")
    
elif waiting_time > 60:     # Over 1 hour
    risk_score += 8
```

**Symptom Burden:**
```python
if symptom_count >= 3:      # Multiple symptoms
    risk_score += 20
    
elif symptom_count >= 1:    # Some symptoms
    risk_score += 10
```

**Risk Factors:**
```python
if risk_factor_count >= 2:  # Multiple conditions
    risk_score += 15
    
elif risk_factor_count >= 1: # Some conditions
    risk_score += 8
```

---

#### 4. Priority Prediction Logic

```python
# Cap risk score at 100
risk_score = min(risk_score, 100)

# Determine predicted priority
if risk_score >= 40 and current_priority != 'RED':
    predicted_priority = 'RED'
    predicted_escalation_time = now + 8 minutes
    reasoning.insert(0, "⚠️ CRITICAL: Immediate escalation to RED predicted")
    
elif risk_score >= 25 and current_priority == 'GREEN':
    predicted_priority = 'YELLOW'
    predicted_escalation_time = now + 12 minutes
    reasoning.insert(0, "⚠️ WARNING: Escalation to YELLOW predicted")
else:
    predicted_priority = current_priority
```

---

#### 5. Confidence Calculation

```python
confidence = 0.85  # Base confidence

# Reduce confidence if data missing
if heart_rate == 0 or oxygen_saturation == 0:
    confidence -= 0.2
    
if age == 0:
    confidence -= 0.1
    
# Clamp between 0.5 and 1.0
confidence = max(0.5, min(1.0, confidence))
```

---

### Output Structure

```json
{
  "risk_score": 78.0,
  "deterioration_probability": 0.78,
  "predicted_escalation_time": "2026-01-07T13:20:00Z",
  "confidence": 0.85,
  "predicted_priority": "RED",
  "ai_reasoning": [
    "⚠️ CRITICAL: Immediate escalation to RED predicted",
    "Abnormal heart rate: 120 bpm",
    "Low oxygen saturation: 94%",
    "Fever: 38.5°C",
    "Elderly patient: 62 years"
  ],
  "shap_values": {
    "heart_rate": 20,
    "oxygen_saturation": 20,
    "temperature": 8,
    "age": 5,
    "symptom_count": 10,
    "risk_factors": 8,
    "waiting_time": 0
  },
  "model_version": "1.0.0"
}
```

---

### SHAP Values Explanation

SHAP (SHapley Additive exPlanations) values show **how much each feature contributed** to the prediction.

```python
{
  "heart_rate": 20,          # HR contributed +20 points
  "oxygen_saturation": 20,   # O2 contributed +20 points
  "temperature": 8,          # Temp contributed +8 points
  "age": 5,                  # Age contributed +5 points
  "symptom_count": 10,       # Symptoms contributed +10 points
  "risk_factors": 8,         # Risk factors contributed +8 points
  "waiting_time": 0          # Wait time contributed 0 points
}

# Sum of SHAP values ≈ risk_score (78)
```

**Interpretation:**
- **Positive values** = feature increases risk
- **Larger magnitude** = stronger influence
- **Zero** = feature had no impact

This provides **explainability** - doctors can see WHY the AI made its prediction.

---

### Code Example: How to Use

```python
from deterioration_predictor import DeteriorationPredictor

predictor = DeteriorationPredictor()

# Patient data
features = {
    'heart_rate': 125,
    'respiratory_rate': 26,
    'systolic_bp': 165,
    'oxygen_saturation': 93,
    'temperature': 38.8,
    'consciousness': 'alert',
    'age': 62,
    'current_priority': 'YELLOW',
    'waiting_time': 25,
    'symptom_count': 2,
    'risk_factor_count': 1
}

# Get prediction
prediction = predictor.predict(features)

print(f"Risk Score: {prediction['risk_score']}")
print(f"Probability: {prediction['deterioration_probability']}")
print(f"Predicted Priority: {prediction['predicted_priority']}")
print(f"Reasoning: {prediction['ai_reasoning']}")
```

---

## 📝 Service 2: NLP Symptom Extractor

**File:** `ml-service/nlp_extractor.py`

### Purpose

Extract **structured medical information** from unstructured free-text chief complaints.

### Example

**Input Text:**
```
"Patient presenting with severe chest pain radiating to left arm, 
accompanied by nausea and sweating. History of hypertension and diabetes."
```

**Output:**
```json
{
  "extracted_symptoms": [
    {"symptom": "Chest Pain", "severity": "critical", "category": "cardiac"},
    {"symptom": "Nausea", "severity": "mild", "category": "gastrointestinal"}
  ],
  "extracted_conditions": [
    {"condition": "Hypertension", "type": "cardiovascular_chronic"},
    {"condition": "Diabetes", "type": "metabolic_chronic"}
  ],
  "predicted_specialty": "Cardiology",
  "predicted_severity": "critical",
  "suggestions": {
    "additional_symptoms_to_check": ["Radiation of pain", "Sweating", "Shortness of breath"],
    "recommended_tests": ["ECG", "Troponin levels"]
  }
}
```

---

### Keyword Dictionary Architecture

#### Symptom Keywords (44 symptoms)

```python
symptom_keywords = {
    'chest pain': {
        'severity': 'critical',
        'category': 'cardiac'
    },
    'shortness of breath': {
        'severity': 'severe',
        'category': 'respiratory'
    },
    'headache': {
        'severity': 'moderate',
        'category': 'neurological'
    },
    # ... 41 more symptoms
}
```

**Categories:**
- `cardiac` - Heart-related
- `respiratory` - Breathing-related
- `neurological` - Brain/nerve-related
- `gastrointestinal` - Digestive system
- `trauma` - Injuries
- `infectious` - Infections
- `general` - Non-specific

**Severity Levels:**
- `critical` - Life-threatening (chest pain, bleeding, seizure)
- `severe` - Urgent (difficulty breathing, severe pain)
- `moderate` - Important (headache, nausea, weakness)
- `mild` - Minor (cough, mild pain)

---

#### Condition Keywords (9 conditions)

```python
condition_keywords = {
    'heart attack': 'cardiac_emergency',
    'stroke': 'neurological_emergency',
    'anaphylaxis': 'allergic_emergency',
    'diabetes': 'metabolic_chronic',
    'hypertension': 'cardiovascular_chronic',
    'asthma': 'respiratory_chronic',
    # ...
}
```

---

### Extraction Algorithm

#### Step 1: Language Detection

```python
from langdetect import detect

try:
    language = detect(text)  # 'en', 'hi', 'es', etc.
except:
    language = 'en'  # Default to English
```

---

#### Step 2: Keyword Matching

```python
text_lower = text.lower()
extracted_symptoms = []

for keyword, info in symptom_keywords.items():
    if keyword in text_lower:
        extracted_symptoms.append({
            'symptom': keyword.title(),
            'severity': info['severity'],
            'category': info['category'],
            'confidence': 0.85 if len(keyword.split()) > 1 else 0.70
        })
```

**Confidence Logic:**
- Multi-word phrases (e.g., "chest pain"): **0.85**
- Single words (e.g., "pain"): **0.70**

---

#### Step 3: Severity Aggregation

```python
severity_order = ['mild', 'moderate', 'severe', 'critical']

max_severity = 'mild'
for symptom in extracted_symptoms:
    if severity_order.index(symptom['severity']) > severity_order.index(max_severity):
        max_severity = symptom['severity']
```

---

#### Step 4: Specialty Prediction

```python
# Priority order for specialty selection
category_priority = [
    'cardiac',        # Highest priority
    'respiratory',
    'neurological',
    'trauma',
    'gastrointestinal',
    'infectious',
    'general'        # Lowest priority
]

# Map category to specialty
specialty_map = {
    'cardiac': 'Cardiology',
    'respiratory': 'Pulmonology',
    'neurological': 'Neurology',
    'trauma': 'Trauma',
    'gastrointestinal': 'General',
    'infectious': 'General',
    'general': 'General'
}

# Select most critical category
for cat in category_priority:
    if cat in symptom_categories:
        predicted_specialty = specialty_map[cat]
        break
```

---

#### Step 5: Smart Suggestions

Based on extracted symptoms, generate contextual recommendations:

**Cardiac Symptoms Detected:**
```python
if 'cardiac' in categories:
    suggestions = {
        'additional_symptoms_to_check': [
            'Radiation of pain to arm/jaw',
            'Sweating',
            'Shortness of breath'
        ],
        'recommended_tests': ['ECG', 'Troponin levels'],
        'risk_factors_to_assess': ['Diabetes', 'Hypertension', 'Smoking history']
    }
```

**Respiratory Symptoms Detected:**
```python
if 'respiratory' in categories:
    suggestions = {
        'additional_symptoms_to_check': ['Wheezing', 'Cough', 'Sputum production'],
        'recommended_tests': ['Oxygen saturation', 'Chest X-ray'],
        'risk_factors_to_assess': ['Asthma', 'COPD', 'Smoking history']
    }
```

**Neurological Symptoms Detected:**
```python
if 'neurological' in categories:
    suggestions = {
        'additional_symptoms_to_check': [
            'Vision changes',
            'Speech difficulty',
            'Facial drooping',
            'Limb weakness'
        ],
        'recommended_tests': ['CT scan', 'Neurological assessment']
    }
```

---

### Complete Example

**Input:**
```
"70 year old male with severe chest pain, difficulty breathing, and nausea. 
Patient has history of diabetes and hypertension. Pain started 30 minutes ago."
```

**Processing:**
```python
extractor = NLPExtractor()
result = extractor.extract(text)
```

**Output:**
```json
{
  "extracted_symptoms": [
    {
      "symptom": "Severe Pain",
      "severity": "severe",
      "category": "general",
      "confidence": 0.85
    },
    {
      "symptom": "Chest Pain",
      "severity": "critical",
      "category": "cardiac",
      "confidence": 0.85
    },
    {
      "symptom": "Difficulty Breathing",
      "severity": "severe",
      "category": "respiratory",
      "confidence": 0.85
    },
    {
      "symptom": "Nausea",
      "severity": "mild",
      "category": "gastrointestinal",
      "confidence": 0.70
    }
  ],
  "extracted_conditions": [
    {
      "condition": "Diabetes",
      "type": "metabolic_chronic",
      "confidence": 0.90
    },
    {
      "condition": "Hypertension",
      "type": "cardiovascular_chronic",
      "confidence": 0.90
    }
  ],
  "predicted_specialty": "Cardiology",
  "predicted_severity": "critical",
  "confidence": 0.80,
  "language_detected": "en",
  "suggestions": {
    "additional_symptoms_to_check": [
      "Radiation of pain to arm/jaw",
      "Sweating",
      "Shortness of breath"
    ],
    "recommended_tests": ["ECG", "Troponin levels"],
    "risk_factors_to_assess": ["Diabetes", "Hypertension", "Smoking history"]
  },
  "raw_text": "..."
}
```

---

### Benefits

```
✅ Instant extraction from free text
✅ Standardized terminology
✅ Contextual suggestions for clinicians
✅ Language detection (multi-lingual support ready)
✅ Confidence scores for reliability
✅ Category-based specialty routing
```

---

## 📊 Service 3: Surge Forecaster

**File:** `ml-service/surge_forecaster.py`

### Purpose

Predict **patient arrival patterns** for the next 6 hours to help hospitals prepare for surges.

---

### Input Data

```python
{
  "hospitalId": 1,
  "hoursAhead": 6,
  "historicalData": [
    {"timestamp": "2026-01-07T06:00:00Z", "patient_count": 12},
    {"timestamp": "2026-01-07T07:00:00Z", "patient_count": 18},
    {"timestamp": "2026-01-07T08:00:00Z", "patient_count": 22},
    # ... more historical data
  ]
}
```

---

### Algorithm: Historical Pattern-Based Forecasting

#### Step 1: Data Validation

```python
if not historical_data or len(historical_data) < 10:
    # Not enough data, use baseline forecast
    return baseline_forecast(hours_ahead)
```

---

#### Step 2: Convert to DataFrame & Extract Features

```python
import pandas as pd

df = pd.DataFrame(historical_data)
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Extract temporal features
df['hour'] = df['timestamp'].dt.hour           # 0-23
df['day_of_week'] = df['timestamp'].dt.dayofweek  # 0=Monday, 6=Sunday
```

---

#### Step 3: Calculate Hourly Patterns

```python
# Group by hour and calculate average patient count
hourly_avg = df.groupby('hour')['patient_count'].mean().to_dict()

# Example result:
# {
#   0: 5.2,   1: 3.1,   2: 2.4,  ...
#   8: 15.6,  9: 18.2,  10: 20.1, ...
#   18: 22.3, 19: 18.5, 20: 15.2, ...
# }
```

---

#### Step 4: Generate Forecast

```python
from datetime import datetime, timedelta
import numpy as np

now = datetime.now()
forecasts = []

for i in range(hours_ahead):
    target_time = now + timedelta(hours=i+1)
    target_hour = target_time.hour
    
    # Base prediction on historical average for that hour
    base_prediction = hourly_avg.get(target_hour, df['patient_count'].mean())
    
    # Add realistic variation (±15%)
    variation = np.random.normal(0, base_prediction * 0.15)
    predicted_count = max(0, int(base_prediction + variation))
    
    forecasts.append({
        'timestamp': target_time.isoformat(),
        'hour': target_hour,
        'predicted_patient_count': predicted_count,
        'confidence_lower': int(predicted_count * 0.8),  # 80% of prediction
        'confidence_upper': int(predicted_count * 1.2)   # 120% of prediction
    })
```

---

#### Step 5: Surge Detection

```python
# Calculate statistics
avg_patients = df['patient_count'].mean()
std_patients = df['patient_count'].std()

# Surge threshold: mean + 1.5 standard deviations
surge_threshold = avg_patients + (1.5 * std_patients)

# Check if any forecast hour exceeds threshold
surge_detected = any(
    f['predicted_patient_count'] > surge_threshold 
    for f in forecasts
)

# Identify peak hour
peak_hour = max(forecasts, key=lambda x: x['predicted_patient_count'])
```

**Why 1.5 standard deviations?**
- Statistically significant (captures ~93% of normal variation)
- Balances sensitivity vs. false alarms
- Industry standard for anomaly detection

---

#### Step 6: Generate Recommendations

```python
def _generate_recommendations(forecasts, surge_detected, avg_patients):
    recommendations = []
    
    if surge_detected:
        peak = max(forecasts, key=lambda x: x['predicted_patient_count'])
        peak_time = datetime.fromisoformat(peak['timestamp'])
        peak_count = peak['predicted_patient_count']
        
        # Recommendation 1: Staffing
        recommendations.append({
            'type': 'staffing',
            'priority': 'high',
            'action': f"Schedule additional staff for {peak_time.strftime('%H:%M')}",
            'details': f"Expected surge of {peak_count} patients",
            'icon': 'users'
        })
        
        # Recommendation 2: Beds (if significant surge)
        if peak_count > avg_patients * 1.5:
            extra_beds = int((peak_count - avg_patients) * 0.7)
            recommendations.append({
                'type': 'beds',
                'priority': 'high',
                'action': 'Prepare additional emergency beds',
                'details': f"Prepare {extra_beds} extra beds",
                'icon': 'bed'
            })
        
        # Recommendation 3: Communication
        recommendations.append({
            'type': 'communication',
            'priority': 'medium',
            'action': 'Alert neighboring hospitals',
            'details': 'Coordinate potential patient transfers',
            'icon': 'phone'
        })
        
        # Recommendation 4: Resources
        recommendations.append({
            'type': 'resources',
            'priority': 'medium',
            'action': 'Stock critical supplies',
            'details': 'Ensure adequate medication and equipment',
            'icon': 'package'
        })
    else:
        # No surge expected
        recommendations.append({
            'type': 'normal',
            'priority': 'low',
            'action': 'Normal operations',
            'details': 'No surge expected - maintain standard staffing',
            'icon': 'check'
        })
    
    return recommendations
```

---

### Baseline Forecast (Fallback)

When insufficient historical data (<10 records), use a **deterministic hourly pattern**:

```python
hourly_pattern = {
    0: 5,  1: 3,  2: 2,  3: 2,  4: 3,  5: 5,      # Night: Low
    6: 8,  7: 12, 8: 15, 9: 18, 10: 20, 11: 22,   # Morning: Rising
    12: 20, 13: 18, 14: 19, 15: 21, 16: 23, 17: 25, # Afternoon: Peak
    18: 22, 19: 18, 20: 15, 21: 12, 22: 10, 23: 7  # Evening: Declining
}
```

This pattern reflects typical **emergency department traffic**:
- **Night (12 AM - 6 AM):** Lowest activity
- **Morning (6 AM - 12 PM):** Gradual increase
- **Afternoon (12 PM - 6 PM):** Peak hours
- **Evening (6 PM - 12 AM):** Gradual decline

---

### Output Structure

```json
{
  "hourly_forecast": [
    {
      "timestamp": "2026-01-07T13:00:00Z",
      "hour": 13,
      "predicted_patient_count": 28,
      "confidence_lower": 22,
      "confidence_upper": 35
    },
    {
      "timestamp": "2026-01-07T14:00:00Z",
      "hour": 14,
      "predicted_patient_count": 32,
      "confidence_lower": 26,
      "confidence_upper": 40
    },
    // ... 4 more hours
  ],
  "surge_detected": true,
  "surge_threshold": 25,
  "current_average": 18,
  "peak_hour": {
    "timestamp": "2026-01-07T18:00:00Z",
    "hour": 18,
    "predicted_patient_count": 45
  },
  "recommendations": [
    {
      "type": "staffing",
      "priority": "high",
      "action": "Schedule additional staff for 18:00",
      "details": "Expected surge of 45 patients",
      "icon": "users"
    },
    {
      "type": "beds",
      "priority": "high",
      "action": "Prepare additional emergency beds",
      "details": "Prepare 19 extra beds",
      "icon": "bed"
    }
  ],
  "confidence": 0.75,
  "model_version": "1.0.0"
}
```

---

### Visualization

The frontend displays this as:

```
Hourly Forecast Chart (Line Graph)
───────────────────────────────────
 Patients
    50 │                    ╱╲
    40 │                  ╱    ╲
    30 │                ╱        ╲
    20 │──────────────╱            ╲────
    10 │
     0 └────────────────────────────────
       13h  14h  15h  16h  17h  18h  19h
       
       ─── Predicted Count
       ··· Confidence Lower/Upper
       ─ ─ Surge Threshold
```

---

## 🛠️ Technology Stack

### Python Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **Flask** | 3.0.0 | Web framework |
| **Flask-CORS** | 4.0.0 | Cross-origin support |
| **NumPy** | 1.26.2 | Numerical computing |
| **Pandas** | 2.1.4 | Data manipulation |
| **scikit-learn** | 1.3.2 | ML algorithms |
| **XGBoost** | 2.0.3 | Gradient boosting (for future models) |
| **SHAP** | 0.44.0 | Model explainability |
| **spaCy** | 3.7.2 | NLP processing |
| **Transformers** | 4.36.2 | Pre-trained language models |
| **PyTorch** | 2.1.2 | Deep learning backend |
| **Prophet** | 1.1.5 | Time-series forecasting (optional) |
| **joblib** | 1.3.2 | Model serialization |
| **langdetect** | 1.0.9 | Language detection |
| **python-dotenv** | 1.0.0 | Environment variables |

---

## 📡 API Reference

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "deterioration": true,
    "nlp": true,
    "surge": true
  },
  "timestamp": "2026-01-07T08:30:00Z"
}
```

---

### Deterioration Prediction

**Endpoint:** `POST /api/predict/deterioration`

**Request:**
```json
{
  "vitalSigns": {
    "heartRate": 125,
    "respiratoryRate": 26,
    "systolicBP": 165,
    "oxygenSaturation": 93,
    "temperature": 38.8,
    "consciousness": "alert"
  },
  "age": 62,
  "currentPriority": "YELLOW",
  "waitingTime": 25,
  "symptoms": [...],
  "riskFactors": [...]
}
```

**Response:** See [Deterioration Predictor Output](#output-structure)

---

### NLP Extraction

**Endpoint:** `POST /api/nlp/extract`

**Request:**
```json
{
  "text": "Patient with severe chest pain and difficulty breathing"
}
```

**Response:** See [NLP Extractor Example](#complete-example)

---

### Surge Forecast

**Endpoint:** `POST /api/forecast/surge`

**Request:**
```json
{
  "hospitalId": 1,
  "hoursAhead": 6,
  "historicalData": [...]
}
```

**Response:** See [Surge Forecaster Output](#output-structure-1)

---

## 🧮 Algorithms Deep Dive

### Deterioration Risk Calculation

**Formula:**
```
risk_score = sum(feature_contributions)

where feature_contributions = {
  vital_signs: 0-150 points,
  age_factor: 0-15 points,
  waiting_time: 0-15 points,
  symptom_burden: 0-20 points,
  risk_factors: 0-15 points
}

deterioration_probability = risk_score / 100.0

predicted_priority = {
  'RED' if risk_score >= 40,
  'YELLOW' if risk_score >= 25,
  'GREEN' otherwise
}
```

---

### NLP Keyword Matching

**Algorithm:**
1. Convert text to lowercase
2. For each keyword in dictionary:
   - Check if keyword exists in text (substring match)
   - If found: Extract with metadata (severity, category, confidence)
3. Aggregate maximum severity
4. Map categories to specialties
5. Generate contextual suggestions

**Confidence Calculation:**
```
confidence = 0.85 if multi_word_phrase else 0.70

if no_symptoms_found:
    confidence = 0.30
else:
    confidence = avg(symptom_confidences)
```

---

### Surge Detection Logic

**Threshold Calculation:**
```
surge_threshold = mean(historical_counts) + 1.5 * std(historical_counts)

Example:
  mean = 18 patients/hour
  std = 5 patients/hour
  threshold = 18 + (1.5 * 5) = 25.5 patients/hour
  
If any predicted hour > 25.5 → surge_detected = true
```

**Recommendation Logic:**
```
if surge_detected:
  extra_beds = (peak_count - avg_count) * 0.7
  
  recommendations:
    - Call extra staff for peak hour
    - Prepare {extra_beds} beds
    - Alert neighboring hospitals
    - Stock supplies
else:
  recommendations:
    - Normal operations
```

---

## 🔍 Model Explainability (SHAP)

### What is SHAP?

**SHAP** (SHapley Additive exPlanations) is a game-theory approach to explain ML model outputs.

### How It Works

For each prediction, SHAP calculates:
> "How much did this feature contribute to the final prediction?"

### Example

```python
Patient: 65-year-old with HR=130, SpO2=91%, temp=38.5°C

SHAP Values:
{
  "heart_rate": 20,       # HR contributed +20
  "oxygen_saturation": 20, # Low O2 contributed +20
  "temperature": 8,        # Fever contributed +8
  "age": 5,                # Age contributed +5
  "symptoms": 0,           # No symptoms → 0
  "risk_factors": 0        # No conditions → 0
}

Total Risk Score: 20 + 20 + 8 + 5 = 53
```

### Visualization

```
Feature Importance (SHAP Values)
──────────────────────────────────
heart_rate         ████████████████████ 20
oxygen_saturation  ████████████████████ 20
temperature        ████████ 8
age                █████ 5
symptoms           0
risk_factors       0
```

### Benefits

```
✅ Transparency: Clinicians see WHY AI made prediction
✅ Trust: Explainable AI builds confidence
✅ Clinical Validation: Can verify reasoning aligns with medical knowledge
✅ Debugging: Identify if model is using correct features
✅ Regulatory Compliance: Required for medical AI systems
```

---

## 🚀 Setup & Deployment

### Local Development

```bash
# Navigate to ML service directory
cd ml-service

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (if using NLP)
python -m spacy download en_core_web_sm

# Start Flask server
python app.py

# Service runs on http://localhost:5001
```

---

### Environment Variables

**File:** `ml-service/.env`

```env
FLASK_ENV=development
ML_SERVICE_PORT=5001
LOG_LEVEL=INFO
```

---

### Production Deployment

**Option 1: Railway**
```bash
# Railway automatically detects Python and runs:
pip install -r requirements.txt
python app.py
```

**Option 2: Docker**
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5001

CMD ["python", "app.py"]
```

**Option 3: AWS Lambda**
```python
# Use Zappa or AWS Lambda for serverless deployment
# Configure API Gateway to route requests
```

---

## 🔬 Extending with Real ML Models

### Current State: Rule-Based

The current implementation uses **rule-based algorithms** for demo purposes.

### Upgrading to Real ML

#### 1. Train Deterioration Model

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Load training data
X_train, X_test, y_train, y_test = train_test_split(
    features,  # Patient features
    labels,    # Did patient deteriorate? (0/1)
    test_size=0.2
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy}")

# Save model
joblib.dump(model, 'models/deterioration_model.pkl')
```

**Replace in code:**
```python
# Old (rule-based)
risk_score = calculate_rule_based_score(features)

# New (ML-based)
model = joblib.load('models/deterioration_model.pkl')
risk_score = model.predict_proba([features])[0][1] * 100
```

---

#### 2. Upgrade NLP with spaCy/Transformers

```python
import spacy
from transformers import pipeline

# Load medical NER model
nlp = spacy.load("en_ner_bc5cdr_md")  # BioClinical NER

# Extract entities
doc = nlp(text)
symptoms = [ent.text for ent in doc.ents if ent.label_ == "DISEASE"]

# Or use transformer-based model
ner_pipeline = pipeline("ner", model="dmis-lab/biobert-base-cased-v1.1")
entities = ner_pipeline(text)
```

---

#### 3. Upgrade Surge Forecaster with Prophet

```python
from prophet import Prophet

# Prepare data
df = pd.DataFrame(historical_data)
df.rename(columns={'timestamp': 'ds', 'patient_count': 'y'}, inplace=True)

# Train Prophet model
model = Prophet(
    yearly_seasonality=False,
    weekly_seasonality=True,
    daily_seasonality=True
)
model.fit(df)

# Make forecast
future = model.make_future_dataframe(periods=6, freq='H')
forecast = model.predict(future)

# Extract predictions
predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(6)
```

---

### Model Training Pipeline

```python
# 1. Collect data from production database
# 2. Label data (ground truth)
# 3. Feature engineering
# 4. Train model
# 5. Evaluate metrics
# 6. Deploy if performance > threshold
# 7. Monitor in production
# 8. Retrain periodically
```

---

## 📚 Key Takeaways

### For Hackathon Presentation

1. **Three AI Services:**
   - Deterioration Predictor (patient risk)
   - NLP Extractor (text → structured data)
   - Surge Forecaster (capacity planning)

2. **Explainability:**
   - SHAP values show feature importance
   - AI reasoning provides human-readable explanations
   - Confidence scores indicate reliability

3. **Fallback Strategy:**
   - Rule-based algorithms work without training data
   - System degrades gracefully if ML service is down
   - Production-ready demo capabilities

4. **Extensibility:**
   - Easy to swap rule-based with real ML models
   - Modular architecture
   - Model versioning built-in

---

## 🎓 Further Learning

### Concepts to Understand

- **Feature Engineering:** Converting raw data into ML features
- **SHAP Values:** Model explainability technique
- **Time Series Forecasting:** Predicting future values from historical patterns
- **Named Entity Recognition (NER):** Extracting entities from text
- **Gradient Boosting:** Advanced ML technique (XGBoost)
- **Model Serialization:** Saving/loading trained models (joblib)

### Resources

- **SHAP Documentation:** https://shap.readthedocs.io/
- **Prophet Guide:** https://facebook.github.io/prophet/
- **spaCy NLP:** https://spacy.io/usage/linguistic-features
- **scikit-learn:** https://scikit-learn.org/stable/tutorial/

---

**Made with 💚 by Team A.I.C.A**  
**IIT Hyderabad Hackathon 2026**

*Master the ML components and ace your presentation! 🚀*
