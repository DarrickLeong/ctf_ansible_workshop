# CTF Tracker Application - Setup Guide

The main CTF web application for managing challenges, scoring, and leaderboards.

## 📁 Files Overview

- **`app.py`** - Main Flask web application
- **`requirements.txt`** - Python dependencies
- **`Dockerfile`** - Container image definition
- **`deploy-interactive.sh`** - OpenShift deployment script
- **`config.template`** - Environment variable template

## 🚀 Quick Deployment

### **Deploy to OpenShift** 🐳
```bash
cd ctf-app/
oc login <your-openshift-url>
./deploy-interactive.sh
```

**The script will prompt for**:
- OpenShift cluster domain
- Project name and storage settings
- Resource limits and security settings
- CTF Tracker URL (save this for central controller setup)

### **Local Development** 💻
```bash
# Set up environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure application
cp config.template .env
vim .env    # Edit with your settings

# Run application
python app.py
# Access at: http://localhost:5000
```

## 🎯 Key Features

- **Multi-AAP Cluster Support** - Manage multiple sub controllers
- **Real-time Scoring** - Live challenge progress and leaderboards
- **Web Dashboard** - Easy-to-use management interface
- **REST API** - Complete API for AAP integration
- **Challenge Tracking** - Apache, Nginx, MySQL, firewall, user management

## ✅ Verification

After deployment:
```bash
# Check deployment status
oc get pods -n <project-name>

# Get application URL
oc get route -n <project-name>

# Test application
curl -I https://<ctf-tracker-url>
```

## 🔧 Configuration

**Environment Variables** (in `.env` or OpenShift):
```bash
CTF_TRACKER_URL=https://ctf-tracker.apps.openshift.com
AUTO_REFRESH_INTERVAL=30
MAX_CONCURRENT_CHECKS=5
DATABASE_DIR=/app/data
```

## 🛠️ Troubleshooting

**Deployment Issues**:
```bash
# Check build logs
oc logs -f bc/<app-name>

# Check pod logs
oc logs -f deployment/<app-name>

# Check events
oc get events --sort-by='.lastTimestamp'
```

**Database Issues**:
```bash
# Check storage
oc get pvc

# Check database directory
oc exec deployment/<app-name> -- ls -la /app/data
```

---

**Your CTF Tracker is ready to manage challenge events!** 🏆
