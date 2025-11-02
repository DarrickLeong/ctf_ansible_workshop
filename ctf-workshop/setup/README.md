# CTF Setup Playbooks

This directory contains setup and reset playbooks for the CTF Workshop environment.

## 📁 Files

- **`setup-all-challenges.yml`** - Creates problem scenarios for all challenges
- **`reset-environment.yml`** - Resets environment to clean state

## 🚀 Usage

### Before the Workshop

Run the setup playbook to create all challenge scenarios:

```bash
# Setup all challenges
ansible-playbook setup-all-challenges.yml -i inventory

# Setup specific challenge only
ansible-playbook setup-all-challenges.yml -i inventory --tags challenge1
```

### After the Workshop

Run the reset playbook to clean up:

```bash
# Reset all challenges
ansible-playbook reset-environment.yml -i inventory

# Reset specific challenge only
ansible-playbook reset-environment.yml -i inventory --tags challenge1
```

## 🎯 What Gets Set Up

### Challenge 1: Out of Sync
- Stops `chronyd` service on all nodes
- Disables chronyd from starting at boot

### Challenge 2: Malicious Package
- Installs `nginx` package on node2 (database server)

### Challenge 3: Rogue User Account
- Creates `rogue_user` account on node1 and node3
- Sets up home directory and shell

### Challenge 4: Inconsistent Messaging
- Creates defaced MOTD on node1 ("HACKED BY DISRUPTIVE DEZIGN!")
- Creates outdated MOTD on node2
- Removes MOTD file on node3

### Challenge 5: Firewall Anomaly
- Installs and starts httpd on node3
- Creates test web page
- Ensures firewalld is running
- Removes HTTP from allowed services

### Challenge 6: Phoenix Protocol
- Stops and removes httpd on node1
- Stops and removes mariadb on node2
- Removes web content and configurations

## 📋 Requirements

### Inventory File

Create an `inventory` file with your three RHEL servers:

```ini
[all]
node1 ansible_host=192.168.1.10
node2 ansible_host=192.168.1.11
node3 ansible_host=192.168.1.12

[webservers]
node1
node3

[databases]
node2

[all:vars]
ansible_user=rhel
ansible_become=yes
ansible_become_method=sudo
```

### Prerequisites

- Ansible 2.9+ installed
- SSH access to all nodes
- Sudo privileges on all nodes
- RHEL 8/9 on target nodes

## 🔍 Verification

After running setup, verify the scenarios:

```bash
# Verify Challenge 1 - chronyd stopped
ansible all -i inventory -m service_facts -a "" | grep chronyd

# Verify Challenge 2 - nginx installed on node2
ansible node2 -i inventory -m shell -a "rpm -qa | grep nginx"

# Verify Challenge 3 - rogue_user exists
ansible node1,node3 -i inventory -m command -a "id rogue_user"

# Verify Challenge 4 - MOTD inconsistent
ansible all -i inventory -m command -a "cat /etc/motd"

# Verify Challenge 5 - HTTP blocked
ansible node3 -i inventory -m command -a "firewall-cmd --list-services"

# Verify Challenge 6 - Services stopped
ansible node1 -i inventory -m command -a "systemctl status httpd" -b
ansible node2 -i inventory -m command -a "systemctl status mariadb" -b
```

## 🎓 Tips

- Run setup playbook before each workshop session
- Use tags to set up/reset individual challenges
- Test the setup by running solution playbooks
- Keep the reset playbook handy for quick cleanup

---

**Ready to create chaos! 🔥**

