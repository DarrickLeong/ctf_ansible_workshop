# Ansible Controller Collection Installation Guide

This guide provides multiple solutions for resolving the `ansible.controller` collection module errors when working with Red Hat Ansible Automation Platform (AAP).

## 🚨 Problem

```
ERROR! couldn't resolve module/action 'ansible.controller.organization'. This often indicates a misspelling, missing collection, or incorrect module path.
```

This error occurs because the `ansible.controller` collection is not installed in your Ansible Automation Platform environment.

## 🎯 Important: Use Red Hat's Official Collection

For **Red Hat Ansible Automation Platform (AAP)**, use the official **`ansible.controller`** collection instead of `awx.awx`:

- **✅ `ansible.controller`** - Official Red Hat supported collection for AAP ([Red Hat Console](https://console.redhat.com/ansible/automation-hub/repo/published/ansible/controller/docs/))
- **❌ `awx.awx`** - Upstream AWX project collection ([GitHub](https://github.com/ansible/awx/tree/devel/awx_collection))

## 🔧 Solution Options

### **Option 1: Install Controller Collection (Recommended)**

#### **A. Using ansible-galaxy (Command Line)**
```bash
# Install the Red Hat controller collection directly
ansible-galaxy collection install ansible.controller

# Or install from requirements file
ansible-galaxy collection install -r requirements.yml
```

#### **B. Using Red Hat Automation Hub**
```bash
# Install from Red Hat Automation Hub (requires Red Hat subscription)
ansible-galaxy collection install ansible.controller --server https://console.redhat.com/api/automation-hub/
```

#### **C. Using AAP Web Interface**
1. **Navigate to** Collections in your AAP web interface
2. **Click** "Browse Gallery" 
3. **Search for** `ansible.controller`
4. **Install** the collection to your organization

#### **D. Using Execution Environment**
```dockerfile
# Add to your execution environment requirements
# requirements.yml
---
collections:
  - name: ansible.controller
    version: ">=4.0.0"
```

### **Option 2: Manual Collection Installation**

If you have access to the AAP controller filesystem:

```bash
# Download collection manually from Red Hat
# (Requires Red Hat subscription and proper authentication)
ansible-galaxy collection install ansible.controller --server https://console.redhat.com/api/automation-hub/
```

### **Option 3: Alternative API Approach (If collection install fails)**

If you cannot install the collection, I can modify the playbook to use direct API calls instead of the `ansible.controller` modules.

**Pros:**
- ✅ No collection dependency
- ✅ Works with any Ansible installation
- ✅ More control over API calls

**Cons:**
- ❌ More complex error handling
- ❌ Less user-friendly than modules
- ❌ More verbose code

## 🎯 Quick Fix Commands

```bash
# Try these in order until one works:

# Method 1: Standard installation
ansible-galaxy collection install ansible.controller

# Method 2: Force reinstall
ansible-galaxy collection install ansible.controller --force

# Method 3: Install specific version
ansible-galaxy collection install ansible.controller:4.5.0

# Method 4: Install from requirements
cd central-controller/
ansible-galaxy collection install -r requirements.yml

# Method 5: Install from Red Hat Automation Hub
ansible-galaxy collection install ansible.controller --server https://console.redhat.com/api/automation-hub/
```

## 🚀 Verification

After installing, verify the collection is available:

```bash
# List installed collections
ansible-galaxy collection list

# Look for ansible.controller in the output
ansible-galaxy collection list | grep ansible.controller

# Test specific module
ansible-doc ansible.controller.organization
```

## 📋 Expected Output

After successful installation, you should see:
```
# ansible-galaxy collection list
Collection         Version
----------------- -------
ansible.controller 4.5.0  
```

## 🆘 If Collection Installation Fails

If you cannot install the `ansible.controller` collection due to permissions or environment restrictions, let me know and I can:

1. **Convert the playbook** to use direct `uri` module API calls
2. **Create a hybrid approach** with fallback methods
3. **Provide alternative deployment strategies**

## 📚 References

- **Red Hat Ansible Controller Collection**: [https://console.redhat.com/ansible/automation-hub/repo/published/ansible/controller/docs/](https://console.redhat.com/ansible/automation-hub/repo/published/ansible/controller/docs/)
- **AWX Collection (Upstream)**: [https://github.com/ansible/awx/tree/devel/awx_collection](https://github.com/ansible/awx/tree/devel/awx_collection)

---

**Try Option 1 first - it should resolve the issue for most Red Hat AAP environments!**
