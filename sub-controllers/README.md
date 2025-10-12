# Sub Controllers - CTF Playbooks Guide

Ansible playbooks that execute CTF challenges on RHEL hosts via sub controllers.

## 📁 Playbooks Overview

### **Challenge Execution**
- **`comprehensive-ctf-playbook.yml`** ⭐ - Main challenge verification (Apache, Nginx, MySQL, firewall, users)
- **`connectivity-test-playbook.yml`** 🔍 - System health and connectivity testing

## 🎯 How It Works

### **Deployment Process** (Automatic)
1. **Central Controller** runs deployment playbook
2. **Sub Controllers** receive these playbooks via Git sync
3. **Job Templates** created automatically on each sub controller
4. **CTF Tracker** triggers challenges via AAP API calls

### **Execution Flow**
```
CTF Tracker → Sub Controller AAP → RHEL Host → Results → CTF Tracker
```

## 🏆 Challenge Types

### **Built-in Challenges** (10 points each)
1. **Apache HTTP Server** - Package, service, config, port 80
2. **Nginx Web Server** - Package, service, config, port 80  
3. **MySQL/MariaDB** - Package, service, port 3306
4. **Firewall Configuration** - firewalld service, zones, HTTP rule
5. **User Management** - Required users, sudo configuration
6. **Custom Commands** - Flexible command execution (variable points)

### **Connectivity Testing** (0-100 score)
- **Basic**: Ansible ping, SSH connectivity (20 pts)
- **Network**: DNS resolution, internet access (25 pts)
- **Security**: SELinux, firewall status (25 pts)
- **RHEL**: Version, subscription status (30 pts)

## 🔧 Configuration Examples

### **Challenge Configuration**
```yaml
challenge_config:
  challenge_types:
    - apache_check
    - nginx_check
    - mysql_check
    - firewall_check
    - user_check
  required_users:
    - webadmin
    - developer
  custom_commands:
    - name: "service_status"
      command: "systemctl is-active myservice"
      points: 15
```

### **Execution Variables**
```yaml
target_host: "rhel-host-01.domain.com"
attendee_id: "student-123"
ctf_tracker_url: "https://ctf-tracker.apps.openshift.com"
ctf_tracker_token: "webhook-auth-token"
```

## 📊 Results Reporting

### **Challenge Results Webhook**
```json
{
  "hostname": "rhel-host-01",
  "attendee_id": "student-123",
  "challenge_results": {
    "apache_check": {
      "completed": true,
      "points_earned": 10,
      "max_points": 10,
      "details": {
        "package_installed": true,
        "service_running": true,
        "config_exists": true,
        "port_accessible": true
      }
    }
  },
  "summary": {
    "total_points": 50,
    "completion_percentage": 100.0
  }
}
```

## 🎮 Adding Custom Challenges

### **Step 1: Extend Playbook**
```yaml
- name: Check Custom Service Challenge
  block:
    - name: Check custom service package
      package_facts:
        manager: auto
    
    - name: Check custom service status
      systemd:
        name: "{{ custom_service_name }}"
      register: custom_service
      ignore_errors: yes
    
    - name: Calculate points
      set_fact:
        custom_points: "{{ ((package_installed | int * 6) + (service_running | int * 4)) }}"
        
  when: "'custom_service_check' in challenge_config.challenge_types"
```

### **Step 2: Test Locally**
```bash
ansible-playbook comprehensive-ctf-playbook.yml \
  -i localhost, \
  -c local \
  -e "target_host=localhost" \
  -e "attendee_id=test-user" \
  -e "challenge_config={challenge_types: ['custom_service_check']}" \
  --check -v
```

## 🛠️ Troubleshooting

### **Common Issues**
```bash
# Test target host connectivity
ansible target-host -m ping -i inventory.ini

# Check challenge components
ansible target-host -m package_facts -i inventory.ini
ansible target-host -m systemd -a "name=httpd" -i inventory.ini

# Test webhook endpoint
curl -X POST https://ctf-tracker.apps.openshift.com/api/challenge_results \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### **Performance Optimization**
```yaml
# Use package_facts instead of multiple package checks
# Cache gathered facts when possible
# Use async for long-running tasks
# Implement proper when conditions
```

---

**Ready to challenge RHEL skills comprehensively!** 🏆
