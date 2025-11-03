# Challenge 6 SELinux Configuration - Two Approaches

## Overview

Challenge 6 requires configuring SELinux to allow httpd to listen on port 8080. This document explains **two methods** to accomplish this task.

---

## ✅ **Method 1: System Roles (RECOMMENDED)**

### **What is linux-system-roles.selinux?**

The `linux-system-roles.selinux` is an **official Red Hat-supported Ansible role** for managing SELinux configurations. It provides:

- ✅ **Idempotent** operations by design
- ✅ **Production-ready** and officially supported
- ✅ **Declarative** configuration (no imperative commands)
- ✅ **Comprehensive** SELinux management (ports, booleans, file contexts, logins, modules)
- ✅ **Abstraction** from underlying commands
- ✅ **Consistent** across RHEL versions

### **Resources**
- 📚 [GitHub Repository](https://github.com/linux-system-roles/selinux)
- 📚 [Red Hat Documentation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/deploying-the-same-selinux-configuration-on-multiple-systems_using-selinux)

### **Installation**

```bash
# Option A: Install collection (includes multiple system roles)
ansible-galaxy collection install fedora.linux_system_roles

# Option B: Install role directly
ansible-galaxy role install linux-system-roles.selinux

# Option C: Use requirements.yml
ansible-galaxy collection install -r ctf-workshop/solutions/requirements.yml
```

### **Playbook Example**

**File:** `challenge6-provision-webserver-v2.yml`

```yaml
- name: Configure SELinux to allow httpd on port 8080
  ansible.builtin.include_role:
    name: linux-system-roles.selinux
  vars:
    selinux_ports:
      - ports: 8080
        proto: tcp
        setype: http_port_t
        state: present
        local: true
```

### **Rollback Example**

```yaml
- name: Remove SELinux port 8080 permission
  ansible.builtin.include_role:
    name: linux-system-roles.selinux
  vars:
    selinux_ports:
      - ports: 8080
        proto: tcp
        setype: http_port_t
        state: absent
        local: true
```

### **Benefits**

| Feature | System Roles | Command Approach |
|---------|-------------|------------------|
| **Idempotency** | ✅ Built-in | ⚠️ Requires manual checks |
| **Error Handling** | ✅ Comprehensive | ⚠️ Manual |
| **Abstraction** | ✅ High-level | ❌ Low-level |
| **Maintainability** | ✅ Excellent | ⚠️ Moderate |
| **Red Hat Support** | ✅ Official | ❌ No |
| **Dependencies** | ⚠️ Requires collection | ✅ None |
| **Learning Curve** | ⚠️ Moderate | ✅ Simple |

---

## ✅ **Method 2: Command-Based (FALLBACK)**

### **When to Use**

Use this method when:
- ❌ System roles are **not available** in your Execution Environment
- ✅ You need a **quick solution** without external dependencies
- ✅ You're in a **restricted environment** (like workshop EE)

### **Playbook Example**

**File:** `challenge6-provision-webserver.yml` (current)

```yaml
- name: Check if port 8080 is already configured in SELinux
  ansible.builtin.shell: semanage port -l | grep -q "http_port_t.*8080"
  register: selinux_port_check
  failed_when: false
  changed_when: false

- name: Configure SELinux to allow httpd on port 8080
  ansible.builtin.command: semanage port -a -t http_port_t -p tcp 8080
  when: selinux_port_check.rc != 0
```

### **How It Works**

1. **Step 1:** Check if port already configured (non-changing operation)
2. **Step 2:** Add port ONLY if not present (conditional execution)
3. **Step 3:** Skip on subsequent runs (idempotent behavior)

### **Rollback Example**

```yaml
- name: Check if port 8080 is configured in SELinux
  ansible.builtin.shell: semanage port -l | grep -q "http_port_t.*8080"
  register: selinux_port_check
  failed_when: false
  changed_when: false

- name: Remove SELinux port 8080 permission
  ansible.builtin.command: semanage port -d -t http_port_t -p tcp 8080
  when: selinux_port_check.rc == 0
```

### **Idempotency Pattern**

```yaml
# Pattern for making any command idempotent
- name: Check current state
  ansible.builtin.shell: <check_command>
  register: result
  failed_when: false      # Don't fail on check
  changed_when: false     # Mark as non-changing

- name: Apply change conditionally
  ansible.builtin.command: <change_command>
  when: result.rc != 0    # Only run if needed
```

---

## 📊 **Comparison Matrix**

### **For Workshop Participants**

| Scenario | Recommended Method |
|----------|-------------------|
| **Execution Environment has collections** | ✅ System Roles (v2) |
| **Restricted EE (no collections)** | ⚠️ Command-based (current) |
| **Learning SELinux concepts** | ✅ Command-based (shows mechanics) |
| **Production deployments** | ✅ System Roles (supported) |
| **Quick workshop completion** | ⚠️ Command-based (no setup) |

### **For Instructors**

- **Teach both methods** to show progression from imperative to declarative
- **Use command-based** as default (works out-of-box)
- **Show system roles** as "production best practice"
- **Explain idempotency patterns** regardless of method

---

## 🎯 **Workshop Implementation Decision**

### **Current Approach (Workshop Default)**
✅ **Command-Based Method** (`challenge6-provision-webserver.yml`)

**Reasoning:**
1. ✅ Works immediately (no collection install required)
2. ✅ Students see SELinux mechanics directly
3. ✅ Teaches idempotency patterns explicitly
4. ✅ No dependency on EE configuration
5. ✅ Portable across environments

### **Alternative Approach (Optional)**
⚠️ **System Roles Method** (`challenge6-provision-webserver-v2.yml`)

**Reasoning:**
1. ✅ Production best practice
2. ✅ Official Red Hat support
3. ⚠️ Requires collection installation
4. ⚠️ Adds complexity for beginners
5. ✅ Better for advanced workshops

---

## 📝 **Workshop Portal Update**

The workshop portal should mention **both approaches**:

### **In Hints Section:**
```
💡 Two Ways to Configure SELinux:

1. System Roles (Recommended for Production):
   - Install: ansible-galaxy collection install fedora.linux_system_roles
   - Use: include_role with selinux_ports variable

2. Command Approach (Works Everywhere):
   - Check first: semanage port -l | grep
   - Add conditionally: semanage port -a ... when: not_present
```

### **In Complete Solution:**
```
✅ We provide TWO solution examples:
   • challenge6-provision-webserver.yml (command-based)
   • challenge6-provision-webserver-v2.yml (system roles)

Both are valid! Use whichever works in your environment.
```

---

## 🚀 **Testing Both Methods**

### **Test System Roles Availability**

```bash
# Check if collection is available
ansible-galaxy collection list | grep linux_system_roles

# Check if role is available
ansible-galaxy role list | grep selinux

# Test the role
ansible-playbook challenge6-provision-webserver-v2.yml
```

### **Test Command-Based Method**

```bash
# Always works (no dependencies)
ansible-playbook challenge6-provision-webserver.yml

# Verify idempotency
ansible-playbook challenge6-provision-webserver.yml  # Should show "changed"
ansible-playbook challenge6-provision-webserver.yml  # Should show "ok" (no changes)
```

---

## 🎓 **Learning Outcomes**

### **Command-Based Method Teaches:**
- ✅ SELinux port labeling concepts
- ✅ Idempotency patterns
- ✅ Conditional execution
- ✅ Pre-flight checks
- ✅ `semanage` command usage

### **System Roles Method Teaches:**
- ✅ Declarative configuration
- ✅ Role inclusion
- ✅ Variable-driven automation
- ✅ Red Hat best practices
- ✅ Collection management

---

## 📚 **Additional Resources**

### **SELinux Port Management**
```bash
# List all port contexts
semanage port -l

# List custom port contexts only
semanage port -l -C

# Check specific port
semanage port -l | grep 8080

# Add port (manual)
semanage port -a -t http_port_t -p tcp 8080

# Delete port (manual)
semanage port -d -t http_port_t -p tcp 8080
```

### **System Roles Documentation**
- [SELinux System Role - GitHub](https://github.com/linux-system-roles/selinux)
- [RHEL 9 - Using SELinux](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux)
- [System Roles - Overview](https://linux-system-roles.github.io/)

---

## ✅ **Recommendation**

**For this CTF Workshop:**
- **Keep command-based as default** ✅
- **Provide v2 as optional bonus** ⭐
- **Document both in workshop portal** 📚
- **Let participants choose** 🎯

**Rationale:** Command-based works everywhere, teaches fundamentals, and is more accessible for beginners. System roles can be introduced as "extra credit" or "production best practice."

