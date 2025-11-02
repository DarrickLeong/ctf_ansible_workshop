# CTF Workshop - Environment Setup Workflow

## 🎯 Overview

This guide explains how to prepare the CTF environment when your **Central AAP cannot directly connect** to the managed RHEL nodes, but your **Sub-AAP controllers can**.

## 📋 Solution Architecture

```
Central AAP Controller
    ↓ (deploys playbooks & job templates)
Sub-AAP Controllers (East, West, etc.)
    ↓ (can connect to managed nodes)
RHEL Nodes (node1, node2, node3)
```

## 🚀 Step-by-Step Workflow

### Step 1: Deploy Playbooks to Sub-Controllers

Run this **ONCE** from your Central AAP Controller to push all playbooks and create job templates:

```bash
cd central-controller

# Update your configuration first
vi central-aap-inventory.ini  # Add your sub-controllers
vi group_vars/all/vault.yml   # Add credentials
ansible-vault encrypt group_vars/all/vault.yml

# Deploy to all sub-controllers
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "ctf_tracker_url=http://ctf-tracker-YOUR-CLUSTER.com" \
  -e "scm_repository_url=https://github.com/YOUR-ORG/ctf_ansible_workshop.git"
```

**What this does:**
- ✅ Creates "CTF Challenge Playbooks" project on each sub-controller
- ✅ Syncs playbooks from your Git repository
- ✅ Creates 4 job templates on each sub-controller:
  1. **CTF Environment Reset** - Clean state
  2. **CTF Environment Setup** - Break things for challenges
  3. **CTF Challenge Validation** - Check solutions & score
  4. **CTF Connectivity Test** - Verify host connectivity

---

### Step 2: Prepare Environment (Run on Sub-Controllers)

Now go to **each Sub-AAP Controller's Web UI** and run these job templates in order:

#### 2a. Reset Environment (Optional - Clean State)

**Job Template**: `CTF Environment Reset`
- **Purpose**: Clean up any previous workshop state
- **Targets**: All managed nodes (node1, node2, node3)
- **Actions**:
  - Starts chronyd service
  - Removes bind-utils from node2
  - Removes rogue_user
  - Cleans up MOTD files
  - Allows HTTP through firewall
  - Restores application stack

**When to run**: 
- Before starting a new workshop
- After a workshop to clean up
- To reset between sessions

**How to run in AAP UI**:
1. Navigate to **Resources → Templates**
2. Click the 🚀 rocket icon next to **CTF Environment Reset**
3. Select **Inventory** (your RHEL nodes inventory)
4. Select **Credential** (SSH credential for RHEL nodes)
5. Click **Launch**

#### 2b. Setup Challenge Environment (Required)

**Job Template**: `CTF Environment Setup`
- **Purpose**: Break things to create the challenge scenarios
- **Targets**: All managed nodes (node1, node2, node3)
- **Actions**:
  - Challenge 1: Stops chronyd on all nodes
  - Challenge 2: Installs bind-utils on node2
  - Challenge 3: Creates rogue_user on node1 & node3
  - Challenge 4: Defacts/corrupts MOTD files
  - Challenge 5: Blocks HTTP on node3 firewall
  - Challenge 6: Breaks application stack (httpd, postgresql)

**When to run**:
- **ALWAYS** run this before starting the workshop
- After running Reset (if you ran it)

**How to run in AAP UI**:
1. Navigate to **Resources → Templates**
2. Click the 🚀 rocket icon next to **CTF Environment Setup**
3. Select **Inventory** (your RHEL nodes inventory)
4. Select **Credential** (SSH credential for RHEL nodes)
5. Click **Launch**
6. **Wait for completion** (~2-3 minutes)

---

### Step 3: Participants Work on Challenges

Participants now work on fixing the issues using Ansible playbooks.

---

### Step 4: Validate Solutions & Score

**Job Template**: `CTF Challenge Validation`
- **Purpose**: Check participant solutions and report scores to CTF Tracker
- **Targets**: All managed nodes
- **Variables Required**:
  - `attendee_name`: Participant's name (e.g., "student1")
  - `ctf_tracker_url`: Your CTF Tracker URL (pre-filled)

**How to run in AAP UI**:
1. Navigate to **Resources → Templates**
2. Click the 🚀 rocket icon next to **CTF Challenge Validation**
3. Select **Inventory** (your RHEL nodes inventory)
4. Select **Credential** (SSH credential for RHEL nodes)
5. **Enter Variables**:
   ```yaml
   attendee_name: student1
   ```
6. Click **Launch**

**What it checks**:
- ✅ Challenge 1: Is chronyd running and enabled?
- ✅ Challenge 2: Is bind-utils removed from node2?
- ✅ Challenge 3: Is rogue_user removed?
- ✅ Challenge 4: Is MOTD correct with hostname and SRE Team?
- ✅ Challenge 5: Is HTTP allowed through firewall on node3?
- ✅ Challenge 6: Are application stack services running?

**Results**: Automatically submitted to CTF Tracker leaderboard

---

## 📊 Typical Workshop Workflow

### Pre-Workshop (Instructor)
```
1. Deploy playbooks to sub-controllers (Step 1) - ONCE
2. Run "CTF Environment Reset" - Clean slate
3. Run "CTF Environment Setup" - Break things
4. Verify challenges are set up correctly
```

### During Workshop (Participants)
```
1. Receive challenge instructions
2. Write Ansible playbooks to fix issues
3. Test solutions in AAP
4. Run "CTF Challenge Validation" to get scored
5. Check CTF Tracker leaderboard for points
```

### Post-Workshop (Instructor)
```
1. Run "CTF Environment Reset" - Clean up
2. Review CTF Tracker final scores
3. Discuss solutions
```

---

## 🔄 Quick Reference Commands

### Redeploy Playbooks to Sub-Controllers
If you update playbooks in Git:
```bash
cd central-controller
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini
```

This will:
- Update the project on sub-controllers
- Sync latest playbooks from Git
- Update job templates (if needed)

### Manual Playbook Execution (CLI)
If you prefer CLI instead of AAP UI:

```bash
# Reset environment
ansible-playbook ctf-workshop/setup/reset-environment.yml -i inventory

# Setup challenges
ansible-playbook ctf-workshop/setup/setup-all-challenges.yml -i inventory

# Validate solutions
ansible-playbook sub-controllers/ctf-challenge-validator.yml \
  -i inventory \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=http://ctf-tracker-YOUR-CLUSTER.com"
```

---

## 🎯 AAP Web UI Screenshots Guide

### Finding Job Templates
1. Login to Sub-AAP Controller
2. Click **Resources** in left sidebar
3. Click **Templates**
4. You'll see 4 CTF job templates

### Running a Job Template
1. Find the template (e.g., "CTF Environment Setup")
2. Click the 🚀 **rocket icon** on the right
3. **Survey prompts appear**:
   - **Inventory**: Select your RHEL inventory
   - **Credential**: Select SSH credential
   - **Variables**: (Only for Challenge Validation)
4. Click **Next** then **Launch**

### Monitoring Job Execution
1. After launch, you're taken to the **Jobs** view
2. See real-time output of playbook execution
3. Green = Success, Red = Failure
4. Click job number to see full details

### Viewing Job History
1. Go to **Views → Jobs**
2. See all past job executions
3. Filter by template name
4. Click any job to review output

---

## 🐛 Troubleshooting

### "Project not found" error
**Issue**: Playbooks haven't been deployed to sub-controller yet
**Fix**: Run Step 1 (deploy-to-sub-controllers.yml) again

### "Cannot connect to managed nodes" error
**Issue**: Sub-controller doesn't have access to RHEL nodes
**Fix**: 
1. Check inventory in AAP
2. Verify SSH credentials
3. Test connectivity: Run "CTF Connectivity Test" job template

### "Playbook file not found" error
**Issue**: Git sync failed or wrong branch
**Fix**:
1. Go to **Resources → Projects** in AAP
2. Find "CTF Challenge Playbooks"
3. Click the **sync** icon 🔄
4. Check SCM URL and branch are correct

### Playbooks are outdated
**Issue**: Git repo was updated but AAP still has old version
**Fix**:
1. **Option A**: Wait (project syncs on launch if configured)
2. **Option B**: Manual sync:
   - Go to **Resources → Projects**
   - Click sync icon 🔄 next to "CTF Challenge Playbooks"

---

## ✅ Verification Checklist

Before starting the workshop, verify:

- [ ] Central controller has deployed to all sub-controllers
- [ ] Sub-controllers show 4 job templates
- [ ] "CTF Environment Reset" runs successfully
- [ ] "CTF Environment Setup" runs successfully  
- [ ] CTF Tracker is accessible
- [ ] Participants have AAP access
- [ ] Participants have challenge instructions

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Can't deploy from central | Check sub-controller credentials in vault.yml |
| Job templates missing | Re-run deploy-to-sub-controllers.yml |
| Playbooks outdated | Sync project in AAP or wait for auto-sync |
| Can't reach nodes | Run "CTF Connectivity Test" job template |
| Scores not showing | Check ctf_tracker_url variable |

---

**🎉 You're all set! The environment is ready for your CTF workshop!**

