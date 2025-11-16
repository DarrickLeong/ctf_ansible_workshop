# Custom Execution Environment Guide

## Overview

Challenge 6 requires the `community.general` collection with the `seport` module to manage SELinux port contexts. Due to Python 3.6 compatibility requirements on RHEL 8 managed nodes, we need a custom Execution Environment (EE) with an older version of the collection.

## Problem

- RHEL 8 managed nodes use **Python 3.6**
- `community.general` >= 6.0.0 requires **Python 3.7+** (uses `from __future__ import annotations`)
- The `community.general.seport` module fails on Python 3.6 with `SyntaxError: future feature annotations is not defined`

## Solution

Use `community.general` version **5.8.3** (last release compatible with Python 3.6) in a custom EE.

---

## Custom EE Configuration

The deployment playbook (`deploy-to-sub-controllers.yml`) automatically creates the custom EE on all sub-controllers.

### EE Details

```yaml
Name: ansible-common-ee
Image: quay.io/dleong/ansible-common-ee:2.0
Description: Custom EE with community.general 5.8.3 for Challenge 6 SELinux management
Pull Policy: missing
```

### What's Included

- **Ansible Core**: 2.15+
- **Collections**:
  - `community.general`: 5.8.3 (Python 3.6 compatible)
  - `ansible.posix`: latest
  - `awx.awx`: latest (for AAP API interactions)
- **Python Packages**:
  - `psycopg2-binary`: For PostgreSQL operations
  - `requests`: For HTTP API calls

---

## Job Templates Using Custom EE

The following job templates are automatically configured to use the custom EE:

1. **challenge6-provision-database**
   - Playbook: `ctf-workshop/solutions/challenge6-provision-database.yml`
   - Purpose: Install and configure PostgreSQL on node2

2. **challenge6-provision-webserver**
   - Playbook: `ctf-workshop/solutions/challenge6-provision-webserver.yml`
   - Purpose: Install and configure Apache httpd on node1
   - **Uses `community.general.seport`** for SELinux configuration

3. **challenge6-deploy-application**
   - Playbook: `ctf-workshop/solutions/challenge6-deploy-application.yml`
   - Purpose: Deploy PHP application to node1

4. **challenge6-validate-service**
   - Playbook: `ctf-workshop/solutions/challenge6-validate-service.yml`
   - Purpose: Validate application deployment

---

## Building Your Own Custom EE

If you need to build your own version of the custom EE:

### 1. Create `execution-environment.yml`

```yaml
version: 3

images:
  base_image:
    name: quay.io/ansible/creator-ee:latest

dependencies:
  galaxy: requirements.yml
  python: requirements.txt
  system: bindep.txt

additional_build_steps:
  prepend_galaxy:
    - RUN ansible-galaxy collection install community.general:5.8.3 --force
  append_final:
    - RUN pip3 install psycopg2-binary requests
```

### 2. Create `requirements.yml`

```yaml
---
collections:
  - name: community.general
    version: "5.8.3"
  - name: ansible.posix
  - name: awx.awx
```

### 3. Create `requirements.txt`

```txt
psycopg2-binary
requests
```

### 4. Create `bindep.txt`

```txt
python38-devel [platform:centos-8 platform:rhel-8]
gcc [platform:centos-8 platform:rhel-8]
postgresql-devel [platform:centos-8 platform:rhel-8]
```

### 5. Build the EE

```bash
ansible-builder build \
  --tag quay.io/yourusername/ansible-common-ee:2.0 \
  --container-runtime podman
```

### 6. Push to Registry

```bash
podman login quay.io
podman push quay.io/yourusername/ansible-common-ee:2.0
```

### 7. Update Deployment Playbook

Update `central-controller/deploy-to-sub-controllers.yml`:

```yaml
custom_ee_image: "{{ custom_ee_image_url | default('quay.io/yourusername/ansible-common-ee:2.0') }}"
```

---

## Alternative: Shell Command Approach

If you don't want to maintain a custom EE, you can modify Challenge 6 playbooks to use shell commands instead of the `community.general.seport` module.

**Example** (already implemented as fallback):

```yaml
- name: Configure SELinux to allow httpd on port 8080
  ansible.builtin.shell: |
    if semanage port -l | grep "http_port_t" | grep -wq "8080"; then
      echo "Port 8080 already configured for http_port_t"
      exit 0
    elif semanage port -m -t http_port_t -p tcp 8080 2>/dev/null; then
      echo "Modified port 8080 to http_port_t"
    else
      semanage port -a -t http_port_t -p tcp 8080
      echo "Added port 8080 to http_port_t"
    fi
  register: selinux_result
  changed_when: "'already configured' not in selinux_result.stdout"
```

**Pros**:
- No custom EE needed
- Works with any execution environment
- More transparent to participants

**Cons**:
- Less "Ansible-native"
- Requires `policycoreutils-python-utils` package (already installed in workshop)

---

## Verification

### Check EE on Sub-Controller

1. Log into AAP sub-controller
2. Navigate to: **Administration → Execution Environments**
3. Verify `ansible-common-ee` is present
4. Check image: `quay.io/dleong/ansible-common-ee:2.0`

### Test Challenge 6 Playbook

Run the `challenge6-provision-webserver` job template:

```bash
# Expected: SUCCESS
# The SELinux task should complete without syntax errors
```

### Verify Collection Version

SSH into a managed node and check:

```bash
ansible-galaxy collection list community.general
```

Expected output:
```
# /usr/share/ansible/collections/ansible_collections
Collection        Version
----------------- -------
community.general 5.8.3
```

---

## Troubleshooting

### Issue: "SyntaxError: future feature annotations is not defined"

**Cause**: Using `community.general` >= 6.0.0 with Python 3.6

**Solution**: Ensure custom EE with `community.general 5.8.3` is being used

### Issue: Job template still uses default EE

**Cause**: Job template not updated after EE creation

**Solution**: Re-run deployment playbook or manually update job template:
1. Resources → Templates
2. Edit `challenge6-provision-webserver`
3. Execution Environment → Select `ansible-common-ee`
4. Save

### Issue: Custom EE not pulling image

**Cause**: Image not accessible or pull policy incorrect

**Solution**:
1. Verify image exists: `podman pull quay.io/dleong/ansible-common-ee:2.0`
2. Check pull policy is `missing` or `always`
3. Add container registry credential if private

---

## Summary

✅ **Automatic Deployment**: Custom EE is created automatically by `deploy-to-sub-controllers.yml`

✅ **Python 3.6 Compatible**: Uses `community.general 5.8.3`

✅ **Challenge 6 Ready**: All Challenge 6 job templates configured with custom EE

✅ **Workshop Transparent**: Participants don't need to know about EE details

For questions or issues, refer to the workshop portal or contact the workshop administrator.

