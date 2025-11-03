# Challenge 6: Phoenix Protocol - Incremental Scoring System

## 🎯 Overview

Challenge 6 now awards **incremental points** for each playbook step, providing immediate feedback and rewarding progress!

---

## 📊 Scoring Breakdown (30 Points Total)

| Step | Playbook | Points | What's Validated |
|------|----------|--------|------------------|
| **1** | `challenge6-provision-database.yml` | **5** | PostgreSQL running + initialized |
| **2** | `challenge6-provision-webserver.yml` | **5** | httpd + port 8080 + SELinux + firewall |
| **3** | `challenge6-deploy-application.yml` | **5** | Application file deployed |
| **4** | `challenge6-validate-service.yml` | **5** | Validation marker created |
| **5** | `challenge6-rollback-webserver.yml` | **5** | Rollback marker created |
| **6** | `challenge6-rollback-database.yml` | **5** | Rollback marker created |

---

## ✅ Validation Criteria

### Step 1: Provision Database (5 points)
```yaml
Checks:
  ✓ PostgreSQL service is active
  ✓ /var/lib/pgsql/data/postgresql.conf exists
```

### Step 2: Provision Web Server (5 points)
```yaml
Checks:
  ✓ httpd service is active
  ✓ Port 8080 is listening (netstat/ss)
  ✓ SELinux allows http_port_t on 8080
  ✓ Firewall allows port 8080
```
**Note:** ALL 4 checks must pass for full points!

### Step 3: Deploy Application (5 points)
```yaml
Checks:
  ✓ /var/www/html/index.php exists
```

### Step 4: Validate Service (5 points)
```yaml
Checks:
  ✓ /tmp/phoenix_validated marker exists
```

### Step 5: Rollback Web Server (5 points)
```yaml
Checks:
  ✓ /tmp/phoenix_web_rollback marker exists
```

### Step 6: Rollback Database (5 points)
```yaml
Checks:
  ✓ /tmp/phoenix_db_rollback marker exists
```

---

## 🎓 Scoring Examples

### Example 1: Just Started
```
Student completes: Provision Database

Challenge 6 (Phoenix Protocol): 5/30 points
  ├─ Step 1 (Provision Database): +5 pts ✅
  ├─ Step 2 (Provision Web Server): 0 pts
  ├─ Step 3 (Deploy Application): 0 pts
  ├─ Step 4 (Validate Service): 0 pts
  ├─ Step 5 (Rollback Web Server): 0 pts
  └─ Step 6 (Rollback Database): 0 pts
```

### Example 2: Halfway Through
```
Student completes: Provision Database + Web Server + Application

Challenge 6 (Phoenix Protocol): 15/30 points
  ├─ Step 1 (Provision Database): +5 pts ✅
  ├─ Step 2 (Provision Web Server): +5 pts ✅
  ├─ Step 3 (Deploy Application): +5 pts ✅
  ├─ Step 4 (Validate Service): 0 pts
  ├─ Step 5 (Rollback Web Server): 0 pts
  └─ Step 6 (Rollback Database): 0 pts
```

### Example 3: Success Path (No Rollback)
```
Student completes: Provision DB + Web + App + Validate

Challenge 6 (Phoenix Protocol): 20/30 points
  ├─ Step 1 (Provision Database): +5 pts ✅
  ├─ Step 2 (Provision Web Server): +5 pts ✅
  ├─ Step 3 (Deploy Application): +5 pts ✅
  ├─ Step 4 (Validate Service): +5 pts ✅
  ├─ Step 5 (Rollback Web Server): 0 pts
  └─ Step 6 (Rollback Database): 0 pts
```

### Example 4: Full Workflow
```
Student completes: ALL 6 playbooks

Challenge 6 (Phoenix Protocol): 30/30 points ✅✅
  ├─ Step 1 (Provision Database): +5 pts ✅
  ├─ Step 2 (Provision Web Server): +5 pts ✅
  ├─ Step 3 (Deploy Application): +5 pts ✅
  ├─ Step 4 (Validate Service): +5 pts ✅
  ├─ Step 5 (Rollback Web Server): +5 pts ✅
  └─ Step 6 (Rollback Database): +5 pts ✅
```

---

## 🔧 Implementation Details

### How Markers Work

**Validation Marker** (`/tmp/phoenix_validated`)
- Created by `challenge6-validate-service.yml`
- Proves validation playbook ran successfully
- Awards 5 points

**Rollback Markers**
- `challenge6-rollback-webserver.yml` creates `/tmp/phoenix_web_rollback`
- `challenge6-rollback-database.yml` creates `/tmp/phoenix_db_rollback`
- Each awards 5 points

**Adding Markers to Solution Playbooks:**
```yaml
- name: Create rollback marker for validation
  ansible.builtin.file:
    path: /tmp/phoenix_web_rollback
    state: touch
    mode: '0644'
```

### Web Server Validation (Comprehensive!)

The web server check is the most comprehensive:

1. **Service Check:** `systemd` module checks httpd status
2. **Port Check:** `netstat -tuln | grep ':8080' || ss -tuln | grep ':8080'`
3. **SELinux Check:** `semanage port -l | grep http_port_t | grep -w 8080`
4. **Firewall Check:** `firewall-cmd --list-ports` (checks for 8080)

**All 4 must pass** for full 5 points!

---

## 🎯 Benefits

### For Students
✅ **Immediate Feedback** - See points after each playbook  
✅ **Clear Progress** - Know exactly where you are  
✅ **Motivation** - Rewarded for incremental progress  
✅ **Debugging** - Identify exactly what failed  
✅ **Engagement** - More satisfying than all-or-nothing

### For Instructors
✅ **Track Progress** - See where each student is stuck  
✅ **Targeted Help** - Know exactly what needs attention  
✅ **Analytics** - Identify common failure points  
✅ **Better Metrics** - Completion rate per step  
✅ **Time Management** - Estimate remaining work

---

## 📝 How to Test

### Run the Validator
```bash
ansible-playbook sub-controllers/ctf-challenge-validator.yml \
  -e "ctf_tracker_url=http://YOUR-TRACKER-URL" \
  -e "attendee_name='Your Name'"
```

### Expected Output
```
Challenge 6 (Phoenix Protocol): X/30 points
  ├─ Step 1 (Provision Database): +5 or 0 pts
  ├─ Step 2 (Provision Web Server): +5 or 0 pts
  ├─ Step 3 (Deploy Application): +5 or 0 pts
  ├─ Step 4 (Validate Service): +5 or 0 pts
  ├─ Step 5 (Rollback Web Server): +5 or 0 pts
  └─ Step 6 (Rollback Database): +5 or 0 pts
```

---

## 🚨 Troubleshooting

### Issue: Step 2 (Web Server) not giving points

**Check all 4 requirements:**
```bash
# 1. Is httpd running?
systemctl status httpd

# 2. Is port 8080 listening?
ss -tuln | grep 8080
netstat -tuln | grep 8080

# 3. Is SELinux configured?
semanage port -l | grep http_port_t | grep 8080

# 4. Is firewall allowing 8080?
firewall-cmd --list-ports
```

### Issue: Rollback steps not giving points

**Check markers exist:**
```bash
# Web rollback marker
ls -l /tmp/phoenix_web_rollback

# DB rollback marker
ls -l /tmp/phoenix_db_rollback
```

**Add to your rollback playbooks:**
```yaml
- name: Create rollback marker
  ansible.builtin.file:
    path: /tmp/phoenix_web_rollback  # or phoenix_db_rollback
    state: touch
    mode: '0644'
```

---

## 🎓 Teaching Points

### Workflow Decomposition
- Complex tasks broken into steps
- Each step validated independently
- Clear dependencies between steps

### Progress Tracking
- Incremental validation
- Immediate feedback loops
- Visual progress indicators

### Comprehensive Validation
- Multiple checks per step
- All-or-nothing per step (web server)
- Marker-based validation (rollbacks)

### Real-World Patterns
- Service health checks
- Port availability verification
- Security configuration validation
- Rollback verification

---

## 📚 Related Files

- `sub-controllers/ctf-challenge-validator.yml` - Validator with incremental scoring
- `ctf-workshop/solutions/challenge6-provision-database.yml`
- `ctf-workshop/solutions/challenge6-provision-webserver.yml`
- `ctf-workshop/solutions/challenge6-deploy-application.yml`
- `ctf-workshop/solutions/challenge6-validate-service.yml`
- `ctf-workshop/solutions/challenge6-rollback-webserver.yml`
- `ctf-workshop/solutions/challenge6-rollback-database.yml`

---

## ✅ Summary

**Before:** All-or-nothing 30 points (only database gave points)  
**After:** 5 points per playbook step (6 steps × 5 = 30 points)

**Result:**  
✅ Better user experience  
✅ Clearer progress tracking  
✅ More engaging workflow  
✅ Easier debugging  
✅ Better learning outcomes

---

**Happy automating!** 🚀
