# CTF Tracker Application - Complete Setup Guide

This folder contains the main CTF Tracker web application and its deployment components for comprehensive CTF challenge management.

## 📁 Contents

### **Core Application**
- **`app.py`** - Main Flask web application with REST API
- **`requirements.txt`** - Python dependencies and versions  
- **`Dockerfile`** - Container image definition with security best practices

### **Configuration & Deployment**
- **`config.template`** - Environment variable configuration template
- **`deploy-interactive.sh`** - Interactive OpenShift deployment script
- **`sanitize-for-github.sh`** - Security sanitization for public repositories

## 🚀 Complete Setup Guide

### **Phase 1: Prerequisites** 📋

```bash
# 1. Ensure you have OpenShift CLI installed
oc version

# 2. Login to your OpenShift cluster
oc login <your-openshift-cluster-url>
# Example: oc login https://api.openshift.apps.yourcompany.com:6443

# 3. Verify you have project creation permissions
oc new-project test-permissions
oc delete project test-permissions

# 4. Check available storage classes (optional)
oc get storageclass
```

### **Phase 2: Local Development (Optional)** 💻

**2.1 Set up Python environment:**
```bash
# Create virtual environment
python3 -m venv ctf-venv
source ctf-venv/bin/activate  # Linux/Mac
# ctf-venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep Flask
```

**2.2 Configure local environment:**
```bash
# Copy configuration template
cp config.template .env

# Edit configuration
vim .env
```

**Example `.env` configuration:**
```bash
# Flask Configuration
FLASK_DEBUG=true
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Database Configuration
DATABASE_DIR=./data
DATABASE_FILE=ctf_tracker.db

# CTF Application Settings
CTF_TRACKER_URL=http://localhost:5000
AUTO_REFRESH_INTERVAL=30
MAX_CONCURRENT_CHECKS=5

# Default AAP Configuration (optional)
AAP_BASE_URL=https://aap-east.yourcompany.com
AAP_USERNAME=admin
AAP_PASSWORD=your-password
AAP_JOB_TEMPLATE_ID=7
AAP_CONNECTIVITY_TEMPLATE_ID=8

# Security Settings
SESSION_SECRET_KEY=your-secret-key-here
VALIDATE_CERTS=false
```

**2.3 Run locally for testing:**
```bash
# Start application
python app.py

# Test in browser
open http://localhost:5000

# Test API endpoints
curl http://localhost:5000/api/attendees
curl http://localhost:5000/api/checkpoints
```

### **Phase 3: OpenShift Deployment** 🐳

**3.1 Navigate to application directory:**
```bash
cd ctf-app/
```

**3.2 Run interactive deployment:**
```bash
./deploy-interactive.sh
```

**Deployment prompts and recommended answers:**

1. **OpenShift Domain**: 
   ```
   Enter OpenShift cluster domain: apps.openshift.yourcompany.com
   ```

2. **Project Name**:
   ```
   Enter project name [ctf-tracker]: ctf-production
   ```

3. **Application Name**:
   ```
   Enter application name [ctf-tracker]: ctf-tracker
   ```

4. **Storage Class**:
   ```
   Available storage classes:
   - gp2 (default)
   - gp3
   - fast-ssd
   Enter storage class [gp2]: gp2
   ```

5. **Storage Size**:
   ```
   Enter storage size [2Gi]: 5Gi
   ```

6. **Resource Limits**:
   ```
   Enter memory limit [512Mi]: 1Gi
   Enter CPU limit [500m]: 1000m
   ```

7. **Security Settings**:
   ```
   Enable security context? [y/N]: y
   Run as non-root? [y/N]: y
   ```

8. **CTF Configuration**:
   ```
   Enter CTF Tracker URL [auto-generated]: https://ctf-tracker-ctf-production.apps.openshift.yourcompany.com
   Auto refresh interval (seconds) [30]: 30
   Max concurrent checks [5]: 10
   ```

9. **Default AAP Settings** (optional):
   ```
   Configure default AAP cluster? [y/N]: y
   AAP Base URL: https://aap-central.yourcompany.com
   AAP Username: admin
   AAP Password: [enter securely]
   ```

### **Phase 4: Verify Deployment** ✅

**4.1 Check deployment status:**
```bash
# Check project was created
oc get project ctf-production

# Check all resources
oc get all -n ctf-production

# Check pod status
oc get pods -n ctf-production
```

**Expected output:**
```bash
NAME                           READY   STATUS    RESTARTS   AGE
ctf-tracker-1-deploy           0/1     Completed   0          5m
ctf-tracker-1-xxxxx            1/1     Running     0          4m
```

**4.2 Check persistent storage:**
```bash
# Check PVC was created
oc get pvc -n ctf-production

# Check storage is bound
oc describe pvc ctf-tracker-data -n ctf-production
```

**4.3 Test application access:**
```bash
# Get application URL
oc get route ctf-tracker -n ctf-production -o jsonpath='{.spec.host}'

# Test HTTP access
export CTF_URL=$(oc get route ctf-tracker -n ctf-production -o jsonpath='{.spec.host}')
curl -I https://$CTF_URL

# Test in browser
echo "Open: https://$CTF_URL"
```

**4.4 Check application logs:**
```bash
# View recent logs
oc logs -f deployment/ctf-tracker -n ctf-production

# Check for startup messages
oc logs deployment/ctf-tracker -n ctf-production | grep "Running on"
```

### **Phase 5: Initial Configuration** ⚙️

**5.1 Access the web interface:**
- Navigate to: `https://ctf-tracker-ctf-production.apps.openshift.yourcompany.com`
- You should see the CTF Tracker dashboard

**5.2 Onboard your first AAP cluster:**
1. Click **"Onboard AAP Cluster"**
2. Fill in details:
   - **Name**: `East Sub Controller`
   - **Base URL**: `https://aap-east.yourcompany.com`
   - **Username**: `admin`
   - **Password**: `[your-password]`
   - **Organization**: `CTF Organization`
   - **Challenge Template ID**: `7` (will be created by central controller)
   - **Connectivity Template ID**: `8` (will be created by central controller)

3. Click **"Test Connection"** - should show green checkmark
4. Click **"Save Cluster"**

**5.3 Add RHEL machines:**
1. Click **"Add Machine"**
2. Fill in details:
   - **Hostname**: `rhel-host-01.east.local`
   - **Attendee**: Select or create attendee
   - **AAP Cluster**: Select the cluster you just added
3. Click **"Save Machine"**

**5.4 Test connectivity:**
1. Click **"Test All Connectivity"**
2. Monitor progress in real-time
3. Verify all machines show "Ready" status

## 🎯 Application Features Deep Dive

### **Web Dashboard** 📊
- **Real-time Leaderboard**: Automatic score updates
- **Challenge Progress**: Visual progress tracking
- **Multi-cluster Management**: Support for multiple AAP clusters
- **System Health**: Connectivity and readiness monitoring

### **API Endpoints** 🔌

**Core Management APIs:**
```bash
# Attendee Management
GET    /api/attendees              # List all attendees
POST   /api/attendees              # Create new attendee
GET    /api/attendees/<id>         # Get specific attendee
PUT    /api/attendees/<id>         # Update attendee
DELETE /api/attendees/<id>         # Delete attendee

# Challenge Management  
GET    /api/checkpoints            # List available challenges
GET    /api/progress               # Get all progress data
GET    /api/progress/<attendee_id> # Get progress for specific attendee

# Machine Management
GET    /api/machines               # List all machines
POST   /api/machines               # Add new machine
PUT    /api/machines/<id>          # Update machine
DELETE /api/machines/<id>          # Delete machine
```

**AAP Integration APIs:**
```bash
# Cluster Management
GET    /api/aap_clusters           # List AAP clusters
POST   /api/aap_clusters           # Add new cluster
PUT    /api/aap_clusters/<id>      # Update cluster
DELETE /api/aap_clusters/<id>      # Delete cluster

# Job Execution
GET    /api/trigger_connectivity_test/<cluster_id>/<hostname>  # Test connectivity
GET    /api/trigger_challenge_check/<cluster_id>/<hostname>   # Run challenges

# Results Webhooks (called by sub controllers)
POST   /api/connectivity_test      # Receive connectivity results
POST   /api/challenge_results      # Receive challenge results
```

**Example API Usage:**
```bash
# Create new attendee
curl -X POST https://$CTF_URL/api/attendees \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get leaderboard data
curl https://$CTF_URL/api/progress

# Trigger challenge check
curl https://$CTF_URL/api/trigger_challenge_check/1/rhel-host-01
```

### **Database Schema** 🗄️

**Main Tables:**
- **`attendees`** - CTF participants
- **`aap_clusters`** - Registered AAP clusters
- **`machines`** - RHEL target hosts
- **`challenge_types`** - Available challenge definitions
- **`attendee_progress`** - Challenge completion tracking
- **`connectivity_results`** - System health data

### **Security Features** 🔐

**Application Security:**
- **Non-root Container**: Runs as user ID 1001
- **Security Context**: Dropped capabilities, read-only root filesystem
- **Network Policies**: Traffic restriction and segmentation
- **Secret Management**: Encrypted credential storage

**API Security:**
- **Token-based Authentication**: Secure webhook endpoints
- **SSL/TLS**: HTTPS-only communication
- **Input Validation**: SQL injection and XSS protection
- **Rate Limiting**: API abuse prevention

## 🔧 Advanced Configuration

### **Environment Variables Reference**

**Flask Configuration:**
```bash
FLASK_DEBUG=false              # Enable debug mode (development only)
FLASK_HOST=0.0.0.0            # Listen address  
FLASK_PORT=5000               # Listen port
```

**Database Configuration:**
```bash
DATABASE_DIR=/app/data        # Database storage directory
DATABASE_FILE=ctf_tracker.db  # SQLite database filename
```

**CTF Application Settings:**
```bash
CTF_TRACKER_URL=https://...   # Public URL of this application
AUTO_REFRESH_INTERVAL=30      # Dashboard refresh rate (seconds)
MAX_CONCURRENT_CHECKS=5       # Concurrent job execution limit
```

**Default AAP Configuration:**
```bash
AAP_BASE_URL=https://...      # Default AAP cluster URL
AAP_USERNAME=admin            # Default username
AAP_PASSWORD=password         # Default password (use secrets!)
AAP_JOB_TEMPLATE_ID=7         # Challenge verification template ID
AAP_CONNECTIVITY_TEMPLATE_ID=8 # Connectivity test template ID
```

**Security Settings:**
```bash
SESSION_SECRET_KEY=secret     # Flask session key (generate random!)
VALIDATE_CERTS=false          # SSL certificate validation
```

### **Custom Challenge Configuration**

**Add new challenge types via database:**
```sql
INSERT INTO challenge_types (name, description, max_points, challenge_config, active)
VALUES (
    'custom_docker',
    'Docker Container Management',
    20,
    '{"required_packages": ["docker"], "services": ["docker"], "custom_commands": [{"name": "container_running", "command": "docker ps | grep nginx", "points": 10}]}',
    TRUE
);
```

### **Performance Tuning**

**Scaling Recommendations:**
```bash
# Resource limits for high-load scenarios
memory_limit: 2Gi
cpu_limit: 2000m
replicas: 3

# Storage optimization
storage_size: 10Gi
storage_class: fast-ssd
```

**Database Optimization:**
```bash
# Enable WAL mode for SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

## 🛠️ Troubleshooting Guide

### **Common Issues & Solutions**

**1. Deployment Fails**
```bash
# Check build logs
oc logs -f bc/ctf-tracker -n ctf-production

# Check deployment logs  
oc logs -f deployment/ctf-tracker -n ctf-production

# Check events
oc get events -n ctf-production --sort-by='.lastTimestamp'
```

**2. Application Won't Start**
```bash
# Check pod status
oc describe pod -l app=ctf-tracker -n ctf-production

# Check resource limits
oc get resourcequota -n ctf-production

# Check storage issues
oc describe pvc ctf-tracker-data -n ctf-production
```

**3. Database Issues**
```bash
# Check database directory permissions
oc exec -it deployment/ctf-tracker -n ctf-production -- ls -la /app/data

# Check database file
oc exec -it deployment/ctf-tracker -n ctf-production -- sqlite3 /app/data/ctf_tracker.db ".tables"

# Reset database (DANGER!)
oc exec -it deployment/ctf-tracker -n ctf-production -- rm /app/data/ctf_tracker.db
oc rollout restart deployment/ctf-tracker -n ctf-production
```

**4. AAP Connection Issues**
```bash
# Test from inside container
oc exec -it deployment/ctf-tracker -n ctf-production -- curl -k https://aap-east.yourcompany.com/api/v2/ping/

# Check network policies
oc get networkpolicy -n ctf-production

# Check DNS resolution
oc exec -it deployment/ctf-tracker -n ctf-production -- nslookup aap-east.yourcompany.com
```

**5. Performance Issues**
```bash
# Check resource usage
oc top pod -n ctf-production

# Check application metrics
oc exec -it deployment/ctf-tracker -n ctf-production -- curl http://localhost:5000/api/health

# Scale up if needed
oc scale deployment/ctf-tracker --replicas=3 -n ctf-production
```

### **Monitoring & Maintenance**

**Health Checks:**
```bash
# Application health endpoint
curl https://$CTF_URL/api/health

# Database health check
oc exec deployment/ctf-tracker -n ctf-production -- sqlite3 /app/data/ctf_tracker.db "SELECT COUNT(*) FROM attendees;"

# Check recent activity
curl https://$CTF_URL/api/progress | jq '.[] | select(.last_updated > "2023-10-01")'
```

**Backup Procedures:**
```bash
# Backup database
oc cp ctf-production/$(oc get pod -l app=ctf-tracker -o name | head -1 | cut -d/ -f2):/app/data/ctf_tracker.db ./backup-$(date +%Y%m%d).db

# Backup configuration
oc get configmap ctf-tracker-config -n ctf-production -o yaml > ctf-config-backup.yaml
oc get secret ctf-tracker-secrets -n ctf-production -o yaml > ctf-secrets-backup.yaml
```

**Log Management:**
```bash
# View logs with timestamps
oc logs deployment/ctf-tracker -n ctf-production --timestamps=true

# Filter for errors
oc logs deployment/ctf-tracker -n ctf-production | grep ERROR

# Monitor logs in real-time
oc logs -f deployment/ctf-tracker -n ctf-production --tail=50
```

---

**🎯 Your CTF Tracker is ready to manage comprehensive challenge events!** 🏆
