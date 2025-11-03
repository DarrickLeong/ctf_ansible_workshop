# Gitea Data Loss Recovery Guide

**Problem:** OpenShift cluster was stopped/hibernated and Gitea data is gone.

**Root Cause:** OpenShift sandbox environments don't persist PVCs (Persistent Volume Claims) across cluster hibernation/restart. When the cluster goes to sleep, the entire project and its storage can be lost.

---

## 🚨 Immediate Recovery Options

### Option 1: Full Redeploy + Recreate Users (RECOMMENDED)

If you have the `workshop-users.csv` file, you can quickly recreate everything:

```bash
cd gitea-openshift

# Step 1: Redeploy Gitea
./deploy-gitea.sh

# Step 2: Get the Gitea URL and create admin token
# Open Gitea in browser: http://gitea-PROJECT.apps.YOUR-CLUSTER.com
# Login as admin
# Go to: Settings → Applications → Generate New Token
# Copy the token

# Step 3: Recreate all users and repos
./create-workshop-repos.sh \
    "http://gitea-gitea.apps.YOUR-CLUSTER.com" \
    "YOUR_ADMIN_TOKEN" \
    "workshop-users.csv"
```

**Time:** ~5-10 minutes  
**Data Loss:** None (if CSV file exists)

---

### Option 2: Use Recovery Script (NEW!)

```bash
cd gitea-openshift
./gitea-recovery.sh
```

**Menu Options:**
1. **Check Gitea Status** - Diagnose what's missing
2. **Backup Gitea Data** - Create backup file (for future)
3. **Restore Gitea Data** - Restore from backup file
4. **Full Redeploy** - Runs deploy-gitea.sh
5. **Export Users CSV** - Export current users to CSV
6. **Recreate from Workshop CSV** - Quick recovery from CSV

---

### Option 3: Manual Step-by-Step

#### Step 1: Redeploy Gitea

```bash
cd gitea-openshift
./deploy-gitea.sh
```

**Prompts:**
```
Enter OpenShift project name [gitea]: gitea
Enter Gitea admin username [gitea_admin]: gitea_admin
Enter Gitea admin password: ********
Enter Gitea admin email [admin@example.com]: admin@example.com
Proceed with deployment? (y/n): y
```

**Wait for deployment to complete.**

#### Step 2: Get Admin Token

1. Open Gitea in browser:
   ```bash
   oc get route gitea -n gitea -o jsonpath='{.spec.host}'
   # Visit: http://gitea-gitea.apps.YOUR-CLUSTER.com
   ```

2. Login with admin credentials

3. Generate token:
   - Click user icon (top right) → **Settings**
   - Click **Applications** (left sidebar)
   - In **Manage Access Tokens** section:
     - Token Name: `workshop-admin`
     - Click **Generate Token**
     - **COPY THE TOKEN** (you won't see it again!)

#### Step 3: Recreate Users and Repos

```bash
cd gitea-openshift

./create-workshop-repos.sh \
    "http://gitea-gitea.apps.YOUR-CLUSTER.com" \
    "YOUR_ADMIN_TOKEN_HERE" \
    "workshop-users.csv"
```

**Example:**
```bash
./create-workshop-repos.sh \
    "http://gitea-gitea.apps.cluster-6zjzq.6zjzq.sandbox5539.opentlc.com" \
    "d41d8cd98f00b204e9800998ecf8427e" \
    "workshop-users.csv"
```

---

## 📋 Verification Checklist

After recovery, verify:

```bash
cd gitea-openshift

# Check deployment status
oc get all -n gitea

# Should show:
# - deployment.apps/gitea (1/1 ready)
# - pod/gitea-XXXXX-XXXXX (Running)
# - service/gitea
# - route.route.openshift.io/gitea
# - pvc/gitea-data (Bound)

# Get Gitea URL
oc get route gitea -n gitea -o jsonpath='{.spec.host}'

# Test access
curl http://$(oc get route gitea -n gitea -o jsonpath='{.spec.host}')
```

**In Gitea Web UI:**
- [ ] Can login as admin
- [ ] All student users exist (student1, student2, etc.)
- [ ] Each user has `ansible-ctf-challenges` repository
- [ ] Repositories have challenge content (6 challenge folders)

---

## 🛡️ Prevention: Future Data Loss

### Strategy 1: Regular Backups

**Create backup before cluster hibernates:**
```bash
cd gitea-openshift
./gitea-recovery.sh
# Select: Option 2 (Backup Gitea Data)
```

**After cluster restart:**
```bash
cd gitea-openshift
./deploy-gitea.sh      # Redeploy Gitea
./gitea-recovery.sh    # Select Option 3 (Restore)
```

---

### Strategy 2: Keep CSV Updated

Always maintain `workshop-users.csv` with current passwords.

**Export users to CSV:**
```bash
cd gitea-openshift
./gitea-recovery.sh
# Select: Option 5 (Export Users CSV)
```

This creates a CSV you can use for quick recovery.

---

### Strategy 3: External Git Backup

For critical workshops, consider backing up repos to external Git:

```bash
# For each student repo, create a mirror
git clone --mirror http://gitea-URL/student1/ansible-ctf-challenges.git
cd ansible-ctf-challenges.git
git push --mirror https://github.com/YOUR-ORG/backup-student1.git
```

---

## 🔧 Troubleshooting

### Issue: "Project gitea not found"

**Cause:** Entire namespace was deleted during cluster restart.

**Fix:**
```bash
cd gitea-openshift
./deploy-gitea.sh  # Redeploy from scratch
```

---

### Issue: "PVC gitea-data stuck in Pending"

**Cause:** Storage class not available or quota exceeded.

**Check:**
```bash
oc get pvc gitea-data -n gitea -o yaml
oc describe pvc gitea-data -n gitea
```

**Fix:**
```bash
# Delete and recreate with smaller size
oc delete pvc gitea-data -n gitea
# Edit deploy-gitea.sh, change storage: 5Gi to storage: 1Gi
./deploy-gitea.sh
```

---

### Issue: "Gitea shows installation wizard"

**Cause:** Database file was lost, Gitea thinks it's first run.

**Fix:**
1. If you have a backup:
   ```bash
   ./gitea-recovery.sh  # Option 3 (Restore)
   ```

2. If no backup:
   ```bash
   # Complete installation wizard, then recreate users
   ./create-workshop-repos.sh URL TOKEN workshop-users.csv
   ```

---

### Issue: "Some users/repos missing"

**Cause:** Incomplete recreation.

**Check:**
```bash
# List users via API
GITEA_URL="http://gitea-gitea.apps.YOUR-CLUSTER.com"
ADMIN_TOKEN="YOUR_TOKEN"

curl -s "${GITEA_URL}/api/v1/admin/users" \
     -H "Authorization: token ${ADMIN_TOKEN}" | jq '.[] | .login'
```

**Fix:**
```bash
# Rerun creation script
./create-workshop-repos.sh "${GITEA_URL}" "${ADMIN_TOKEN}" "workshop-users.csv"
```

---

## 📊 Recovery Time Estimates

| Method | Time | Data Loss | Requirements |
|--------|------|-----------|--------------|
| Full Redeploy + CSV | 5-10 min | None | workshop-users.csv |
| Restore from Backup | 3-5 min | None | Backup file |
| Manual Recreation | 15-20 min | None | Remember credentials |

---

## 🎯 Quick Recovery Commands

**Full automated recovery (if you have CSV):**
```bash
cd /Users/dleong/Documents/ctf_ansible_workshop/gitea-openshift

# 1. Redeploy Gitea
./deploy-gitea.sh

# 2. Get your Gitea URL
oc get route gitea -n gitea -o jsonpath='{.spec.host}' && echo

# 3. Login to Gitea web UI, generate admin token

# 4. Recreate everything
./create-workshop-repos.sh \
    "http://$(oc get route gitea -n gitea -o jsonpath='{.spec.host}')" \
    "PASTE_YOUR_TOKEN_HERE" \
    "workshop-users.csv"
```

**Done!** All users and repos will be recreated. ✅

---

## 📝 Post-Recovery Checklist

- [ ] Gitea accessible via route
- [ ] Admin can login
- [ ] All student users exist
- [ ] All repos have challenge content
- [ ] Create a backup:
  ```bash
  ./gitea-recovery.sh  # Option 2
  ```
- [ ] Save backup file to safe location
- [ ] Update workshop documentation with new Gitea URL (if changed)

---

## 💡 Best Practices

1. **Before cluster shutdown:**
   - Run backup (Option 2 in recovery script)
   - Save `workshop-users.csv` locally
   - Document admin credentials

2. **After cluster restart:**
   - Check if Gitea project exists
   - If not, redeploy + recreate from CSV
   - If yes, verify data integrity

3. **Regular maintenance:**
   - Weekly backups during active workshops
   - Keep CSV updated with current passwords
   - Test recovery process in non-production

---

**Need Help?**

Run the recovery script for interactive guidance:
```bash
cd gitea-openshift
./gitea-recovery.sh
```

Select Option 1 to check status and get specific guidance.

