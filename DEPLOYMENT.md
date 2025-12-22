# TRIAGELOCK Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=triagelock_prod
DB_USER=triagelock_user
DB_PASSWORD=<strong-password>

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# Security
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=24h

# Triage Thresholds (customize per hospital policy)
CRITICAL_WAIT_TIME_MINUTES=15
HIGH_WAIT_TIME_MINUTES=60
MEDIUM_WAIT_TIME_MINUTES=120

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### 2. Database Setup

#### PostgreSQL Installation (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database and User
```bash
sudo -u postgres psql

CREATE DATABASE triagelock_prod;
CREATE USER triagelock_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE triagelock_prod TO triagelock_user;
\q
```

#### Run Migrations
```bash
npm run migrate
```

#### Optional: Seed Sample Data
```bash
npm run seed
```

### 3. Redis Setup

#### Installation (Ubuntu/Debian)
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Secure Redis
Edit `/etc/redis/redis.conf`:
```
bind 127.0.0.1
requirepass your-redis-password
```

Then restart:
```bash
sudo systemctl restart redis
```

Update `.env`:
```env
REDIS_URL=redis://:your-redis-password@localhost:6379/0
```

### 4. Build Application

```bash
npm install --production
npm run build
```

### 5. Process Manager (PM2)

#### Install PM2
```bash
npm install -g pm2
```

#### Start Application
```bash
pm2 start dist/server.js --name triagelock -i max
```

Options:
- `-i max`: Use all CPU cores (cluster mode)
- `-i 4`: Use 4 instances

#### Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

#### Monitor Application
```bash
pm2 status
pm2 logs triagelock
pm2 monit
```

### 6. Reverse Proxy (Nginx)

#### Install Nginx
```bash
sudo apt install nginx
```

#### Configure Nginx
Create `/etc/nginx/sites-available/triagelock`:

```nginx
upstream triagelock_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # WebSocket support
    location / {
        proxy_pass http://triagelock_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running connections
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting (optional)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/triagelock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

### 8. Firewall Configuration

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9. Log Rotation

Create `/etc/logrotate.d/triagelock`:

```
/path/to/triagelock/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 10. Monitoring & Alerts

#### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

### 11. Database Backup

#### Automated Daily Backup Script
Create `/usr/local/bin/backup-triagelock.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/triagelock"
mkdir -p $BACKUP_DIR

pg_dump -U triagelock_user triagelock_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-triagelock.sh
```

Add to crontab:
```bash
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/backup-triagelock.sh
```

### 12. Performance Optimization

#### Database Indexing
Indexes are already created in migrations, but verify:
```sql
CREATE INDEX idx_patients_hospital_status ON patients(hospital_id, status);
CREATE INDEX idx_patients_priority_arrival ON patients(priority, arrival_time);
CREATE INDEX idx_alerts_hospital_ack ON alerts(hospital_id, acknowledged, created_at);
```

#### PostgreSQL Configuration
Edit `/etc/postgresql/14/main/postgresql.conf`:

```
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Redis Configuration
Edit `/etc/redis/redis.conf`:

```
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 13. Security Hardening

#### Update Default Passwords
After deployment, immediately change all default passwords:

```bash
# Connect to your server
psql -U triagelock_user -d triagelock_prod

# Update user passwords
UPDATE users SET password_hash = '$2b$10$...' WHERE email = 'admin@cityhospital.com';
```

Or use the API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new-admin@hospital.com",
    "password": "NewSecurePassword123!",
    "name": "New Admin",
    "role": "admin",
    "hospitalId": 1
  }'
```

#### Environment Variables
Never commit `.env` to version control:
```bash
echo ".env" >> .gitignore
```

#### CORS Configuration
Update `src/server.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 14. Scaling Considerations

#### Horizontal Scaling
- Use PM2 cluster mode: `pm2 start dist/server.js -i max`
- Load balance with Nginx upstream
- Use Redis for session sharing

#### Database Connection Pooling
Already configured in `knexfile.js`:
```javascript
pool: {
  min: 5,
  max: 30
}
```

#### Vertical Scaling
Recommended minimum specs:
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 20GB+ SSD
- Network: 100Mbps+

### 15. Testing Deployment

```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cityhospital.com","password":"admin123"}'

# WebSocket test (using wscat)
npm install -g wscat
wscat -c wss://api.yourdomain.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 16. Rollback Plan

```bash
# List PM2 processes
pm2 list

# Stop application
pm2 stop triagelock

# Restore database backup
gunzip < /backups/triagelock/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U triagelock_user triagelock_prod

# Restart with previous version
pm2 start dist/server.js --name triagelock
```

### 17. Maintenance Mode

Create maintenance page and enable in Nginx:

```nginx
if (-f /var/www/maintenance.html) {
    return 503;
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www;
    rewrite ^(.*)$ /maintenance.html break;
}
```

---

## Docker Deployment (Alternative)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: triagelock_prod
      POSTGRES_USER: triagelock_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Deploy with Docker
```bash
docker-compose up -d
docker-compose logs -f
```

---

## Support Contacts

- System Administrator: admin@hospital.com
- Technical Support: support@triagelock.com
- Emergency Hotline: +1-555-TRIAGE

---

**Remember: This is a critical healthcare system. Test thoroughly before production deployment.**
