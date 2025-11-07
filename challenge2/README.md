# Challenge 2: Malicious Package (10 Points)

## 🎯 Target Nodes
**node2 ONLY** - database server

## The Problem
A compliance scan has detected an unauthorized package, `bind-utils`, installed on the database server (node2). Per security policy, database servers must not have DNS utility tools installed.

## Your Mission
Create a playbook that removes the `bind-utils` package from **node2 only**.

## Requirements
- Target only **node2** (NOT node1 or node3)
- Remove bind-utils package
- Ensure package is completely removed
- Other servers must not be affected

## Helpful Hints
- Module to use: `ansible.builtin.dnf` (or `ansible.builtin.yum`)
- State should be: `absent`
- Target hosts: Use `hosts: node2` to target only the database server
- Check the [dnf module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/dnf_module.html)

## Playbook Template
Create your playbook as `challenge2/solution.yml`

```yaml
---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2  # Targets only node2
  become: yes
  
  tasks:
    # Your task here
```
