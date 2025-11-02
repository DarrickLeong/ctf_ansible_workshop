# CTF Workshop - Challenges and Scoring Guide

This document contains all challenges, scoring information, and available resources for the Ansible Automation Platform CTF Workshop.

---

## 📋 Available Resources

### Infrastructure
- **Ansible Automation Platform** - Central automation controller
- **3 RHEL Servers** - Target systems for challenges
  - `node1` - Primary Web Server
  - `node2` - Database Server
  - `node3` - Secondary Web Server / Utility

---

## 🎯 Scoring System

| Challenge | Points | Type |
|-----------|--------|------|
| Challenge 1: Out of Sync | 5 | Basic Service Management |
| Challenge 2: Malicious Package | 10 | Package Management |
| Challenge 3: Rogue User Account | 15 | User Management |
| Challenge 4: Inconsistent Messaging | 20 | Templates & Facts |
| Challenge 5: Firewall Anomaly | 20 | Firewall Configuration |
| Challenge 6: Phoenix Protocol | 30 | Workflow Orchestration |
| **Extra Credit** | +10 | Workflow Approvals |
| **Total Possible** | **100 (+10)** | |

---

## 🚀 Challenge Details

### Challenge 1: Out of Sync (5 Points)

**Difficulty**: ⭐ Beginner

**The Problem**: 
System clocks are drifting because the time synchronization service (`chronyd`) has been stopped across the environment. This is causing logging and authentication issues.

**The Mission**: 
Write a single playbook to ensure the `chronyd` service is running and enabled on all servers.

**Learning Goal**: 
Learn to use the `ansible.builtin.service` module to manage system services.

**Required Skills**:
- Service module usage
- State management (started, enabled)
- Applying configuration to all hosts

**Success Criteria**:
- ✅ `chronyd` service is running on all three nodes
- ✅ `chronyd` service is enabled to start at boot
- ✅ Playbook is idempotent (can run multiple times safely)

---

### Challenge 2: Malicious Package (10 Points)

**Difficulty**: ⭐⭐ Beginner+

**The Problem**: 
A compliance scan has detected an unauthorized package, `bind-utils`, installed on the database server (`node2`). Per security policy, database servers must not have DNS utility tools installed. These tools need to be removed immediately.

**The Mission**: 
Create a playbook that removes the `bind-utils` package from `node2`.

**Learning Goal**: 
Understand how to manage software packages using the `ansible.builtin.dnf` module.

**Required Skills**:
- Package management
- State management (absent)
- Host targeting (specific host)

**Success Criteria**:
- ✅ `bind-utils` package is removed from `node2`
- ✅ `bind-utils` is not removed from other nodes (selective targeting)
- ✅ Playbook handles cases where package doesn't exist

---

### Challenge 3: Rogue User Account (15 Points)

**Difficulty**: ⭐⭐ Intermediate

**The Problem**: 
A rogue user account, `rogue_user`, was found on `node1` and `node3`. This is a major security vulnerability.

**The Mission**: 
Write a playbook that ensures the `rogue_user` user is completely removed from any server where it exists.

**Learning Goal**: 
Master user account management with the `ansible.builtin.user` module and learn how to handle tasks that may not apply to every host in a play.

**Required Skills**:
- User management
- State management (absent)
- Error handling (ignore_errors or failed_when)
- Multiple host targeting

**Success Criteria**:
- ✅ `rogue_user` is removed from `node1`
- ✅ `rogue_user` is removed from `node3`
- ✅ Playbook doesn't fail if user doesn't exist
- ✅ User's home directory is also removed

---

### Challenge 4: Inconsistent Messaging (20 Points)

**Difficulty**: ⭐⭐⭐ Intermediate+

**The Problem**: 
The "Message of the Day" (`/etc/motd`) is inconsistent across servers, causing confusion. Some were even defaced by "Disruptive Dezign".

**The Mission**: 
Create a standardized MOTD using a template. The message should be:
```
Welcome to {{ ansible_hostname }} - Managed by SRE Team
```
Deploy this template to all three servers.

**Learning Goal**: 
Learn to use the `ansible.builtin.template` module and Ansible facts (`ansible_hostname`) to deploy custom configuration files.

**Required Skills**:
- Template creation
- Ansible facts/variables
- File deployment
- Jinja2 templating basics

**Success Criteria**:
- ✅ Template file created with proper Jinja2 syntax
- ✅ MOTD deployed to all three nodes
- ✅ Each server shows its own hostname in the message
- ✅ File permissions are preserved (0644)

**Hint**: Create a `templates/motd.j2` file in your playbook directory.

---

### Challenge 5: Firewall Anomaly (20 Points)

**Difficulty**: ⭐⭐⭐ Intermediate+

**The Problem**: 
A backup web service is running on `node3`, but it's inaccessible because the firewall is blocking HTTP traffic.

**The Mission**: 
Write a playbook that adds a permanent rule to the firewall on `node3` to allow traffic for the `http` service.

**Learning Goal**: 
Practice managing firewall rules with the `ansible.posix.firewalld` module, a critical skill for securing servers.

**Required Skills**:
- Firewall management
- Service-based rules
- Permanent configuration
- Collections usage (`ansible.posix`)

**Success Criteria**:
- ✅ HTTP traffic is allowed through `firewalld` on `node3`
- ✅ Rule is permanent (survives reboot)
- ✅ Firewall service is running
- ✅ Rule is applied to the correct zone

**Prerequisites**: 
```bash
# Ensure the ansible.posix collection is installed
ansible-galaxy collection install ansible.posix
```

---

### Challenge 6: The Phoenix Protocol (30 Points + 10 Extra Credit)

**Difficulty**: ⭐⭐⭐⭐⭐ Advanced - Full Stack Disaster Recovery!

**The Disaster**: 
The application stack is not working. The web server (`node1`) and the database server (`node2`) are both offline. Packages are missing, services are stopped, and configurations are lost.

**The Mission**: 
You must orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow, ensuring services are brought up and rolled back in the correct order.

#### Part 1: Create Playbooks (30 Points)

Create **six separate playbooks**:

1. **`provision-database.yml`** - Provision Database Server
   - Install required database packages (postgresql-server, postgresql)
   - Initialize PostgreSQL database
   - Start and enable postgresql service
   - Configure basic database settings

2. **`provision-webserver.yml`** - Provision Web Server
   - Install required web packages (httpd)
   - Start and enable httpd service
   - Configure basic web server settings

3. **`deploy-application.yml`** - Deploy Application
   - Deploy application files
   - Configure application to connect to database
   - Set proper permissions

4. **`validate-service.yml`** - Validate Service
   - Check if web server is responding (HTTP 200)
   - Check if database is accepting connections (port 5432)
   - Verify application endpoints are working
   - **Fail the playbook if any check fails** (to trigger rollback)

5. **`rollback-webserver.yml`** - Rollback Web Server
   - Stop httpd service
   - Remove application files
   - Clean up configurations

6. **`rollback-database.yml`** - Rollback Database
   - Stop postgresql service
   - Clean up database configurations

#### Part 2: Create AAP Job Templates

In Ansible Automation Platform, create **six separate Job Templates**:

1. **Provision Database** - Points to `provision-database.yml`
2. **Provision Web Server** - Points to `provision-webserver.yml`
3. **Deploy Application** - Points to `deploy-application.yml`
4. **Validate Service** - Points to `validate-service.yml`
5. **Rollback Web Server** - Points to `rollback-webserver.yml`
6. **Rollback Database** - Points to `rollback-database.yml`

#### Part 3: Create Workflow Template

Create a **new Workflow Template** that links the Job Templates together:

**Success Path** (Correct Dependency Order):
```
START → Provision DB → Provision Web → Deploy App → Validate → END
```

**Failure Path** (Reverse Rollback Order):
```
Validate [FAIL] → Rollback Web → Rollback DB → END
```

**Workflow Configuration**:
- Name: `Full Stack Disaster Recovery`
- Each node should have:
  - **On Success**: Continue to next step in chain
  - **On Failure**: Skip or go to rollback (depending on step)
- Validate node should have:
  - **On Success**: End workflow
  - **On Failure**: Start rollback chain

#### Part 4: Launch and Verify

1. Launch the workflow
2. Watch the full application stack rise from the ashes
3. Verify all services are running
4. Test the application endpoints

**Learning Goals**:
- Master creation of multi-tier AAP workflows with dependent steps
- Understand ordered recovery procedures
- Implement proper rollback mechanisms
- Handle failure scenarios gracefully

**Success Criteria**:
- ✅ All six playbooks created and functional
- ✅ All six job templates created in AAP
- ✅ Workflow template created with proper dependencies
- ✅ Success path provisions all services correctly
- ✅ Failure path triggers proper rollback sequence
- ✅ Application stack is fully functional after workflow completes

---

### Extra Credit: The "Go/No-Go" Approval Gate (10 Points)

**Difficulty**: ⭐⭐⭐⭐ Advanced

**The Use Case**: 
A full disaster recovery is a major event. Your manager wants a final "Go/No-Go" checkpoint before the workflow actually starts modifying servers.

**The Mission**: 
Add a manual approval gate to your workflow.

#### Steps:

1. **Edit Your Workflow Template**
   - Open the Workflow Template editor
   - Add a new **Workflow Approval** node

2. **Reconfigure Workflow Flow**
   - Delete the original link from `START` to `Provision DB`
   - Drag the `START` node to point to the new `Approval` node
   - Configure the `Approval` node's **On Approve** path to link to `Provision DB`

3. **Configure Approval Node**
   - Name: `Manager Go/No-Go Approval`
   - Description: `Final checkpoint before disaster recovery begins`
   - Timeout: 60 minutes (or as needed)

4. **Test the Approval Workflow**
   - Save and launch the workflow
   - Go to **Jobs** view
   - You will see the workflow is "Pending" and waiting for approval
   - Click the workflow job
   - Click the **Approve** button to allow the disaster recovery to proceed
   - Watch the workflow continue execution

**Visual Workflow**:
```
START → [APPROVAL GATE] → Provision DB → Provision Web → Deploy App → Validate → END
                                                                             ↓ [FAIL]
                                                              Rollback Web → Rollback DB → END
```

**Learning Goals**:
- Use Workflow Approvals to create manual gates
- Implement human decision points in automation
- Safely manage critical infrastructure changes
- Understand approval timeouts and notifications

**Success Criteria**:
- ✅ Approval node added to workflow
- ✅ Workflow flow reconfigured correctly
- ✅ Workflow pauses at approval gate
- ✅ Approval interface is accessible
- ✅ Workflow continues after approval
- ✅ All subsequent steps execute successfully

---

## 📚 Helpful Resources

### Ansible Module Documentation

- **Service Management**: `ansible.builtin.service`
- **Package Management**: `ansible.builtin.dnf` / `ansible.builtin.yum`
- **User Management**: `ansible.builtin.user`
- **Template Management**: `ansible.builtin.template`
- **Firewall Management**: `ansible.posix.firewalld`

### AAP Workflow Resources

- **Job Templates**: Create reusable automation units
- **Workflow Templates**: Chain job templates with dependencies
- **Workflow Approvals**: Add manual gates to workflows
- **Notifications**: Alert on success/failure

### Best Practices

1. **Idempotency**: Playbooks should be safe to run multiple times
2. **Error Handling**: Use `failed_when`, `ignore_errors`, and `block/rescue`
3. **Variables**: Use variables for reusability
4. **Documentation**: Comment your playbooks
5. **Testing**: Test on non-production systems first

---

## 🎓 Tips for Success

### General Tips
- Read the challenge description carefully
- Test your playbooks before submitting
- Use `--check` mode to preview changes
- Check syntax with `ansible-playbook --syntax-check`

### Challenge-Specific Tips

**Challenge 1**: Remember both `state` and `enabled` parameters

**Challenge 2**: Target specific hosts using `hosts:` parameter

**Challenge 3**: Use `state: absent` and `remove: yes` for complete cleanup

**Challenge 4**: Template files use `.j2` extension and go in `templates/` directory

**Challenge 5**: Ensure the `ansible.posix` collection is installed

**Challenge 6**: 
- Start with simple playbooks and test each one
- Build the workflow step by step
- Test the success path first
- Then test the failure path by intentionally breaking validation
- Use the workflow visualizer to verify dependencies

**Extra Credit**:
- Approval nodes are found in the node type palette
- Remember to save after reconfiguring the workflow
- Test the timeout by not approving immediately

---

## 🏆 Scoring and Completion

### Points Distribution
- Challenges 1-2 (15 points): Foundation skills
- Challenges 3-5 (55 points): Intermediate automation
- Challenge 6 (30 points): Advanced orchestration
- Extra Credit (10 points): Professional workflows

### Verification

Each challenge should report results back to the CTF Tracker automatically. You can verify your progress at:
```
http://ctf-tracker.apps.YOUR-CLUSTER.com
```

### Time Expectations
- Challenge 1: ~10 minutes
- Challenge 2: ~15 minutes
- Challenge 3: ~20 minutes
- Challenge 4: ~30 minutes
- Challenge 5: ~30 minutes
- Challenge 6: ~60-90 minutes
- Extra Credit: ~15 minutes

**Total Estimated Time**: 2.5 - 3.5 hours

---

## 📝 Challenge Submission

### Automatic Submission
When you run playbooks via AAP Job Templates with the CTF integration configured, your results are automatically submitted to the CTF Tracker.

### Manual Verification
If needed, you can verify challenge completion manually:
```bash
# Check service status
ansible all -m service -a "name=chronyd state=started"

# Check package status
ansible node2 -m dnf -a "name=bind-utils state=present" --check

# Check user status
ansible all -m command -a "id rogue_user"

# Check file content
ansible all -m command -a "cat /etc/motd"

# Check firewall rules
ansible node3 -m command -a "firewall-cmd --list-services"
```

---

**Good luck, and may the automation be with you!** 🚀

---

*Last Updated: 2025-11-02*
*Version: 1.0*

