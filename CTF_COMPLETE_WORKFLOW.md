# 🎯 CTF Complete Setup & Operation Guide

## 📋 **Quick Reference: Key Variables**

### **For Central Controller Job Templates:**
```yaml
# Required variables for "Deploy CTF Playbooks to Sub Controllers"
scm_repository_url: "https://github.com/DarrickLeong/ctf_ansible_workshop.git"
scm_source_branch: "main"
scm_source_type: "git"
ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
project_name: "CTF Challenge Playbooks"
```

### **For Sub-Controller Playbooks (Auto-configured):**
```yaml
# These are automatically set by the central controller deployment
ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
# ctf_tracker_token: "" # Optional authentication (not required for basic setup)
```

## 🚀 **Complete Step-by-Step Workflow**

### **Phase 1: Central Controller Setup (AAP)**

1. **Create/Update Job Templates in your Central AAP:**
   
   **Template 1:** `Test Sub Controller Connectivity`
   - **Playbook:** `central-controller/test-sub-controllers.yml`
   - **Inventory:** Your AAP inventory with sub-controllers
   - **Credentials:** Sub-controller admin credentials
   
   **Template 2:** `Deploy CTF Playbooks to Sub Controllers`
   - **Playbook:** `central-controller/deploy-to-sub-controllers.yml`
   - **Inventory:** Same AAP inventory
   - **Credentials:** Sub-controller admin credentials
   - **Survey Variables:** Use the values above ☝️

### **Phase 2: Execute Deployment**

2. **Run in AAP (Critical Order):**
   ```
   ⚡ FIRST:  "Test Sub Controller Connectivity"
   🚀 SECOND: "Deploy CTF Playbooks to Sub Controllers"
   ```

3. **Verify Deployment Success:**
   - Check that both job templates were created on each sub-controller:
     - `CTF Challenge Verification`
     - `CTF Connectivity Test`

### **Phase 3: CTF Tracker Setup**

4. **Access CTF Tracker Dashboard:**
   ```
   http://ctf-tracker-ctf-project.apps.your-cluster.com/
   ```

5. **Add Attendees** (via API):
   ```bash
   curl -X POST http://ctf-tracker-ctf-project.apps.your-cluster.com/api/attendees \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john.doe@your-company.com",
       "team": "Team Red"
     }'
   ```

6. **Add RHEL Machines** (via API):
   ```bash
   curl -X POST http://ctf-tracker-ctf-project.apps.your-cluster.com/api/machines \
     -H "Content-Type: application/json" \
     -d '{
       "hostname": "rhel-east-01",
       "ip": "10.0.1.XXX", 
       "region": "east",
       "attendee_id": 1
     }'
   ```

### **Phase 4: Run CTF Challenges**

7. **On Each Sub-Controller, Execute:**
   
   **For Connectivity Test:**
   - **Template:** `CTF Connectivity Test`
   - **Inventory:** Your RHEL machines inventory
   - **Credentials:** RHEL machine credentials
   - **Variables:**
     ```yaml
     ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
     ```
   
   **For Challenge Verification:**
   - **Template:** `CTF Challenge Verification`  
   - **Inventory:** Your RHEL machines inventory
   - **Credentials:** RHEL machine credentials
   - **Variables:**
     ```yaml
     ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
     attendee_name: "John Doe"  # Match the name in CTF Tracker
     ```

## 🎯 **Expected Results**

### **In CTF Tracker Dashboard:**
- 📊 **Statistics:** Shows registered attendees and machines
- 🏆 **Leaderboard:** Displays scores as challenges are completed
- 🖥️ **Machines:** Lists all RHEL machines with status
- 📈 **Activity:** Real-time updates as playbooks run

### **Challenge Results Flow:**
```
RHEL Machine → Sub Controller Playbook → Webhook → CTF Tracker → Dashboard Update
```

## 🔧 **API Endpoints for Management**

### **Attendee Management:**
```bash
# List attendees
curl http://ctf-tracker-ctf-project.apps.your-cluster.com/api/attendees

# Add attendee
curl -X POST .../api/attendees -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@your-company.com", "team": "Blue"}'
```

### **Machine Management:**
```bash
# List machines  
curl http://ctf-tracker-ctf-project.apps.your-cluster.com/api/machines

# Add machine
curl -X POST .../api/machines -H "Content-Type: application/json" \
  -d '{"hostname": "rhel-west-01", "ip": "10.0.2.XXX", "region": "west", "attendee_id": 1}'
```

### **Results & Progress:**
```bash
# View current progress
curl http://ctf-tracker-ctf-project.apps.your-cluster.com/api/progress

# View leaderboard  
curl http://ctf-tracker-ctf-project.apps.your-cluster.com/api/results
```

## 🚨 **Troubleshooting**

### **If Webhooks Don't Work:**
1. **Check connectivity:** Can sub-controllers reach the CTF Tracker URL?
2. **Verify variables:** Ensure `ctf_tracker_url` is correct in job templates
3. **Check logs:** Look at playbook execution logs for webhook errors

### **If Dashboard Shows No Data:**
1. **Add attendees first** using the API endpoints above
2. **Register RHEL machines** with attendee assignments  
3. **Run connectivity tests** to verify the webhook integration

## 🎉 **Success Indicators**

✅ **Connectivity Test Success:** Dashboard shows machines with "Connected" status  
✅ **Challenge Success:** Leaderboard updates with scores  
✅ **Real-time Updates:** Dashboard refreshes automatically every 30 seconds  
✅ **Multi-Controller:** Results from all sub-controllers appear in single dashboard

---

**You now have a complete CTF infrastructure! Start by running the central controller deployment, then add attendees and machines via API, and finally execute challenges on your sub-controllers.** 🚀
