# Running CTF Job Templates on Specific Sub-Controllers from Central AAP

This guide explains how to execute CTF playbooks on specific sub-controllers using the Central AAP "Deploy CTF Playbooks to Sub Ansible Controllers" job template with survey forms.

---

## Method 1: Using Limit Parameter (Recommended)

### How It Works
The `deploy-to-sub-controllers.yml` playbook targets `hosts: all` from your inventory, then filters based on host variables. You can use AAP's built-in `limit` parameter to target specific controllers.

### Setup Steps

#### 1. Enable "Prompt on Launch" for Limit

In the Central AAP Job Template:

1. Go to **Resources** → **Templates**
2. Find **"Deploy CTF Playbooks to Sub Ansible Controllers"**
3. Click **Edit**
4. Scroll to **Options** section
5. Check ☑️ **"Prompt on launch"** for **Limit**
6. **Save**

#### 2. Run with Specific Controllers

When launching the job:

1. Click **Launch** on the job template
2. In the **Limit** field, enter one or more controllers:

**Examples:**
```
# Single controller
sub-controller-east

# Multiple controllers (comma-separated)
sub-controller-east,sub-controller-west

# Pattern matching
sub-controller-*

# Exclude controllers
all:!sub-controller-test
```

3. Click **Next** → **Launch**

---

## Method 2: Survey Form with Controller Selection

### How It Works
Create a survey question that allows selecting specific controllers from a dropdown or text input.

### Setup Steps

#### 1. Add Survey to Job Template

1. Go to **Resources** → **Templates**
2. Find **"Deploy CTF Playbooks to Sub Ansible Controllers"**
3. Click **Edit**
4. Click **Survey** tab
5. Click **Add**

#### 2. Survey Question Configuration

**Question Text:** `Select Target Controllers`

**Answer Variable Name:** `target_controllers`

**Answer Type:** `Multiple Choice (multiple select)` or `Text`

**Multiple Choice Options** (if using dropdown):
```
sub-controller-east
sub-controller-west
sub-controller-north
sub-controller-south
```

OR

**Answer Type:** `Text`  
**Default Answer:** `all`

**Required:** ☐ No (optional)

6. Click **Save**
7. **Save** the job template

#### 3. Update Playbook to Use Survey Variable

Add this to the beginning of `deploy-to-sub-controllers.yml`:

```yaml
---
- name: Deploy CTF Playbooks to Sub Ansible Controllers
  hosts: "{{ target_controllers | default('all') }}"  # Uses survey input
  gather_facts: no
  serial: 1
  vars:
    # ... existing vars ...
```

Or use it as a limit in pre_tasks:

```yaml
  pre_tasks:
    - name: Apply controller limit from survey
      meta: end_host
      when: 
        - target_controllers is defined
        - target_controllers != 'all'
        - inventory_hostname not in target_controllers.split(',')
```

---

## Method 3: Execute Job Templates on Sub-Controllers Directly

### Scenario
You've already deployed the CTF playbooks to sub-controllers. Now you want to **run a specific job template** (like "CTF Challenge Validator") on **specific sub-controllers** from the Central AAP.

### How It Works
Create a new playbook on Central AAP that launches job templates on selected sub-controllers.

### Implementation

#### 1. Create New Playbook: `execute-ctf-job-on-subs.yml`

```yaml
---
# Execute CTF Job Templates on Specific Sub-Controllers
# Run from Central AAP to trigger jobs on sub-controllers
# Requires: ansible-core >= 2.12, awx.awx collection

- name: Execute CTF Job on Selected Sub-Controllers
  hosts: "{{ target_controllers | default('all') }}"
  gather_facts: no
  vars:
    # Survey variables
    # job_template_name: Name of the job template to run (set by survey)
    # target_inventory: Inventory to use on sub-controller (set by survey)
    # target_credential: Credential to use on sub-controller (set by survey)
    # extra_variables: Extra vars to pass to job (optional, set by survey)
    
    # Connection to sub-controllers
    awx_host: "{{ sub_controller_host }}"
    awx_username: "{{ sub_controller_username }}"
    awx_password: "{{ sub_controller_password | default('') }}"
    awx_token: "{{ sub_controller_token | default('') }}"
    awx_validate_certs: "{{ sub_controller_validate_certs | default(false) }}"

  pre_tasks:
    - name: Skip hosts that are not sub controllers
      meta: end_host
      when: >
        sub_controller_host is not defined or
        sub_controller_username is not defined or
        (sub_controller_password is not defined and sub_controller_token is not defined)

  tasks:
    - name: Execute job template on sub-controller
      block:
        - name: Display execution target
          debug:
            msg: |
              ==========================================
              EXECUTING JOB ON SUB-CONTROLLER
              ==========================================
              Controller: {{ inventory_hostname }}
              Host: {{ awx_host }}
              Job Template: {{ job_template_name }}
              Inventory: {{ target_inventory }}
              ==========================================
        
        - name: Launch job template on sub-controller
          ansible.controller.job_launch:
            controller_host: "{{ awx_host }}"
            controller_username: "{{ awx_username }}"
            controller_password: "{{ awx_password }}"
            validate_certs: "{{ awx_validate_certs }}"
            job_template: "{{ job_template_name }}"
            inventory: "{{ target_inventory }}"
            credentials:
              - "{{ target_credential }}"
            extra_vars: "{{ extra_variables | default({}) }}"
            wait: true
            timeout: 600
          register: job_result
          delegate_to: localhost
        
        - name: Report job execution result
          debug:
            msg: |
              ✅ Job executed on {{ inventory_hostname }}:
              - Job ID: {{ job_result.id }}
              - Status: {{ job_result.status }}
              - Job URL: https://{{ awx_host }}/#/jobs/playbook/{{ job_result.id }}

      rescue:
        - name: Report job execution failure
          debug:
            msg: |
              ❌ Failed to execute job on {{ inventory_hostname }}:
              - Error: {{ ansible_failed_result.msg | default('Unknown error') }}

# Summary
- name: Execution Summary
  hosts: localhost
  connection: local
  gather_facts: no
  tasks:
    - name: Display final summary
      debug:
        msg: |
          ==========================================
          EXECUTION SUMMARY
          ==========================================
          Job Template: {{ job_template_name }}
          Inventory: {{ target_inventory }}
          
          RESULTS:
          {% for controller in ansible_play_hosts %}
          {% if hostvars[controller]['job_result'] is defined %}
          ✅ {{ controller }}: Job ID {{ hostvars[controller]['job_result']['id'] }} - {{ hostvars[controller]['job_result']['status'] }}
          {% else %}
          ❌ {{ controller }}: Failed or skipped
          {% endif %}
          {% endfor %}
          ==========================================
```

#### 2. Create Job Template in Central AAP

1. **Name:** `Execute CTF Job on Sub-Controllers`
2. **Job Type:** Run
3. **Inventory:** Your Central AAP Inventory (with sub-controller hosts)
4. **Project:** CTF Challenge Playbooks
5. **Playbook:** `central-controller/execute-ctf-job-on-subs.yml`
6. **Credentials:** Central AAP credential
7. **Options:**
   - ☑️ **Prompt on launch:** Limit
   - ☑️ **Enable Survey**

#### 3. Configure Survey

Add these survey questions:

**Question 1:**
- **Prompt:** Select Target Controllers
- **Answer Variable Name:** `target_controllers`
- **Answer Type:** Multiple Choice (multiple select)
- **Choices:**
  ```
  all
  sub-controller-east
  sub-controller-west
  sub-controller-north
  sub-controller-south
  ```
- **Default:** `all`

**Question 2:**
- **Prompt:** Job Template to Execute
- **Answer Variable Name:** `job_template_name`
- **Answer Type:** Multiple Choice (single select)
- **Choices:**
  ```
  CTF Challenge Validation
  CTF Environment Reset
  CTF Environment Setup
  CTF Connectivity Test
  ```
- **Default:** `CTF Challenge Validation`
- **Required:** Yes

**Question 3:**
- **Prompt:** Target Inventory on Sub-Controller
- **Answer Variable Name:** `target_inventory`
- **Answer Type:** Text
- **Default:** `Workshop Inventory`
- **Required:** Yes

**Question 4:**
- **Prompt:** Target Credential on Sub-Controller
- **Answer Variable Name:** `target_credential`
- **Answer Type:** Text
- **Default:** `Workshop Credential`
- **Required:** Yes

**Question 5:**
- **Prompt:** Extra Variables (JSON format)
- **Answer Variable Name:** `extra_variables`
- **Answer Type:** Textarea
- **Default:**
  ```json
  {
    "ctf_tracker_url": "http://ctf-tracker.apps.YOUR-CLUSTER.com",
    "attendee_name": "Team Name"
  }
  ```
- **Required:** No

---

## Method 4: Using Tags for Selective Execution

### How It Works
Add tags to different sections of the playbook and use `--tags` or `--skip-tags` to control execution.

### Implementation

Update `deploy-to-sub-controllers.yml` to add tags:

```yaml
  tasks:
    - name: Deploy CTF infrastructure to sub controller
      tags: ['deploy', 'setup']
      block:
        # ... existing deployment tasks ...

    - name: Run Environment Reset (if enabled)
      tags: ['reset', 'environment']
      block:
        # ... existing reset tasks ...

    - name: Run Environment Setup (if enabled)
      tags: ['setup', 'environment']
      block:
        # ... existing setup tasks ...
```

Then in the job template:
1. Enable **"Prompt on launch"** for **Job Tags**
2. When launching, specify tags:
   - `deploy` - Only deploy/update playbooks
   - `reset` - Only run environment reset
   - `setup` - Only run environment setup
   - `deploy,reset` - Deploy and reset
   - `all` - Run everything (default)

---

## Complete Example Workflow

### Scenario: Run CTF Challenge Validator on East and West Controllers

#### Step 1: Deploy Playbooks to All Controllers (One Time)
```
Job Template: Deploy CTF Playbooks to Sub Ansible Controllers
Limit: all
Survey: (fill in SCM URL, CTF Tracker URL)
Launch
```

#### Step 2: Execute Validator on Specific Controllers
```
Job Template: Execute CTF Job on Sub-Controllers
Limit: sub-controller-east,sub-controller-west
Survey:
  - Target Controllers: sub-controller-east, sub-controller-west
  - Job Template: CTF Challenge Validation
  - Inventory: Workshop Inventory
  - Credential: Workshop Credential
  - Extra Variables:
    {
      "ctf_tracker_url": "http://ctf-tracker.apps.cluster.com",
      "attendee_name": "East Team"
    }
Launch
```

---

## Quick Reference

### Limit Syntax Examples

| Limit Pattern | Effect |
|--------------|---------|
| `sub-controller-east` | Only east controller |
| `sub-controller-east,sub-controller-west` | East and west |
| `sub-controller-*` | All matching pattern |
| `all:!sub-controller-test` | All except test |
| `@inventories/east.txt` | From inventory file |

### Job Template Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `target_controllers` | Limit controllers | `sub-controller-east` |
| `job_template_name` | Template to execute | `CTF Challenge Validation` |
| `target_inventory` | Inventory on sub-controller | `Workshop Inventory` |
| `target_credential` | Credential on sub-controller | `Workshop Credential` |
| `extra_variables` | Pass to job | `{"ctf_tracker_url": "..."}` |

---

## Troubleshooting

### Issue: "No hosts matched the limit pattern"

**Cause:** The limit or target_controllers doesn't match any inventory hosts.

**Fix:**
1. Check inventory: `Resources → Inventories → Your Inventory → Hosts`
2. Verify host names match exactly
3. Use pattern: `sub-controller-*` to match multiple

### Issue: "Job template not found on sub-controller"

**Cause:** The job template doesn't exist on the target sub-controller.

**Fix:**
1. First run: **Deploy CTF Playbooks to Sub Ansible Controllers**
2. Then run: **Execute CTF Job on Sub-Controllers**

### Issue: "Authentication failed"

**Cause:** Sub-controller credentials are incorrect or expired.

**Fix:**
1. Update host vars in inventory with correct credentials
2. Check `sub_controller_password` or `sub_controller_token`

---

## Best Practices

1. **Always deploy playbooks first** before trying to execute them
2. **Use limit parameter** for ad-hoc single-controller runs
3. **Use survey forms** for regular operations with predefined options
4. **Test on one controller** before running on all
5. **Monitor job execution** in both Central and Sub-AAP
6. **Use tags** for partial playbook execution

---

## Files to Create

1. **`central-controller/execute-ctf-job-on-subs.yml`** - New playbook for remote execution
2. **Job Template** - "Execute CTF Job on Sub-Controllers" with survey
3. **Update** - `deploy-to-sub-controllers.yml` with `target_controllers` variable

---

**Need Help?**

See these guides for more details:
- `central-controller/README.md` - Central AAP setup
- `central-controller/AUTO_SETUP_GUIDE.md` - Automatic environment setup
- `CONTROLLER_REGISTRATION_GUIDE.md` - Sub-controller onboarding

