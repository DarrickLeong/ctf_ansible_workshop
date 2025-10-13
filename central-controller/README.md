# Central Controller - Setup Guide

Manage deployment to multiple sub Ansible controllers from a central AAP controller using dynamic inventory.

## 🚨 Prerequisites

**Required Collections:**
- `ansible.controller` collection (v4.0.0+) for Red Hat AAP integration
- Install with: `ansible-galaxy collection install ansible.controller`
- **If collection install fails**: See `AWX_COLLECTION_INSTALL_GUIDE.md`

## 📁 Files Overview

### **Executable Playbooks** (Run in Order)
1. **`test-sub-controllers.yml`** ⚡ - **RUN FIRST** - Test connectivity to all sub controllers
2. **`deploy-to-sub-controllers.yml`** 🚀 - **RUN SECOND** - Deploy CTF playbooks to sub controllers

### **Configuration Files** (Reference Only)
- **`central-aap-inventory.ini`** - Static inventory template (for reference)
- **`host_vars/`** - Example host variable templates  
- **`group_vars/all/vault.yml`** - Example vault structure
- **`AAP_INVENTORY_SETUP.md`** - Complete AAP inventory setup guide

## 🎯 New AAP Inventory Integration

The playbooks now work directly with **AAP inventory** instead of static files!

### **Key Changes** ✨
- ✅ **Dynamic host discovery** - Add/remove sub controllers via AAP web interface
- ✅ **Auto-filtering** - Playbooks automatically detect sub controllers
- ✅ **No group dependency** - Works with all inventory hosts (groups optional)
- ✅ **Credential management** - Use AAP credential system
- ✅ **No static files** - Everything managed through AAP

### **How It Works** 🔄
```
AAP Inventory → Dynamic Host Selection → Playbook Execution → Results
```

## 🚀 Quick Setup (AAP Inventory Method)

### **Step 1: Configure AAP Inventory** 📝
1. **Create Inventory**: "CTF Sub Controllers" in AAP
2. **Add Hosts**: Each sub controller as a host with variables
3. **Set Credentials**: Use AAP credential system for passwords

**Example Host Variables in AAP**:
```yaml
sub_controller_host: "aap-east.your-company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_east_password }}"
sub_controller_organization: "CTF Organization"
```

📋 **[Complete AAP Inventory Setup Guide](AAP_INVENTORY_SETUP.md)**

### **Step 2: Create Job Templates** 🎛️

**Template 1** ⚡:
- **Name**: `Test Sub Controller Connectivity`
- **Inventory**: `CTF Sub Controllers` (your AAP inventory)
- **Playbook**: `central-controller/test-sub-controllers.yml`
- **Credentials**: Your sub controller passwords credential

**Template 2** 🚀:
- **Name**: `Deploy CTF Playbooks to Sub Controllers`  
- **Inventory**: `CTF Sub Controllers` (your AAP inventory)
- **Playbook**: `central-controller/deploy-to-sub-controllers.yml`
- **Credentials**: Your sub controller passwords credential
        - **Survey**: Repository URL, Branch, CTF Tracker URL
          - **scm_repository_url**: Git repository URL (Text, Required, Default: `https://github.com/your-org/ctf-ansible-workshop.git`)
          - **scm_source_branch**: Git branch (Text, Required, Default: `main`)
          - **scm_source_type**: SCM type (Choice, Required, Default: `git`, Options: `git`, `manual`, `archive`)
          - **ctf_tracker_url**: CTF Tracker URL (Text, Required, Default: `http://ctf-tracker-ctf-project.apps.your-cluster.com`)
          - **project_name**: Project name (Text, Required, Default: `CTF Challenge Playbooks`)
          - **sub_controller_team_name**: Team name (Text, Optional, Default: `{inventory_hostname} Team`)
          - **sub_controller_team_email**: Team email (Text, Optional, Default: `{inventory_hostname}@your-company.com`)
          - **sub_controller_region**: Region name (Text, Optional, Default: `region-{inventory_hostname}`)

## 🎯 Integrated CTF Tracker Onboarding

### **New in v2.0** ✨
The deployment playbook now **automatically onboards** your sub-controllers to the CTF tracker!

**What happens during deployment:**
1. ✅ **Deploy playbooks** to sub-controller
2. ✅ **Create job templates** with proper variables
3. ✅ **Register attendee/team** in CTF tracker
4. ✅ **Register controller** as a tracking entity
5. ✅ **Configure job templates** with correct attendee names

**No separate onboarding script needed!** 🎉

## 🔥 Critical Execution Order

### **1. FIRST: Test Connectivity** ⚡
```bash
Run: "Test Sub Controller Connectivity"
```
**Auto-discovers**: All hosts with sub controller variables  
**Expected output**: 
```
✅ sub-controller-east: aap-east.your-company.com
✅ sub-controller-west: aap-west.your-company.com
```

### **2. SECOND: Deploy Infrastructure** 🚀
```bash
Run: "Deploy CTF Playbooks to Sub Controllers"
```
**Auto-discovers**: Same hosts as connectivity test  
**Expected result**: Job templates created on all sub controllers

## ✅ Benefits of AAP Inventory

### **Dynamic Management** 🎛️
- Add sub controllers via web interface
- Update credentials without file changes
- Group-based organization
- API-driven management

### **Better Security** 🔐
- Encrypted credential storage
- Role-based access control
- No plaintext passwords in files
- Audit trail for changes

### **Scalability** 📈
- Handle hundreds of sub controllers
- Organize by region/environment
- Bulk operations on groups
- External system integration

## 🛠️ Migration from Static Files

If you're migrating from the static `.ini` approach:

1. **Keep existing files** as reference
2. **Create AAP inventory** with same host information
3. **Test with new method** using job templates
4. **Remove static files** once confirmed working

## 🔧 Troubleshooting

**No hosts found**:
```bash
# Check your AAP inventory has hosts with required variables:
# - sub_controller_host
# - sub_controller_username  
# - sub_controller_password (or sub_controller_token)
```

**Authentication issues**:
```bash
# Verify credentials are properly configured in AAP
# Check credential type injection settings
```

**Host filtering issues**:
```bash
# Add debug task to see which hosts are being processed
- name: Debug discovered hosts
  debug:
    msg: "Found sub controller: {{ inventory_hostname }} -> {{ sub_controller_host }}"
```

---

**Remember: Always test connectivity FIRST, then deploy!** ⚡🚀
