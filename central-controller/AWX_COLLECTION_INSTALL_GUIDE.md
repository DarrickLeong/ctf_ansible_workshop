# AWX Collection Installation Guide

This guide provides multiple solutions for resolving the `awx.awx` collection module errors.

## 🚨 Problem

```
ERROR! couldn't resolve module/action 'awx.awx.organization'. This often indicates a misspelling, missing collection, or incorrect module path.
```

This error occurs because the `awx.awx` collection is not installed in your Ansible Automation Platform environment.

## 🔧 Solution Options

### **Option 1: Install AWX Collection (Recommended)**

#### **A. Using ansible-galaxy (Command Line)**
```bash
# Install the collection directly
ansible-galaxy collection install awx.awx

# Or install from requirements file
ansible-galaxy collection install -r requirements.yml
```

#### **B. Using AAP Web Interface**
1. **Navigate to** Collections in your AAP web interface
2. **Click** "Browse Gallery" 
3. **Search for** `awx.awx`
4. **Install** the collection to your organization

#### **C. Using Execution Environment**
```dockerfile
# Add to your execution environment requirements
# requirements.yml
---
collections:
  - name: awx.awx
    version: ">=23.0.0"
```

### **Option 2: Manual Collection Installation**

If you have access to the AAP controller filesystem:

```bash
# Download collection manually
curl -L https://galaxy.ansible.com/download/awx-awx-23.9.0.tar.gz -o awx-awx.tar.gz

# Install manually
ansible-galaxy collection install awx-awx.tar.gz
```

### **Option 3: Alternative API Approach (If collection install fails)**

If you cannot install the collection, I can modify the playbook to use direct API calls instead of the `awx.awx` modules.

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
ansible-galaxy collection install awx.awx

# Method 2: Force reinstall
ansible-galaxy collection install awx.awx --force

# Method 3: Install specific version
ansible-galaxy collection install awx.awx:23.9.0

# Method 4: Install from requirements
cd central-controller/
ansible-galaxy collection install -r requirements.yml
```

## 🚀 Verification

After installing, verify the collection is available:

```bash
# List installed collections
ansible-galaxy collection list

# Look for awx.awx in the output
ansible-galaxy collection list | grep awx.awx

# Test specific module
ansible-doc awx.awx.organization
```

## 📋 Expected Output

After successful installation, you should see:
```
# ansible-galaxy collection list
Collection    Version
------------- -------
awx.awx       23.9.0  
```

## 🆘 If Collection Installation Fails

If you cannot install the `awx.awx` collection due to permissions or environment restrictions, let me know and I can:

1. **Convert the playbook** to use direct `uri` module API calls
2. **Create a hybrid approach** with fallback methods
3. **Provide alternative deployment strategies**

---

**Try Option 1 first - it should resolve the issue for most AAP environments!**
