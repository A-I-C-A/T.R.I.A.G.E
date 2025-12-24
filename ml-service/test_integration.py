#!/usr/bin/env python3
"""
AI/ML Integration Test Script
Tests all endpoints and validates responses
"""

import requests
import json
import time
from datetime import datetime

ML_SERVICE_URL = "http://localhost:5001"
BASE_COLOR = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"

def print_header(text):
    print(f"\n{BLUE}{'='*60}{BASE_COLOR}")
    print(f"{BLUE}{text:^60}{BASE_COLOR}")
    print(f"{BLUE}{'='*60}{BASE_COLOR}\n")

def print_test(name, status, details=""):
    symbol = f"{GREEN}✓{BASE_COLOR}" if status else f"{RED}✗{BASE_COLOR}"
    print(f"{symbol} {name}")
    if details:
        print(f"  {details}")

def test_ml_service_health():
    """Test ML service health endpoint"""
    print_header("Testing ML Service Health")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=3)
        data = response.json()
        
        if response.status_code == 200 and data.get('status') == 'healthy':
            print_test("ML Service Health Check", True, f"Status: {data['status']}")
            print_test("Deterioration Model", data['models']['deterioration'])
            print_test("NLP Model", data['models']['nlp'])
            print_test("Surge Model", data['models']['surge'])
            return True
        else:
            print_test("ML Service Health Check", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("ML Service Health Check", False, f"Error: {str(e)}")
        return False

def test_deterioration_prediction():
    """Test deterioration prediction endpoint"""
    print_header("Testing Deterioration Prediction")
    
    test_data = {
        "vitalSigns": {
            "heartRate": 125,
            "respiratoryRate": 22,
            "systolicBP": 95,
            "oxygenSaturation": 92,
            "temperature": 38.5,
            "consciousness": "alert"
        },
        "age": 70,
        "currentPriority": "GREEN",
        "waitingTime": 45,
        "symptoms": [
            {"symptom": "Chest Pain", "severity": "severe"},
            {"symptom": "Shortness of Breath", "severity": "moderate"}
        ],
        "riskFactors": [
            {"factor": "Diabetes", "category": "chronic"},
            {"factor": "Hypertension", "category": "chronic"}
        ]
    }
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/predict/deterioration",
            json=test_data,
            timeout=5
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            prediction = data['prediction']
            print_test("Deterioration Prediction", True)
            print(f"  Risk Score: {YELLOW}{prediction['risk_score']}%{BASE_COLOR}")
            print(f"  Deterioration Probability: {prediction['deterioration_probability']}")
            print(f"  Predicted Priority: {YELLOW}{prediction['predicted_priority']}{BASE_COLOR}")
            print(f"  Confidence: {prediction['confidence']}")
            print(f"  AI Reasoning ({len(prediction['ai_reasoning'])} points):")
            for reason in prediction['ai_reasoning'][:3]:
                print(f"    • {reason}")
            
            # Validate response structure
            assert 'risk_score' in prediction
            assert 'deterioration_probability' in prediction
            assert 'confidence' in prediction
            assert 'ai_reasoning' in prediction
            assert 'shap_values' in prediction
            
            print_test("Response Structure", True, "All required fields present")
            return True
        else:
            print_test("Deterioration Prediction", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Deterioration Prediction", False, f"Error: {str(e)}")
        return False

def test_nlp_extraction():
    """Test NLP extraction endpoint"""
    print_header("Testing NLP Extraction")
    
    test_cases = [
        "Patient complains of severe chest pain radiating to left arm and shortness of breath",
        "65-year-old male with crushing chest pain, sweating, and difficulty breathing",
        "Patient has headache and dizziness, feeling weak"
    ]
    
    all_passed = True
    for i, text in enumerate(test_cases, 1):
        print(f"\n{BLUE}Test Case {i}:{BASE_COLOR}")
        print(f"  Input: \"{text[:60]}...\"")
        
        try:
            response = requests.post(
                f"{ML_SERVICE_URL}/api/nlp/extract",
                json={"text": text},
                timeout=3
            )
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                extraction = data['extraction']
                print_test(f"NLP Extraction #{i}", True)
                print(f"  Extracted Symptoms: {GREEN}{len(extraction['extracted_symptoms'])}{BASE_COLOR}")
                for symptom in extraction['extracted_symptoms'][:3]:
                    print(f"    • {symptom['symptom']} ({symptom['severity']}) - {symptom['confidence']}")
                print(f"  Predicted Specialty: {YELLOW}{extraction['predicted_specialty']}{BASE_COLOR}")
                print(f"  Confidence: {extraction['confidence']}")
                
                # Validate structure
                assert 'extracted_symptoms' in extraction
                assert 'predicted_specialty' in extraction
                assert 'confidence' in extraction
                assert 'suggestions' in extraction
            else:
                print_test(f"NLP Extraction #{i}", False, f"Status: {response.status_code}")
                all_passed = False
        except Exception as e:
            print_test(f"NLP Extraction #{i}", False, f"Error: {str(e)}")
            all_passed = False
    
    return all_passed

def test_surge_forecast():
    """Test surge forecasting endpoint"""
    print_header("Testing Surge Forecasting")
    
    # Generate sample historical data
    historical_data = []
    base_time = datetime.now()
    for i in range(168):  # 7 days of hourly data
        historical_data.append({
            "timestamp": base_time.isoformat(),
            "patient_count": 10 + (i % 24) + (i % 7) * 2
        })
    
    test_data = {
        "hospitalId": 1,
        "historicalData": historical_data,
        "hoursAhead": 6
    }
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/forecast/surge",
            json=test_data,
            timeout=5
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            forecast = data['forecast']
            print_test("Surge Forecast", True)
            print(f"  Surge Detected: {YELLOW}{forecast['surge_detected']}{BASE_COLOR}")
            print(f"  Forecast Hours: {GREEN}{len(forecast['hourly_forecast'])}{BASE_COLOR}")
            print(f"  Peak Count: {forecast['peak_hour']['predicted_patient_count']}")
            print(f"  Confidence: {forecast['confidence']}")
            print(f"  Recommendations: {len(forecast['recommendations'])}")
            
            for rec in forecast['recommendations'][:2]:
                print(f"    • [{rec['priority'].upper()}] {rec['action']}")
            
            # Validate structure
            assert 'hourly_forecast' in forecast
            assert 'surge_detected' in forecast
            assert 'recommendations' in forecast
            assert len(forecast['hourly_forecast']) == 6
            
            print_test("Response Structure", True, "All required fields present")
            return True
        else:
            print_test("Surge Forecast", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Surge Forecast", False, f"Error: {str(e)}")
        return False

def test_error_handling():
    """Test error handling"""
    print_header("Testing Error Handling")
    
    # Test empty NLP request
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/nlp/extract",
            json={"text": ""},
            timeout=3
        )
        if response.status_code == 400:
            print_test("Empty Text Validation", True, "Correctly rejected empty input")
        else:
            print_test("Empty Text Validation", False, "Should reject empty input")
    except Exception as e:
        print_test("Empty Text Validation", False, f"Error: {str(e)}")
    
    # Test malformed request
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/predict/deterioration",
            json={},
            timeout=3
        )
        # Should handle gracefully with defaults
        if response.status_code in [200, 400]:
            print_test("Malformed Request Handling", True, "Handled gracefully")
        else:
            print_test("Malformed Request Handling", False)
    except Exception as e:
        print_test("Malformed Request Handling", False, f"Error: {str(e)}")

def main():
    print(f"\n{GREEN}{'='*60}{BASE_COLOR}")
    print(f"{GREEN}{'AI/ML Integration Test Suite':^60}{BASE_COLOR}")
    print(f"{GREEN}{'='*60}{BASE_COLOR}")
    print(f"\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"ML Service: {ML_SERVICE_URL}\n")
    
    results = {
        "Health Check": test_ml_service_health(),
        "Deterioration Prediction": test_deterioration_prediction(),
        "NLP Extraction": test_nlp_extraction(),
        "Surge Forecasting": test_surge_forecast(),
        "Error Handling": test_error_handling()
    }
    
    print_header("Test Summary")
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}PASS{BASE_COLOR}" if result else f"{RED}FAIL{BASE_COLOR}"
        print(f"  {test_name}: {status}")
    
    print(f"\n{BLUE}{'='*60}{BASE_COLOR}")
    if passed == total:
        print(f"{GREEN}All tests passed! ({passed}/{total}){BASE_COLOR}")
        print(f"{GREEN}AI/ML integration is working correctly ✓{BASE_COLOR}")
    else:
        print(f"{YELLOW}Tests passed: {passed}/{total}{BASE_COLOR}")
        print(f"{RED}Some tests failed. Check errors above.{BASE_COLOR}")
    print(f"{BLUE}{'='*60}{BASE_COLOR}\n")
    
    return passed == total

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
