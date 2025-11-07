# Challenge 3: Rogue User Account (15 Points)

## 🎯 Target Nodes
**node1 and node3** - NOT node2

## The Problem
A rogue user account, `rogue_user`, was found on **node1 and node3**. This is a major security vulnerability that must be addressed immediately.

## Your Mission
Write a playbook that ensures the `rogue_user` user is completely removed from **node1 and node3**.

## Requirements
- Remove the user from **node1**
- Remove the user from **node3**
- User's home directory should be removed
- Handle cases where user may not exist (no failures)

## Helpful Hints
- Module to use: `ansible.builtin.user`
- State should be: `absent`
- Target hosts: Use `hosts: node1,node3` to target only these two nodes
- Use `remove: yes` to also delete home directory
- Check the [user module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/user_module.html)

## Playbook Template
Create your playbook as `challenge3/solution.yml`

```yaml
---
- name: Challenge 3 - Remove Rogue User
  hosts: node1,node3  # Targets only node1 and node3
  become: yes
  
  tasks:
    # Your task here
```
