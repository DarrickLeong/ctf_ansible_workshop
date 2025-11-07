# Challenge 1: Out of Sync (5 Points)

## 🎯 Target Nodes
**ALL nodes** - node1, node2, and node3

## The Problem
System clocks are drifting because the time synchronization service (`chronyd`) has been stopped across the environment. This is causing logging and authentication issues.

## Your Mission
Write a playbook that ensures the `chronyd` service is running and enabled on **all three nodes**.

## Requirements
- Service must be started on **node1, node2, and node3**
- Service must be enabled (starts on boot) on **all nodes**
- Must work on all hosts in inventory

## Helpful Hints
- Module to use: `ansible.builtin.service`
- Target hosts: Use `hosts: all` or `hosts: web` (the group containing all nodes)
- Check the [service module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)

## Playbook Template
Create your playbook as `challenge1/solution.yml`

```yaml
---
- name: Challenge 1 - Fix Time Sync
  hosts: all  # Targets all nodes
  become: yes
  
  tasks:
    # Your task here
```
