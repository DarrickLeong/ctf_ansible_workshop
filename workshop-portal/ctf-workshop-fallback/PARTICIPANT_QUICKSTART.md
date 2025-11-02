# 🎯 CTF Workshop - Participant Quickstart Guide

Welcome to the Ansible Automation Platform CTF Workshop! This guide will help you get started quickly.

## 📋 What You'll Need

Before starting, ensure you have:
- ✅ Access to Ansible Automation Platform (AAP)
- ✅ Credentials for 3 RHEL servers (node1, node2, node3)
- ✅ CTF Tracker URL: `http://ctf-tracker.apps.YOUR-CLUSTER.com`
- ✅ Your team/attendee name
- ✅ This challenges document: [CHALLENGES.md](../CHALLENGES.md)

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Log into AAP

1. Open your browser and navigate to your AAP URL
2. Log in with your provided credentials
3. Familiarize yourself with the interface

### Step 2: Verify Your Inventory

1. Go to **Resources** → **Inventories**
2. Find your assigned inventory (e.g., "CTF Team 1")
3. Click on it and verify you see three hosts:
   - `node1` (Primary Web Server)
   - `node2` (Database Server)
   - `node3` (Secondary Web Server)

### Step 3: Check the CTF Tracker

1. Open the CTF Tracker URL in a new tab
2. You should see the dashboard with:
   - Leaderboard (currently empty)
   - Statistics
   - Challenge list
3. Bookmark this page - you'll check it often!

---

## 📖 Understanding the Challenges

### Challenge Breakdown

| Challenge | Points | Difficulty | Time Est. | Key Skills |
|-----------|--------|------------|-----------|------------|
| 1: Out of Sync | 5 | ⭐ Easy | 10 min | Service management |
| 2: Malicious Package | 10 | ⭐⭐ Easy+ | 15 min | Package management |
| 3: Rogue User Account | 15 | ⭐⭐ Medium | 20 min | User management |
| 4: Inconsistent Messaging | 20 | ⭐⭐⭐ Medium+ | 30 min | Templates & Facts |
| 5: Firewall Anomaly | 20 | ⭐⭐⭐ Medium+ | 30 min | Firewall rules |
| 6: Phoenix Protocol | 30 | ⭐⭐⭐⭐⭐ Hard | 90 min | AAP Workflows |
| Extra Credit | +10 | ⭐⭐⭐⭐ Advanced | 15 min | Approvals |

**Total**: 100 points (+10 extra credit)

---

## 🎮 How to Complete Challenges

### Method 1: Using AAP Job Templates (Recommended)

1. Go to **Resources** → **Templates**
2. Click **Add** → **Add job template**
3. Fill in the details:
   - **Name**: "Challenge 1 Solution"
   - **Inventory**: Your team inventory
   - **Project**: Your Git project
   - **Playbook**: Select your playbook file
   - **Credentials**: RHEL machine credentials
4. Add survey variables (if needed):
   - `ctf_tracker_url`: Your tracker URL
   - `attendee_name`: Your team name
5. **Save** and **Launch**!

### Method 2: Using ansible-playbook (CLI)

```bash
ansible-playbook challenge1-solution.yml \
  -i inventory \
  -e "ctf_tracker_url=http://ctf-tracker.apps.YOUR-CLUSTER.com" \
  -e "attendee_name='Your Team Name'"
```

---

## 📝 Writing Your First Playbook

### Challenge 1 Template

Here's a starter template for Challenge 1:

```yaml
---
- name: Challenge 1 - Fix Time Synchronization
  hosts: all
  become: yes
  
  tasks:
    # Your tasks here
    - name: Ensure chronyd service is started
      ansible.builtin.service:
        name: chronyd
        state: ???  # Fill this in!
        enabled: ???  # Fill this in!
```

### Key Ansible Modules You'll Use

#### Service Management
```yaml
- name: Manage a service
  ansible.builtin.service:
    name: servicename
    state: started  # or stopped
    enabled: yes  # or no
```

#### Package Management
```yaml
- name: Remove a package
  ansible.builtin.dnf:
    name: packagename
    state: absent  # or present
```

#### User Management
```yaml
- name: Remove a user
  ansible.builtin.user:
    name: username
    state: absent
    remove: yes  # Remove home directory
```

#### Template Deployment
```yaml
- name: Deploy template
  ansible.builtin.template:
    src: templates/file.j2
    dest: /path/to/destination
    mode: '0644'
```

#### Firewall Management
```yaml
- name: Manage firewall
  ansible.posix.firewalld:
    service: http
    permanent: yes
    state: enabled
    immediate: yes
```

---

## 🎯 CTF Tracker Integration

### Automatic Reporting

Your playbooks can automatically report results to the CTF Tracker:

```yaml
- name: Report to CTF Tracker
  ansible.builtin.uri:
    url: "{{ ctf_tracker_url }}/api/challenge_results"
    method: POST
    body_format: json
    body:
      attendee_name: "{{ attendee_name }}"
      hostname: "{{ inventory_hostname }}"
      challenge_results:
        challenge_1:
          completed: true
          points_earned: 5
          max_points: 5
    validate_certs: no
  ignore_errors: yes
```

### Checking Your Score

1. Go to the CTF Tracker dashboard
2. Find your team in the leaderboard
3. Your points update in real-time!

---

## 🏆 Challenge Strategy

### Recommended Order

1. **Start with Challenge 1** - It's the easiest and builds confidence
2. **Do Challenge 2 next** - Similar difficulty, different module
3. **Try Challenge 3** - Introduces error handling
4. **Move to Challenge 4** - Introduces templates
5. **Tackle Challenge 5** - Most complex standalone challenge
6. **Save Challenge 6 for last** - Requires AAP workflow knowledge
7. **Extra Credit** - Only after Challenge 6 is working

### Time Management

- **First 30 minutes**: Complete Challenges 1-2
- **Next hour**: Complete Challenges 3-4
- **Next hour**: Complete Challenge 5
- **Final 90 minutes**: Challenge 6 and Extra Credit

---

## 💡 Tips & Tricks

### General Tips
1. **Read carefully** - Each challenge description contains hints
2. **Test incrementally** - Run playbooks often to catch errors early
3. **Use check mode** - `--check` flag to preview changes
4. **Check syntax** - `ansible-playbook --syntax-check playbook.yml`
5. **Read the output** - Ansible tells you what went wrong

### AAP-Specific Tips
1. **Use Projects** - Store your playbooks in Git
2. **Use Surveys** - Collect variables at runtime
3. **Check Logs** - Job output shows everything Ansible does
4. **Save Often** - Save job templates as you configure them

### Challenge-Specific Hints

**Challenge 1**: You need TWO parameters: `state` and `enabled`

**Challenge 2**: Use `hosts: node2` to target only the database server

**Challenge 3**: Use `ignore_errors: yes` to handle missing users

**Challenge 4**: Template files go in a `templates/` directory with `.j2` extension

**Challenge 5**: Run `ansible-galaxy collection install ansible.posix` first

**Challenge 6**: Draw the workflow on paper before building it in AAP

---

## 🐛 Troubleshooting

### Common Errors

#### "Module not found: ansible.posix.firewalld"
```bash
Solution: ansible-galaxy collection install ansible.posix
```

#### "Template not found: templates/motd.j2"
```
Solution: Create the templates/ directory in your playbook location
         and create the motd.j2 file there
```

#### "Permission denied"
```
Solution: Add `become: yes` to your play or task
```

#### "No hosts matched"
```
Solution: Check your inventory file and the `hosts:` parameter
```

### Getting Help

1. **Check the challenge description** - It contains hints
2. **Read Ansible error messages** - They're usually helpful
3. **Check AAP job output** - Full logs are available
4. **Ask the instructor** - We're here to help!
5. **Collaborate** - Work with your team!

---

## 📚 Quick Reference

### File Structure

```
your-playbook-directory/
├── inventory               # Your hosts file
├── challenge1-solution.yml
├── challenge2-solution.yml
├── challenge3-solution.yml
├── challenge4-solution.yml
├── challenge5-solution.yml
├── templates/
│   └── motd.j2            # For Challenge 4
└── challenge6/
    ├── provision-database.yml
    ├── provision-webserver.yml
    ├── deploy-application.yml
    ├── validate-service.yml
    ├── rollback-webserver.yml
    └── rollback-database.yml
```

### Essential Commands

```bash
# Test playbook syntax
ansible-playbook playbook.yml --syntax-check

# Run in check mode (dry run)
ansible-playbook playbook.yml --check

# Run playbook
ansible-playbook playbook.yml -i inventory

# Run with extra variables
ansible-playbook playbook.yml -e "var1=value1 var2=value2"

# Limit to specific hosts
ansible-playbook playbook.yml --limit node1

# Show verbose output
ansible-playbook playbook.yml -v
ansible-playbook playbook.yml -vvv  # Very verbose
```

### Useful Ansible Modules

- `ansible.builtin.service` - Manage services
- `ansible.builtin.dnf` / `ansible.builtin.yum` - Manage packages
- `ansible.builtin.user` - Manage users
- `ansible.builtin.template` - Deploy template files
- `ansible.builtin.copy` - Copy files
- `ansible.builtin.file` - Manage files/directories
- `ansible.posix.firewalld` - Manage firewall
- `ansible.builtin.uri` - Make HTTP requests
- `ansible.builtin.debug` - Print messages
- `ansible.builtin.assert` - Verify conditions

---

## 🎉 Success Indicators

You'll know you're succeeding when:

✅ Your playbooks run without errors
✅ Tasks show "changed" or "ok" status
✅ The CTF Tracker shows your points
✅ Your team moves up the leaderboard
✅ The validation checks in each challenge pass

---

## 🏁 Ready to Start?

1. ✅ Read the [CHALLENGES.md](../CHALLENGES.md) file
2. ✅ Log into AAP
3. ✅ Check your inventory
4. ✅ Create your first playbook
5. ✅ Run Challenge 1
6. ✅ Watch your score increase!

---

**Good luck, and may the automation be with you!** 🚀

---

## 📞 Need Help?

- **Instructor**: Ask for assistance
- **Documentation**: https://docs.ansible.com
- **AAP Docs**: https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/
- **CTF Tracker**: Check your dashboard for real-time updates

---

*Version 1.0 - Updated: 2025-11-02*

