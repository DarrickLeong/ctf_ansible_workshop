# Central Controller - Setup Guide

Manage deployment to multiple sub Ansible controllers from a central AAP controller.

## 📁 Files Overview

### **Executable Playbooks** (Run in Order)
1. **`test-sub-controllers.yml`** ⚡ - **RUN FIRST** - Test connectivity to all sub controllers
2. **`deploy-to-sub-controllers.yml`** 🚀 - **RUN SECOND** - Deploy CTF playbooks to sub controllers

### **Configuration Files**
- **`central-aap-inventory.ini`** - Sub controller hostnames and settings
- **`host_vars/`** - Individual sub controller credentials and settings  
- **`group_vars/all/vault.yml`** - Encrypted passwords (Ansible Vault)

## 🚀 Quick Setup

### **Step 1: Configure Sub Controllers** 📝
```bash
# Edit inventory with your actual sub controller hostnames
vim central-aap-inventory.ini

# Configure credentials for each sub controller
vim host_vars/sub-controller-east.yml    # Set: host, username, password
vim host_vars/sub-controller-west.yml    # Set: host, username, password

# Set up encrypted passwords
vim group_vars/all/vault.yml             # Add actual passwords
ansible-vault encrypt group_vars/all/vault.yml
```

### **Step 2: Import into Central AAP Controller** 🎛️
1. **Create Project**: "CTF Sub Controller Management" (Git SCM)
2. **Create Inventory**: "CTF Sub Controllers Inventory" (upload inventory file)
3. **Create Vault Credential**: Use your vault password
4. **Create Job Templates**:

   **Template 1** ⚡:
   - **Name**: `Test Sub Controller Connectivity`
   - **Playbook**: `central-controller/test-sub-controllers.yml`
   - **Purpose**: Test all sub controllers (RUN FIRST)

   **Template 2** 🚀:
   - **Name**: `Deploy CTF Playbooks to Sub Controllers`  
   - **Playbook**: `central-controller/deploy-to-sub-controllers.yml`
   - **Survey**: Enable with Repository URL, Branch, CTF Tracker URL
   - **Purpose**: Deploy infrastructure (RUN SECOND)

## 🔥 Critical Execution Order

### **1. FIRST: Test Connectivity** ⚡
```bash
Run: "Test Sub Controller Connectivity"
```
**Must show**: All controllers `PASS` status
**Expected output**: 
```
✅ sub-controller-east: aap-east.company.com
✅ sub-controller-west: aap-west.company.com
✅ sub-controller-central: aap-central.company.com
```

### **2. SECOND: Deploy Infrastructure** 🚀
```bash
Run: "Deploy CTF Playbooks to Sub Controllers"
```
**Survey inputs**: Repository URL, Branch, CTF Tracker URL
**Expected result**: Job templates created on all sub controllers

## ✅ Verification

Each sub controller should have:
- ✅ Project: "CTF Challenge Playbooks"
- ✅ Job Template: "CTF Challenge Verification"  
- ✅ Job Template: "CTF Connectivity Test"

## 🛠️ Troubleshooting

**Authentication Issues**:
```bash
# Check vault passwords
ansible-vault view group_vars/all/vault.yml

# Test sub controller access
curl -k https://aap-east.company.com/api/v2/ping/
```

**Network Issues**:
```bash
# Test connectivity
ping aap-east.company.com
telnet aap-east.company.com 443
```

**Deployment Issues**:
```bash
# Local testing
ansible-playbook test-sub-controllers.yml -i central-aap-inventory.ini --ask-vault-pass -v
```

---

**Remember: Always test connectivity FIRST, then deploy!** ⚡🚀
