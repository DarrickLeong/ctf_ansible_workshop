# CTF Environment Reset - Troubleshooting Guide

## Common Issue: httpd Service Fails to Start

### Error Message
```
fatal: [node1]: FAILED! => {"changed": false, "msg": "Unable to start service httpd: Job for httpd.service failed because the control process exited with error code.\nSee \"systemctl status httpd.service\" and \"journalctl -xe\" for details.\n"}
```

### Root Cause
During **Challenge 6 (Phoenix Protocol)**, participants modify the httpd configuration:
- Change Listen port from 80 to 8080
- Add custom application files
- Modify configuration files

When running the **Environment Reset**, these modifications can prevent httpd from starting cleanly.

---

## ✅ Solution (Already Implemented)

The `reset-environment.yml` playbook has been updated to include proper cleanup:

```yaml
- name: Install and start httpd on node1
  block:
    - name: Install httpd
      dnf:
        name: httpd
        state: present
    
    # NEW: Remove custom configurations
    - name: Remove custom httpd configurations
      file:
        path: "{{ item }}"
        state: absent
      loop:
        - /etc/httpd/conf.d/custom.conf
        - /var/www/html/index.php
      ignore_errors: yes
    
    # NEW: Reset port to 80
    - name: Reset httpd Listen port to 80
      lineinfile:
        path: /etc/httpd/conf/httpd.conf
        regexp: '^Listen '
        line: 'Listen 80'
      ignore_errors: yes
    
    # NEW: Create default content
    - name: Create default index.html
      copy:
        content: |
          <html>
          <head><title>Web Server</title></head>
          <body><h1>Web Server on {{ ansible_hostname }}</h1></body>
          </html>
        dest: /var/www/html/index.html
        mode: '0644'
      ignore_errors: yes
    
    - name: Start httpd service
      service:
        name: httpd
        state: started
        enabled: yes
```

---

## 🚀 How to Apply the Fix

### Method 1: Automatic (Recommended)
Redeploy to sub-controllers to get the latest playbooks:

```bash
cd central-controller
git pull origin main

ansible-playbook deploy-to-sub-controllers.yml \
  --ask-vault-pass \
  -i central-aap-inventory.ini \
  -e "run_environment_reset=true" \
  -e "environment_inventory='Workshop'" \
  -e "environment_credential='Workshop Credential'"
```

### Method 2: Manual (If needed immediately)
Sync the project on your sub-AAP controller:

1. Login to sub-AAP Web UI
2. Go to **Resources → Projects**
3. Find **"CTF Challenge Playbooks"**
4. Click the **Sync** icon 🔄
5. Wait for sync to complete
6. Re-run **"CTF Environment Reset"** job template

---

## 🔍 Manual Verification (If Still Failing)

If the reset still fails, SSH to node1 and check:

```bash
# Check httpd status
systemctl status httpd

# Check what port it's trying to use
grep "^Listen" /etc/httpd/conf/httpd.conf

# Check for syntax errors
httpd -t

# Check SELinux denials
ausearch -m avc -ts recent | grep httpd

# View detailed logs
journalctl -xe -u httpd

# Common fixes:
# 1. Reset config
cp /etc/httpd/conf/httpd.conf.rpmsave /etc/httpd/conf/httpd.conf

# 2. Check port isn't in use
ss -tlnp | grep :80

# 3. Restart with fresh config
systemctl restart httpd
```

---

## 🛠️ Prevention

To avoid this issue in future workshops:

1. **Always run Reset before Setup**: This ensures a clean baseline
2. **Document Challenge 6 changes**: Remind participants their changes will be reverted
3. **Test the full cycle**: Reset → Setup → Workshop → Reset

---

## 📋 Related Playbooks

- **`reset-environment.yml`** - Cleans up all challenge modifications (✅ Fixed)
- **`setup-all-challenges.yml`** - Sets up challenge scenarios
- **Challenge 6 solutions** - Modify httpd configuration

---

## ✅ Verification

After applying the fix, the reset should complete successfully:

```
TASK [Start httpd service] *************************************
ok: [node1] => {"changed": false, "enabled": true, "name": "httpd", "state": "started"}

PLAY [Display Reset Summary] ***********************************
ok: [localhost] => {
    "msg": "==========================================
CTF Workshop Reset Complete!
==========================================

✅ All challenges have been reset to clean state

Environment is ready for next session!
=========================================="
}
```

---

## 🎯 Summary

**Problem**: httpd fails to start during reset due to Challenge 6 modifications  
**Solution**: Added cleanup steps to reset configuration before starting  
**Status**: ✅ Fixed in commit cad4cbe  
**Action**: Pull latest changes and sync to sub-controllers

---

**This fix ensures the Environment Reset can successfully complete after Challenge 6!** 🎉

