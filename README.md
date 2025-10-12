# CTF Ansible Workshop - Organized Structure

This repository contains a comprehensive CTF (Capture the Flag) infrastructure management system with centralized deployment capabilities.

## 📁 Clean Repository Structure

```
ctf-ansible-workshop/
├── ctf-app/                    # 🎯 CTF Tracker Web Application
│   ├── app.py                  # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Container definition
│   ├── deploy-interactive.sh   # OpenShift deployment
│   ├── config.template         # Environment variables
│   └── README.md               # App setup guide
│
├── central-controller/         # 🎛️ Central AAP Controller
│   ├── test-sub-controllers.yml          # ⚡ RUN FIRST - Connectivity test
│   ├── deploy-to-sub-controllers.yml     # 🚀 RUN SECOND - Deploy playbooks
│   ├── central-aap-inventory.ini         # Sub controller inventory
│   ├── host_vars/                        # Individual controller configs
│   │   ├── sub-controller-east.yml
│   │   └── sub-controller-west.yml
│   ├── group_vars/all/vault.yml          # Encrypted passwords
│   └── README.md                         # Central controller guide
│
├── sub-controllers/            # 🎯 Playbooks for Sub Controllers
│   ├── comprehensive-ctf-playbook.yml    # Challenge verification
│   ├── connectivity-test-playbook.yml    # System health checks
│   └── README.md                         # Playbook guide
│
├── openshift/                  # 🐳 Container Deployment
│   ├── openshift-deployment.template.yaml
│   ├── openshift-configs.template.yaml
│   └── README.md               # Template guide
│
├── docs/                       # 📚 Additional Documentation
│   ├── AAP_SETUP_GUIDE.md      # Detailed AAP configuration
│   ├── ENHANCED_CTF_GUIDE.md   # Extended feature guide
│   └── COMMIT_CHECKLIST.md     # Development checklist
│
├── README.md                   # This file - main guide
└── LICENSE                     # Apache License 2.0
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

## 🚀 Quick Start - Essential Steps

### **Step 1: Deploy CTF Tracker** 🎯
```bash
cd ctf-app/
oc login <your-openshift-url>
./deploy-interactive.sh
# Save the CTF Tracker URL for later steps
```

### **Step 2: Configure Central Controller** 🎛️
```bash
cd central-controller/

# Edit inventory with your sub controllers
vim central-aap-inventory.ini

# Configure credentials for each sub controller
vim host_vars/sub-controller-east.yml
vim host_vars/sub-controller-west.yml

# Set up encrypted passwords
vim group_vars/all/vault.yml
ansible-vault encrypt group_vars/all/vault.yml
```

### **Step 3: Set Up Central AAP Controller** 🏗️
1. **Create Project**: "CTF Sub Controller Management" (Git SCM)
2. **Create Inventory**: "CTF Sub Controllers Inventory" 
3. **Create Vault Credential**: For encrypted passwords
4. **Create Job Templates**:
   - `Test Sub Controller Connectivity` 
   - `Deploy CTF Playbooks to Sub Controllers`

### **Step 4: Execute (CRITICAL ORDER)** ⚡
```bash
# FIRST: Test connectivity - MUST PASS before deployment
Run: "Test Sub Controller Connectivity"
# ✅ Verify all controllers show PASS

# SECOND: Deploy playbooks  
Run: "Deploy CTF Playbooks to Sub Controllers"
# ✅ Verify deployment success on all controllers
```

### **Step 5: Start Your CTF** 🎮
1. Open CTF Tracker web interface
2. Onboard your sub controllers 
3. Add RHEL machines
4. Run challenges and monitor scores

## 🎯 Success Path Summary
```
Deploy App → Configure Files → Setup AAP → Test → Deploy → CTF Ready
```

## 📋 What We Cleaned Up

### **✅ Removed Unnecessary Files**
- ❌ `central-controller/central-controller-job-templates.yml` - Redundant config (info moved to README)
- ❌ `central-controller/inventories/` - Empty directory
- ❌ `docs/CENTRAL_AAP_SETUP_GUIDE.md` - Duplicate (info in central-controller README)
- ❌ `docs/README.md` - Redundant index file

### **✅ Simplified Documentation**
- 📄 **Main README** - Focus on essential 5-step process
- 📄 **Component READMEs** - Streamlined with only essential information
- 📄 **Clear execution order** - ⚡ Test FIRST, 🚀 Deploy SECOND

### **✅ Clean File Structure**
- **12 executable files** - Only what you need to run
- **5 README files** - One per component + main guide
- **3 docs files** - Extended guides and checklists
- **Zero redundancy** - No duplicate information

## 🎯 Final Summary

**You now have a clean, organized CTF infrastructure with:**

✅ **Clear execution path**: 5 simple steps to get running  
✅ **Component separation**: Each folder has a specific purpose  
✅ **Simplified documentation**: Essential information only  
✅ **No confusion**: 2 playbooks to run in clear order  
✅ **Easy maintenance**: Everything in its logical place  

**Total files reduced from complex structure to essential components only!**

## 📖 Documentation

For detailed setup instructions, see component-specific guides:
- **[Central Controller Setup](central-controller/README.md)**: Complete AAP controller configuration
- **[CTF Application Setup](ctf-app/README.md)**: OpenShift deployment guide  
- **[Sub Controller Playbooks](sub-controllers/README.md)**: Challenge and connectivity playbooks
- **[OpenShift Templates](openshift/README.md)**: Container deployment templates

## 🤝 Contributing

1. Follow the **[Commit Checklist](docs/COMMIT_CHECKLIST.md)**
2. Test with all three components
3. Update relevant documentation
4. Ensure security sanitization

## 📄 License

Apache License 2.0 - see LICENSE file for details.

---

**Enterprise CTF Infrastructure - Simplified and Scalable!** 🏆