# CTF Workshop - Complete Deployment & Testing Guide

## 🎯 Overview

This guide walks you through deploying and testing the entire CTF workshop infrastructure from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ OpenShift cluster access (`oc login` completed)
- ✅ Ansible Automation Platform (AAP) - Central and Sub-controllers accessible
- ✅ 3 RHEL servers (node1, node2, node3) for testing
- ✅ This repository cloned locally
- ✅ Git configured (`git config user.name` and `user.email` set)

---

## 🚀 Deployment Steps

### Phase 1: Deploy OpenShift Applications (Required)

These applications run on OpenShift and are essential for the workshop.

#### Step 1.1: Deploy CTF Tracker (Required)
```bash
cd ctf-tracker-nodejs

# Run the automated deployment script
./deploy.sh

# Follow the prompts:
# - Project name: ctf-workshop (or your choice)
# - App name: ctf-tracker (or your choice)
# - Git repo: https://github.com/YOUR-ORG/ctf_ansible_workshop.git
# - Branch: main
# - Context directory: ctf-tracker-nodejs
# - Enable persistent storage: y (recommended)

# Wait for build to complete (2-3 minutes)
# Note the route URL shown at the end
```

**Save this URL** - you'll need it for AAP configuration:
```
Example: http://ctf-tracker-ctf-workshop.apps.cluster-xxxxx.opentlc.com
```

#### Step 1.2: Deploy Workshop Portal (Optional but Recommended)
```bash
cd workshop-portal

# Run the automated deployment script
./deploy.sh

# Follow the prompts (similar to CTF Tracker)
# Note the route URL for participants to access materials
```

#### Step 1.3: Deploy Gitea (Optional - for distributed workshops)
```bash
cd gitea-openshift

# Run the automated deployment script
./deploy-gitea.sh

# Follow the prompts:
# - Project name: gitea
# - Admin username: admin
# - Admin password: (choose a secure password)
# - Admin email: admin@workshop.local

# After deployment completes:
# 1. Access the Gitea web UI (URL shown at end)
# 2. Register the first admin user manually via web UI
# 3. Get the admin token: Settings → Applications → Generate Token
```

**If using Gitea, create workshop repositories:**
```bash
cd gitea-openshift

# Edit workshop-users.csv with your participants
# Then run:
./create-workshop-repos.sh \
  http://gitea-gitea.apps.YOUR-CLUSTER.com \
  YOUR_ADMIN_TOKEN \
  workshop-users.csv
```

---

### Phase 2: Configure Ansible Automation Platform

#### Step 2.1: Update Central Controller Variables

Edit your central controller configuration with actual values:

```bash
cd central-controller

# Edit the inventory file
vi central-aap-inventory.ini

# Update with your actual sub-controller hostnames:
[sub_controllers]
sub-controller-east.YOUR-DOMAIN.com
sub-controller-west.YOUR-DOMAIN.com
```

**Edit host variables:**
```bash
# For each sub-controller, edit the host_vars file
vi host_vars/sub-controller-east.yml

# Update:
aap_host: "https://sub-controller-east.YOUR-DOMAIN.com"
# (Keep vault variables as-is)
```

**Update vault file with actual credentials:**
```bash
# Edit vault file
vi group_vars/all/vault.yml

# Replace placeholders:
vault_aap_username: "admin"
vault_aap_password: "YOUR_ACTUAL_PASSWORD"

# Encrypt the vault file
ansible-vault encrypt group_vars/all/vault.yml
# Enter a vault password when prompted
```

#### Step 2.2: Update Deployment Playbook with CTF Tracker URL

```bash
vi deploy-to-sub-controllers.yml

# Find the ctf_tracker_url variable and update:
ctf_tracker_url: "http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com"
```

#### Step 2.3: Deploy to Sub-Controllers

**IMPORTANT**: You only need to run this if:
- This is your first time setting up
- You've added new sub-controllers
- You want to update the playbooks on existing sub-controllers

```bash
cd central-controller

# Run the deployment playbook
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini

# Enter your vault password when prompted
```

This playbook will:
- ✅ Create organizations on each sub-controller
- ✅ Sync Git repository with playbooks
- ✅ Create job templates for challenge validation
- ✅ Configure credentials
- ✅ Set up inventories

**You do NOT need to rerun this** if:
- Sub-controllers are already configured
- You haven't changed AAP configurations
- You're just testing the new validator

---

### Phase 3: Prepare Test Environment (Required)

Set up the challenge environment on your RHEL nodes:

#### Step 3.1: Run Setup Playbook

```bash
cd ctf-workshop/setup

# Create a simple inventory file for your test nodes
cat > inventory <<EOF
[all]
node1 ansible_host=NODE1_IP_OR_HOSTNAME
node2 ansible_host=NODE2_IP_OR_HOSTNAME
node3 ansible_host=NODE3_IP_OR_HOSTNAME

[all:vars]
ansible_user=YOUR_SSH_USER
ansible_become=yes
EOF

# Run the setup playbook to initialize all challenges
ansible-playbook setup-all-challenges.yml -i inventory

# This will:
# - Stop chronyd (Challenge 1)
# - Install bind-utils on node2 (Challenge 2)
# - Create rogue_user on node1 and node3 (Challenge 3)
# - Clear /etc/motd (Challenge 4)
# - Block HTTP on node3 firewall (Challenge 5)
# - Stop services for Challenge 6
```

---

## 🧪 Testing the Workshop

### Option A: Test via AAP Web UI (Recommended)

1. **Login to your Sub-Controller AAP**
   - Navigate to: https://sub-controller-east.YOUR-DOMAIN.com

2. **Navigate to Job Templates**
   - Resources → Templates

3. **Find and Launch: "CTF Challenge Validation"**
   - Click the rocket icon to launch

4. **Enter Survey Variables:**
   ```yaml
   attendee_name: student1
   target_host: node1  # or node2, node3
   ```

5. **View Results:**
   - Watch the job execution
   - Check the final output for points earned
   - Visit CTF Tracker URL to see leaderboard updated

### Option B: Test via Ansible CLI (Quick Test)

Use the **NEW** challenge validator directly:

```bash
cd sub-controllers

# Create a test inventory
cat > test-inventory <<EOF
[all]
node1 ansible_host=NODE1_IP
node2 ansible_host=NODE2_IP
node3 ansible_host=NODE3_IP

[all:vars]
ansible_user=YOUR_USER
ansible_become=yes
EOF

# Run the new validator playbook
ansible-playbook ctf-challenge-validator.yml \
  -i test-inventory \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com"

# This will:
# - Check all 6 challenges on all nodes
# - Report results to CTF Tracker
# - Display summary at the end
```

### Option C: Test via AAP API (Programmatic)

```bash
# Set variables
AAP_HOST="https://sub-controller-east.YOUR-DOMAIN.com"
AAP_USER="admin"
AAP_PASS="your_password"
JOB_TEMPLATE_NAME="CTF Challenge Validation"

# Get job template ID
TEMPLATE_ID=$(curl -s -k -u ${AAP_USER}:${AAP_PASS} \
  "${AAP_HOST}/api/v2/job_templates/?name=${JOB_TEMPLATE_NAME}" | \
  jq -r '.results[0].id')

# Launch job
curl -k -u ${AAP_USER}:${AAP_PASS} \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "extra_vars": {
      "attendee_name": "student1",
      "target_host": "node1"
    }
  }' \
  "${AAP_HOST}/api/v2/job_templates/${TEMPLATE_ID}/launch/"
```

---

## 🎯 Testing Each Challenge Individually

### Challenge 1: chronyd (5 points)
```bash
# Verify it's broken
ansible node1 -i test-inventory -m shell -a "systemctl status chronyd"
# Should show: inactive (stopped)

# Apply solution
cd ctf-workshop/solutions
ansible-playbook challenge1-solution.yml -i ../setup/inventory

# Run validator to get points
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

### Challenge 2: bind-utils removal (10 points)
```bash
# Verify it's present
ansible node2 -i test-inventory -m shell -a "rpm -q bind-utils"
# Should show: bind-utils-x.x.x

# Apply solution
ansible-playbook challenge2-solution.yml -i ../setup/inventory

# Verify it's removed
ansible node2 -i test-inventory -m shell -a "rpm -q bind-utils"
# Should show: package bind-utils is not installed

# Run validator
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory -l node2 \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

### Challenge 3: rogue_user (15 points)
```bash
# Verify user exists
ansible node1,node3 -i test-inventory -m shell -a "id rogue_user"
# Should show user info

# Apply solution
ansible-playbook challenge3-solution.yml -i ../setup/inventory

# Verify removed
ansible node1,node3 -i test-inventory -m shell -a "id rogue_user"
# Should show: no such user

# Run validator
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory -l node1,node3 \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

### Challenge 4: MOTD (20 points)
```bash
# Verify MOTD is wrong/empty
ansible all -i test-inventory -m shell -a "cat /etc/motd"

# Apply solution
ansible-playbook challenge4-solution.yml -i ../setup/inventory

# Verify MOTD is correct
ansible all -i test-inventory -m shell -a "cat /etc/motd"
# Should show: Welcome to HOSTNAME - Managed by SRE Team

# Run validator
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

### Challenge 5: Firewall (20 points)
```bash
# Verify HTTP is blocked
ansible node3 -i test-inventory -m shell -a "firewall-cmd --query-service=http"
# Should show: no (exit code 1)

# Apply solution
ansible-playbook challenge5-solution.yml -i ../setup/inventory

# Verify HTTP is allowed
ansible node3 -i test-inventory -m shell -a "firewall-cmd --query-service=http"
# Should show: yes (exit code 0)

# Run validator
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory -l node3 \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

### Challenge 6: Phoenix Protocol (30 points)
**Note**: This is a WORKFLOW challenge, meant to be done in AAP Web UI

```bash
# In AAP Web UI:
# 1. Create 6 Job Templates (one for each solution playbook)
# 2. Create a Workflow Template
# 3. Link templates: Provision DB → Provision Web → Deploy App → Validate
# 4. Add failure path: Validate (fail) → Rollback Web → Rollback DB
# 5. Optional: Add approval gate before Provision DB for +10 extra credit
# 6. Launch the workflow

# For CLI testing, you can run playbooks sequentially:
cd ctf-workshop/solutions
ansible-playbook challenge6-provision-database.yml -i ../setup/inventory
ansible-playbook challenge6-provision-webserver.yml -i ../setup/inventory
ansible-playbook challenge6-deploy-application.yml -i ../setup/inventory
ansible-playbook challenge6-validate-service.yml -i ../setup/inventory

# Create validation marker
ansible node1 -i ../setup/inventory -m file -a "path=/tmp/phoenix_validated state=touch"

# Run validator
ansible-playbook ../../sub-controllers/ctf-challenge-validator.yml \
  -i ../setup/inventory \
  -e "attendee_name=student1" \
  -e "ctf_tracker_url=YOUR_TRACKER_URL"
```

---

## 📊 Verify CTF Tracker

After running challenges, check the CTF Tracker:

```bash
# Open in browser
open http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com

# Or check via API
curl http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com/api/attendees

# Should show:
# [
#   {
#     "id": 1,
#     "name": "student1",
#     "total_points": XX,  # Sum of all challenges completed
#     ...
#   }
# ]
```

---

## 🔄 Reset Environment for Testing

To reset and try again:

```bash
cd ctf-workshop/setup

# Reset all challenges
ansible-playbook reset-environment.yml -i inventory

# Then run setup again
ansible-playbook setup-all-challenges.yml -i inventory
```

---

## 🎓 Full Workshop Test Scenario

**Complete end-to-end test:**

1. **Deploy Infrastructure** (Phase 1 - one time)
   ```bash
   cd ctf-tracker-nodejs && ./deploy.sh
   cd ../workshop-portal && ./deploy.sh
   ```

2. **Configure AAP** (Phase 2 - only if not done or changed)
   ```bash
   # Update central-controller configs
   cd central-controller
   ansible-playbook deploy-to-sub-controllers.yml --ask-vault-pass -i central-aap-inventory.ini
   ```

3. **Setup Environment** (Phase 3 - every test)
   ```bash
   cd ctf-workshop/setup
   ansible-playbook setup-all-challenges.yml -i inventory
   ```

4. **Test Challenge Validation** (Can do multiple times)
   ```bash
   cd ../../sub-controllers
   ansible-playbook ctf-challenge-validator.yml \
     -i ../ctf-workshop/setup/inventory \
     -e "attendee_name=student1" \
     -e "ctf_tracker_url=http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com"
   ```

5. **Apply Solutions** (Simulate participant work)
   ```bash
   cd ../ctf-workshop/solutions
   ansible-playbook challenge1-solution.yml -i ../setup/inventory
   ansible-playbook challenge2-solution.yml -i ../setup/inventory
   ansible-playbook challenge3-solution.yml -i ../setup/inventory
   ansible-playbook challenge4-solution.yml -i ../setup/inventory
   ansible-playbook challenge5-solution.yml -i ../setup/inventory
   ```

6. **Run Validator Again** (Should show 90/100 points)
   ```bash
   cd ../../sub-controllers
   ansible-playbook ctf-challenge-validator.yml \
     -i ../ctf-workshop/setup/inventory \
     -e "attendee_name=student1" \
     -e "ctf_tracker_url=http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com"
   ```

7. **Check Leaderboard**
   - Open CTF Tracker in browser
   - Should show student1 with 90 points (all except Challenge 6)

---

## ⚠️ When Do You Need to Rerun Central Controller Playbook?

**You NEED to rerun** `deploy-to-sub-controllers.yml` if:
- ✅ Adding new sub-controllers
- ✅ First time setup
- ✅ Changed Git repository URL
- ✅ Want to update playbooks on sub-controllers
- ✅ Modified job template configurations
- ✅ Changed CTF Tracker URL in deployment playbook

**You DON'T need to rerun** if:
- ❌ Just testing the validator locally
- ❌ Only running setup/solution playbooks
- ❌ Just checking CTF Tracker
- ❌ Testing individual challenges
- ❌ AAP is already configured and working

---

## 🚀 Quick Start for Immediate Testing

**If AAP is already configured, start here:**

```bash
# 1. Setup challenges
cd ctf-workshop/setup
ansible-playbook setup-all-challenges.yml -i inventory

# 2. Run validator
cd ../../sub-controllers
ansible-playbook ctf-challenge-validator.yml \
  -i ../ctf-workshop/setup/inventory \
  -e "attendee_name=testuser" \
  -e "ctf_tracker_url=http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com"

# 3. Check results in CTF Tracker
open http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com
```

---

## 📞 Troubleshooting

### Issue: Validator not reporting to CTF Tracker
```bash
# Check CTF Tracker is accessible from your machine
curl http://ctf-tracker-ctf-workshop.apps.YOUR-CLUSTER.com/health

# Check the validator output for API errors
# Ensure ctf_tracker_url variable is correct
```

### Issue: AAP job templates not found
```bash
# Rerun deployment
cd central-controller
ansible-playbook deploy-to-sub-controllers.yml --ask-vault-pass -i central-aap-inventory.ini
```

### Issue: RHEL nodes not accessible
```bash
# Test connectivity
ansible all -i ctf-workshop/setup/inventory -m ping

# Check SSH access
ssh YOUR_USER@node1
```

---

## ✅ Success Criteria

You know everything is working when:

- ✅ CTF Tracker dashboard loads in browser
- ✅ Setup playbook runs without errors
- ✅ Validator playbook completes successfully
- ✅ CTF Tracker shows attendee with 0-100 points
- ✅ Applying solutions increases points
- ✅ Leaderboard updates in real-time

---

**Ready to deploy and test! 🚀**

