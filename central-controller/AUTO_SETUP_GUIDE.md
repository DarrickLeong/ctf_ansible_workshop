# Deploy-to-Sub-Controllers - Automatic Environment Setup

## 🎯 New Feature: One-Command Deployment + Setup

The `deploy-to-sub-controllers.yml` playbook can now **automatically** run Environment Reset and Setup after deploying playbooks to sub-controllers.

---

## 📋 Usage Options

### Option 1: Deploy Only (Original Behavior)
Deploy playbooks and create job templates, but **don't run** reset/setup:

```bash
cd central-controller
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "scm_repository_url=https://github.com/YOUR-ORG/ctf_ansible_workshop.git"
```

**Result**: Job templates created, but you must manually launch them from AAP UI.

---

### Option 2: Deploy + Auto Reset (Clean State)
Deploy playbooks AND automatically run Environment Reset:

```bash
cd central-controller
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "scm_repository_url=https://github.com/YOUR-ORG/ctf_ansible_workshop.git" \
  -e "run_environment_reset=true" \
  -e "environment_inventory='RHEL Hosts'" \
  -e "environment_credential='RHEL SSH Key'"
```

**Result**: Playbooks deployed + Environment cleaned to baseline state.

---

### Option 3: Deploy + Auto Reset + Auto Setup (Full Workshop Prep)
Deploy playbooks AND automatically run both Reset and Setup:

```bash
cd central-controller
ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "scm_repository_url=https://github.com/YOUR-ORG/ctf_ansible_workshop.git" \
  -e "run_environment_reset=true" \
  -e "run_environment_setup=true" \
  -e "environment_inventory='RHEL Hosts'" \
  -e "environment_credential='RHEL SSH Key'"
```

**Result**: 
1. Playbooks deployed to sub-controllers
2. Environment reset to clean state
3. Environment setup with all challenges broken
4. **Workshop is ready to start!**

---

## 🔧 Required Extra Variables (for Auto-Run)

| Variable | Description | Example |
|----------|-------------|---------|
| `run_environment_reset` | Enable auto-reset | `true` or `false` |
| `run_environment_setup` | Enable auto-setup | `true` or `false` |
| `environment_inventory` | Inventory name in AAP | `"RHEL Hosts"` or `"Workshop Nodes"` |
| `environment_credential` | SSH credential name in AAP | `"RHEL SSH Key"` or `"Machine Credential"` |

⚠️ **Important**: 
- Inventory and credential names must **exactly match** what exists in your sub-AAP controllers
- Names are **case-sensitive**
- Use quotes around names with spaces

---

## 📊 Execution Flow

When auto-run is enabled:

```
┌─────────────────────────────────────────────────┐
│  1. Deploy Playbooks to Sub-Controller          │
│     - Create/update project                      │
│     - Sync from Git                              │
│     - Create 4 job templates                     │
├─────────────────────────────────────────────────┤
│  2. [Optional] Run Environment Reset             │
│     - Launch "CTF Environment Reset" job         │
│     - Wait for completion (up to 10 min)         │
│     - Clean all nodes to baseline                │
├─────────────────────────────────────────────────┤
│  3. [Optional] Run Environment Setup             │
│     - Wait 5 seconds after reset                 │
│     - Launch "CTF Environment Setup" job         │
│     - Wait for completion (up to 10 min)         │
│     - Break all 6 challenges                     │
├─────────────────────────────────────────────────┤
│  4. Report Final Status                          │
│     - Show job IDs and status                    │
│     - CTF Tracker onboarding status              │
└─────────────────────────────────────────────────┘
```

---

## ✅ Example Output

With auto-run enabled, you'll see:

```
PLAY RECAP ******************************************
sub-controller-east    : ok=42   changed=8
sub-controller-west    : ok=42   changed=8

FINAL DEPLOYMENT SUMMARY
==========================================
Total Sub Controllers: 2
Successful Deployments: 2
Failed Deployments: 0

SUCCESSFUL DEPLOYMENTS:
✅ sub-controller-east: aap-east.company.com
✅ sub-controller-west: aap-west.company.com

Job Templates Deployed:
- CTF Environment Reset
- CTF Environment Setup
- CTF Challenge Validation
- CTF Connectivity Test

AUTOMATIC EXECUTION:
🔄 sub-controller-east: Environment Reset - successful (Job ID: 123)
⚙️ sub-controller-east: Environment Setup - successful (Job ID: 124)
🔄 sub-controller-west: Environment Reset - successful (Job ID: 125)
⚙️ sub-controller-west: Environment Setup - successful (Job ID: 126)

CTF TRACKER ONBOARDING:
✅ sub-controller-east: Registered as East Team (ID: 1)
✅ sub-controller-west: Registered as West Team (ID: 2)

Dashboard URL: http://ctf-tracker.apps.YOUR-CLUSTER.com
==========================================
```

---

## 🐛 Troubleshooting

### "Inventory not found" Error
**Problem**: `environment_inventory` name doesn't match what's in AAP.

**Fix**: 
1. Login to sub-AAP controller
2. Go to **Resources → Inventories**
3. Copy the **exact name** (case-sensitive)
4. Use that in your command

### "Credential not found" Error
**Problem**: `environment_credential` name doesn't match what's in AAP.

**Fix**:
1. Login to sub-AAP controller
2. Go to **Resources → Credentials**
3. Copy the **exact name** (case-sensitive)
4. Use that in your command

### Job Times Out (10 Minutes)
**Problem**: Reset or Setup job takes longer than 600 seconds.

**Fix**: Edit `deploy-to-sub-controllers.yml` and increase `timeout`:
```yaml
timeout: 1200  # 20 minutes
```

### Reset Runs But Setup Doesn't
**Problem**: Reset failed, so Setup was skipped.

**Fix**: Check the reset job logs in AAP for errors. Common issues:
- Node connectivity problems
- Missing packages (e.g., firewalld, postgresql)
- Permission issues

---

## 🎓 When to Use Each Option

| Scenario | Use This |
|----------|----------|
| **First-time setup** | Option 3 (Deploy + Reset + Setup) |
| **Update playbooks only** | Option 1 (Deploy only) |
| **Reset after workshop** | Option 2 (Deploy + Reset only) |
| **Full workshop prep** | Option 3 (Deploy + Reset + Setup) |
| **Quick testing** | Option 1, then manual launch in AAP |

---

## 🚀 Pro Tip: Save as Script

Create `deploy-and-setup.sh`:

```bash
#!/bin/bash
cd central-controller

ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "ctf_tracker_url=http://ctf-tracker.apps.cluster-abc.com" \
  -e "scm_repository_url=https://github.com/myorg/ctf_ansible_workshop.git" \
  -e "run_environment_reset=true" \
  -e "run_environment_setup=true" \
  -e "environment_inventory='RHEL Hosts'" \
  -e "environment_credential='RHEL SSH Key'"
```

Then run:
```bash
chmod +x deploy-and-setup.sh
./deploy-and-setup.sh
```

---

**🎉 Now you can prepare your entire CTF workshop with one command!**

