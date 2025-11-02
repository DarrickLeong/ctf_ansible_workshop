# ✅ Gitea OpenShift Deployment - Complete!

## 🎉 What Was Created

Based on the [official Gitea Kubernetes installation guide](https://docs.gitea.com/installation/install-on-kubernetes), a complete Gitea deployment solution for OpenShift with automated user creation.

---

## 📦 Files Created

```
gitea-openshift/
├── deploy-gitea.sh            # Main deployment script (interactive)
├── create-users-api.sh        # API-based bulk user creation
├── manage-gitea.sh            # Management helper (status, backup, etc.)
├── workshop-users.csv         # Example user list (10 users)
└── README.md                  # Complete documentation
```

**Auto-Generated (by deploy script):**
- `create-gitea-users.sh` - CLI-based user creation script
- `sample-users.csv` - Sample user file with 5 users

---

## 🚀 Quick Start

### **1. Deploy Gitea**
```bash
cd gitea-openshift
./deploy-gitea.sh
```

**Prompts for:**
- Project name (default: `gitea`)
- Admin username
- Admin password
- Admin email

**What it deploys:**
- ✅ Gitea application (1.25.0)
- ✅ Persistent storage (5Gi PVC)
- ✅ Service (HTTP + SSH)
- ✅ Route for external access
- ✅ Health checks ([per documentation](https://docs.gitea.com/installation/install-on-kubernetes#health-check-endpoint))
- ✅ Admin user creation
- ✅ User creation scripts

### **2. Create Multiple Users**

**Method 1: CLI (recommended)**
```bash
./create-gitea-users.sh workshop-users.csv
```

**Method 2: API**
```bash
# Get admin token from Gitea UI first
./create-users-api.sh http://gitea-url TOKEN workshop-users.csv
```

### **3. Manage Gitea**
```bash
./manage-gitea.sh status        # Check status
./manage-gitea.sh logs          # View logs
./manage-gitea.sh url           # Get URL
./manage-gitea.sh list-users    # List all users
./manage-gitea.sh backup        # Backup data
```

---

## ✨ Features

### **Automated Deployment**
✅ One-command installation  
✅ OpenShift-compatible configurations  
✅ No manual YAML editing required  
✅ Health checks pre-configured  
✅ Persistent storage automatic  

### **Bulk User Creation**
✅ Create users from CSV files  
✅ Two methods: CLI and API  
✅ Admin and regular user support  
✅ Sample files included  
✅ Password management  

### **Production Ready**
✅ Health endpoints ([/api/healthz](https://docs.gitea.com/installation/install-on-kubernetes#health-check-endpoint))  
✅ Liveness probes configured  
✅ Readiness probes configured  
✅ Persistent data storage  
✅ SSH and HTTP support  

### **Easy Management**
✅ Helper script for common tasks  
✅ Backup functionality  
✅ User management commands  
✅ Status monitoring  
✅ Log viewing  

---

## 📋 CSV User Format

```csv
username,email,password,is_admin
participant1,participant1@workshop.local,Workshop2024!,false
instructor,instructor@workshop.local,Instructor2024!,true
```

---

## 🎯 Use Cases

### **For CTF Workshops**
- Pre-create participant accounts
- Host challenge repositories
- Track student progress
- Code review and collaboration

### **For Training**
- Distribute course materials
- Student project submissions
- Collaborative exercises
- Version control training

### **For Development**
- Self-hosted Git server
- On-premise source control
- No external dependencies
- Full control over data

---

## 🔧 Technical Details

### **Configuration**
- **Image:** `gitea/gitea:1.25.0`
- **Database:** SQLite (upgradeable to PostgreSQL/MySQL)
- **Storage:** 5Gi PVC
- **Ports:** 3000 (HTTP), 22 (SSH)
- **Health Check:** `/api/healthz` endpoint

### **OpenShift Resources**
- **Deployment:** 1 replica, resource limits optional
- **Service:** ClusterIP with HTTP and SSH ports
- **Route:** HTTP (upgradeable to HTTPS/TLS)
- **PVC:** ReadWriteOnce, 5Gi
- **ConfigMap:** Gitea configuration (`app.ini`)

### **Security**
- Admin user created during deployment
- Optional: Disable public registration
- Optional: Require signin to view
- SSH key authentication supported
- OAuth2 enabled

---

## 📊 Health Check Example

As documented in the [Gitea Kubernetes guide](https://docs.gitea.com/installation/install-on-kubernetes#health-check-endpoint):

```bash
curl http://gitea-url/api/healthz
```

**Response:**
```json
{
  "status": "pass",
  "description": "Gitea: Git with a cup of tea",
  "checks": {
    "cache:ping": [{"status": "pass"}],
    "database:ping": [{"status": "pass"}]
  }
}
```

---

## 🛠️ Management Commands

```bash
# Status and monitoring
./manage-gitea.sh status           # Full status
./manage-gitea.sh logs             # Follow logs
./manage-gitea.sh url              # Get URL

# User management
./manage-gitea.sh list-users       # List all users
./manage-gitea.sh reset-password <user> <pass>
./manage-gitea.sh delete-user <user>

# Operations
./manage-gitea.sh restart          # Restart Gitea
./manage-gitea.sh backup           # Backup data
./manage-gitea.sh shell            # Open shell in pod
```

---

## 📚 Example Workflows

### **Workshop Setup (10 participants)**

1. Deploy Gitea:
```bash
./deploy-gitea.sh
# Project: workshop-git
# Admin: workshop_admin
# Password: ********
```

2. Create participant accounts:
```bash
# Edit workshop-users.csv with 10 participants
./create-gitea-users.sh workshop-users.csv
```

3. Share URL with participants:
```bash
./manage-gitea.sh url
# http://gitea-workshop-git.apps.cluster.com
```

4. Participants login and create repositories
5. Monitor activity via admin dashboard

### **Training Environment (Team-based)**

```csv
team_red,team_red@training.local,TeamRed2024!,false
team_blue,team_blue@training.local,TeamBlue2024!,false
team_green,team_green@training.local,TeamGreen2024!,false
instructor,instructor@training.local,Instructor2024!,true
```

---

## 🔗 Additional Resources

- [Gitea Official Documentation](https://docs.gitea.com/)
- [Gitea Kubernetes Installation](https://docs.gitea.com/installation/install-on-kubernetes)
- [Gitea API Documentation](https://docs.gitea.com/api/1.25/)
- [Health Check Configuration](https://docs.gitea.com/installation/install-on-kubernetes#health-check-endpoint)
- [Kubernetes Liveness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

## ✅ Benefits

**vs GitHub/GitLab:**
- ✅ Self-hosted (complete control)
- ✅ No external dependencies
- ✅ Runs on your OpenShift cluster
- ✅ No cloud costs
- ✅ Data privacy

**vs Manual Git Server:**
- ✅ Web UI included
- ✅ User management
- ✅ Repository browsing
- ✅ Pull requests
- ✅ Issue tracking

**vs Other Self-Hosted:**
- ✅ Lightweight (single binary)
- ✅ Easy to deploy
- ✅ SQLite by default (no extra DB)
- ✅ Fast and responsive
- ✅ Active development

---

**Deploy your own Git server in minutes!** 🚀🔧✨

*Based on Gitea 1.25.0 - November 2025*

