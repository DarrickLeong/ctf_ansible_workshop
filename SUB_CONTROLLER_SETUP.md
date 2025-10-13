# 🎯 CTF Challenge Progress Tracking - Complete Setup

## ⚡ **INTEGRATED ONBOARDING** - No Separate Scripts Needed!

Starting with v2.0, the `deploy-to-sub-controllers.yml` playbook automatically:
1. ✅ **Deploys** CTF playbooks to sub-controllers
2. ✅ **Registers attendees/teams** in CTF tracker
3. ✅ **Onboards controllers** as tracking entities
4. ✅ **Configures job templates** with correct attendee names

**One playbook does everything!** 🎉

## 📝 Pre-Deployment Configuration

### **AAP Inventory Variables for Each Sub-Controller:**

When setting up your AAP inventory, include these variables for each sub-controller host:

```yaml
# Required for deployment
sub_controller_host: "aap-east.your-company.com"
sub_controller_username: "admin" 
sub_controller_password: "{{ vault_east_password }}"

# CTF Tracker onboarding (optional - smart defaults used)
sub_controller_team_name: "East Team"           # Default: "{hostname} Team"
sub_controller_team_email: "east@your-company.com"   # Default: "{hostname}@your-company.com"  
sub_controller_region: "east"                   # Default: "region-{hostname}"
```

### **Job Template Survey Configuration:**

Add these survey questions to your deployment job template:

1. **CTF Tracker URL** (Required)
   - Variable: `ctf_tracker_url`
   - Default: `http://ctf-tracker-ctf-project.apps.your-cluster.com`

2. **Team Name Override** (Optional)
   - Variable: `sub_controller_team_name`
   - Default: `{inventory_hostname} Team`

3. **Region Name** (Optional)
   - Variable: `sub_controller_region`
   - Default: `region-{inventory_hostname}`

### **For CTF Connectivity Test Template:**
```yaml
# Template Name: "CTF Connectivity Test"
# Playbook: sub-controllers/connectivity-test-playbook.yml

# Required Variables:
ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
attendee_name: "East Team"  # Must match name in CTF Tracker (or "West Team")

# Optional Variables:
ctf_tracker_token: ""  # Leave empty for basic setup
```

### **For CTF Challenge Verification Template:**
```yaml
# Template Name: "CTF Challenge Verification" 
# Playbook: sub-controllers/comprehensive-ctf-playbook.yml

# Required Variables:
ctf_tracker_url: "http://ctf-tracker-ctf-project.apps.your-cluster.com"
attendee_name: "East Team"  # Must match name in CTF Tracker (or "West Team")

# Optional Challenge Configuration:
challenge_config:
  apache_check:
    service_name: "httpd"
    port: 80
    points: 10
  nginx_check:
    service_name: "nginx" 
    port: 80
    points: 10
  mysql_check:
    service_name: "mysqld"
    port: 3306
    points: 15
  firewall_check:
    required_rules: ["ssh", "http", "https"]
    points: 10
  user_check:
    required_users: ["webuser", "dbuser"]
    points: 10
  package_check:
    required_packages: ["git", "vim", "curl"]
    points: 5
```

## Example Job Template Survey Configuration

### **Survey Questions for Challenge Playbooks:**

1. **CTF Tracker URL**
   - Variable Name: `ctf_tracker_url`
   - Type: Text
   - Default: `http://ctf-tracker-ctf-project.apps.your-cluster.com`
   - Required: Yes

2. **Attendee/Team Name**
   - Variable Name: `attendee_name`
   - Type: Multiple Choice
   - Options: `East Team`, `West Team`
   - Required: Yes

3. **Target Host** (Optional)
   - Variable Name: `target_host`
   - Type: Text
   - Default: `all`
   - Required: No

## What Happens When Playbooks Run

### **Connectivity Test Flow:**
```
RHEL Machine → Test Connectivity → Calculate Score → Report to CTF Tracker → Dashboard Update
```

### **Challenge Verification Flow:**
```  
RHEL Machine → Run Challenges → Calculate Points → Report to CTF Tracker → Leaderboard Update
```

## Expected Results in CTF Tracker

After running playbooks, you'll see:

1. **Dashboard Statistics**: Updated machine and challenge counts
2. **Leaderboard**: Teams ranked by total points earned  
3. **Machine Status**: Each RHEL machine with connectivity status
4. **Real-time Updates**: Progress updates every 30 seconds

## Monitoring Progress

Watch your CTF Tracker dashboard:
- **URL**: http://ctf-tracker-ctf-project.apps.your-cluster.com/
- **Updates**: Automatic refresh every 30 seconds
- **API**: `/api/progress` for programmatic monitoring
