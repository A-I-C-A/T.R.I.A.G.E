# ML Service for TRIAGELOCK

AI/ML microservice providing:
- Deterioration prediction with explainable AI (SHAP values)
- NLP-based chief complaint extraction
- Patient surge forecasting

## Setup

1. **Install Python 3.9+**

2. **Create virtual environment**
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Download spaCy model** (optional, for advanced NLP)
```bash
python -m spacy download en_core_web_sm
```

5. **Start service**
```bash
python app.py
```

Service runs on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```

### Deterioration Prediction
```
POST /api/predict/deterioration
Body: {
  "vitalSigns": { ... },
  "age": 45,
  "currentPriority": "GREEN",
  "waitingTime": 30,
  "symptoms": [...],
  "riskFactors": [...]
}
```

### NLP Symptom Extraction
```
POST /api/nlp/extract
Body: {
  "text": "Patient complains of chest pain and difficulty breathing"
}
```

### Surge Forecasting
```
POST /api/forecast/surge
Body: {
  "hospitalId": 1,
  "historicalData": [...],
  "hoursAhead": 6
}
```

## Model Training

Place trained models in `ml-service/models/` directory:
- `deterioration_model.pkl` - XGBoost/Random Forest model
- `nlp_model.pkl` - Trained NLP model

Current implementation uses rule-based mock models for demonstration.
