# Central Controller - Complete Setup Guide

This folder contains all components for the Central Ansible Platform Controller that manages deployment to multiple sub controllers.

## 📁 Contents

### **Core Playbooks**
- **`deploy-to-sub-controllers.yml`** - Main deployment playbook for sub controllers
- **`test-sub-controllers.yml`** - Connectivity and permission testing (⚡ **RUN FIRST**)
- **`central-controller-job-templates.yml`** - Job template configurations

### **Inventory & Configuration**
- **`central-aap-inventory.ini`** - Inventory template for sub controllers
- **`host_vars/`** - Host-specific variables for each sub controller
  - `sub-controller-east.yml` - East coast controller config
  - `sub-controller-west.yml` - West coast controller config
- **`group_vars/all/vault.yml`** - Encrypted credentials (Ansible Vault)

## 🚀 Step-by-Step Setup Process

### **Step 1: Configure Sub Controller Details** 📝

```bash
# 1.1 Navigate to central controller directory
cd central-controller/

# 1.2 Copy and customize inventory
cp central-aap-inventory.ini my-sub-controllers.ini

# 1.3 Edit with your actual sub controller hostnames
vim my-sub-controllers.ini
```

**Example `my-sub-controllers.ini`:**
```ini
[sub_controllers]
sub-controller-east ansible_host=aap-east.yourcompany.com
sub-controller-west ansible_host=aap-west.yourcompany.com
sub-controller-central ansible_host=aap-central.yourcompany.com

[sub_controllers:vars]
ansible_connection=local
ansible_python_interpreter="{{ ansible_playbook_python }}"
sub_controller_validate_certs=false
sub_controller_organization="CTF Organization"
ctf_tracker_url="https://ctf-tracker-myproject.apps.your-cluster.com"
scm_type=git
scm_repository_url="https://github.com/your-org/ctf-ansible-workshop.git"
scm_branch=main
project_name="CTF Challenge Playbooks"
```

### **Step 2: Configure Host Variables** 🏗️

**2.1 Configure East Controller:**
```bash
vim host_vars/sub-controller-east.yml
```

**Example configuration:**
```yaml
---
# Host variables for sub-controller-east
sub_controller_host: "aap-east.yourcompany.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_sub_controller_east_password }}"
# Alternative: Use OAuth token instead of password
# sub_controller_token: "{{ vault_sub_controller_east_token }}"
sub_controller_organization: "CTF Organization"
sub_controller_validate_certs: false

# Controller-specific settings (optional)
controller_region: "east"
controller_timezone: "America/New_York"
controller_description: "East Coast CTF Sub Controller"

# Override global settings if needed
# scm_repository_url: "https://github.com/your-org/ctf-east-playbooks.git"
```

**2.2 Configure West Controller:**
```bash
vim host_vars/sub-controller-west.yml
```

**Example configuration:**
```yaml
---
# Host variables for sub-controller-west  
sub_controller_host: "aap-west.yourcompany.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_sub_controller_west_password }}"
sub_controller_organization: "CTF Organization"
sub_controller_validate_certs: false

controller_region: "west"
controller_timezone: "America/Los_Angeles"
controller_description: "West Coast CTF Sub Controller"
```

### **Step 3: Set Up Encrypted Credentials** 🔐

```bash
# 3.1 Edit vault file with actual passwords
vim group_vars/all/vault.yml
```

**Example `vault.yml` (before encryption):**
```yaml
---
# Vault-encrypted passwords for sub controllers
# Encrypt this file with: ansible-vault encrypt group_vars/all/vault.yml

# Sub Controller Authentication
vault_sub_controller_east_password: "your-actual-east-password"
vault_sub_controller_west_password: "your-actual-west-password"
vault_sub_controller_central_password: "your-actual-central-password"

# Alternative: OAuth Tokens (more secure)
# vault_sub_controller_east_token: "your-east-oauth-token"
# vault_sub_controller_west_token: "your-west-oauth-token"

# Additional encrypted variables as needed
vault_git_username: "your-git-username"
vault_git_password: "your-git-password"
vault_git_token: "your-git-token"
```

```bash
# 3.2 Encrypt the vault file
ansible-vault encrypt group_vars/all/vault.yml
# Enter vault password when prompted (REMEMBER THIS!)

# 3.3 Verify encryption worked
ansible-vault view group_vars/all/vault.yml
# Should prompt for password and display decrypted content
```

### **Step 4: Test Configuration Locally** 🧪

```bash
# 4.1 Test inventory syntax
ansible-inventory --list -i my-sub-controllers.ini

# 4.2 Test vault decryption
ansible-vault view group_vars/all/vault.yml

# 4.3 Test basic connectivity (optional)
ansible all -i my-sub-controllers.ini -m ping --ask-vault-pass

# 4.4 Run connectivity test playbook
ansible-playbook test-sub-controllers.yml \
  -i my-sub-controllers.ini \
  --ask-vault-pass \
  -v
```

**Expected output from connectivity test:**
```
TASK [Display final connectivity summary] ****
ok: [localhost] => {
    "msg": "All controllers are ready for deployment!"
}
```

### **Step 5: Import into Central AAP Controller** 🎛️

**5.1 Create Project in AAP:**
- Navigate to: **Projects** → **Add**
- **Name**: `CTF Sub Controller Management`
- **Organization**: `Default` (or your org)
- **SCM Type**: `Git`
- **SCM URL**: `https://github.com/your-org/ctf-ansible-workshop.git`
- **SCM Branch/Tag/Commit**: `main`
- **SCM Update Options**: 
  - ✅ Clean
  - ✅ Delete on Update
  - ✅ Update Revision on Launch
- **Save**

**5.2 Create Inventory in AAP:**
- Navigate to: **Inventories** → **Add** → **Inventory**
- **Name**: `CTF Sub Controllers Inventory`
- **Organization**: `Default`
- **Save**
- **Sources** → **Add**
- **Name**: `Sub Controllers Source`
- **Source**: `Sourced from a Project`
- **Project**: `CTF Sub Controller Management`
- **Inventory file**: `central-controller/my-sub-controllers.ini`
- **Save** → **Sync**

**5.3 Create Vault Credential:**
- Navigate to: **Credentials** → **Add**
- **Name**: `CTF Sub Controllers Vault`
- **Organization**: `Default`
- **Credential Type**: `Vault`
- **Vault Password**: (enter your vault password from Step 3.2)
- **Save**

### **Step 6: Create Job Templates** 📋

**6.1 Create Connectivity Test Template:**
- Navigate to: **Templates** → **Add** → **Job Template**
- **Name**: `Test Sub Controller Connectivity`
- **Job Type**: `Run`
- **Inventory**: `CTF Sub Controllers Inventory`
- **Project**: `CTF Sub Controller Management`
- **Playbook**: `central-controller/test-sub-controllers.yml`
- **Credentials**: 
  - `CTF Sub Controllers Vault` (Vault)
- **Variables**: (leave empty)
- **Options**:
  - ✅ Enable Privilege Escalation
  - Verbosity: `1 (Verbose)`
- **Save**

**6.2 Create Deployment Template:**
- Navigate to: **Templates** → **Add** → **Job Template**
- **Name**: `Deploy CTF Playbooks to Sub Controllers`
- **Job Type**: `Run`
- **Inventory**: `CTF Sub Controllers Inventory`
- **Project**: `CTF Sub Controller Management`
- **Playbook**: `central-controller/deploy-to-sub-controllers.yml`
- **Credentials**: 
  - `CTF Sub Controllers Vault` (Vault)
- **Options**:
  - ✅ Prompt on launch: Variables
  - ✅ Enable Privilege Escalation
  - Verbosity: `1 (Verbose)`
- **Survey**: ✅ Survey Enabled

**Survey Configuration for Deployment Template:**
```
Question 1:
- Question: Repository URL
- Description: Git repository containing CTF playbooks
- Answer Variable Name: scm_repository_url
- Answer Type: Text
- Default Answer: https://github.com/your-org/ctf-ansible-workshop.git
- Required: ✅

Question 2:
- Question: Branch
- Description: Git branch to deploy
- Answer Variable Name: scm_branch
- Answer Type: Text
- Default Answer: main
- Required: ✅

Question 3:
- Question: CTF Tracker URL
- Description: URL of the central CTF tracker application
- Answer Variable Name: ctf_tracker_url
- Answer Type: Text
- Default Answer: https://ctf-tracker-myproject.apps.your-cluster.com
- Required: ✅

Question 4:
- Question: Project Name
- Description: Name for the project on sub controllers
- Answer Variable Name: project_name
- Answer Type: Text
- Default Answer: CTF Challenge Playbooks
- Required: ✅
```

### **Step 7: Create Workflow Template** 🔄

- Navigate to: **Templates** → **Add** → **Workflow Template**
- **Name**: `Complete CTF Infrastructure Setup`
- **Organization**: `Default`
- **Save**

**Workflow Design:**
```
[Start] → [Test Sub Controller Connectivity] → [Deploy CTF Playbooks]
              ↓ (on success)                    ↓ (on success)
          [Continue workflow]                [Complete]
              ↓ (on failure)                   ↑ (on failure)
             [Stop - Fix Issues] → [Manual Fix] → [Retry]
```

**Add Workflow Nodes:**
1. **Node 1**: `Test Sub Controller Connectivity`
   - **Success**: Link to Node 2
   - **Failure**: End workflow
2. **Node 2**: `Deploy CTF Playbooks to Sub Controllers` 
   - **Always**: End workflow

## 🚀 Execution Guide

### **🔥 CRITICAL: Execute in This Order**

**Phase 1: Test Connectivity (MUST RUN FIRST)**
1. Navigate to **Templates**
2. Click **🚀** next to `Test Sub Controller Connectivity`
3. Click **Launch**
4. Monitor output for:
   - ✅ **PASSED CONTROLLERS**: All should show "Connection successful"
   - ❌ **FAILED CONTROLLERS**: Fix authentication/network issues
5. **DO NOT PROCEED** until all controllers show **PASS**

**Example Success Output:**
```
TASK [Display final connectivity summary] ****
==========================================
FINAL CONNECTIVITY TEST SUMMARY  
==========================================
Total Controllers Tested: 3
Passed: 3
Failed: 0

PASSED CONTROLLERS:
✅ sub-controller-east: aap-east.yourcompany.com
✅ sub-controller-west: aap-west.yourcompany.com
✅ sub-controller-central: aap-central.yourcompany.com
==========================================
```

**Phase 2: Deploy CTF Playbooks**
1. Navigate to **Templates**
2. Click **🚀** next to `Deploy CTF Playbooks to Sub Controllers`
3. **Survey Questions** - Fill in:
   - **Repository URL**: `https://github.com/your-org/ctf-ansible-workshop.git`
   - **Branch**: `main`
   - **CTF Tracker URL**: `https://ctf-tracker-myproject.apps.your-cluster.com`
   - **Project Name**: `CTF Challenge Playbooks`
4. Click **Launch**
5. Monitor deployment progress for each sub controller

**Example Success Output:**
```
TASK [Display final deployment summary] ****
==========================================
FINAL DEPLOYMENT SUMMARY
==========================================
Total Sub Controllers: 3
Successful Deployments: 3
Failed Deployments: 0

SUCCESSFUL DEPLOYMENTS:
✅ sub-controller-east: aap-east.yourcompany.com
✅ sub-controller-west: aap-west.yourcompany.com
✅ sub-controller-central: aap-central.yourcompany.com

Job Templates Deployed:
- CTF Challenge Verification
- CTF Connectivity Test
==========================================
```

## ✅ Verification Steps

### **Check Each Sub Controller Has:**
1. **Project**: "CTF Challenge Playbooks"
2. **Job Templates**:
   - `CTF Challenge Verification`
   - `CTF Connectivity Test`
3. **Playbooks**: 
   - `comprehensive-ctf-playbook.yml`
   - `connectivity-test-playbook.yml`

### **Manual Verification Commands:**
```bash
# Test sub controller API manually
curl -k https://aap-east.yourcompany.com/api/v2/ping/

# Check if project was created
curl -k -u admin:password https://aap-east.yourcompany.com/api/v2/projects/ | grep "CTF Challenge Playbooks"

# Check if job templates were created
curl -k -u admin:password https://aap-east.yourcompany.com/api/v2/job_templates/ | grep "CTF Challenge Verification"
```

## 🎯 What Gets Deployed to Each Sub Controller

### **Project Configuration:**
```yaml
Name: "CTF Challenge Playbooks"
Description: "CTF Challenge Verification and Connectivity Test Playbooks - Deployed from central controller"
SCM Type: Git
SCM URL: https://github.com/your-org/ctf-ansible-workshop.git
SCM Branch: main
Organization: CTF Organization
Update on Launch: true
```

### **Job Template 1: CTF Challenge Verification**
```yaml
Name: "CTF Challenge Verification"
Description: "Execute CTF challenges and report results - Managed by central controller"
Project: "CTF Challenge Playbooks"
Playbook: "sub-controllers/comprehensive-ctf-playbook.yml"
Ask Variables on Launch: true
Ask Inventory on Launch: true
Ask Credential on Launch: true
Extra Variables:
  ctf_tracker_url: "https://ctf-tracker-myproject.apps.your-cluster.com"
```

### **Job Template 2: CTF Connectivity Test**
```yaml
Name: "CTF Connectivity Test"
Description: "Test RHEL host connectivity and system health - Managed by central controller"
Project: "CTF Challenge Playbooks"
Playbook: "sub-controllers/connectivity-test-playbook.yml"
Ask Variables on Launch: true
Ask Inventory on Launch: true
Ask Credential on Launch: true
Extra Variables:
  ctf_tracker_url: "https://ctf-tracker-myproject.apps.your-cluster.com"
```

## 🛠️ Troubleshooting Guide

### **Common Issues & Solutions**

**1. Authentication Failures**
```bash
# Check vault passwords
ansible-vault view group_vars/all/vault.yml

# Test credentials manually
curl -k -u admin:wrong-password https://aap-east.yourcompany.com/api/v2/ping/
# Should return 401 Unauthorized

curl -k -u admin:correct-password https://aap-east.yourcompany.com/api/v2/ping/
# Should return 200 OK
```

**2. Network Connectivity Issues**
```bash
# Test basic connectivity
ping aap-east.yourcompany.com

# Test HTTPS connectivity
curl -k https://aap-east.yourcompany.com/api/v2/ping/

# Check firewall/network policies
telnet aap-east.yourcompany.com 443
```

**3. Permission Issues**
```bash
# Check user permissions on sub controller
curl -k -u admin:password https://aap-east.yourcompany.com/api/v2/organizations/
# Should return organization list

# Verify admin user has project creation permissions
curl -k -u admin:password https://aap-east.yourcompany.com/api/v2/projects/
# Should return project list without 403 errors
```

**4. SCM Sync Failures**
```bash
# Test Git repository access
git clone https://github.com/your-org/ctf-ansible-workshop.git
cd ctf-ansible-workshop
git log --oneline -5

# Check branch exists
git branch -r | grep main
```

**5. Inventory Issues**
```bash
# Test inventory syntax
ansible-inventory --list -i my-sub-controllers.ini

# Check host variables are loaded
ansible-inventory --list -i my-sub-controllers.ini | grep sub_controller_host

# Verify groups are correct
ansible-inventory --graph -i my-sub-controllers.ini
```

### **Debug Commands**

```bash
# Test connectivity with verbose output
ansible-playbook test-sub-controllers.yml \
  -i my-sub-controllers.ini \
  --ask-vault-pass \
  -vvv

# Test deployment with dry-run
ansible-playbook deploy-to-sub-controllers.yml \
  -i my-sub-controllers.ini \
  --ask-vault-pass \
  --check \
  -e "scm_repository_url=https://github.com/your-org/ctf-ansible-workshop.git" \
  -e "ctf_tracker_url=https://ctf-tracker.apps.your-cluster.com"

# Check specific host connectivity
ansible sub-controller-east \
  -i my-sub-controllers.ini \
  -m uri \
  -a "url=https://{{ sub_controller_host }}/api/v2/ping/ validate_certs=no" \
  --ask-vault-pass
```

### **Recovery Procedures**

**If connectivity test fails:**
1. Fix authentication credentials in `group_vars/all/vault.yml`
2. Re-encrypt vault file: `ansible-vault encrypt group_vars/all/vault.yml`
3. Update AAP credential with new vault password
4. Re-run connectivity test

**If deployment fails partially:**
1. Check failed sub controllers in job output
2. Fix specific controller issues
3. Re-run deployment (idempotent - safe to repeat)
4. Verify successful deployment on all controllers

**If sub controller is missing job templates:**
1. Check project sync status on sub controller
2. Manually sync project if needed
3. Re-run deployment playbook
4. Verify job templates were created

---

**🎯 Your centralized CTF infrastructure is ready!** 🏆
