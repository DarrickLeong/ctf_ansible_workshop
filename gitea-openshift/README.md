# Gitea on OpenShift

Complete deployment solution for Gitea Git server on OpenShift with automated user creation.

Based on the [official Gitea Kubernetes installation guide](https://docs.gitea.com/installation/install-on-kubernetes).

## 🚀 Quick Start

### **1. Deploy Gitea**

```bash
cd gitea-openshift
./deploy-gitea.sh
```

The script will prompt for:
- Project name (default: `gitea`)
- Admin username (default: `gitea_admin`)
- Admin password
- Admin email

### **2. Create Workshop Users and Repositories**

```bash
# Get admin token from Gitea UI first:
# Login → Settings → Applications → Generate Token

./create-workshop-repos.sh \
    "http://gitea-gitea.apps.YOUR-CLUSTER.com" \
    "YOUR_ADMIN_TOKEN" \
    "workshop-users.csv"
```

This will:
- Create all users from CSV
- Create `ansible-ctf-challenges` repository for each user
- Initialize repos with challenge content (6 challenges)
- Add README and templates

---

## 📋 Features

✅ **Automated Deployment**
- One-command installation
- OpenShift-compatible security contexts
- Persistent storage for data
- Health checks configured ([per docs](https://docs.gitea.com/installation/install-on-kubernetes))

✅ **User Management**
- Bulk user creation from CSV
- Automated repository setup
- Challenge content initialization
- Admin and regular user support

✅ **Production Ready**
- SQLite database (upgradeable to PostgreSQL/PostgreSQL)
- Persistent volume claims
- Service and route exposure
- Liveness and readiness probes

---

## 📁 Scripts Overview

### **Core Scripts**
- **`deploy-gitea.sh`** - Main deployment script (interactive)
- **`create-workshop-repos.sh`** - Create users + repos + challenge content
- **`manage-gitea.sh`** - Management utilities (status, logs, backup, etc.)
- **`gitea-recovery.sh`** - Interactive recovery menu (backup/restore/redeploy)
- **`quick-recovery.sh`** - Non-interactive deployment (automation-friendly)
- **`workshop-users.csv`** - Example user list with challenge participants

### **What Gets Deployed**
- **Deployment:** Gitea application (1 replica)
- **Service:** HTTP (3000) and SSH (22) ports
- **PVC:** 5Gi persistent storage
- **ConfigMap:** Gitea configuration
- **Route:** External access

---

## 🎓 Usage Examples

### **Create Workshop Users with Challenge Repositories**

Edit `workshop-users.csv`:

```csv
# Workshop Participants
Student1,Student1@ctfworkshop.com,R3dh4t1!,false
nj8zq,nj8zq@ctfworkshop.com,R3dh4t1!,false
```

Then run:
```bash
./create-workshop-repos.sh \
    "http://gitea-gitea.apps.YOUR-CLUSTER.com" \
    "YOUR_ADMIN_TOKEN" \
    "workshop-users.csv"
```

This will:
1. Create each user account
2. Create `ansible-ctf-challenges` repository for each user
3. Initialize repository with:
   - 6 challenge directories (challenge1/ to challenge6/)
   - README with problem descriptions
   - Playbook templates
   - Example templates (motd.j2)
   - .gitignore

### **Check Deployment Status**

```bash
./manage-gitea.sh status
```

### **Backup Data (Before Cluster Hibernation)**

```bash
./gitea-recovery.sh
# Select Option 2: Backup Gitea Data
```

---

## 🔧 Configuration

### **Default Settings**

- **App Name:** Gitea: Git with a cup of tea
- **Database:** SQLite (stored in `/data/gitea/gitea.db`)
- **Repository Root:** `/data/git/repositories`
- **Registration:** Enabled (can be disabled)
- **SSH:** Enabled on port 22

### **Customize Configuration**

Edit the ConfigMap in `deploy-gitea.sh` before running:

```ini
[service]
DISABLE_REGISTRATION = true  # Disable public registration
REQUIRE_SIGNIN_VIEW = true   # Require login to view

[repository]
DEFAULT_PRIVATE = private    # Make repos private by default
```

---

## 📊 Monitoring & Management

### **Check Status**
```bash
oc get pods -n gitea
oc logs -f deployment/gitea -n gitea
```

### **Health Check**
```bash
GITEA_URL=$(oc get route gitea -n gitea -o jsonpath='{.spec.host}')
curl http://${GITEA_URL}/api/healthz
```

Expected response:
```json
{
  "status": "pass",
  "description": "Gitea: Git with a cup of tea",
  "checks": {
    "database:ping": [{"status": "pass"}]
  }
}
```

### **Access Gitea CLI**
```bash
POD_NAME=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec -it ${POD_NAME} -n gitea -- gitea admin user list
```

---

## 🛠️ Troubleshooting

### **Pod Not Starting**

```bash
# Check pod status
oc get pods -n gitea

# View logs
oc logs deployment/gitea -n gitea

# Describe pod
oc describe pod -l app=gitea -n gitea
```

### **Cannot Access via Route**

```bash
# Verify route exists
oc get route gitea -n gitea

# Test service
oc port-forward service/gitea 3000:3000 -n gitea
# Then access: http://localhost:3000
```

### **User Creation Fails**

```bash
# Check if admin user exists
POD_NAME=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec ${POD_NAME} -n gitea -- gitea admin user list

# Manually create user
oc exec ${POD_NAME} -n gitea -- gitea admin user create \
  --username newuser \
  --password password123 \
  --email newuser@example.com \
  -c /etc/gitea/app.ini
```

---

## 🔒 Security Considerations

### **Change Default Passwords**
- Update admin password after first login
- Use strong passwords in CSV files
- Don't commit CSV files with real passwords to git

### **Disable Public Registration** (Production)
```ini
[service]
DISABLE_REGISTRATION = true
```

### **Enable HTTPS**
```bash
# Create TLS route
oc create route edge gitea-secure \
  --service=gitea \
  --cert=tls.crt \
  --key=tls.key \
  -n gitea
```

---

## 📚 Advanced Configuration

### **Upgrade to PostgreSQL**

1. Deploy PostgreSQL:
```bash
oc new-app postgresql-persistent \
  -p POSTGRESQL_USER=gitea \
  -p POSTGRESQL_PASSWORD=gitea123 \
  -p POSTGRESQL_DATABASE=gitea \
  -n gitea
```

2. Update ConfigMap:
```ini
[database]
DB_TYPE = postgres
HOST = postgresql:5432
NAME = gitea
USER = gitea
PASSWD = gitea123
```

### **Enable Email Notifications**

```ini
[mailer]
ENABLED = true
FROM = noreply@example.com
MAILER_TYPE = smtp
HOST = smtp.example.com:587
USER = smtp_user
PASSWD = smtp_password
```

---

## 🎯 Use Cases

### **For CTF Workshops**
- Pre-create accounts for participants
- Host challenge repositories
- Track student progress via Git commits
- Provide code review capabilities

### **For Training**
- Distribute course materials via Git
- Student project submissions
- Collaborative exercises
- Version control training

### **For Development Teams**
- Self-hosted Git server
- On-premise source control
- Integration with CI/CD
- No external dependencies

---

## 📦 What's Included

```
gitea-openshift/
├── deploy-gitea.sh              # Main deployment script
├── create-users-api.sh          # API-based user creation
├── sample-users.csv             # Auto-generated example users
├── create-gitea-users.sh        # Auto-generated CLI script
└── README.md                    # This file
```

---

## 🔗 Additional Resources

- [Gitea Documentation](https://docs.gitea.com/)
- [Gitea Kubernetes Installation](https://docs.gitea.com/installation/install-on-kubernetes)
- [Gitea API Documentation](https://docs.gitea.com/api/1.25/)
- [Gitea Health Check Endpoint](https://docs.gitea.com/installation/install-on-kubernetes#health-check-endpoint)

---

## ✅ Quick Commands Reference

```bash
# Deploy Gitea
./deploy-gitea.sh

# Create users from CSV
./create-gitea-users.sh users.csv

# Get Gitea URL
oc get route gitea -n gitea

# View logs
oc logs -f deployment/gitea -n gitea

# Access Gitea pod
POD=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec -it $POD -n gitea -- /bin/sh

# List all users
oc exec $POD -n gitea -- gitea admin user list

# Delete Gitea
oc delete project gitea
```

---

**Deploy your own Git server in minutes!** 🚀🔧✨

