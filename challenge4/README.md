# Challenge 4: Inconsistent Messaging (20 Points)

## 🎯 Target Nodes
**ALL nodes** - node1, node2, and node3

## The Problem
The "Message of the Day" (`/etc/motd`) is inconsistent across servers, causing confusion:
- **node1**: Defaced by a bad actor
- **node2**: Outdated message
- **node3**: File is missing entirely

## Your Mission
Create a standardized MOTD using a Jinja2 template. The message must:
- Include the text "Welcome to" followed by the server's **actual hostname**
- Include the text "Managed by SRE Team" or "SRE Team"
- Be deployed to `/etc/motd` on **all three servers**
- Each server must display its **own unique hostname** (node1, node2, node3)

## Requirements
- Create a Jinja2 template file in a `templates/` directory
- Deploy to **all servers (node1, node2, node3)**
- Use Ansible facts to dynamically insert each server's hostname
- Ensure the message includes "SRE Team"

## Helpful Hints
- Ansible collects "facts" about each server automatically - these are variables containing system information
- The hostname is available as an Ansible fact
- Template files use Jinja2 syntax with double curly braces `{{ variable_name }}`
- Module to use: `ansible.builtin.template`
- Target hosts: Use `hosts: all` or `hosts: web` to target all nodes
- Create a template file: `templates/motd.j2`
- Destination: `/etc/motd`
- Check the [template module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/template_module.html)

## Playbook Template
Create your playbook as `challenge4/solution.yml` and template as `challenge4/templates/motd.j2`

```yaml
---
- name: Challenge 4 - Fix MOTD
  hosts: all  # Targets all nodes
  become: yes
  
  tasks:
    # Your task here
```

**Remember:** You also need to create `templates/motd.j2` with your template content!
