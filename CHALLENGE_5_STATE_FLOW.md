# Challenge 5 - State Flow Diagram

## ✅ CORRECTED - Final Fix Applied

### The Root Cause (Finally!)

**BOTH playbooks were creating the SAME state!**

```
BEFORE THE FIX:
Reset:  HTTP blocked (state: disabled)
Setup:  HTTP blocked (state: disabled)  
Result: NO DIFFERENCE!
```

This meant:
- Reset didn't create a "clean" state
- Setup didn't create a "problem" state  
- They both created the same state
- Validator couldn't tell the difference

### The Correct State Flow

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: RESET (Clean Functional Baseline)             │
├─────────────────────────────────────────────────────────┤
│ • httpd: INSTALLED and RUNNING                          │
│ • firewalld: RUNNING                                    │
│ • HTTP in firewall: ENABLED ✅                          │
│ • Web page: Accessible                                  │
│                                                          │
│ Result: Everything works! Clean baseline!               │
│ Validator check: HTTP allowed = Challenge already solved│
│ Points: 20 (if validator runs now)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: SETUP (Create the Problem)                    │
├─────────────────────────────────────────────────────────┤
│ • httpd: RUNNING (from reset or newly installed)        │
│ • firewalld: RUNNING                                    │
│ • HTTP in firewall: DISABLED ❌                         │
│ • Web page: Blocked by firewall                         │
│                                                          │
│ Result: httpd works but firewall blocks it!             │
│ Validator check: HTTP blocked = Challenge NOT solved    │
│ Points: 0 (this is the challenge!)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: PARTICIPANT SOLUTION                           │
├─────────────────────────────────────────────────────────┤
│ Participant creates playbook:                           │
│                                                          │
│ - name: Allow HTTP                                      │
│   ansible.posix.firewalld:                              │
│     service: http                                       │
│     state: enabled      ← Solves the challenge!         │
│     permanent: yes                                      │
│     immediate: yes                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: VALIDATION                                     │
├─────────────────────────────────────────────────────────┤
│ Validator checks:                                       │
│ • firewall-cmd --query-service=http                     │
│ • Returns: yes (HTTP is allowed)                        │
│                                                          │
│ Result: Challenge 5 complete!                           │
│ Points: 20 ✅                                           │
└─────────────────────────────────────────────────────────┘
```

## State Comparison Table

| Phase | httpd Status | HTTP in Firewall | Web Accessible? | Challenge State | Points if Validated |
|-------|-------------|------------------|-----------------|-----------------|-------------------|
| **RESET** | Running ✅ | **ENABLED** ✅ | YES ✅ | **Clean baseline** | 20 (solved) |
| **SETUP** | Running ✅ | **DISABLED** ❌ | NO ❌ | **Problem created** | 0 (unsolved) |
| **SOLUTION** | Running ✅ | **ENABLED** ✅ | YES ✅ | **Participant fixed** | 20 (solved) |

## Why This Matters

### The Problem Before

```
Scenario 1: Validator runs after RESET (before SETUP)
├─ Reset: HTTP enabled
├─ Validator: Sees HTTP enabled → Awards 20 points ❌ WRONG!
└─ Setup hasn't run yet to create the problem

Scenario 2: RESET and SETUP run, but participant solves Challenge 1
├─ Reset: HTTP disabled (WRONG!)
├─ Setup: HTTP disabled (same as reset!)
├─ Participant: Fixes chronyd only
├─ Validator: Checks all challenges
│   ├─ Challenge 1: chronyd running → 5 points ✅
│   └─ Challenge 5: HTTP disabled → 0 points ✅ (correct)
└─ This actually works! But only by accident...

Scenario 3: Someone manually enables HTTP between RESET and SETUP
├─ Reset: HTTP disabled
├─ Manual change: HTTP enabled
├─ Validator runs: Sees HTTP enabled → Awards 20 points ❌
└─ Setup hasn't run yet to block it again
```

### After The Fix

```
Scenario 1: Validator runs after RESET (before SETUP)
├─ Reset: HTTP enabled (clean state)
├─ Validator: Sees HTTP enabled → Awards 20 points
├─ This is CORRECT because RESET creates a solved state
└─ SETUP will then block it to create the challenge

Scenario 2: Proper workflow - RESET → SETUP → CHALLENGES
├─ Reset: HTTP enabled (clean)
├─ Setup: HTTP disabled (problem)
├─ Validator: Sees HTTP disabled → 0 points ✅
├─ Participant: Solves Challenge 5
├─ Validator: Sees HTTP enabled → 20 points ✅
└─ Perfect! This is the intended flow

Scenario 3: Workflow - RESET → SETUP → Participant solves Challenge 1 only
├─ Reset: HTTP enabled (clean)
├─ Setup: HTTP disabled (problem)
├─ Participant: Fixes chronyd only  
├─ Validator: 
│   ├─ Challenge 1: chronyd running → 5 points ✅
│   └─ Challenge 5: HTTP still disabled → 0 points ✅
└─ Correct! Only awards points for what was actually solved
```

## The Key Insight

**RESET must create a FUNCTIONAL, SOLVED state for all challenges.**

This might seem counterintuitive, but it's correct because:

1. **RESET = Return to working baseline**
   - All services functional
   - All challenges "solved"
   - If validator runs now, everything should pass

2. **SETUP = Break things to create challenges**
   - Takes the working baseline
   - Introduces problems
   - If validator runs now, everything should fail

3. **SOLUTION = Fix the problems**
   - Participant makes changes
   - Returns to working state (same as RESET)
   - If validator runs now, should pass for solved challenges only

## The Proper Sequence

```
START → RESET → SETUP → WORKSHOP → RESET → ...
         ↓       ↓        ↓          ↓
       Clean   Problems  Solutions  Clean again
```

**DO NOT run validator between RESET and SETUP!**

The validator should only run:
- After SETUP (to confirm all challenges are unsolved)
- After each participant solution (to award points)
- After workshop (to see final scores)

## Code Review

### RESET playbook (CORRECTED)

```yaml
# ✅ CORRECT - Creates clean functional state
- name: Challenge 5 Reset - Allow HTTP on node3 (clean functional state)
  tasks:
    - name: Install httpd for testing
      dnf:
        name: httpd
        state: present
    
    - name: Start httpd service
      service:
        name: httpd
        state: started
        enabled: yes
    
    - name: Allow http service in firewall (clean functional state)
      firewalld:
        service: http
        state: enabled  # ✅ ENABLED = clean state
        permanent: yes
        immediate: yes
```

### SETUP playbook (Already Correct)

```yaml
# ✅ CORRECT - Creates the problem
- name: Challenge 5 Setup - Block HTTP on node3
  tasks:
    - name: Install httpd for testing
      dnf:
        name: httpd
        state: present
    
    - name: Start httpd service
      service:
        name: httpd
        state: started
        enabled: yes
    
    - name: Remove http service from firewall
      firewalld:
        service: http
        state: disabled  # ✅ DISABLED = problem state
        permanent: yes
        immediate: yes
```

### SOLUTION playbook (Participant creates)

```yaml
# ✅ Participant's solution
- name: Challenge 5 - Fix Firewall
  hosts: node3
  become: yes
  
  tasks:
    - name: Allow HTTP traffic
      ansible.posix.firewalld:
        service: http
        state: enabled  # ✅ ENABLED = solves the challenge
        permanent: yes
        immediate: yes
```

## Testing The Fix

### Test 1: After RESET only

```bash
# Run RESET
ansible-playbook ctf-workshop/setup/reset-environment.yml

# Check firewall
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Expected: yes

# Run validator (if needed)
# Expected: Challenge 5 = 20 points (this is OK! Reset creates solved state)
```

### Test 2: After RESET + SETUP

```bash
# Run RESET
ansible-playbook ctf-workshop/setup/reset-environment.yml

# Run SETUP
ansible-playbook ctf-workshop/setup/setup-all-challenges.yml

# Check firewall
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Expected: no

# Run validator
# Expected: Challenge 5 = 0 points (problem exists, not solved)
```

### Test 3: After RESET + SETUP + SOLUTION

```bash
# Run RESET
ansible-playbook ctf-workshop/setup/reset-environment.yml

# Run SETUP  
ansible-playbook ctf-workshop/setup/setup-all-challenges.yml

# Participant solves Challenge 5
ansible-playbook challenge5-solution.yml

# Check firewall
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Expected: yes

# Run validator
# Expected: Challenge 5 = 20 points (solved by participant)
```

## Summary

✅ **RESET** = HTTP ENABLED (functional baseline)  
✅ **SETUP** = HTTP DISABLED (create problem)  
✅ **SOLUTION** = HTTP ENABLED (fix problem)  
✅ **VALIDATOR** = Check HTTP state and award points accordingly

The fix is now correct and production-ready! 🎉

