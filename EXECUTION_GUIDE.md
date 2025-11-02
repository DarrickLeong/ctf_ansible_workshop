# 🎯 CTF Execution Guide - Complete Steps

## 🚨 **SECURITY SCAN RESULTS** ✅

### ✅ **No Sensitive Data Found**
- All passwords use template variables (`{{ vault_* }}`)
- All credentials reference AAP vault system  
- No hardcoded tokens or API keys
- URLs properly variablized for AAP surveys
- All example URLs use placeholder domains

### ✅ **Repository Sanitization**
- Removed Flask app (legacy application)
- Removed hardcoded cluster URLs
- All configuration uses templates
- Only Node.js tracker application remains

---

## 🎯 **EXECUTION STEPS - Node.js CTF Tracker**

### **Phase 1: Deploy CTF Tracker Application** 🚀

Deploy the Node.js CTF Tracker to OpenShift:

```bash
cd ctf-tracker-nodejs/

# Deploy using OpenShift Node.js S2I builder
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=ctf-tracker-nodejs \
  --name=ctf-tracker-nodejs

# Expose the service
oc expose service ctf-tracker-nodejs

# Get the route URL - save this for later steps
CTF_TRACKER_URL=$(oc get route ctf-tracker-nodejs -o jsonpath='{.spec.host}')
echo "CTF Tracker URL: http://${CTF_TRACKER_URL}"
```

**Save this URL** - you'll need it for configuring the Central AAP Controller!

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
  Default: http://ctf-tracker.apps.YOUR-CLUSTER.com
  
- Variable: scm_repository_url  
  Type: Text
  Label: Git Repository URL
  Required: Yes
  Default: https://github.com/YOUR-ORG/ctf_ansible_workshop.git
  
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

**⚠️ IMPORTANT**: Replace placeholder values:
- `YOUR-CLUSTER.com` with your actual OpenShift cluster domain
- `YOUR-ORG` with your GitHub organization or username

#### **Step 2: Verify AAP Inventory Configuration**

Ensure your AAP inventory has hosts with these variables:
```yaml
# For each sub-controller host in AAP inventory
sub_controller_host: "aap-east.YOUR-COMPANY.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_east_password }}"
sub_controller_organization: "CTF Organization"
```

**⚠️ SECURITY NOTE**: 
- Never hardcode passwords in inventory variables
- Use AAP credential system or vault variables
- Replace `YOUR-COMPANY.com` with your actual domain

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
- ctf_tracker_url: http://ctf-tracker.apps.YOUR-CLUSTER.com
- scm_repository_url: https://github.com/YOUR-ORG/ctf_ansible_workshop.git
- scm_source_branch: main
- project_name: CTF Challenge Playbooks

Expected: ✅ Job templates created on all sub controllers
```

**⚠️ IMPORTANT**: Replace placeholder values with your actual URLs!

---

### **Phase 4: Run CTF Challenges** 🎮

#### **On Each Sub Controller**

**Run These Job Templates** (created by Phase 3):

1. **"CTF Connectivity Test"**
   ```yaml
   Variables:
   - ctf_tracker_url: http://ctf-tracker.apps.YOUR-CLUSTER.com
   - attendee_name: "Team Name"
   ```

2. **"CTF Challenge Verification"** 
   ```yaml
   Variables:
   - ctf_tracker_url: http://ctf-tracker.apps.YOUR-CLUSTER.com
   - attendee_name: "Team Name"
   ```

**⚠️ IMPORTANT**: Replace `YOUR-CLUSTER.com` with your actual cluster domain!

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
   ctf_tracker_url: http://ctf-tracker.apps.YOUR-CLUSTER.com
   ```
   Replace `YOUR-CLUSTER.com` with your actual cluster domain

2. **Run CTF Challenges** on sub controllers with new URL

3. **Watch Real-Time Dashboard** - scores update immediately!

---

## 🎯 **VERIFICATION CHECKLIST**

### ✅ **Dashboard Working**
- Visit: `http://ctf-tracker.apps.YOUR-CLUSTER.com`
- Shows: Statistics, Leaderboard, Machines, Recent Activity
- Replace `YOUR-CLUSTER.com` with your actual cluster domain

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
