# 🚂 RAILWAY.COM DEPLOYMENT GUIDE - TRIAGELOCK AI/ML

## 📋 OVERVIEW

Railway.com deployment requires **3 SEPARATE SERVICES**:

```
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY PROJECT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Service 1: BACKEND (Node.js)                              │
│  ├── Backend API                                            │
│  ├── Frontend (served as static files)                      │
│  ├── WebSocket                                              │
│  └── Database (SQLite or PostgreSQL)                        │
│                                                             │
│  Service 2: ML SERVICE (Python)                            │
│  ├── Flask API                                              │
│  ├── Deterioration Predictor                                │
│  ├── NLP Extractor                                          │
│  └── Surge Forecaster                                       │
│                                                             │
│  Service 3: REDIS (Optional)                               │
│  └── Caching                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 DEPLOYMENT STRATEGY

### **OPTION A: Monorepo (RECOMMENDED)**
Deploy as **2 services in 1 Railway project**:
- Service 1: Backend + Frontend (Node.js)
- Service 2: ML Service (Python)

### **OPTION B: Separate Repos**
Split into 3 separate Railway projects

**We'll use OPTION A** (easier, faster, cheaper)

---

## 🔧 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Prepare Repository**

**1.1 Create `.railwayignore` (if needed)**
```bash
# Create in project root
node_modules/
ml-service/venv/
*.log
.env
dist/
client/dist/
```

**1.2 Update `package.json` for production**

Already good! Your `start` script:
```json
"start": "npm run migrate && npm run create-admin && NODE_ENV=production node dist/server.js"
```

**1.3 Create `Procfile` for backend** (optional but recommended)
```
web: npm run build && npm start
```

---

### **STEP 2: Deploy Backend Service**

**2.1 Push to GitHub**
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

**2.2 Create Railway Project**
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Node.js

**2.3 Configure Backend Environment Variables**

In Railway Dashboard → Your Service → Variables:

```env
NODE_ENV=production
PORT=3000

# Database (Railway provides PostgreSQL)
DATABASE_URL=${DATABASE_URL}  # Auto-provided by Railway if you add PostgreSQL

# OR use SQLite (simpler for demo)
# No DATABASE_URL needed, SQLite file will be created

# JWT
JWT_SECRET=your-super-secure-secret-key-change-this-now
JWT_EXPIRES_IN=24h

# ML Service URL (will update after deploying ML service)
ML_SERVICE_URL=https://your-ml-service.railway.app

# Admin
ADMIN_EMAIL=admin@triagelock.com
ADMIN_PASSWORD=SecurePassword123!

# Triage Thresholds
CRITICAL_WAIT_TIME_MINUTES=15
HIGH_WAIT_TIME_MINUTES=60
MEDIUM_WAIT_TIME_MINUTES=120
```

**2.4 Add PostgreSQL Database (Optional)**

If you want PostgreSQL instead of SQLite:
1. In Railway Dashboard → "New" → "Database" → "PostgreSQL"
2. Railway auto-creates `DATABASE_URL` variable
3. Your backend will auto-connect

**For SQLite (simpler for hackathon):**
- No additional setup needed
- Database file created automatically

**2.5 Configure Build Settings**

Railway should auto-detect. Verify:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/`

---

### **STEP 3: Deploy ML Service**

**3.1 Create `ml-service/Procfile`**
```
web: python app.py
```

**3.2 Create `ml-service/runtime.txt`**
```
python-3.10.7
```

**3.3 Update `ml-service/app.py` for production**

Add at the bottom:
```python
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))  # Railway provides PORT
    app.run(host='0.0.0.0', port=port, debug=False)  # debug=False for production
```

**3.4 Deploy ML Service to Railway**

1. Railway Dashboard → "New" → "Empty Service"
2. Name it "ML Service"
3. Connect to same GitHub repo
4. **Root Directory**: `/ml-service`
5. Railway auto-detects Python

**3.5 Configure ML Service Environment Variables**
```env
PORT=5001
ML_SERVICE_PORT=5001
FLASK_ENV=production
```

**3.6 Verify ML Service Build Settings**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Root Directory**: `/ml-service`

---

### **STEP 4: Connect Services**

**4.1 Get ML Service URL**
1. Railway Dashboard → ML Service → Settings → Domains
2. Click "Generate Domain"
3. Copy URL (e.g., `https://ml-service-production-abc123.up.railway.app`)

**4.2 Update Backend Environment Variables**
```env
ML_SERVICE_URL=https://ml-service-production-abc123.up.railway.app
```

**4.3 Update Frontend API URLs**

If frontend makes direct calls to ML service, update:

**Option 1: Environment Variable (RECOMMENDED)**

Create `client/.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app
VITE_ML_SERVICE_URL=https://your-ml-service.railway.app
```

**Option 2: Proxy through Backend (BETTER)**

Keep all ML calls going through backend (already implemented in `aiService.ts`), so no frontend changes needed!

---

### **STEP 5: Configure CORS**

**Backend (`src/server.ts`)** - Should already have:
```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
};
app.use(cors(corsOptions));
```

**ML Service (`ml-service/app.py`)** - Already configured:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Allow all origins (or restrict in production)
```

**For production, restrict CORS:**
```python
CORS(app, origins=[
    "https://your-backend.railway.app",
    "https://triagelock.com"  # Your custom domain
])
```

---

### **STEP 6: Add Redis (Optional)**

If you want caching:
1. Railway Dashboard → "New" → "Database" → "Redis"
2. Railway auto-creates `REDIS_URL` variable
3. Your backend auto-connects

**For hackathon demo**: Skip Redis, not critical.

---

## 🔍 VERIFY DEPLOYMENT

### **Check Backend**
```bash
curl https://your-backend.railway.app/api/hospitals
```

### **Check ML Service**
```bash
curl https://your-ml-service.railway.app/health
```
Should return:
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

### **Check Frontend**
Open browser: `https://your-backend.railway.app`

---

## 📦 ALTERNATIVE: SINGLE SERVICE DEPLOYMENT

**If you want everything in one service:**

**1. Create `railway.json` in root:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**2. Create `nixpacks.toml` in root:**
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "python310"]

[phases.install]
cmds = [
  "npm install",
  "cd ml-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd .."
]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "python ml-service/app.py & npm start"
```

**⚠️ Note**: This is trickier, **2 services recommended**.

---

## 🎯 RAILWAY-SPECIFIC FILES TO CREATE

### **1. `railway.toml` (Backend Service)**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
```

### **2. `ml-service/railway.toml` (ML Service)**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "python app.py"
restartPolicyType = "ON_FAILURE"
```

---

## 🚨 IMPORTANT CONFIGURATION CHANGES

### **1. Update `knexfile.js` for Railway**

```javascript
require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './triagelock.sqlite3'
    },
    useNullAsDefault: true,
    // ... rest
  },

  production: {
    client: process.env.DATABASE_URL ? 'pg' : 'sqlite3',
    connection: process.env.DATABASE_URL || {
      filename: './triagelock.sqlite3'
    },
    useNullAsDefault: !process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
```

### **2. Update `src/config/database.ts`**

```typescript
import knex from 'knex';
import knexConfig from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

export default db;
```

### **3. Ensure Frontend Build is Served**

**Update `src/server.ts`** (should already have):
```typescript
import path from 'path';
import express from 'express';

// ... other imports

const app = express();

// ... middleware

// Serve static files from client build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🔐 SECURITY CHECKLIST

Before deploying:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change default admin password
- [ ] Set `NODE_ENV=production`
- [ ] Restrict CORS origins
- [ ] Add rate limiting (optional)
- [ ] Enable HTTPS (Railway provides automatically)

---

## 💰 RAILWAY PRICING

**Free Tier:**
- $5 credit/month
- Enough for small demos
- Services sleep after inactivity

**Hobby Plan:**
- $5/month
- Better for hackathon presentation
- No sleeping

**For IIT Hackathon**: Free tier should be sufficient!

---

## 📊 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Railway Load        │
         │   Balancer            │
         └───────────┬───────────┘
                     │
        ─────────────┴────────────────
        │                            │
        ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│  Backend Service │◄──────►│  ML Service      │
│  (Node.js)       │        │  (Python Flask)  │
│                  │        │                  │
│  • API           │        │  • Deterioration │
│  • Frontend      │        │  • NLP           │
│  • WebSocket     │        │  • Surge         │
│  • Database      │        │                  │
└──────────────────┘        └──────────────────┘
```

---

## 🎯 QUICK DEPLOYMENT COMMANDS

```bash
# 1. Initialize Railway CLI (optional)
npm i -g @railway/cli
railway login

# 2. Deploy Backend
railway up

# 3. Deploy ML Service
cd ml-service
railway up --service ml-service

# 4. Check status
railway status

# 5. View logs
railway logs
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Backend accessible: `https://your-backend.railway.app`
- [ ] ML Service healthy: `https://ml-service.railway.app/health`
- [ ] Frontend loads: `https://your-backend.railway.app`
- [ ] Can login with credentials
- [ ] NLP extraction works
- [ ] Deterioration predictor shows
- [ ] Database migrations ran
- [ ] Check Railway logs for errors

---

## 🐛 TROUBLESHOOTING

### **Backend won't start**
- Check Railway logs: `railway logs`
- Verify `npm run build` succeeds
- Check environment variables

### **ML Service fails**
- Verify `requirements.txt` is complete
- Check Python version: `runtime.txt` has `python-3.10.7`
- Check logs for missing packages

### **Database errors**
- Verify migrations ran: Check logs for "Batch X run"
- For PostgreSQL: Check `DATABASE_URL` is set
- For SQLite: Volume persistence enabled

### **CORS errors**
- Update CORS origins in both services
- Verify `ML_SERVICE_URL` is correct

---

## 📖 SUMMARY

**To deploy TRIAGELOCK on Railway:**

1. **Create 2 Railway Services:**
   - Service 1: Backend + Frontend (Node.js)
   - Service 2: ML Service (Python)

2. **Set Environment Variables**
   - Backend needs `ML_SERVICE_URL`
   - ML Service needs `PORT`

3. **Deploy & Connect**
   - Push to GitHub
   - Railway auto-deploys
   - Update URLs in env vars

4. **Test**
   - Check health endpoints
   - Login and test AI features

**Total Time**: ~30 minutes for first deployment

---

**🎯 Your Railway setup will be production-ready for the IIT Hackathon presentation!** 🚀
