# Central AAP Controller Setup Guide

This guide walks you through setting up the central Ansible Platform Controller to manage CTF playbook deployment to multiple sub controllers.

## 🏗️ Architecture Overview

```
Central AAP Controller
       │
       ├── Inventory: CTF Sub Controllers
       ├── Project: CTF Sub Controller Management  
       ├── Job Templates:
       │   ├── Test Sub Controller Connectivity
       │   └── Deploy CTF Playbooks to Sub Controllers
       └── Workflow: Complete CTF Infrastructure Setup
                │
                ▼
       [Sub Controller 1] ──→ [RHEL Hosts Group 1]
       [Sub Controller 2] ──→ [RHEL Hosts Group 2]  
       [Sub Controller N] ──→ [RHEL Hosts Group N]
```

## 📋 Prerequisites

1. **Central Ansible Platform Controller** with admin access
2. **awx.awx collection** installed on central controller
3. **Network connectivity** from central to all sub controllers
4. **Authentication credentials** for each sub controller
5. **Git repository** (optional but recommended) containing CTF playbooks

## 🚀 Setup Instructions

### Step 1: Install Required Collection

On your Central AAP Controller:
```bash
ansible-galaxy collection install awx.awx
```

### Step 2: Create Project

1. **Create Project** in Central AAP Controller:
   - **Name**: `CTF Sub Controller Management`
   - **SCM Type**: Git (recommended) or Manual
   - **SCM URL**: `https://github.com/your-org/ctf-ansible-workshop.git`
   - **SCM Branch**: `main`
   - **Update on Launch**: ✅ (if using Git)

### Step 3: Create Inventory

1. **Create Inventory** named `CTF Sub Controllers Inventory`

2. **Add Inventory Source** (choose one method):

   **Method A: Manual Entry**
   - Add hosts manually using the web interface
   - Host names: `sub-controller-east`, `sub-controller-west`, etc.
   - Group: `sub_controllers`

   **Method B: Import from File**
   - Upload `central-aap-inventory.ini` as inventory source
   - Set sync schedule if desired

### Step 4: Configure Host Variables

For each sub controller host, add these **Host Variables**:

```yaml
# Required variables
sub_controller_host: "aap-east.company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_sub_controller_east_password }}"
sub_controller_organization: "CTF Organization"
sub_controller_validate_certs: false

# Optional variables
controller_region: "east"
controller_description: "East Coast CTF Sub Controller"
```

### Step 5: Create Credentials

1. **Create Vault Credential**:
   - **Name**: `CTF Sub Controllers Vault`
   - **Type**: Vault
   - **Vault Password**: [Your vault password]

2. **Create Machine Credential** (if needed):
   - **Name**: `CTF Central Controller`
   - **Type**: Machine
   - **Username**: [Central controller service account]

### Step 6: Encrypt Sensitive Data

Create and encrypt vault file:
```bash
# Edit the vault file
vim group_vars/all/vault.yml

# Add your passwords:
vault_sub_controller_east_password: "actual-password"
vault_sub_controller_west_password: "actual-password"

# Encrypt the file
ansible-vault encrypt group_vars/all/vault.yml
```

### Step 7: Create Job Templates

#### Job Template 1: Test Connectivity
- **Name**: `Test Sub Controller Connectivity`
- **Job Type**: Run
- **Inventory**: `CTF Sub Controllers Inventory`
- **Project**: `CTF Sub Controller Management`
- **Playbook**: `test-sub-controllers.yml`
- **Credentials**: `CTF Sub Controllers Vault`
- **Verbosity**: 1 (Verbose)

#### Job Template 2: Deploy Playbooks
- **Name**: `Deploy CTF Playbooks to Sub Controllers`
- **Job Type**: Run
- **Inventory**: `CTF Sub Controllers Inventory`
- **Project**: `CTF Sub Controller Management`
- **Playbook**: `deploy-to-sub-controllers.yml`
- **Credentials**: `CTF Sub Controllers Vault`
- **Variables**: ✅ Prompt on launch
- **Verbosity**: 1 (Verbose)

**Survey Questions** for deployment job:
1. **Repository URL**: Git repository with CTF playbooks
2. **Branch**: Git branch to deploy (default: main)
3. **CTF Tracker URL**: Central tracker application URL
4. **Project Name**: Name for project on sub controllers

### Step 8: Create Workflow Template

1. **Create Workflow Template**:
   - **Name**: `Complete CTF Infrastructure Setup`
   - **Organization**: Default

2. **Add Workflow Nodes**:
   ```
   [Test Sub Controller Connectivity]
              │ (on success)
              ▼
   [Deploy CTF Playbooks to Sub Controllers]
   ```

## 🎯 Usage

### Quick Test
1. Run `Test Sub Controller Connectivity` job template
2. Verify all sub controllers are accessible

### Full Deployment
1. Run `Complete CTF Infrastructure Setup` workflow, OR
2. Run `Deploy CTF Playbooks to Sub Controllers` directly

### Monitor Progress
- View job output in real-time
- Check deployment status for each sub controller
- Review any failures and retry as needed

## 🔧 Configuration Options

### Environment Variables (Survey)
- **Repository URL**: Source of CTF playbooks
- **Branch**: Git branch to deploy
- **CTF Tracker URL**: Central application endpoint
- **Project Name**: Project name on sub controllers

### Advanced Settings
- **Serial Execution**: Controlled by `serial: 1` in playbook
- **Timeout**: Configurable connection timeouts
- **Retry Logic**: Built-in error handling and reporting

## 🛠️ Troubleshooting

### Common Issues

**1. Authentication Failures**
```bash
# Check credentials in vault file
ansible-vault view group_vars/all/vault.yml

# Verify sub controller passwords/tokens
```

**2. Network Connectivity**
```bash
# Test from central controller
curl -k https://aap-east.company.com/api/v2/ping/
```

**3. Permission Issues**
- Ensure sub controller accounts have admin privileges
- Check organization settings on sub controllers

**4. Playbook Sync Failures**
- Verify Git repository URL and branch
- Check network access to Git repository
- Review project sync logs

### Debug Mode
Enable verbose logging by setting job template verbosity to 2 or 3.

### Support Commands
```bash
# View deployment status
awx jobs list --name "Deploy CTF Playbooks"

# Check workflow execution
awx workflow_jobs list --name "Complete CTF Infrastructure Setup"
```

## 🔄 Maintenance

### Regular Tasks
1. **Update Playbooks**: Sync project from Git
2. **Credential Rotation**: Update vault passwords periodically
3. **Health Checks**: Run connectivity tests regularly
4. **Monitoring**: Review job execution logs

### Scaling
- Add new sub controllers to inventory
- Update host variables for new controllers
- Test connectivity before deployment

---

**Your CTF infrastructure is now managed centrally!** 🎉

Run the workflow template to deploy CTF playbooks to all sub controllers with a single click.
