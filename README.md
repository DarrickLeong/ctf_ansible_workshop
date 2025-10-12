# CTF Ansible Workshop - Organized Structure

This repository contains a comprehensive CTF (Capture the Flag) infrastructure management system with centralized deployment capabilities.

## 📁 Repository Structure

```
ctf-ansible-workshop/
├── ctf-app/                           # CTF Tracker Web Application
│   ├── app.py                         # Main Flask application
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Container image definition
│   ├── config.template                # Configuration template
│   ├── deploy-interactive.sh          # Interactive deployment script
│   └── sanitize-for-github.sh         # Security sanitization script
│
├── central-controller/                # Central Ansible Platform Controller
│   ├── deploy-to-sub-controllers.yml  # Main deployment playbook
│   ├── test-sub-controllers.yml       # Connectivity test playbook
│   ├── central-aap-inventory.ini      # Inventory template
│   ├── central-controller-job-templates.yml  # Job template configs
│   ├── host_vars/                     # Host-specific variables
│   │   ├── sub-controller-east.yml
│   │   └── sub-controller-west.yml
│   └── group_vars/all/
│       └── vault.yml                  # Encrypted credentials
│
├── sub-controllers/                   # Playbooks for Sub Controllers
│   ├── comprehensive-ctf-playbook.yml # Challenge verification playbook
│   └── connectivity-test-playbook.yml # System health check playbook
│
├── openshift/                         # OpenShift Deployment
│   ├── openshift-deployment.template.yaml
│   └── openshift-configs.template.yaml
│
├── docs/                              # Documentation
│   ├── README.md                      # This file
│   ├── CENTRAL_AAP_SETUP_GUIDE.md     # Central controller setup
│   ├── ENHANCED_CTF_GUIDE.md          # Detailed CTF guide
│   ├── AAP_SETUP_GUIDE.md             # AAP setup instructions
│   └── COMMIT_CHECKLIST.md            # Development checklist
│
├── LICENSE                            # Apache License 2.0
└── README.md                          # Main documentation
```

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CTF Infrastructure                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   CTF Tracker   │    │     Central AAP Controller       │   │
│  │   (OpenShift)   │    │                                  │   │
│  │                 │    │  • Manages Sub Controllers       │   │
│  │  • Web Dashboard│    │  • Deploys CTF Playbooks        │   │
│  │  • Scoring      │    │  • Orchestrates Infrastructure  │   │
│  │  • Leaderboard  │    │                                  │   │
│  └─────────────────┘    └──────────────────────────────────┘   │
│           │                               │                    │
│           │ HTTP API                      │ AAP API            │
│           │                               │                    │
│  ┌────────▼────────────────────────────────▼────────────────┐   │
│  │              Sub Controllers                             │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │Sub AAP East │  │Sub AAP West │  │Sub AAP Cent │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │RHEL Hosts A │  │RHEL Hosts B │  │RHEL Hosts C │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Component Overview

### **CTF Tracker Application** (`ctf-app/`)
- **Purpose**: Central web application for CTF management
- **Technology**: Flask-based web application
- **Deployment**: OpenShift container platform
- **Features**: 
  - Real-time challenge tracking
  - Multi-AAP cluster support
  - Leaderboard and scoring
  - Web-based management interface

### **Central AAP Controller** (`central-controller/`)
- **Purpose**: Orchestrates deployment to multiple sub controllers
- **Technology**: Ansible Platform Controller
- **Features**:
  - Centralized sub controller management
  - Automated playbook deployment
  - Connectivity testing and validation
  - Credential management with vault encryption

### **Sub Controllers** (`sub-controllers/`)
- **Purpose**: Execute CTF challenges on RHEL hosts
- **Technology**: Ansible playbooks
- **Features**:
  - Challenge verification (Apache, Nginx, MySQL, etc.)
  - System connectivity and health checks
  - Results reporting back to central tracker
  - Multi-challenge support with point calculation

### **OpenShift Deployment** (`openshift/`)
- **Purpose**: Container orchestration for CTF tracker
- **Technology**: OpenShift/Kubernetes
- **Features**:
  - Scalable web application deployment
  - Persistent storage for scoring data
  - Network policies and security
  - Service discovery and load balancing

## 📋 Quick Start Guide

### **Phase 1: Deploy CTF Tracker Application** 🎯

```bash
# 1. Navigate to CTF app directory
cd ctf-app/

# 2. Login to OpenShift
oc login <your-openshift-cluster-url>

# 3. Run interactive deployment
./deploy-interactive.sh

# The script will prompt for:
# - OpenShift cluster domain
# - Project name
# - Storage configuration
# - Application security settings
# - CTF Tracker URL (save this for later steps)
```

**Expected Result**: CTF Tracker web application running on OpenShift

### **Phase 2: Configure Central Controller** 🎛️

```bash
# 1. Navigate to central controller directory
cd central-controller/

# 2. Configure your sub controllers inventory
cp central-aap-inventory.ini my-inventory.ini
vim my-inventory.ini
# Edit with your actual sub controller hostnames

# 3. Configure host variables for each sub controller
vim host_vars/sub-controller-east.yml
# Set: sub_controller_host, username, organization

vim host_vars/sub-controller-west.yml
# Set: sub_controller_host, username, organization

# 4. Set up encrypted passwords
vim group_vars/all/vault.yml
# Add your actual sub controller passwords

# 5. Encrypt the vault file
ansible-vault encrypt group_vars/all/vault.yml
# Enter a vault password (remember this!)
```

### **Phase 3: Set Up Central AAP Controller** 🏗️

**In Central AAP Controller Web Interface:**

1. **Create Project**:
   - Name: `CTF Sub Controller Management`
   - SCM Type: `Git`
   - SCM URL: `https://github.com/your-org/ctf-ansible-workshop.git`
   - SCM Branch: `main`
   - Update on Launch: ✅

2. **Create Inventory**:
   - Name: `CTF Sub Controllers Inventory`
   - Import from: Upload `my-inventory.ini`
   - Configure host variables from `host_vars/` files

3. **Create Vault Credential**:
   - Name: `CTF Sub Controllers Vault`
   - Type: `Vault`
   - Vault Password: (from step 2.5 above)

4. **Create Job Templates**:

   **Template 1: Test Connectivity** ⚡
   - Name: `Test Sub Controller Connectivity`
   - Job Type: `Run`
   - Inventory: `CTF Sub Controllers Inventory`
   - Project: `CTF Sub Controller Management`
   - Playbook: `central-controller/test-sub-controllers.yml`
   - Credentials: `CTF Sub Controllers Vault`

   **Template 2: Deploy Playbooks** 🚀
   - Name: `Deploy CTF Playbooks to Sub Controllers`
   - Job Type: `Run`
   - Inventory: `CTF Sub Controllers Inventory`
   - Project: `CTF Sub Controller Management`
   - Playbook: `central-controller/deploy-to-sub-controllers.yml`
   - Credentials: `CTF Sub Controllers Vault`
   - Prompt on launch: `Variables` ✅
   - Survey: Enable with these questions:
     - Repository URL: `https://github.com/your-org/ctf-ansible-workshop.git`
     - Branch: `main`
     - CTF Tracker URL: (from Phase 1)

### **Phase 4: Execute Deployment** 🚀

**CRITICAL: Launch in this exact order!**

1. **First: Test Connectivity** ⚡
   ```
   Run Job Template: "Test Sub Controller Connectivity"
   ```
   - **Must show**: All sub controllers `PASS` status
   - **If failures**: Fix authentication/network issues before proceeding

2. **Second: Deploy CTF Playbooks** 🎯
   ```
   Run Job Template: "Deploy CTF Playbooks to Sub Controllers"
   ```
   - **Survey inputs**:
     - Repository URL: `https://github.com/your-org/ctf-ansible-workshop.git`
     - Branch: `main`
     - CTF Tracker URL: `https://ctf-tracker-project.apps.your-cluster.com`
     - Project Name: `CTF Challenge Playbooks`

### **Phase 5: Verification** ✅

**Check each sub controller has**:
- ✅ Project: "CTF Challenge Playbooks"
- ✅ Job Template: "CTF Challenge Verification"
- ✅ Job Template: "CTF Connectivity Test"
- ✅ Playbooks synced from Git

**Test the complete flow**:
1. In CTF Tracker web interface: "Onboard AAP Cluster"
2. Add a sub controller with its details
3. Add RHEL machines from the sub controller's inventory
4. Run "Check All Machines (AAP)" to test CTF challenges

## 🎯 Execution Order Summary

```
Phase 1: Deploy CTF App → OpenShift
Phase 2: Configure Files → Local setup
Phase 3: Setup AAP → Create templates
Phase 4: Execute → Test FIRST, then Deploy
Phase 5: Verify → Check sub controllers
```

**🔥 Critical Success Path:**
1. **Test connectivity** → Must pass before deployment
2. **Deploy playbooks** → Creates infrastructure on sub controllers  
3. **Verify setup** → Confirm job templates created
4. **Test end-to-end** → Run actual CTF challenges

## 🔧 Configuration

### **Environment-Specific Settings**
- **Central Controller**: Configure in `central-controller/host_vars/`
- **Sub Controllers**: Managed via central deployment
- **CTF Application**: Configure via `ctf-app/config.template`

### **Security**
- **Vault Encryption**: All sensitive data in `group_vars/all/vault.yml`
- **Network Policies**: OpenShift network security
- **RBAC**: Role-based access control in AAP

## 📖 Documentation

- **[Central AAP Setup Guide](docs/CENTRAL_AAP_SETUP_GUIDE.md)**: Complete setup instructions
- **[Enhanced CTF Guide](docs/ENHANCED_CTF_GUIDE.md)**: Detailed feature documentation
- **[AAP Setup Guide](docs/AAP_SETUP_GUIDE.md)**: Ansible Platform configuration

## 🤝 Contributing

1. Follow the **[Commit Checklist](docs/COMMIT_CHECKLIST.md)**
2. Test with all three components
3. Update relevant documentation
4. Ensure security sanitization

## 📄 License

Apache License 2.0 - see LICENSE file for details.

---

**Enterprise CTF Infrastructure - Simplified and Scalable!** 🏆