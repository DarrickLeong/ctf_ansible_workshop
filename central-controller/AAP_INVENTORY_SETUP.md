# AAP Inventory Setup Guide

Configure your Ansible Automation Platform inventory to work directly with the central controller playbooks.

## 🎯 Overview

The central controller playbooks now read directly from the AAP inventory instead of requiring a static `.ini` file. This allows for dynamic management of sub controllers through the AAP web interface.

## 📋 AAP Inventory Configuration

### **Step 1: Create Inventory in AAP** 🏗️

1. Navigate to **Inventories** → **Add** → **Inventory**
2. **Name**: `CTF Sub Controllers`
3. **Organization**: `Default` (or your organization)
4. **Save**

### **Step 2: Add Sub Controller Hosts** 🖥️

For each sub controller, add a host with these settings:

#### **Host Configuration**
- **Name**: `sub-controller-east` (descriptive name)
- **Variables**: (in YAML format)

```yaml
---
# Sub Controller Connection Details
sub_controller_host: "aap-east.your-company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_east_password }}"
# Alternative: sub_controller_token: "{{ vault_east_token }}"
sub_controller_organization: "CTF Organization"
sub_controller_validate_certs: false

# Controller Metadata (optional)
controller_region: "east"
controller_timezone: "America/New_York"
controller_description: "East Coast CTF Sub Controller"

# Deployment Configuration (can be set per host or globally)
ctf_tracker_url: "https://ctf-tracker.apps.your-cluster.com"
scm_repository_url: "https://github.com/your-org/ctf-ansible-workshop.git"
scm_branch: "main"
project_name: "CTF Challenge Playbooks"
```

#### **Repeat for Additional Controllers**

**West Controller**:
```yaml
---
sub_controller_host: "aap-west.your-company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_west_password }}"
sub_controller_organization: "CTF Organization"
sub_controller_validate_certs: false

controller_region: "west"
controller_timezone: "America/Los_Angeles"
controller_description: "West Coast CTF Sub Controller"
```

**Central Controller** (if managing itself):
```yaml
---
sub_controller_host: "aap-central.your-company.com"
sub_controller_username: "admin"
sub_controller_password: "{{ vault_central_password }}"
sub_controller_organization: "Default"
sub_controller_validate_certs: false

controller_region: "central"
controller_timezone: "America/Chicago"
controller_description: "Central CTF Management Controller"
```

### **Step 3: Create Groups (Optional)** 📂

Create logical groups for better organization (not required for playbook execution):

1. **Group**: `sub_controllers` *(Optional)*
   - **Description**: All CTF sub controllers
   - **Add hosts**: All your sub controller hosts
   - **Note**: Playbooks work with or without this group

2. **Group**: `east_region` *(Optional)*
   - **Description**: East coast controllers
   - **Add hosts**: `sub-controller-east`

3. **Group**: `west_region` *(Optional)*
   - **Description**: West coast controllers
   - **Add hosts**: `sub-controller-west`

**Important**: The playbooks automatically work with all hosts in the inventory that have the required sub controller variables, regardless of group membership.

### **Step 4: Set Global Variables** 🌐

Add inventory-level variables (click **Variables** in inventory settings):

```yaml
---
# Global deployment settings
ansible_connection: local
ansible_python_interpreter: "{{ ansible_playbook_python }}"

# Default CTF configuration
ctf_tracker_url: "https://ctf-tracker.apps.your-cluster.com"
scm_type: "git"
scm_repository_url: "https://github.com/your-org/ctf-ansible-workshop.git"
scm_branch: "main"
project_name: "CTF Challenge Playbooks"

# Default sub controller settings
sub_controller_validate_certs: false
sub_controller_organization: "CTF Organization"
```

## 🔐 Credential Management

### **Method 1: Using Credential Variables** (Recommended)

1. **Create Custom Credential Type**:
   - Navigate to **Credential Types** → **Add**
   - **Name**: `Sub Controller Passwords`
   - **Input Configuration**:
     ```yaml
     fields:
       - id: vault_east_password
         type: string
         label: East Controller Password
         secret: true
       - id: vault_west_password
         type: string
         label: West Controller Password
         secret: true
       - id: vault_central_password
         type: string
         label: Central Controller Password
         secret: true
     ```
   - **Injector Configuration**:
     ```yaml
     extra_vars:
       vault_east_password: '{{ vault_east_password }}'
       vault_west_password: '{{ vault_west_password }}'
       vault_central_password: '{{ vault_central_password }}'
     ```

2. **Create Credential**:
   - Navigate to **Credentials** → **Add**
   - **Name**: `CTF Sub Controller Passwords`
   - **Credential Type**: `Sub Controller Passwords` (the one you just created)
   - Fill in the actual passwords

### **Method 2: Using Ansible Vault** (Alternative)

Create vault variables in your inventory:

```yaml
---
# Encrypted passwords (encrypt with ansible-vault)
vault_east_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          66386439653937336464623462326566...
vault_west_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          35663934636564393965396665653937...
```

## 🚀 Job Template Configuration

Update your job templates to use the AAP inventory:

### **Test Connectivity Template**
- **Name**: `Test Sub Controller Connectivity`
- **Inventory**: `CTF Sub Controllers` (your AAP inventory)
- **Playbook**: `central-controller/test-sub-controllers.yml`
- **Credentials**: Include your credential for passwords
- **Limit**: Leave empty (playbook will auto-filter)

### **Deploy Playbooks Template**
- **Name**: `Deploy CTF Playbooks to Sub Controllers`
- **Inventory**: `CTF Sub Controllers` (your AAP inventory)
- **Playbook**: `central-controller/deploy-to-sub-controllers.yml`
- **Credentials**: Include your credential for passwords
- **Survey**: Configure as before
- **Limit**: Leave empty (playbook will auto-filter)

## 🔍 Dynamic Host Filtering

The updated playbooks automatically filter hosts based on required variables:

**Hosts are included if they have**:
- ✅ `sub_controller_host` defined
- ✅ `sub_controller_username` defined  
- ✅ Either `sub_controller_password` OR `sub_controller_token` defined

**Hosts are skipped if**:
- ❌ Missing any required variables
- ❌ Not configured as sub controllers

## ✅ Verification

### **Test Your Inventory Setup**

1. **Run Connectivity Test**:
   - Execute `Test Sub Controller Connectivity` job template
   - Should show only configured sub controllers
   - All tests should pass

2. **Check Inventory via API**:
   ```bash
   # Get inventory hosts
   curl -k -u admin:password \
     "https://your-aap.com/api/v2/inventories/ID/hosts/" | jq '.results[].name'
   
   # Get host variables
   curl -k -u admin:password \
     "https://your-aap.com/api/v2/hosts/ID/variable_data/" | jq '.'
   ```

3. **Debug Host Selection**:
   Add this task to temporarily see which hosts are selected:
   ```yaml
   - name: Debug selected hosts
     debug:
       msg: "Processing {{ inventory_hostname }}: {{ sub_controller_host }}"
   ```

## 🎯 Benefits of AAP Inventory

### **Dynamic Management**
- ✅ Add/remove sub controllers via web interface
- ✅ Update credentials without touching files
- ✅ Group-based organization and targeting
- ✅ API-driven inventory management

### **Security**
- ✅ Encrypted credential storage
- ✅ Role-based access control
- ✅ Audit trail for changes
- ✅ No plaintext passwords in files

### **Scalability**
- ✅ Handle hundreds of sub controllers
- ✅ Organize by region, environment, etc.
- ✅ Bulk operations on groups
- ✅ Integration with external systems

## 🔍 How Host Selection Works

### **Automatic Host Discovery** 🎯

The playbooks use this logic to automatically find sub controllers:

1. **Start with all inventory hosts** - `hosts: all` in playbook
2. **Filter by required variables** - Skip hosts missing:
   - `sub_controller_host`
   - `sub_controller_username`  
   - `sub_controller_password` OR `sub_controller_token`
3. **Process selected hosts** - Only configured sub controllers run
4. **Generate reports** - Use `ansible_play_hosts_all` for summaries

### **No Group Dependency** ✨

**This means**:
- ✅ You can add hosts directly to inventory without groups
- ✅ You can still use groups for organization if desired
- ✅ Playbooks work the same way either approach
- ✅ Mix and match - some hosts in groups, some not

**Example inventory scenarios that all work**:

**Scenario 1: No Groups** (Simple)
```
Inventory: CTF Sub Controllers
├── sub-controller-east (with variables)
├── sub-controller-west (with variables)
└── sub-controller-central (with variables)
```

**Scenario 2: With Groups** (Organized)
```
Inventory: CTF Sub Controllers
├── Group: sub_controllers
│   ├── sub-controller-east
│   ├── sub-controller-west
│   └── sub-controller-central
└── Group: regions
    ├── Group: east (contains sub-controller-east)
    └── Group: west (contains sub-controller-west)
```

**Scenario 3: Mixed** (Flexible)
```
Inventory: CTF Sub Controllers
├── sub-controller-legacy (no groups, has variables)
├── Group: new_controllers
│   ├── sub-controller-east
│   └── sub-controller-west
└── other-host (no sub_controller variables - ignored)
```

All three scenarios work identically with the same playbooks!

---

**Your AAP inventory is now ready for dynamic sub controller management!** 🎛️
