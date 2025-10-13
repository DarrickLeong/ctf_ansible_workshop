# 🎯 CTF Execution Guide - Complete Steps

## 🚨 **SECURITY SCAN RESULTS** ✅

### ✅ **No Sensitive Data Found**
- All passwords use template variables (`{{ vault_* }}`)
- All credentials reference AAP vault system  
- No hardcoded tokens or API keys
- URLs properly variablized for AAP surveys

### ✅ **Files Cleaned Up**
- Removed redundant Flask app files
- Removed temporary documentation files
- Kept only essential, working components

---

## 🎯 **EXECUTION STEPS - Node.js CTF Tracker**

### **Phase 1: Deploy CTF Tracker Application** 🚀

The Node.js CTF Tracker is already deployed and working at:
```
http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
```

**✅ Status**: DEPLOYED AND WORKING

---

### **Phase 2: Update Central Controller Configuration** 🎛️

#### **Step 1: Update Job Template Survey Variables**

In your AAP Central Controller, update the job template surveys:

**For "Deploy CTF Playbooks to Sub Controllers"**:
```yaml
# Survey Variables (Add these to your job template survey)
- Variable: ctf_tracker_url
  Type: Text
  Label: CTF Tracker URL
  Required: Yes
  Default: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com

- Variable: scm_repository_url  
  Type: Text
  Label: Git Repository URL
  Required: Yes
  Default: https://github.com/DarrickLeong/ctf_ansible_workshop.git

- Variable: scm_source_branch
  Type: Text  
  Label: Git Branch
  Required: Yes
  Default: main

- Variable: project_name
  Type: Text
  Label: Project Name
  Required: Yes
  Default: CTF Challenge Playbooks
```

#### **Step 2: Verify AAP Inventory Configuration**

Ensure your AAP inventory has hosts with these variables:
```yaml
# For each sub-controller host in AAP inventory
sub_controller_host: "aap-east.company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_east_password }}"
sub_controller_organization: "CTF Organization"
```

---

### **Phase 3: Execute CTF Infrastructure** ⚡

#### **CRITICAL ORDER - Follow Exactly** 

**🔥 Step 1: Test Connectivity FIRST** ⚡
```bash
Job Template: "Test Sub Controller Connectivity"
Status: MUST PASS before proceeding
Expected: ✅ All sub controllers show PASS
```

**🚀 Step 2: Deploy Infrastructure SECOND** 
```bash
Job Template: "Deploy CTF Playbooks to Sub Controllers"
Survey Values:
- ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
- scm_repository_url: https://github.com/DarrickLeong/ctf_ansible_workshop.git
- scm_source_branch: main
- project_name: CTF Challenge Playbooks

Expected: ✅ Job templates created on all sub controllers
```

---

### **Phase 4: Run CTF Challenges** 🎮

#### **On Each Sub Controller**

**Run These Job Templates** (created by Phase 3):

1. **"CTF Connectivity Test"**
   ```yaml
   Variables:
   - ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   - attendee_name: "Team Name"
   ```

2. **"CTF Challenge Verification"** 
   ```yaml
   Variables:
   - ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   - attendee_name: "Team Name"
   ```

---

## 🎯 **DO YOU NEED TO RE-RUN ONBOARDING?**

### **✅ NO - If Sub Controllers Are Already Set Up**

If you already have:
- ✅ Sub controllers configured in AAP inventory
- ✅ Connectivity test passing
- ✅ Job templates exist on sub controllers

**Just update the `ctf_tracker_url` variable and run challenges!**

### **🔄 YES - If Starting Fresh**

If you need to set up from scratch:

1. **Configure AAP Inventory** (one time)
   - Add sub controller hosts
   - Set credentials
   
2. **Run Connectivity Test** (verify setup)
   
3. **Deploy Infrastructure** (creates job templates)
   
4. **Run Challenges** (execute CTF)

---

## 🎯 **QUICK START - Existing Setup**

**If your infrastructure is already deployed**, just:

1. **Update Survey Variable**:
   ```yaml
   ctf_tracker_url: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
   ```

2. **Run CTF Challenges** on sub controllers with new URL

3. **Watch Real-Time Dashboard** - scores update immediately!

---

## 🎯 **VERIFICATION CHECKLIST**

### ✅ **Dashboard Working**
- Visit: http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com
- Shows: Statistics, Leaderboard, Machines, Recent Activity

### ✅ **API Working**  
- Health: `/health` returns `{"status":"healthy"}`
- Stats: `/api/stats` returns counts
- Leaderboard: `/api/leaderboard` returns rankings

### ✅ **Challenges Working**
- Run challenge playbook
- Check dashboard for immediate score updates
- Verify leaderboard shows correct points

---

## 🎯 **SUCCESS INDICATORS**

**You'll know it's working when:**
- ✅ Dashboard loads without errors
- ✅ Leaderboard shows team scores immediately  
- ✅ No caching or refresh issues
- ✅ Real-time updates every 30 seconds

**🎉 Your CTF is ready to run with the reliable Node.js tracker!**
