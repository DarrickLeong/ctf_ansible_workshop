# Challenge 5: Firewall Anomaly (20 Points)

## 🎯 Target Nodes
**node3 ONLY** - backup web server

## The Problem
A backup web service is running on **node3**, but it's inaccessible because the firewall is blocking HTTP traffic. The `httpd` service is running, but external connections fail.

## Your Mission
Write a playbook that adds a **permanent** rule to the firewall on **node3** to allow traffic for the `http` service.

## Requirements
- Target only **node3** (NOT node1 or node2)
- Add firewall rule for http service
- Rule must be permanent (survives reboot)
- Firewall must be reloaded
- `firewalld` service must be running

## Helpful Hints
- Module to use: `ansible.posix.firewalld`
- Target hosts: Use `hosts: node3` to target only the backup web server
- Service: `http`
- State should be: `enabled`
- Make it permanent: `permanent: yes`
- Reload after: `immediate: yes`
- Check the [firewalld module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/posix/firewalld_module.html)

## Playbook Template
Create your playbook as `challenge5/solution.yml`

```yaml
---
- name: Challenge 5 - Fix Firewall
  hosts: node3  # Targets only node3
  become: yes
  
  tasks:
    # Your task here
```
