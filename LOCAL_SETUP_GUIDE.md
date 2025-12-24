# 🚀 COMPLETE LOCAL SETUP GUIDE - TRIAGELOCK AI/ML

**Last Updated**: December 23, 2025

This guide will get the entire TRIAGELOCK AI/ML system running on your local machine in **under 10 minutes**.

---

## ⚡ QUICK START (EASIEST METHOD)

### **Windows:**
```bash
start-ai-system.bat
```

### **Linux/Mac:**
```bash
chmod +x start-ai-system.sh
./start-ai-system.sh
```

That's it! The automated script will:
- ✅ Start ML Service (Python Flask)
- ✅ Start Backend (Node.js/TypeScript)
- ✅ Start Frontend (React/Vite)

**Access the app**: http://localhost:5173

---

## 📋 MANUAL SETUP (Step-by-Step)

If the automated script doesn't work or you want manual control:

### **STEP 1: Prerequisites Check**

**Required Software:**
- ✅ Node.js 18+ ([Download](https://nodejs.org))
- ✅ Python 3.9+ ([Download](https://python.org))

**Verify installations:**
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 8.x.x or higher
python --version  # Should show 3.9.x or higher
```

---

### **STEP 2: Install Dependencies**

**Backend & Frontend:**
```bash
cd C:\Users\eldoj\PycharmProjects\Triage

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

**ML Service:**
```bash
cd ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate           # Windows
source venv/bin/activate        # Linux/Mac

# Install Python packages
pip install flask flask-cors numpy pandas scikit-learn joblib python-dotenv langdetect

cd ..
```

---

### **STEP 3: Setup Database**

```bash
# Run migrations to create tables
npm run migrate

# (Optional) Seed with sample data
npm run seed
```

**Expected Output:**
```
Using environment: development
Batch 3 run: 1 migrations
```

---

### **STEP 4: Start All Services**

**Open 3 Terminal Windows:**

**Terminal 1 - ML Service:**
```bash
cd C:\Users\eldoj\PycharmProjects\Triage\ml-service
venv\Scripts\activate           # Windows
source venv/bin/activate        # Linux/Mac
python app.py
```
**Expected Output:**
```
 * Running on http://127.0.0.1:5001
 * Running on http://192.168.x.x:5001
```

**Terminal 2 - Backend:**
```bash
cd C:\Users\eldoj\PycharmProjects\Triage
npm run dev:backend
```
**Expected Output:**
```
[nodemon] starting `ts-node src/server.ts`
Server running on port 3000
```

**Terminal 3 - Frontend:**
```bash
cd C:\Users\eldoj\PycharmProjects\Triage
npm run dev:client
```
**Expected Output:**
```
  VITE v5.1.6  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

### **STEP 5: Verify Everything is Running**

**Check ML Service Health:**
```bash
curl http://localhost:5001/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "models": {
    "deterioration": true,
    "nlp": true,
    "surge": true
  }
}
```

**Or open in browser:** http://localhost:5001/health

**Check Frontend:** http://localhost:5173

---

## 🎯 ACCESS THE APPLICATION

### **Main Access Point**
```
Frontend: http://localhost:5173
```

### **Login Credentials** (after seeding)

| Role | Email | Password |
|------|-------|----------|
| **Nurse** | nurse@cityhospital.com | nurse123 |
| **Doctor** | doctor@cityhospital.com | doctor123 |
| **Admin** | admin@cityhospital.com | admin123 |
| **Government** | government@health.gov | gov123 |

### **API Endpoints**
```
Backend API:  http://localhost:3000
ML Service:   http://localhost:5001
```

---

## 🧪 TEST AI FEATURES

### **1. Test NLP Extraction (Chief Complaint)**

**Login as Nurse** → **Register New Patient**

Type in Chief Complaint:
```
"65-year-old male with severe chest pain radiating to left arm, sweating, and shortness of breath"
```

**Watch:** AI automatically extracts symptoms with severity levels! ✨

---

### **2. Test Deterioration Predictor**

**Login as Doctor** → **View Queue** → **Select a Patient**

**You'll see:**
- 🔴 Risk Score meter
- ⏱️ Live countdown to escalation
- 📊 SHAP values (feature importance)
- 💡 AI reasoning

---

### **3. Test Surge Forecaster**

**Login as Government** → **View Dashboard**

**You'll see:**
- 📈 6-hour patient arrival forecast
- 🚨 Surge alerts (if predicted)
- 💼 Smart recommendations (staffing, beds, etc.)

---

## 🐛 TROUBLESHOOTING

### **Problem: ML Service won't start**

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
cd ml-service
venv\Scripts\activate
pip install flask flask-cors numpy pandas scikit-learn joblib python-dotenv langdetect
python app.py
```

---

### **Problem: "AI assistant unavailable" in frontend**

**Check ML service is running:**
```bash
curl http://localhost:5001/health
```

**If not running:**
```bash
cd ml-service
venv\Scripts\activate
python app.py
```

---

### **Problem: Backend won't start**

**Error:** `Error: Cannot find module 'express'`

**Solution:**
```bash
npm install
npm run dev:backend
```

---

### **Problem: Database error**

**Error:** `Knex: run migrations please`

**Solution:**
```bash
npm run migrate
```

---

### **Problem: Port already in use**

**Error:** `EADDRINUSE: address already in use :::5001`

**Solution (Windows):**
```bash
# Find process using port
netstat -ano | findstr :5001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Solution (Linux/Mac):**
```bash
# Find and kill process
lsof -ti:5001 | xargs kill -9
```

---

### **Problem: Python version too old**

**Error:** `Python 3.9+ required`

**Solution:**
1. Download Python 3.9+ from https://python.org
2. Install with "Add to PATH" checked
3. Restart terminal
4. Verify: `python --version`

---

## 📊 VERIFY AI FEATURES ARE WORKING

### **Quick Health Check Script:**

**PowerShell (Windows):**
```powershell
# Check ML Service
Invoke-WebRequest http://localhost:5001/health | ConvertFrom-Json

# Check Backend
Invoke-WebRequest http://localhost:3000/api/hospitals

# Check Frontend
Start-Process http://localhost:5173
```

**Bash (Linux/Mac):**
```bash
# Check ML Service
curl http://localhost:5001/health | jq

# Check Backend
curl http://localhost:3000/api/hospitals

# Open Frontend
open http://localhost:5173  # Mac
xdg-open http://localhost:5173  # Linux
```

---

## 🎬 DEMO WALKTHROUGH

### **Complete Demo Flow (5 minutes):**

**1. NLP Demo (1 min)**
- Login as Nurse
- Click "Register Patient"
- Type: "Patient has crushing chest pain and difficulty breathing"
- **Watch AI extract symptoms automatically**
- Add patient details, submit

**2. Deterioration Predictor (1.5 min)**
- Login as Doctor
- View patient queue
- Click on a GREEN priority patient
- **Watch AI warning appear** with risk score and countdown
- Update vitals to worsen slightly
- **Watch risk score increase** and countdown update

**3. Surge Forecast (1 min)**
- Login as Government
- View Dashboard
- **See 6-hour forecast graph**
- **See surge alerts** (if predicted)
- **View smart recommendations**

**4. Explainability (30s)**
- In Deterioration Alert, click "Show Feature Importance"
- **See SHAP values waterfall chart**
- Shows WHY AI predicted high risk

---

## 📱 MOBILE/REMOTE ACCESS

### **Access from Another Device on Same Network:**

**Find your IP address:**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

**Access from phone/tablet:**
```
http://YOUR_IP:5173
```

Example: `http://192.168.1.45:5173`

---

## 🛑 STOP ALL SERVICES

### **Using Automated Script:**
- Just close the terminal window, or press `Ctrl+C`

### **Manual Stop:**

**Windows:**
```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Stop all Python processes
taskkill /F /IM python.exe
```

**Linux/Mac:**
```bash
# Stop all services
pkill -f "node"
pkill -f "python app.py"
```

---

## 🔄 RESTART SERVICES

**Quick Restart (if already installed):**
```bash
# Restart ML Service
cd ml-service
venv\Scripts\activate
python app.py

# Restart Backend (new terminal)
npm run dev:backend

# Restart Frontend (new terminal)
npm run dev:client
```

---

## 📂 PROJECT STRUCTURE

```
Triage/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/doctor/  # AI components here
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── ml-service/                 # ML Microservice (Python Flask)
│   ├── app.py                  # Main server
│   ├── deterioration_predictor.py
│   ├── nlp_extractor.py
│   ├── surge_forecaster.py
│   ├── requirements.txt
│   └── venv/                   # Python virtual environment
│
├── src/                        # Backend (Node.js/TypeScript)
│   ├── controllers/
│   ├── services/
│   │   └── aiService.ts        # ML service client
│   ├── routes/
│   └── server.ts
│
├── start-ai-system.bat         # Windows startup script
├── start-ai-system.sh          # Linux/Mac startup script
├── package.json                # Backend dependencies
└── triagelock.sqlite3          # Database file
```

---

## 📖 DOCUMENTATION REFERENCE

- **QUICK_REFERENCE.txt** - One-page cheat sheet
- **AI_IMPLEMENTATION.md** - Complete technical guide
- **IMPLEMENTATION_SUMMARY.md** - Full overview
- **VALIDATION_REPORT.md** - Validation results
- **README_AI.md** - Updated README

---

## ✅ SUCCESS CHECKLIST

Before your demo, verify:

- [ ] ML Service running: http://localhost:5001/health shows "healthy"
- [ ] Backend running: http://localhost:3000 accessible
- [ ] Frontend running: http://localhost:5173 loads
- [ ] Database migrated: `npm run migrate` completed
- [ ] Can login with test credentials
- [ ] NLP extracts symptoms from chief complaint
- [ ] Deterioration alert shows risk score
- [ ] Surge forecast renders graph
- [ ] All animations smooth

---

## 🎯 READY TO DEMO!

**Everything should now be running:**

✅ **Frontend**: http://localhost:5173  
✅ **Backend**: http://localhost:3000  
✅ **ML Service**: http://localhost:5001  

**Login and explore the AI features!**

---

## 📞 NEED HELP?

**Common Issues:**
1. Port conflicts → Change ports in `.env` files
2. Python errors → Check virtual environment activated
3. Database errors → Run `npm run migrate`
4. AI unavailable → Check ML service at :5001/health

**Check Logs:**
- Backend: Terminal running `npm run dev:backend`
- ML Service: Terminal running `python app.py`
- Frontend: Browser console (F12)

---

**🚀 Good luck with your IIT Hackathon! Success is your bare minimum! 🎯**
