# Challenge 5 Troubleshooting Guide

## Quick Diagnostic

Run this command from your Ansible controller to check Challenge 5 state:

```bash
./ctf-workshop/setup/diagnose-challenge5.sh
```

Or manually check:

```bash
# Check if HTTP is blocked
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Expected: "no" (blocked) for unsolved challenge
# If shows: "yes" (allowed), challenge is already solved!
```

## The Issue You're Experiencing

**Symptom:** After running Reset → Setup → Validation, Challenge 5 shows as complete (20 points)

**Expected:** Challenge 5 should show 0 points after setup

## Root Cause Analysis

There are only a few possibilities:

### Possibility 1: Setup playbook didn't run or failed

**Check:**
```bash
# Look at the AAP job output for "CTF Environment Setup"
# Specifically look for this task:
# "Remove http service from firewall" on node3
# It should show "changed: [node3]"
```

**If it shows "skipped" or "failed":**
- The firewall blocking didn't happen
- HTTP remained enabled from the reset phase
- Validator sees HTTP enabled → awards points

**Fix:** Run setup playbook again

### Possibility 2: Validation ran before setup completed

**Check:**
```bash
# Look at the timestamps of your AAP jobs:
# - CTF Environment Reset: completed at XX:XX
# - CTF Environment Setup: completed at XX:XX  
# - CTF Challenge Validator: ran at XX:XX

# Validator must run AFTER setup completes!
```

**If validator ran between reset and setup:**
- Reset enables HTTP (clean state)
- Validator runs and sees HTTP enabled
- Awards 20 points
- Setup runs later but score already recorded

**Fix:** Always run validator AFTER setup completes

### Possibility 3: Something is re-enabling HTTP

**Check:**
```bash
# After setup completes, immediately check:
ansible node3 -m shell -a "firewall-cmd --query-service=http"

# If it shows "yes" right after setup:
# Something is enabling it after setup blocks it
```

**Possible causes:**
- Another playbook running
- Manual intervention
- AAP workflow step
- Firewalld automatic rules

**Fix:** Check AAP job history for any tasks running on node3 after setup

### Possibility 4: Validator checking wrong host

**Check the validator playbook:**
```yaml
# In ctf-challenge-validator.yml
# Challenge 5 section should have:
when: "'node3' in inventory_hostname or inventory_hostname == 'node3'"
```

**If it's checking all nodes:**
- Might be seeing HTTP enabled on node1 or node2
- Incorrectly awarding points

**Fix:** Verify validator targets only node3 for Challenge 5

## Step-by-Step Debugging

### Step 1: Check Current State

```bash
# Run the diagnostic script
./ctf-workshop/setup/diagnose-challenge5.sh

# Or manually:
ansible node3 -m shell -a "firewall-cmd --list-services"
# Should NOT see 'http' in the list if challenge is unsolved
```

### Step 2: Run Setup Again (Without Reset)

```bash
# In AAP, run ONLY the "CTF Environment Setup" job template
# Watch specifically for the Challenge 5 tasks

# After it completes, check immediately:
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Should output: no
```

### Step 3: Run Validator Immediately After

```bash
# In AAP, run "CTF Challenge Validator" job template
# Check Challenge 5 points
# Should be: 0 points (unsolved)
```

### Step 4: Solve Challenge 5 Manually

```bash
# Create a test playbook:
cat > /tmp/test-challenge5.yml <<EOF
---
- name: Test Challenge 5 Solution
  hosts: node3
  become: yes
  tasks:
    - name: Allow HTTP in firewall
      ansible.posix.firewalld:
        service: http
        permanent: yes
        state: enabled
        immediate: yes
EOF

# Run it
ansible-playbook /tmp/test-challenge5.yml

# Check firewall
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Should output: yes
```

### Step 5: Run Validator Again

```bash
# In AAP, run "CTF Challenge Validator" again
# Challenge 5 should NOW show: 20 points (solved)
```

## Common Mistakes

### ❌ Running validator before setup completes

```
WRONG:
1. Start "CTF Environment Reset"
2. Start "CTF Environment Setup"  
3. Start "CTF Challenge Validator" (while #2 is still running!)
```

```
RIGHT:
1. Run "CTF Environment Reset" → Wait for completion
2. Run "CTF Environment Setup" → Wait for completion
3. Run "CTF Challenge Validator"
```

### ❌ Not waiting between jobs

The jobs need a few seconds to complete and update the system state.

### ❌ Running validator after reset but before setup

```
WRONG:
1. CTF Environment Reset (enables HTTP)
2. CTF Challenge Validator (sees HTTP enabled → 20 points)
3. CTF Environment Setup (blocks HTTP but points already awarded)
```

### ❌ Having auto-run enabled in AAP workflows

If you have a workflow that automatically runs validator after reset, it will award points before setup runs.

## Verification Checklist

After running Reset → Setup, verify:

- [ ] Setup job completed successfully (check AAP job status)
- [ ] All Challenge 5 tasks show "changed" or "ok" (not "failed" or "skipped")
- [ ] `ansible node3 -m shell -a "firewall-cmd --query-service=http"` returns "no"
- [ ] `ansible node3 -m shell -a "firewall-cmd --list-services"` does NOT include "http"
- [ ] Validator shows Challenge 5 = 0 points

If all checks pass but validator still shows 20 points, then:

## Advanced Debugging

### Check the validator code for Challenge 5:

```bash
grep -A 50 "Challenge 5" sub-controllers/ctf-challenge-validator.yml
```

Look for the validation logic:
```yaml
- name: Check if HTTP service is allowed
  command: firewall-cmd --query-service=http
  register: http_service_check
```

This command should return exit code 0 (success) if HTTP is allowed, or exit code 1 (failure) if HTTP is blocked.

### Run the validator check manually:

```bash
# SSH to AAP controller or use ansible command:
ansible node3 -m shell -a "firewall-cmd --query-service=http; echo Exit code: \$?"

# Expected output if UNSOLVED:
# no
# Exit code: 1

# If you see:
# yes  
# Exit code: 0
# Then HTTP IS allowed and challenge IS solved
```

### Check for conflicting firewall rules:

```bash
ansible node3 -m shell -a "firewall-cmd --list-all"
# Look at services, ports, and rich rules
# Should NOT see 'http' or port 80 anywhere
```

## The Nuclear Option

If nothing else works, completely reset Challenge 5:

```bash
# Create a clean-slate playbook:
cat > /tmp/clean-challenge5.yml <<EOF
---
- name: Complete Challenge 5 Clean Slate
  hosts: node3
  become: yes
  tasks:
    - name: Stop httpd
      service:
        name: httpd
        state: stopped
        enabled: no
      ignore_errors: yes
    
    - name: Remove httpd
      dnf:
        name: httpd
        state: absent
    
    - name: Stop firewalld
      service:
        name: firewalld
        state: stopped
        enabled: no
      ignore_errors: yes
    
    - name: Remove firewalld
      dnf:
        name: firewalld
        state: absent
    
    - name: Clean firewall config
      file:
        path: /etc/firewalld
        state: absent
      ignore_errors: yes
EOF

# Run it
ansible-playbook /tmp/clean-challenge5.yml

# Then run ONLY the Challenge 5 setup:
ansible-playbook ctf-workshop/setup/setup-all-challenges.yml --tags challenge5

# Verify
ansible node3 -m shell -a "firewall-cmd --query-service=http"
# Should be: no
```

## Still Not Working?

If Challenge 5 still shows as solved after all these steps, please provide:

1. **Output of diagnostic script:**
   ```bash
   ./ctf-workshop/setup/diagnose-challenge5.sh > challenge5-diag.txt 2>&1
   cat challenge5-diag.txt
   ```

2. **AAP job output:**
   - Screenshot or text of "CTF Environment Setup" job
   - Specifically the Challenge 5 tasks section

3. **Manual firewall check:**
   ```bash
   ansible node3 -m shell -a "firewall-cmd --list-all" > firewall-status.txt
   cat firewall-status.txt
   ```

4. **Validator output:**
   - Screenshot or text showing Challenge 5 = 20 points

With this information, we can identify the exact cause!

