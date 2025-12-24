# 🔍 AI COMPONENTS NOT SHOWING RESPONSE - DEBUG GUIDE

## ✅ What We Know:
- ✅ All services are running (ML, Backend, Frontend)
- ✅ ML service health check passes
- ✅ Deterioration endpoint works (tested)
- ❌ Components show but no AI response appears

---

## 🐛 COMMON ISSUES & FIXES

### **ISSUE 1: Browser Console Errors** ⭐ CHECK THIS FIRST

**How to check:**
1. Open browser (Chrome/Edge)
2. Press `F12` to open DevTools
3. Click "Console" tab
4. Look for RED errors

**Common errors you might see:**

#### Error: "CORS policy blocked"
```
Access to fetch at 'http://localhost:5001/api/nlp/extract' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Fix:**
```python
# In ml-service/app.py (already should be there)
from flask_cors import CORS
CORS(app)
```

#### Error: "Failed to fetch" or "Network error"
```
TypeError: Failed to fetch
```

**Causes:**
- ML service crashed
- ML service port changed
- Firewall blocking

**Fix:**
- Restart ML service
- Check logs for errors

#### Error: "Unexpected token < in JSON"
```
SyntaxError: Unexpected token < in JSON at position 0
```

**Cause:** ML service returned HTML error page instead of JSON

**Fix:** Check ML service terminal for Python errors

---

### **ISSUE 2: NLP Component Not Showing Results**

**Checklist:**

1. **Are you typing in the correct field?**
   - ✅ Type in: **"Chief Complaint (AI-Powered)"**
   - ❌ NOT in: "Additional Clinical Notes"

2. **Are you typing enough text?**
   - Minimum: 3 characters
   - Best: Full sentence like "Patient has chest pain"

3. **Are you waiting 1 second?**
   - NLP has 800ms debounce
   - Wait for AI to analyze

4. **Check browser console:**
   ```javascript
   // You should see:
   POST http://localhost:5001/api/nlp/extract
   // Response: { success: true, extraction: {...} }
   ```

5. **Check Network tab:**
   - F12 → Network tab
   - Type in field
   - Look for "extract" request
   - Click it → Check Response

---

### **ISSUE 3: Deterioration Alert Not Showing**

**Checklist:**

1. **Is patient data complete?**
   - ✅ Patient must have vitals entered
   - ✅ Patient must have age

2. **Are you on the right page?**
   - Login as Doctor
   - Click a patient from queue
   - Look at RIGHT PANEL (patient details)
   - AI card should be at TOP

3. **Check browser console:**
   ```javascript
   // You should see:
   POST http://localhost:5001/api/predict/deterioration
   // Response: { success: true, prediction: {...} }
   ```

4. **Check if AI service is available:**
   - Component checks health endpoint first
   - If health check fails, AI won't load

---

### **ISSUE 4: Surge Forecast Not Showing**

**Checklist:**

1. **Are you logged in as Government?**
   - Email: government@health.gov
   - Password: gov123

2. **Do you have at least 1 hospital?**
   - Surge forecast needs hospital data
   - Check if hospitals array has data

3. **Check browser console:**
   ```javascript
   // You should see:
   POST http://localhost:5001/api/forecast/surge
   // Response: { success: true, forecast: {...} }
   ```

---

## 🔧 STEP-BY-STEP DEBUG PROCESS

### **Step 1: Check All Services Running**

Open 3 terminals, run each:

```bash
# Terminal 1: ML Service
cd ml-service
python app.py
# Should show: Running on http://127.0.0.1:5001

# Terminal 2: Backend
npm run dev:server
# Should show: Server running on port 3000

# Terminal 3: Frontend
npm run dev:client
# Should show: Local: http://localhost:5173
```

### **Step 2: Test ML Endpoints Manually**

**Test NLP:**
```bash
curl -X POST http://localhost:5001/api/nlp/extract ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Patient has severe chest pain\"}"
```

**Expected response:**
```json
{
  "success": true,
  "extraction": {
    "symptoms": [...],
    "specialty": "Cardiology",
    "severity": "critical"
  }
}
```

**Test Deterioration:**
```bash
curl -X POST http://localhost:5001/api/predict/deterioration ^
  -H "Content-Type: application/json" ^
  -d "{\"vitalSigns\": {\"heartRate\": 125, \"oxygenSaturation\": 92}, \"age\": 65, \"currentPriority\": \"GREEN\", \"waitingTime\": 15}"
```

**Expected response:**
```json
{
  "success": true,
  "prediction": {
    "risk_score": 35,
    "predicted_priority": "YELLOW",
    "ai_reasoning": [...]
  }
}
```

### **Step 3: Check Browser Console**

1. Open http://localhost:5173
2. Press F12
3. Go to Console tab
4. Try the action (type in NLP, click patient, etc.)
5. Look for:
   - ✅ Green: Request sent
   - ❌ Red: Error occurred

### **Step 4: Check Network Tab**

1. F12 → Network tab
2. Filter: "Fetch/XHR"
3. Perform action
4. Look for requests to localhost:5001
5. Click request → Check:
   - **Headers**: Is Content-Type: application/json?
   - **Payload**: Is data formatted correctly?
   - **Response**: What did ML service return?

---

## 🎯 MOST LIKELY ISSUES

### **Issue: "I see the component but it says 'AI service unavailable'**

**Cause:** Health check failing

**Fix:**
```bash
# Test health endpoint
curl http://localhost:5001/health

# Should return:
{
  "status": "healthy",
  "models": {
    "deterioration": true,
    "nlp": true,
    "surge": true
  }
}
```

If any model is `false`, check ML service logs for errors.

---

### **Issue: "NLP field shows but no blue card appears when I type"**

**Debugging steps:**

1. Open Console (F12)
2. Type this to test directly:
```javascript
fetch('http://localhost:5001/api/nlp/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Patient has chest pain' })
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e))
```

3. If you see response in console but not in UI:
   - Check if `onSymptomsExtracted` callback is defined
   - Check if parent component is handling extraction

---

### **Issue: "Deterioration card doesn't appear on doctor page"**

**Check patient data:**

Open Console, type:
```javascript
// Get the patient object
console.log(patient)

// Check if vitals exist
console.log(patient.vitals)

// Should have: hr, spo2, bpSys, bpDia, temp
```

If `patient.vitals` is null/undefined:
- Patient was registered without vitals
- Re-register with vitals filled

---

## 📋 QUICK CHECKLIST

**Before asking for help, verify:**

- [ ] ML service running (`http://localhost:5001/health` works)
- [ ] Backend running (`http://localhost:3000/health` works)
- [ ] Frontend running (`http://localhost:5173` loads)
- [ ] No console errors (F12 → Console)
- [ ] Network requests reaching ML service (F12 → Network)
- [ ] Patient has required data (vitals, age, etc.)
- [ ] Typing in correct field (Chief Complaint AI-Powered, not Clinical Notes)
- [ ] Waiting 1 second after typing (debounce)
- [ ] Logged in with correct user (nurse/doctor/government)

---

## 🚨 IF NOTHING WORKS

**Nuclear option - Full restart:**

```bash
# 1. Stop ALL terminals (Ctrl+C everywhere)

# 2. Restart ML service
cd ml-service
python app.py

# 3. Restart backend (new terminal)
npm run dev:server

# 4. Restart frontend (new terminal)  
npm run dev:client

# 5. Hard refresh browser
# Windows: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 6. Clear browser cache
# F12 → Application → Clear storage → Clear site data
```

---

## 📞 GETTING HELP

**When reporting issue, include:**

1. Which component (NLP/Deterioration/Surge)?
2. Browser console errors (screenshot)
3. Network tab showing failed request (screenshot)
4. ML service terminal output
5. What you see vs what you expect

**Example good report:**
> "NLP component shows but blue card doesn't appear. Console shows: 
> 'POST http://localhost:5001/api/nlp/extract 400 (Bad Request)'. 
> Network tab shows payload: {...}. Expected to see symptoms extracted."

**Example bad report:**
> "AI doesn't work"

---

## ✅ WORKING INDICATORS

**You know it's working when:**

**NLP:**
- Type "chest pain"
- Wait 1 second
- Blue card appears below
- Shows extracted symptoms

**Deterioration:**
- View patient as doctor
- See orange/red card at top of details panel
- Shows risk score meter
- Shows countdown timer

**Surge:**
- Login as government
- See graph on right side
- Shows 6-hour forecast
- Shows recommendations below

---

**This debug guide should help you find the exact issue! Start with browser console (F12) - that's where 90% of issues show up!**
