# CTF Workshop - Solution Playbooks

This directory contains complete solution playbooks for all CTF challenges. These are provided for instructors and for participants after completing the workshop.

⚠️ **FOR INSTRUCTORS ONLY** - Do not share with participants until after the workshop!

## 📁 Solution Files

### Basic Challenges
- **`challenge1-solution.yml`** - Out of Sync (5 points)
- **`challenge2-solution.yml`** - Malicious Package (10 points)
- **`challenge3-solution.yml`** - Rogue User Account (15 points)
- **`challenge4-solution.yml`** - Inconsistent Messaging (20 points)
  - Requires: `templates/motd.j2`
- **`challenge5-solution.yml`** - Firewall Anomaly (20 points)

### Advanced Challenge (Workflow)
- **`challenge6-provision-database.yml`** - Part 1: Provision DB
- **`challenge6-provision-webserver.yml`** - Part 2: Provision Web
- **`challenge6-deploy-application.yml`** - Part 3: Deploy App
- **`challenge6-validate-service.yml`** - Part 4: Validate
- **`challenge6-rollback-webserver.yml`** - Part 5: Rollback Web
- **`challenge6-rollback-database.yml`** - Part 6: Rollback DB

## 🚀 Usage

### Running Individual Solutions

```bash
# Challenge 1 - Service Management
ansible-playbook challenge1-solution.yml -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Instructor Demo'"

# Challenge 2 - Package Management
ansible-playbook challenge2-solution.yml -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Instructor Demo'"

# Challenge 3 - User Management
ansible-playbook challenge3-solution.yml -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Instructor Demo'"

# Challenge 4 - Template Management
ansible-playbook challenge4-solution.yml -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Instructor Demo'"

# Challenge 5 - Firewall Management
ansible-playbook challenge5-solution.yml -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Instructor Demo'"
```

### Challenge 6 - Workflow Setup in AAP

Challenge 6 requires setting up a workflow in Ansible Automation Platform:

#### Step 1: Create Job Templates

Create six job templates in AAP:

1. **Provision Database**
   - Playbook: `challenge6-provision-database.yml`
   - Inventory: Your RHEL inventory
   - Limit: `node2`

2. **Provision Web Server**
   - Playbook: `challenge6-provision-webserver.yml`
   - Inventory: Your RHEL inventory
   - Limit: `node1`

3. **Deploy Application**
   - Playbook: `challenge6-deploy-application.yml`
   - Inventory: Your RHEL inventory
   - Limit: `node1`

4. **Validate Service**
   - Playbook: `challenge6-validate-service.yml`
   - Inventory: Your RHEL inventory
   - Extra vars: `ctf_tracker_url`, `attendee_name`

5. **Rollback Web Server**
   - Playbook: `challenge6-rollback-webserver.yml`
   - Inventory: Your RHEL inventory
   - Limit: `node1`

6. **Rollback Database**
   - Playbook: `challenge6-rollback-database.yml`
   - Inventory: Your RHEL inventory
   - Limit: `node2`

#### Step 2: Create Workflow Template

1. Create new Workflow Template: "Phoenix Protocol"
2. Add nodes in this order:

**Success Path:**
```
START → Provision DB → Provision Web → Deploy App → Validate → SUCCESS
```

**Failure Path:**
```
Validate [ON FAILURE] → Rollback Web → Rollback DB → END
```

#### Step 3: Configure Node Connections

- **Provision DB** → On Success → **Provision Web**
- **Provision Web** → On Success → **Deploy App**
- **Deploy App** → On Success → **Validate**
- **Validate** → On Success → **END**
- **Validate** → On Failure → **Rollback Web**
- **Rollback Web** → Always → **Rollback DB**
- **Rollback DB** → Always → **END**

#### Extra Credit: Add Approval Gate

1. Add **Workflow Approval** node
2. Connect **START** → **Approval** → **Provision DB**
3. Configure approval timeout: 60 minutes

## 📊 Solution Key Points

### Challenge 1 (5 Points)
**Key Module**: `ansible.builtin.service`
```yaml
- name: Ensure chronyd is running
  ansible.builtin.service:
    name: chronyd
    state: started
    enabled: yes
```

### Challenge 2 (10 Points)
**Key Module**: `ansible.builtin.dnf`
```yaml
- name: Remove nginx
  ansible.builtin.dnf:
    name: nginx
    state: absent
```
**Important**: Use `hosts: node2` to target specific host

### Challenge 3 (15 Points)
**Key Module**: `ansible.builtin.user`
```yaml
- name: Remove rogue_user
  ansible.builtin.user:
    name: rogue_user
    state: absent
    remove: yes
    force: yes
```
**Important**: Use `ignore_errors: yes` to handle missing users

### Challenge 4 (20 Points)
**Key Module**: `ansible.builtin.template`
```yaml
- name: Deploy MOTD
  ansible.builtin.template:
    src: templates/motd.j2
    dest: /etc/motd
    mode: '0644'
```
**Template Content**: `Welcome to {{ ansible_hostname }} - Managed by SRE Team`

### Challenge 5 (20 Points)
**Key Module**: `ansible.posix.firewalld`
```yaml
- name: Allow HTTP
  ansible.posix.firewalld:
    service: http
    permanent: yes
    state: enabled
    immediate: yes
```
**Prerequisites**: `ansible-galaxy collection install ansible.posix`

### Challenge 6 (30 Points + 10 Extra)
**Key Concept**: Workflow orchestration with dependencies and rollbacks
- 6 separate playbooks
- 6 job templates
- 1 workflow template
- Success and failure paths
- Optional approval gate

## 🎓 Teaching Points

### Challenge 1
- Service module basics
- State vs enabled parameters
- Idempotency concept

### Challenge 2
- Package management
- Host targeting
- Selective application

### Challenge 3
- User management
- Error handling with ignore_errors
- Complete cleanup with remove parameter

### Challenge 4
- Template creation and deployment
- Ansible facts usage
- File permissions

### Challenge 5
- Firewall management
- Collection usage
- Permanent vs immediate rules

### Challenge 6
- Workflow design
- Dependency ordering
- Rollback strategies
- Manual approval gates
- Multi-tier application recovery

## 🔍 Verification

After running solutions, verify with:

```bash
# Challenge 1
ansible all -i inventory -m service_facts | grep chronyd

# Challenge 2
ansible node2 -i inventory -m shell -a "rpm -qa | grep nginx"

# Challenge 3
ansible node1,node3 -i inventory -m command -a "id rogue_user" || echo "User removed"

# Challenge 4
ansible all -i inventory -m command -a "cat /etc/motd"

# Challenge 5
ansible node3 -i inventory -m command -a "firewall-cmd --list-services" -b

# Challenge 6
curl http://node1-ip/  # Should show Phoenix Protocol page
mysql -h node2-ip -e "SHOW DATABASES;" # Should show ctf_app
```

## 📝 Notes for Instructors

1. **Setup First**: Run `ctf-setup/setup-all-challenges.yml` before workshop
2. **Test Solutions**: Verify all solutions work in your environment
3. **CTF Tracker**: Ensure tracker URL is correct in all playbooks
4. **Collections**: Ensure `ansible.posix` is installed on AAP
5. **Permissions**: Participants need proper AAP permissions
6. **Inventory**: Ensure inventory has proper variables set
7. **Network**: Verify connectivity between AAP and nodes

## 🚨 Common Issues

### Collection Not Found
```bash
# On AAP or execution environment
ansible-galaxy collection install ansible.posix
ansible-galaxy collection install community.mysql
```

### Template Not Found
- Ensure `templates/motd.j2` exists in playbook directory
- Check file path is relative to playbook

### Firewall Module Fails
- Verify firewalld service is running
- Check `ansible.posix` collection is installed
- Ensure become/sudo is configured

### Workflow Connections
- Draw workflow on paper first
- Test success path before adding failure path
- Remember to connect failure paths from Validate node

## 📚 Additional Resources

- [Ansible Service Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)
- [Ansible Package Modules](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/dnf_module.html)
- [Ansible User Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/user_module.html)
- [Ansible Template Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/template_module.html)
- [Ansible Firewalld Module](https://docs.ansible.com/ansible/latest/collections/ansible/posix/firewalld_module.html)
- [AAP Workflows](https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/)

---

**These solutions should only be shared after the workshop is complete!** 🔒

