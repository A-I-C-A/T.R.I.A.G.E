from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Import ML modules
from deterioration_predictor import DeteriorationPredictor
from nlp_extractor import NLPExtractor
from surge_forecaster import SurgeForecaster

# Initialize models
deterioration_model = DeteriorationPredictor()
nlp_model = NLPExtractor()
surge_model = SurgeForecaster()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models': {
            'deterioration': deterioration_model.is_loaded(),
            'nlp': nlp_model.is_loaded(),
            'surge': surge_model.is_loaded()
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict/deterioration', methods=['POST'])
def predict_deterioration():
    """Predict patient deterioration risk"""
    try:
        data = request.json
        
        # Extract features
        features = {
            'heart_rate': data.get('vitalSigns', {}).get('heartRate', 80),
            'respiratory_rate': data.get('vitalSigns', {}).get('respiratoryRate', 16),
            'systolic_bp': data.get('vitalSigns', {}).get('systolicBP', 120),
            'oxygen_saturation': data.get('vitalSigns', {}).get('oxygenSaturation', 98),
            'temperature': data.get('vitalSigns', {}).get('temperature', 37.0),
            'consciousness': data.get('vitalSigns', {}).get('consciousness', 'alert'),
            'age': data.get('age', 40),
            'current_priority': data.get('currentPriority', 'GREEN'),
            'waiting_time': data.get('waitingTime', 0),
            'symptom_count': len(data.get('symptoms', [])),
            'risk_factor_count': len(data.get('riskFactors', []))
        }
        
        # Get prediction
        prediction = deterioration_model.predict(features)
        
        return jsonify({
            'success': True,
            'prediction': prediction
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/nlp/extract', methods=['POST'])
def extract_symptoms():
    """Extract symptoms and conditions from chief complaint"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        # Extract information
        extraction = nlp_model.extract(text)
        
        return jsonify({
            'success': True,
            'extraction': extraction
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/forecast/surge', methods=['POST'])
def forecast_surge():
    """Forecast patient surge for hospital"""
    try:
        data = request.json
        hospital_id = data.get('hospitalId')
        hours_ahead = data.get('hoursAhead', 6)
        historical_data = data.get('historicalData', [])
        
        # Get forecast
        forecast = surge_model.forecast(historical_data, hours_ahead)
        
        return jsonify({
            'success': True,
            'forecast': forecast
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Railway provides PORT env variable
    port = int(os.getenv('PORT', os.getenv('ML_SERVICE_PORT', 5001)))
    # Use debug=False in production
    debug = os.getenv('FLASK_ENV', 'production') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
