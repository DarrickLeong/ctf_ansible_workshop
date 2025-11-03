# Challenge 4 & Activity Feed Fixes - Deployment Guide

## Fixes Applied (Commit: 5e1d300)

### Fix #1: Challenge 4 - No More Partial Credit ✅

**Problem:** Challenge 4 was giving 5 points just for `/etc/motd` existing, even if the content was wrong (defaced, outdated, or missing required text).

**Before:**
```
node1: /etc/motd = "HACKED BY DISRUPTIVE DEZIGN!" → 5 points ❌
node2: /etc/motd = "Welcome to the old server"  → 5 points ❌  
node3: /etc/motd = missing                      → 0 points ✅
```

**After:**
```
node1: /etc/motd = "HACKED BY DISRUPTIVE DEZIGN!" → 0 points ✅
node2: /etc/motd = "Welcome to the old server"  → 0 points ✅
node3: /etc/motd = missing                      → 0 points ✅

Only correct MOTD with hostname + "SRE Team" → 20 points!
```

**Fix Applied:**
```yaml
# validator: sub-controllers/ctf-challenge-validator.yml
challenge4_points: "{{ 20 if challenge4_correct else 0 }}"
# All-or-nothing scoring
```

---

### Fix #2: Activity Feed - Hide 0-Point Submissions ✅

**Problem:** Recent Activity was showing every validation run, even when no points were earned, cluttering the display.

**Before:**
```
Recent Activity:
- Team completed challenge1_chronyd on node3 +0 points
- Team completed challenge3_rogue_user on node3 +0 points
- Team completed challenge5_firewall on node3 +0 points
- Team completed challenge6_phoenix on node3 +0 points
- Team completed challenge4_motd on node3 +0 points
```

**After:**
```
Recent Activity:
- Team completed challenge1_chronyd on node3 +5 points  
- Team completed challenge5_firewall on node3 +20 points
(Only shows actual achievements!)
```

**Fix Applied:**
```javascript
// ctf-tracker-nodejs/server.js
Object.entries(challenge_results).forEach(([challenge_type, result]) => {
    const points = result.points_earned || 0;
    totalPoints += points;

    // Only record results with points > 0
    if (points > 0) {
        insertPromises.push(new Promise((resolve, reject) => {
            db.run(`INSERT INTO challenge_results ...`);
        }));
    }
});
```

---

## Deployment Steps

### Step 1: Deploy Updated Validator to Sub-Controllers

```bash
# From your local machine or AAP central controller
cd /path/to/ctf_ansible_workshop

# Pull latest changes
git pull

# Deploy to sub-controllers (this updates the validator playbook)
ansible-playbook central-controller/deploy-to-sub-controllers.yml

# This will sync the fixed ctf-challenge-validator.yml to all sub-controllers
```

**What this does:**
- Deploys the fixed Challenge 4 scoring (no partial credit)
- Ensures all challenges use all-or-nothing scoring
- Validator playbook updated on all sub-AAP controllers

---

### Step 2: Redeploy CTF Tracker Application

The CTF tracker needs to be redeployed to apply the 0-point activity filter.

**Option A: Automatic (if you have the deploy script)**
```bash
cd ctf-tracker-nodejs
./deploy.sh
```

**Option B: Manual OpenShift Rebuild**
```bash
# Check your current project
oc project

# If not in the right project:
oc project ctf-nodejs  # or whatever your CTF tracker project is named

# Trigger a new build from Git
oc start-build ctf-tracker-nodejs --follow

# Or if build doesn't exist, create new app
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=ctf-tracker-nodejs \
  --name=ctf-tracker-nodejs
```

**Option C: Rollout Restart (if image is already built)**
```bash
oc rollout restart deployment/ctf-tracker-nodejs
```

---

### Step 3: Clear Existing 0-Point Activities (Optional)

If you want to clean up the existing 0-point activities from the database:

**Option A: Reset the Database**
```bash
# Delete the existing pod (database will be recreated from scratch)
oc delete pod -l app=ctf-tracker-nodejs

# Wait for new pod to start
oc get pods -w
```

**Option B: Manually Clean Database (Advanced)**
```bash
# Exec into the pod
oc exec -it $(oc get pod -l app=ctf-tracker-nodejs -o name) -- /bin/bash

# Inside the pod, use sqlite to clean up
sqlite3 /opt/app-root/src/ctf_tracker.db
> DELETE FROM challenge_results WHERE points_earned = 0;
> .quit
```

**Option C: Leave as-is**
- Old 0-point activities will remain
- New validations won't create 0-point activities
- Activity feed will gradually clean up over time

---

## Testing After Deployment

### Test 1: Challenge 4 Scoring

```bash
# After Reset + Setup, run validator
# Expected: Challenge 4 = 0 points (defaced MOTD)

# Check the validation output:
# node1 should have 0 points (defaced)
# node2 should have 0 points (outdated)  
# node3 should have 0 points (missing)
```

### Test 2: Activity Feed

```bash
# After a validation run with 0 points:
# Check the CTF Tracker dashboard
# Expected: NO new activity entries

# After solving Challenge 1:
# Check the CTF Tracker dashboard  
# Expected: ONE new activity entry showing +5 points
```

---

## Verification Checklist

After deployment, verify:

- [ ] Sub-controllers have latest validator playbook
- [ ] CTF Tracker app has been redeployed
- [ ] Validator run after setup shows Challenge 4 = 0 points (not 5 or 13)
- [ ] Activity feed shows NO entries for 0-point validations
- [ ] Activity feed DOES show entries when points are earned
- [ ] Leaderboard still shows correct total points
- [ ] Challenge 1-6 all use all-or-nothing scoring (0 or full points only)

---

## Summary of All Challenges - Scoring Logic

| Challenge | Points | Scoring Logic |
|-----------|--------|---------------|
| 1 - chronyd | 5 | All-or-nothing: service running AND enabled |
| 2 - Package | 10 | All-or-nothing: bind-utils removed from node2 |
| 3 - User | 15 | All-or-nothing: rogue_user removed |
| 4 - MOTD | 20 | **FIXED**: All-or-nothing: file exists AND has hostname AND has "SRE Team" |
| 5 - Firewall | 20 | **FIXED**: All-or-nothing: firewall running AND HTTP allowed AND permanent |
| 6 - Phoenix | 30 | All-or-nothing: validation marker exists |

**No partial credit for any challenge!**

---

## Rollback (If Needed)

If the changes cause issues:

```bash
# Revert to previous commit
git revert HEAD
git push

# Redeploy
ansible-playbook central-controller/deploy-to-sub-controllers.yml

# Rebuild CTF tracker
oc start-build ctf-tracker-nodejs --follow
```

---

## Quick Commands Reference

```bash
# Deploy validator fix
ansible-playbook central-controller/deploy-to-sub-controllers.yml

# Rebuild CTF tracker
oc start-build ctf-tracker-nodejs --follow

# Check CTF tracker logs
oc logs -f deployment/ctf-tracker-nodejs

# Check validator output in AAP
# Go to Jobs → CTF Challenge Validator → View output

# Manual test of Challenge 4
ansible all -m shell -a "cat /etc/motd"
```

---

**Status: Ready for Deployment** ✅

Both fixes are committed and pushed. Deploy to see the improvements!

