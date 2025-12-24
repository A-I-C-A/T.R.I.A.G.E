# 🚀 RUN TRIAGELOCK LOCALLY - COMPLETE GUIDE

## ⚡ SUPER QUICK START (10 SECONDS)

```bash
start-ai-system.bat
```

Then open: **http://localhost:5173**

---

## 📋 STEP-BY-STEP (FIRST TIME SETUP)

### **1. Install Prerequisites** (5 minutes)

Download and install:
- ✅ [Node.js 18+](https://nodejs.org) - JavaScript runtime
- ✅ [Python 3.9+](https://python.org) - ML service runtime

Verify:
```bash
node --version   # Should be v18.x.x+
python --version # Should be 3.9.x+
```

---

### **2. Install Dependencies** (3 minutes)

```bash
# Backend + Frontend dependencies
npm install

# ML Service dependencies
cd ml-service
python -m venv venv
venv\Scripts\activate          # Windows
pip install flask flask-cors numpy pandas scikit-learn joblib python-dotenv langdetect
cd ..
```

---

### **3. Setup Database** (1 minute)

```bash
npm run migrate    # Creates database tables
npm run seed       # (Optional) Adds sample data
```

---

### **4. Start Everything** (1 minute)

**OPTION A - Automated:**
```bash
start-ai-system.bat
```

**OPTION B - Manual (3 terminals):**

Terminal 1:
```bash
cd ml-service
venv\Scripts\activate
python app.py
```

Terminal 2:
```bash
npm run dev:backend
```

Terminal 3:
```bash
npm run dev:client
```

---

### **5. Access & Login**

Open browser: **http://localhost:5173**

Login with:
- **Nurse**: nurse@cityhospital.com / nurse123
- **Doctor**: doctor@cityhospital.com / doctor123

---

## 🎯 VERIFY AI FEATURES WORK

### **Test 1: NLP (30 seconds)**
1. Login as **Nurse**
2. Click "Register Patient"
3. In Chief Complaint, type: `"Patient has severe chest pain and shortness of breath"`
4. ✅ **AI should extract symptoms automatically!**

### **Test 2: Deterioration Predictor (30 seconds)**
1. Login as **Doctor**
2. View Queue → Click any patient
3. ✅ **You should see AI risk score + countdown timer!**

### **Test 3: ML Service Health (10 seconds)**
```bash
curl http://localhost:5001/health
```
✅ Should return: `{"status": "healthy", ...}`

---

## 🐛 COMMON ISSUES & FIXES

| Problem | Solution |
|---------|----------|
| "AI assistant unavailable" | Check ML service: `http://localhost:5001/health` |
| Port already in use | Kill process: `taskkill /F /IM python.exe` |
| ModuleNotFoundError | Run: `pip install -r ml-service/requirements.txt` |
| Database error | Run: `npm run migrate` |
| Backend won't start | Run: `npm install` then `npm run dev:backend` |

---

## 📊 WHAT'S RUNNING WHERE?

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐                                   │
│  │   Frontend (React)  │  http://localhost:5173           │
│  │   Port: 5173        │                                   │
│  └─────────┬───────────┘                                   │
│            │                                                │
│            ▼                                                │
│  ┌─────────────────────┐                                   │
│  │  Backend (Node.js)  │  http://localhost:3000           │
│  │  Port: 3000         │                                   │
│  └─────────┬───────────┘                                   │
│            │                                                │
│            ├─────────────────┬─────────────────┐           │
│            ▼                 ▼                 ▼           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Database   │  │  ML Service  │  │   WebSocket  │    │
│  │   SQLite     │  │  Port: 5001  │  │  Real-time   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 DEMO WORKFLOW

### **Complete 5-Minute Demo:**

```
[00:00] START
  ↓
[00:30] NLP Demo - Nurse Registration
  • Type: "65yo male, crushing chest pain to left arm, SOB"
  • AI extracts: Chest Pain (Critical), Shortness of Breath (Severe)
  • Recommends: ECG, Troponin, Cardiology
  ↓
[01:30] Deterioration Predictor - Doctor View
  • Show GREEN patient
  • AI shows: Risk 72%, Escalation in 12 minutes
  • Update vitals worse
  • Risk jumps to 85%, countdown updates
  ↓
[03:00] Surge Forecast - Government Dashboard
  • 6-hour forecast graph shows spike at 19:00
  • Surge alert: 45 patients expected (threshold: 20)
  • Recommendations: "Call 3 nurses", "Prepare 8 beds"
  ↓
[04:00] Explainability
  • Click "Show Feature Importance"
  • SHAP waterfall: SpO2 (+20), HR (+15), Age (+12)
  ↓
[05:00] END - Q&A
```

---

## 🔄 RESTART IF NEEDED

**Stop all services:**
```bash
# Press Ctrl+C in each terminal
# Or kill all:
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

**Start again:**
```bash
start-ai-system.bat
```

---

## 📱 ACCESS FROM PHONE/TABLET

Find your computer's IP:
```bash
ipconfig    # Windows
ifconfig    # Mac/Linux
```

On your phone, open: `http://YOUR_IP:5173`

Example: `http://192.168.1.100:5173`

---

## ✅ PRE-DEMO CHECKLIST

Before presenting:

- [ ] ML service running → `http://localhost:5001/health` shows "healthy"
- [ ] Backend running → No errors in terminal
- [ ] Frontend loads → `http://localhost:5173` opens
- [ ] Can login with nurse@cityhospital.com / nurse123
- [ ] NLP extracts symptoms when typing
- [ ] Deterioration alert shows risk score
- [ ] Surge forecast displays graph
- [ ] All animations smooth
- [ ] Have QUICK_REFERENCE.txt open for demo script

---

## 📖 DOCUMENTATION FILES

| File | Purpose |
|------|---------|
| **START_HERE.txt** | This quick reference |
| **LOCAL_SETUP_GUIDE.md** | Complete setup instructions |
| **QUICK_REFERENCE.txt** | Demo script cheat sheet |
| **IMPLEMENTATION_SUMMARY.md** | Technical overview |
| **VALIDATION_REPORT.md** | Integration validation |
| **AI_IMPLEMENTATION.md** | Full AI documentation |

---

## 💡 PRO TIPS

1. **Always start ML service first** - Backend depends on it
2. **Keep terminals open** - You can see live logs
3. **Test before demo** - Run through workflow once
4. **Have backup plan** - Screenshots if something fails
5. **Know your credentials** - Write them down
6. **Check health endpoint** - `localhost:5001/health` before demo

---

## 🎯 SUCCESS!

If you see:
- ✅ Frontend at http://localhost:5173
- ✅ Login page loads
- ✅ Can login as Nurse/Doctor
- ✅ NLP extracts symptoms
- ✅ Risk scores display

**You're ready for your IIT Hackathon demo! 🚀**

---

**Need Help?** Check LOCAL_SETUP_GUIDE.md for detailed troubleshooting.

**Last Updated**: December 23, 2025
