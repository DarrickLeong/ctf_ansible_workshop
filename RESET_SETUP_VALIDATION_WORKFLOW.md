# Reset, Setup, and Validation Workflow

## 🚨 Critical Fix Applied - November 2, 2025

### The Problem Discovered

During testing, Challenge 5 (Firewall Anomaly) was being marked complete when a participant only ran Challenge 1 playbook. Investigation revealed:

**Root Cause:**  
The `reset-environment.yml` playbook was **solving Challenge 5** instead of creating a clean state!

```yaml
# WRONG - This was in the reset playbook
- name: Allow http service in firewall  # ❌ This SOLVES the challenge!
  firewalld:
    service: http
    permanent: yes
    state: enabled  # ❌ This completes Challenge 5!
    immediate: yes
```

**What Happened:**
1. Instructor ran "CTF Environment Reset" to prepare for workshop
2. Reset playbook enabled HTTP in firewall on node3 (solving Challenge 5)
3. Participant ran Challenge 1 playbook (fixed chronyd)
4. Validator ran and checked ALL challenges on ALL nodes
5. Validator found HTTP already enabled on node3 → Awarded Challenge 5 points!
6. Participant got credit for challenge they didn't solve

### The Fix

**Changed Reset Playbook:**
```yaml
# CORRECT - Reset removes httpd and blocks HTTP (clean state)
- name: Stop httpd service
  service:
    name: httpd
    state: stopped
  ignore_errors: yes

- name: Remove httpd package
  dnf:
    name: httpd
    state: absent

- name: Remove http service from firewall (clean state)
  firewalld:
    service: http
    permanent: yes
    state: disabled  # ✅ HTTP blocked = clean state
    immediate: yes
```

Now reset creates a **truly clean environment** where no challenges are solved.

## 🎯 Correct Workflow

### Phase 1: Environment Preparation (Instructor)

```
RESET → SETUP → Ready for Workshop
```

#### 1. Reset Environment (Clean Slate)
```bash
# Job Template: "CTF Environment Reset"
# Playbook: ctf-workshop/setup/reset-environment.yml
```

**What It Does:**
- ✅ Starts chronyd (Challenge 1: clean state)
- ✅ Removes bind-utils (Challenge 2: clean state)
- ✅ Removes rogue_user (Challenge 3: clean state)
- ✅ Creates default MOTD (Challenge 4: clean state)
- ✅ **Blocks HTTP in firewall** (Challenge 5: clean state) ← **FIXED!**
- ✅ Installs httpd/postgresql (Challenge 6: clean state)

**Result:** Environment is in a **CLEAN, FUNCTIONAL state**. All services work. No challenges are "broken" yet.

#### 2. Setup Challenges (Create Problems)
```bash
# Job Template: "CTF Environment Setup"
# Playbook: ctf-workshop/setup/setup-all-challenges.yml
```

**What It Does:**
- 🔴 Stops chronyd (Challenge 1: PROBLEM)
- 🔴 Installs bind-utils on node2 (Challenge 2: PROBLEM)
- 🔴 Creates rogue_user (Challenge 3: PROBLEM)
- 🔴 Defaces MOTD files (Challenge 4: PROBLEM)
- 🔴 Installs httpd and blocks HTTP (Challenge 5: PROBLEM)
- 🔴 Removes httpd/postgresql (Challenge 6: PROBLEM)

**Result:** Environment now has **6 PROBLEMS** ready for participants to solve.

### Phase 2: Workshop Execution (Participants)

```
Participant Creates Solution → Runs Playbook → Validator Checks → Points Awarded
```

#### 1. Participant Creates Playbook
```yaml
---
- name: Challenge 5 - Fix Firewall
  hosts: node3
  become: yes
  
  tasks:
    - name: Allow HTTP in firewall
      ansible.posix.firewalld:
        service: http
        permanent: yes
        state: enabled
        immediate: yes
```

#### 2. Participant Runs via AAP
- Creates Job Template in AAP
- Runs the playbook against managed nodes
- Playbook makes the fix (enables HTTP)

#### 3. Validator Runs
```bash
# Job Template: "CTF Challenge Validator"
# Playbook: sub-controllers/ctf-challenge-validator.yml
```

**What It Checks:**
- ✅ Chronyd running on all nodes?
- ✅ Bind-utils absent on node2?
- ✅ Rogue_user absent?
- ✅ MOTD correct?
- ✅ HTTP allowed on node3 firewall?
- ✅ Services running for Challenge 6?

#### 4. Points Awarded
- Validator reports to CTF Tracker
- Leaderboard updates
- Participant sees their score

### Phase 3: Reset for Next Session (Instructor)

```
RESET → Environment returns to clean state
```

Run "CTF Environment Reset" again to:
- Remove all participant changes
- Return to functional baseline
- Ready to run SETUP again for next workshop

## ⚠️ Important: When to Run Each Playbook

| Playbook | When to Run | Purpose | Who Runs It |
|----------|-------------|---------|-------------|
| **reset-environment.yml** | Before workshop OR between sessions | Clean slate | Instructor |
| **setup-all-challenges.yml** | After reset, before workshop starts | Create problems | Instructor |
| **Participant Solutions** | During workshop | Fix specific problems | Participants |
| **ctf-challenge-validator.yml** | After each participant solution | Check and score | Automatic (AAP) |

## 🔍 Why This Fix Was Needed

### The Validation Logic

The validator checks the **current state** of all nodes:

```yaml
# Challenge 5 Validator Check
- name: Check if HTTP service is allowed
  command: firewall-cmd --query-service=http
  register: http_service_check

# If HTTP is allowed → Challenge 5 is marked complete!
```

**The validator doesn't know WHO or WHAT enabled HTTP** - it only checks if HTTP is currently allowed.

### The Problem Before Fix

```
[Reset runs] → HTTP enabled on node3 (reset did this!)
[Participant runs Challenge 1] → Fixed chronyd
[Validator runs] → Checks all nodes
                 → Sees HTTP enabled on node3
                 → Awards Challenge 5 points ❌ WRONG!
```

### After Fix

```
[Reset runs] → HTTP blocked on node3 (clean state)
[Setup runs] → HTTP still blocked (problem state)
[Participant runs Challenge 1] → Fixed chronyd
[Validator runs] → Checks all nodes
                 → Challenge 1: chronyd running ✅ 5 points
                 → Challenge 5: HTTP still blocked ✅ 0 points
```

Now participants must explicitly solve Challenge 5 to get those points!

## 📋 Validation Triggers

The validator should only run:

1. **After participant runs their solution** (manual trigger or AAP workflow)
2. **On-demand for scoring check** (instructor can trigger manually)

The validator should **NEVER** run automatically after:
- Reset playbook
- Setup playbook

These are preparation tasks, not solutions!

## 🎓 Testing the Fix

### Test Scenario 1: Clean Workshop Start

```bash
# 1. Reset environment
Run "CTF Environment Reset"

# 2. Setup challenges
Run "CTF Environment Setup"

# 3. Run validator (baseline check)
Run "CTF Challenge Validator"
Expected: All challenges should show 0 points

# ✅ If all challenges are 0 points → Setup/Reset are correct!
```

### Test Scenario 2: Single Challenge Solution

```bash
# 1. Participant solves Challenge 1
Run chronyd playbook

# 2. Validate
Run "CTF Challenge Validator"
Expected: Challenge 1 = 5 points, all others = 0 points

# ✅ If only Challenge 1 has points → Validator is correct!
```

### Test Scenario 3: Challenge 5 Specifically

```bash
# 1. After setup, check firewall
ansible node3 -m shell -a "firewall-cmd --query-service=http"
Expected: "no" (HTTP is blocked)

# 2. Run validator
Expected: Challenge 5 = 0 points

# 3. Run Challenge 5 solution
ansible-playbook challenge5-solution.yml

# 4. Check firewall again
ansible node3 -m shell -a "firewall-cmd --query-service=http"
Expected: "yes" (HTTP is allowed)

# 5. Run validator
Expected: Challenge 5 = 20 points

# ✅ Points only awarded after explicit solution!
```

## 🔧 Troubleshooting

### Issue: Challenges showing points before participants solve them

**Diagnosis:**
```bash
# Check current state of each challenge
ansible all -m shell -a "systemctl status chronyd"  # Challenge 1
ansible node2 -m shell -a "rpm -q bind-utils"       # Challenge 2
ansible all -m shell -a "id rogue_user"              # Challenge 3
ansible all -m shell -a "cat /etc/motd"              # Challenge 4
ansible node3 -m shell -a "firewall-cmd --list-services"  # Challenge 5
ansible node1 -m shell -a "systemctl status httpd"  # Challenge 6
```

**Expected After Setup:**
- Challenge 1: chronyd **STOPPED** ❌
- Challenge 2: bind-utils **INSTALLED** on node2 ❌
- Challenge 3: rogue_user **EXISTS** ❌
- Challenge 4: MOTD **DEFACED/INCONSISTENT** ❌
- Challenge 5: HTTP **NOT IN LIST** ❌
- Challenge 6: httpd/postgresql **STOPPED/REMOVED** ❌

**If any challenge shows the "correct" state after setup:**
→ The setup playbook has a problem!

### Issue: Validator not detecting participant solutions

**Check:**
1. Is the validator targeting the correct nodes? (`hosts: web`)
2. Are the inventory hostnames correct? (node1, node2, node3)
3. Is the CTF Tracker URL configured?
4. Are the validation checks looking for the right state?

## 📝 Summary

**The Golden Rule:**

```
RESET = Clean, functional baseline (no challenges solved)
SETUP = Create problems (all challenges in broken state)
SOLUTION = Participant fixes (specific challenge solved)
VALIDATOR = Check and score (only what's actually fixed)
```

**Before this fix:**
- Reset was solving Challenge 5 ❌
- Participants got unearned points ❌

**After this fix:**
- Reset creates clean state ✅
- Setup creates problems ✅
- Only participant solutions earn points ✅

All playbooks have been updated and tested. The workflow is now correct and production-ready! 🎉

## 🔄 Automatic Deployment

The fixed playbooks are automatically deployed to sub-controllers when you run:

```bash
ansible-playbook central-controller/deploy-to-sub-controllers.yml
```

If you have `auto_run_reset` and `auto_run_setup` set to `true`, the deployment will automatically:
1. Sync the fixed playbooks
2. Create/update job templates
3. Run reset to clean environment
4. Run setup to create challenge problems
5. Environment is ready for workshop!

Make sure to update the sub-controllers with the latest code!

