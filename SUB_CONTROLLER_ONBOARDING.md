# 🎯 Sub Controller Onboarding - Complete Setup Guide

## 🚨 **Starting Fresh - No Sub Controllers Onboarded**

Since you have no sub controllers onboarded yet, here's the complete step-by-step process:

---

## **Phase 1: Set Up Central AAP Controller** 🎛️

### **Step 1: Create Project in Central AAP**

1. **Login to your Central AAP Controller**
2. **Navigate to Projects** → **Add**
3. **Create Project**:
   ```yaml
   Name: CTF Sub Controller Management
   Description: Manages deployment to multiple sub AAP controllers
   SCM Type: Git
   SCM URL: https://github.com/DarrickLeong/ctf_ansible_workshop.git
   SCM Branch: main
   SCM Update on Launch: ✅ Enabled
   ```

### **Step 2: Create Inventory in Central AAP**

1. **Navigate to Inventories** → **Add**
2. **Create Inventory**:
   ```yaml
   Name: CTF Sub Controllers
   Description: Inventory of all sub AAP controllers for CTF
   Organization: Default (or your organization)
   ```

### **Step 3: Add Sub Controller Hosts**

For **each sub controller** you want to manage:

1. **In "CTF Sub Controllers" inventory** → **Hosts** → **Add**
2. **Add Host**:
   ```yaml
   Name: sub-controller-east
   Description: East Region Sub Controller
   ```

3. **Edit Host Variables** (click on host name → Edit):
   ```yaml
   ---
   # Required variables for sub controller
   sub_controller_host: "aap-east.company.com"
   sub_controller_username: "admin"
   sub_controller_password: "{{ vault_east_password }}"
   sub_controller_organization: "CTF Organization"
   sub_controller_validate_certs: false
   
   # Optional: Controller-specific settings
   controller_region: "east"
   controller_description: "East Coast CTF Sub Controller"
   ```

4. **Repeat for each sub controller** (west, central, etc.)

### **Step 4: Create Credentials**

1. **Navigate to Credentials** → **Add**
2. **Create Vault Credential**:
   ```yaml
   Name: CTF Sub Controller Passwords
   Credential Type: Vault
   Vault Password: your-ansible-vault-password
   ```

### **Step 5: Create Job Templates**

#### **Template 1: Connectivity Test** ⚡

1. **Navigate to Templates** → **Add** → **Job Template**
2. **Configuration**:
   ```yaml
   Name: Test Sub Controller Connectivity
   Job Type: Run
   Inventory: CTF Sub Controllers
   Project: CTF Sub Controller Management
   Playbook: central-controller/test-sub-controllers.yml
   Credentials: CTF Sub Controller Passwords
   Execution Environment: Default execution environment
   ```

#### **Template 2: Deploy Infrastructure** 🚀

1. **Navigate to Templates** → **Add** → **Job Template**
2. **Configuration**:
   ```yaml
   Name: Deploy CTF Playbooks to Sub Controllers
   Job Type: Run
   Inventory: CTF Sub Controllers
   Project: CTF Sub Controller Management  
   Playbook: central-controller/deploy-to-sub-controllers.yml
   Credentials: CTF Sub Controller Passwords
   Prompt on launch: Variables ✅
   ```

3. **Add Survey** (click **Survey** tab → **Add**):
   ```yaml
   # Survey Question 1
   Question: CTF Tracker URL
   Answer Variable Name: ctf_tracker_url
   Answer Type: Text
   Required: ✅
   Default: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com

   # Survey Question 2  
   Question: Git Repository URL
   Answer Variable Name: scm_repository_url
   Answer Type: Text
   Required: ✅
   Default: https://github.com/DarrickLeong/ctf_ansible_workshop.git

   # Survey Question 3
   Question: Git Branch
   Answer Variable Name: scm_source_branch
   Answer Type: Text
   Required: ✅
   Default: main

   # Survey Question 4
   Question: Project Name
   Answer Variable Name: project_name
   Answer Type: Text
   Required: ✅
   Default: CTF Challenge Playbooks
   ```

---

## **Phase 2: Execute Onboarding** ⚡

### **🔥 Step 1: Test Connectivity FIRST**

1. **Run Job Template**: "Test Sub Controller Connectivity"
2. **Expected Output**:
   ```
   ✅ sub-controller-east: aap-east.company.com - PASS
   ✅ sub-controller-west: aap-west.company.com - PASS
   ```
3. **⚠️ MUST PASS** before proceeding to next step

### **🚀 Step 2: Deploy Infrastructure SECOND**

1. **Run Job Template**: "Deploy CTF Playbooks to Sub Controllers"
2. **Survey Answers**:
   ```yaml
   CTF Tracker URL: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   Git Repository URL: https://github.com/DarrickLeong/ctf_ansible_workshop.git
   Git Branch: main
   Project Name: CTF Challenge Playbooks
   ```
3. **Expected Output**:
   ```
   ✅ Project created on sub-controller-east
   ✅ Job templates created on sub-controller-east
   ✅ Project created on sub-controller-west  
   ✅ Job templates created on sub-controller-west
   ```

---

## **Phase 3: Verify Sub Controller Setup** ✅

### **Check Each Sub Controller**

1. **Login to each sub controller**
2. **Verify Projects**: Should see "CTF Challenge Playbooks"
3. **Verify Job Templates**: Should see:
   - "CTF Challenge Verification"
   - "CTF Connectivity Test"

---

## **Phase 4: Run Your First CTF** 🎮

### **On Each Sub Controller**

1. **Run**: "CTF Connectivity Test"
   ```yaml
   Extra Variables:
   attendee_name: "Team Alpha"
   ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   ```

2. **Run**: "CTF Challenge Verification"
   ```yaml
   Extra Variables:
   attendee_name: "Team Alpha"
   ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   ```

3. **Watch Dashboard**: Scores update in real-time!

---

## **🎯 Quick Checklist**

### **Central Controller Setup** ✅
- [ ] Project created: "CTF Sub Controller Management"
- [ ] Inventory created: "CTF Sub Controllers"  
- [ ] Hosts added with proper variables
- [ ] Credentials created for vault passwords
- [ ] Job templates created with surveys

### **Execution Order** ✅
- [ ] ⚡ Test connectivity - MUST PASS
- [ ] 🚀 Deploy infrastructure - Creates job templates
- [ ] 🎮 Run CTF challenges - Generate scores

### **Verification** ✅
- [ ] Sub controllers show new projects
- [ ] Job templates exist on sub controllers
- [ ] Dashboard shows real-time updates
- [ ] Leaderboard displays team scores

---

## **🎉 Success Indicators**

**You'll know onboarding worked when:**
- ✅ Connectivity test passes for all sub controllers
- ✅ Job templates appear on each sub controller
- ✅ CTF challenges run successfully
- ✅ Dashboard shows live score updates
- ✅ "Controllers" section shows registered sub controllers

**🚀 Your multi-controller CTF infrastructure will be ready!**
