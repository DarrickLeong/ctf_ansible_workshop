# Controller Registration Guide

## 🎯 **Fixed Issue**: Proper Controller Registration

The system now properly registers **only the AAP sub controllers** you define in your central AAP inventory, not individual RHEL hosts or auto-generated names.

## 📋 **How It Works Now**

### ✅ **Central Controller Inventory Controls Registration**
- **Only sub controllers** defined in your central AAP inventory will appear in the CTF Tracker
- **No more auto-generated** controller names from group names
- **No more individual RHEL hosts** showing up as controllers

### 🔄 **Registration Flow**
1. **Central Controller** (`deploy-to-sub-controllers.yml`) registers each sub controller via `/api/register_controller`
2. **Sub Controllers** run challenge playbooks but do NOT register themselves
3. **CTF Tracker** shows only properly registered sub controllers

## 🚀 **Steps to Get Clean Controller Registration**

### **Step 1: Clear Existing Data**
```bash
# Already done - cleared all invalid controllers
curl -X DELETE "http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com/api/clear_all"
```

### **Step 2: Re-run Central Controller Deployment**
From your **central AAP controller**, run:
- **Job Template**: `"Deploy CTF Playbooks to Sub Controllers"`
- **Variables**:
  ```yaml
  ctf_tracker_base_url: "http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com"
  ```

This will:
- ✅ Deploy playbooks to your sub controller(s)
- ✅ Register **only your actual sub controller** in the CTF Tracker
- ✅ Show proper controller name (from your inventory)

### **Step 3: Run Challenge Playbooks**
On your **sub controller**, run:
- **Job Template**: `"CTF Challenge Verification"`
- **Variables**:
  ```yaml
  attendee_name: "Team Alpha"
  ctf_tracker_url: "http://ctf-tracker-nodejs-ctf-nodejs.apps.cluster-r7xph.r7xph.sandbox2418.opentlc.com"
  sub_controller_name: "sub-controller-east"  # Your actual sub controller name
  ```

## 📊 **Expected Result**

### **Controllers Section Should Show:**
- ✅ **1 Controller**: Your actual AAP sub controller name
- ✅ **Status**: "Active"
- ✅ **No duplicate or auto-generated names**

### **What You'll See:**
```
Controllers: 1
🎛️ sub-controller-east    [Active]
```

## 🔧 **If You Still See Issues**

1. **Check your central AAP inventory** - make sure you have only the controllers you want
2. **Re-run the central deployment** - this registers controllers properly
3. **Clear data if needed** - use the "Clear All Data" button in the dashboard

The system now uses your **central AAP inventory as the single source of truth** for controller registration.
