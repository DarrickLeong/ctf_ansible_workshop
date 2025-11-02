# CTF Ansible Workshop - Organized Structure

This repository contains a comprehensive CTF (Capture the Flag) infrastructure management system with centralized deployment capabilities.

## 📁 Clean Repository Structure

```
ctf-ansible-workshop/
├── ctf-workshop/               # 🎯 Complete CTF Workshop Materials
│   ├── CHALLENGES.md           # Challenge descriptions and scoring
│   ├── PARTICIPANT_QUICKSTART.md  # Participant quick-start guide
│   ├── INSTRUCTOR_GUIDE.md     # Complete instructor guide
│   ├── IMPLEMENTATION_SUMMARY.md  # Technical overview
│   ├── setup/                  # Environment setup automation
│   │   ├── setup-all-challenges.yml
│   │   ├── reset-environment.yml
│   │   └── README.md
│   ├── solutions/              # Complete solution playbooks
│   │   ├── challenge1-solution.yml (5 pts)
│   │   ├── challenge2-solution.yml (10 pts)
│   │   ├── challenge3-solution.yml (15 pts)
│   │   ├── challenge4-solution.yml (20 pts)
│   │   ├── challenge5-solution.yml (20 pts)
│   │   ├── challenge6-*.yml (30 pts + 10 extra)
│   │   ├── templates/motd.j2
│   │   └── README.md
│   └── README.md               # Workshop overview
│
├── ctf-tracker-nodejs/         # 🚀 Node.js CTF Tracker Application
│   ├── server.js               # Express server
│   ├── deploy.sh               # Automated deployment script
│   ├── package.json            # Node.js dependencies  
│   ├── public/index.html       # Dashboard frontend
│   └── README.md               # Node.js app guide
│
├── central-controller/         # 🎛️ Central AAP Controller
│   ├── test-sub-controllers.yml          # ⚡ RUN FIRST - Connectivity test
│   ├── deploy-to-sub-controllers.yml     # 🚀 RUN SECOND - Deploy playbooks
│   ├── central-aap-inventory.ini         # Sub controller inventory (template)
│   ├── host_vars/                        # Individual controller configs (templates)
│   │   ├── sub-controller-east.yml
│   │   └── sub-controller-west.yml
│   ├── group_vars/all/vault.yml          # Encrypted passwords (template)
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

### **CTF Tracker Application** (`ctf-tracker-nodejs/`)
- **Purpose**: Central web application for CTF management
- **Technology**: Node.js/Express web application
- **Deployment**: OpenShift container platform
- **Features**: 
  - Real-time challenge tracking with no caching issues
  - Multi-AAP cluster support
  - Live leaderboard and scoring
  - Clean REST API for Ansible integration
  - Auto-refresh dashboard (30 seconds)
  - SQLite database backend

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
cd ctf-tracker-nodejs/

# Deploy using OpenShift Node.js S2I builder
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=ctf-tracker-nodejs \
  --name=ctf-tracker-nodejs

# Expose the service
oc expose service ctf-tracker-nodejs

# Get the route URL - save this for later steps
oc get route ctf-tracker-nodejs -o jsonpath='{.spec.host}'
```

### **Step 2: Configure Central Controller** 🎛️

**NEW: AAP Inventory Integration** ✨
The central controller now works directly with AAP inventory - no more static files needed!

```bash
cd central-controller/

# Option A: Use AAP Inventory (Recommended)
# 1. Create "CTF Sub Controllers" inventory in AAP web interface
# 2. Add each sub controller as a host with these variables:
#    - sub_controller_host: "aap-east.company.com"
#    - sub_controller_username: "admin"  
#    - sub_controller_password: "{{ vault_east_password }}"
# 3. Create credential for passwords
# See: central-controller/AAP_INVENTORY_SETUP.md

# Option B: Static Files (Legacy)
vim central-aap-inventory.ini          # Edit sub controller hostnames
vim host_vars/sub-controller-east.yml  # Configure credentials
vim group_vars/all/vault.yml           # Set encrypted passwords
ansible-vault encrypt group_vars/all/vault.yml
```

### **Step 3: Set Up Central AAP Controller** 🏗️

**Using AAP Inventory (Recommended)**:
1. **Create Project**: "CTF Sub Controller Management" (Git SCM)
2. **Create Inventory**: "CTF Sub Controllers" (dynamic inventory in AAP)
3. **Create Credential**: For sub controller passwords
4. **Create Job Templates**: Point to your AAP inventory

**Using Static Files (Legacy)**:
1. **Create Project**: "CTF Sub Controller Management" (Git SCM)  
2. **Upload Inventory**: Use `central-aap-inventory.ini`
3. **Create Vault Credential**: For encrypted passwords
4. **Create Job Templates**: Point to uploaded inventory

        ### **Step 4: Execute (CRITICAL ORDER)** ⚡
```bash
        # FIRST: Test connectivity - MUST PASS before deployment
        Run: "Test Sub Controller Connectivity"
        # ✅ Verify all controllers show PASS

        # SECOND: Deploy playbooks AND onboard to CTF Tracker
        Run: "Deploy CTF Playbooks to Sub Controllers"
        # ✅ Verify deployment success on all controllers
        # ✅ Verify CTF Tracker shows registered attendees/teams
        ```

        ### **Step 5: Start Your CTF** 🎮
        1. Open CTF Tracker web interface (automatically populated during deployment)
        2. Your sub controllers are now registered as teams
        3. Add RHEL machines via the job templates
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
- 📄 **Main README** - Focus on essential 5-step process with AAP inventory option
- 📄 **Component READMEs** - Streamlined with AAP inventory integration
- 📄 **Clear execution order** - ⚡ Test FIRST, 🚀 Deploy SECOND
- 📄 **Dynamic inventory** - No more static file management needed

### **✅ Clean File Structure**
- **Minimal executable files** - Only what you need to run
- **4 README files** - One per component + main guide
- **3 docs files** - Extended guides and checklists
- **AAP setup guides** - Complete inventory integration guide
- **Zero redundancy** - No duplicate information
- **All credentials templated** - No hardcoded secrets

## 🎯 Final Summary

**You now have a clean, organized CTF infrastructure with:**

✅ **Clear execution path**: 5 simple steps to get running  
✅ **Component separation**: Each folder has a specific purpose  
✅ **Simplified documentation**: Essential information only  
✅ **No confusion**: 2 playbooks to run in clear order  
✅ **Easy maintenance**: Everything in its logical place  
✅ **AAP inventory integration**: Dynamic host management via web interface
✅ **Better credential security**: No plaintext passwords in files

**Total files reduced from complex structure to essential components only!**

## 📖 Documentation

### CTF Workshop
- **[CTF Workshop](ctf-workshop/README.md)**: Complete workshop materials
  - **[Challenges](ctf-workshop/CHALLENGES.md)**: Challenge descriptions and scoring
  - **[Participant Guide](ctf-workshop/PARTICIPANT_QUICKSTART.md)**: Fast-start guide for participants
  - **[Instructor Guide](ctf-workshop/INSTRUCTOR_GUIDE.md)**: Complete teaching guide
  - **[Setup Playbooks](ctf-workshop/setup/README.md)**: Environment setup and reset
  - **[Solutions](ctf-workshop/solutions/README.md)**: Complete solution playbooks (instructor only)

### Infrastructure Components
- **[Central Controller Setup](central-controller/README.md)**: Complete AAP controller configuration
- **[CTF Tracker Application](ctf-tracker-nodejs/README.md)**: Node.js tracker deployment guide  
- **[Sub Controller Playbooks](sub-controllers/README.md)**: Challenge and connectivity playbooks
- **[OpenShift Templates](openshift/README.md)**: Container deployment templates
- **[AAP Setup Guide](docs/AAP_SETUP_GUIDE.md)**: Detailed AAP integration guide

## 🤝 Contributing

1. Follow the **[Commit Checklist](docs/COMMIT_CHECKLIST.md)**
2. Test with all three components
3. Update relevant documentation
4. Ensure security sanitization

## 📄 License

Apache License 2.0 - see LICENSE file for details.

---

**Enterprise CTF Infrastructure - Simplified and Scalable!** 🏆