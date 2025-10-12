# Sub Controllers - CTF Playbooks Complete Guide

This folder contains the Ansible playbooks that get deployed to sub controllers for executing CTF challenges on RHEL hosts.

## 📁 Contents

### **Challenge Playbooks**
- **`comprehensive-ctf-playbook.yml`** - Main challenge verification playbook (⭐ **Primary**)
- **`connectivity-test-playbook.yml`** - System health and connectivity checks (🔍 **Diagnostic**)

## 🎯 Playbook Deep Dive

### **Comprehensive CTF Playbook** (`comprehensive-ctf-playbook.yml`)

**Purpose**: Executes and verifies multiple CTF challenges on RHEL hosts with comprehensive scoring

#### **Supported Challenge Types:**

**1. Apache HTTP Server Challenge** (10 points)
```yaml
Challenge Components:
- Package Installation: httpd package verification (3 points)
- Service Status: Active/running state (4 points) 
- Configuration: httpd.conf exists (2 points)
- Network Access: Port 80 accessibility (1 point)

Execution Example:
target_host: rhel-host-01
challenge_types: ["apache_check"]
```

**2. Nginx Web Server Challenge** (10 points)
```yaml
Challenge Components:
- Package Installation: nginx package verification (4 points)
- Service Status: Active/running state (4 points)
- Configuration: nginx.conf exists (1 point)
- Network Access: Port 80 accessibility (1 point)

Execution Example:
target_host: rhel-host-02
challenge_types: ["nginx_check"]
```

**3. MySQL/MariaDB Database Challenge** (10 points)
```yaml
Challenge Components:
- Package Installation: mariadb-server/mysql-server (5 points)
- Service Status: mariadb service running (3 points)
- Network Access: Port 3306 accessibility (2 points)

Execution Example:
target_host: rhel-host-03
challenge_types: ["mysql_check"]
```

**4. Firewall Configuration Challenge** (10 points)
```yaml
Challenge Components:
- Service Status: firewalld active (4 points)
- Zone Configuration: Active zones configured (3 points)
- HTTP Service: HTTP service allowed (3 points)

Execution Example:
target_host: rhel-host-04
challenge_types: ["firewall_check"]
```

**5. User Management Challenge** (10 points)
```yaml
Challenge Components:
- User Creation: Required users exist (6 points)
- Sudo Configuration: sudoers.d/webadmin exists (4 points)

Configuration Example:
required_users:
  - webadmin
  - developer
  - testuser
```

**6. Custom Command Challenges** (Variable points)
```yaml
Configuration Example:
custom_commands:
  - name: "nginx_status_check"
    command: "systemctl is-active nginx"
    points: 5
  - name: "config_validation"
    command: "nginx -t"
    points: 3
  - name: "log_rotation_check"
    command: "test -f /etc/logrotate.d/nginx"
    points: 2
```

#### **Execution Flow:**
```
1. Challenge Selection → Based on challenge_config.challenge_types
2. Package Verification → rpm/yum package manager checks  
3. Service Validation → systemctl status verification
4. Configuration Checks → File existence and permissions
5. Network Testing → Port accessibility and connectivity
6. Point Calculation → Weighted scoring based on completion
7. Results Reporting → Webhook POST to central tracker
```

#### **Required Variables:**
```yaml
# Required for execution
target_host: "rhel-host-01.domain.com"    # Target RHEL system
attendee_id: "student-123"                # Student identifier
ctf_tracker_url: "https://ctf-tracker.apps.openshift.com"  # Central tracker
ctf_tracker_token: "webhook-auth-token"   # Authentication token

# Optional configuration
challenge_config:
  challenge_types:                         # Challenges to execute
    - apache_check
    - nginx_check
    - mysql_check
  required_users:                          # Custom user list
    - webadmin
    - developer
  custom_commands:                         # Custom challenge commands
    - name: "service_check"
      command: "systemctl is-active myservice"
      points: 15
```

#### **Scoring Algorithm:**
```yaml
# Apache Example (10 points max)
apache_points = (package_installed * 3) + 
                (service_running * 4) + 
                (config_exists * 2) + 
                (port_accessible * 1)

# Final calculation  
total_points = sum(all_challenge_points)
completion_percentage = (completed_challenges / total_challenges) * 100
```

### **Connectivity Test Playbook** (`connectivity-test-playbook.yml`)

**Purpose**: Tests RHEL host connectivity, system health, and CTF readiness

#### **Test Categories:**

**1. Basic Connectivity Tests**
```yaml
Tests Performed:
- Ansible Ping: Basic reachability verification
- SSH Connection: Ansible can connect and authenticate
- Python Availability: Required for Ansible modules

Expected Results:
✅ ping_success: true
✅ ansible_reachable: true
```

**2. Network Connectivity Tests**
```yaml
Tests Performed:
- DNS Resolution: nslookup google.com
- Internet Access: HTTP GET to external site
- Network Configuration: IP address and routing

Expected Results:
✅ dns_resolution: true  
✅ internet_access: true
✅ ip_address: "192.168.1.100"
```

**3. System Health Checks**
```yaml
Tests Performed:
- System Uptime: Server stability indicator
- Disk Usage: Available storage space
- Memory Usage: RAM utilization
- Running Services: Active service count

Health Metrics:
- disk_usage: ["Filesystem", "Size", "Used", "Avail", "Use%", "Mounted on"]
- memory_usage: "              total        used        free      shared"
- services_running: 45
```

**4. RHEL Information Gathering**
```yaml
Information Collected:
- RHEL Version: /etc/redhat-release contents
- Subscription Status: subscription-manager status
- Architecture: x86_64, aarch64, etc.
- Kernel Version: uname -r output

Example Results:
rhel_version: "Red Hat Enterprise Linux release 8.4 (Ootpa)"
subscription_status: true
architecture: "x86_64"
```

**5. Security Status Assessment**
```yaml
Security Checks:
- SELinux Status: getenforce output
- Firewall Status: firewalld service state
- SSH Configuration: sshd service status
- Security Updates: Available patches

Security Scoring:
✅ selinux_status: "Enforcing"
✅ firewall_running: true
✅ ssh_secure: true
```

#### **Connectivity Scoring System:**
```yaml
# Scoring weights (100 points total)
Basic Connectivity: 20 points    # Ping and SSH
DNS Resolution: 15 points        # Name resolution
Internet Access: 10 points       # External connectivity  
Firewall Running: 10 points      # Security compliance
RHEL Subscription: 15 points     # License validation
Base Score: 30 points           # System availability

# Status determination
connectivity_status: 
  - "excellent" (80-100 points)
  - "good" (60-79 points)
  - "fair" (40-59 points)  
  - "poor" (0-39 points)

connectivity_ready: score >= 60  # Minimum for CTF participation
```

## 🚀 Deployment and Execution Process

### **How Playbooks Get Deployed**

**Phase 1: Central Controller Deployment**
```bash
# From Central AAP Controller
1. Run "Deploy CTF Playbooks to Sub Controllers" job template
2. Central controller connects to each sub controller via API
3. Creates project "CTF Challenge Playbooks" on sub controller
4. Syncs playbooks from Git repository
5. Creates job templates for both playbooks
```

**Phase 2: Sub Controller Configuration**
```yaml
# Project created on sub controller
Name: "CTF Challenge Playbooks"
SCM Type: Git
SCM URL: https://github.com/your-org/ctf-ansible-workshop.git
SCM Branch: main
Organization: "CTF Organization"
Update on Launch: true

# Job templates created
1. "CTF Challenge Verification"
   - Playbook: sub-controllers/comprehensive-ctf-playbook.yml
   - Ask Variables: true
   - Ask Inventory: true
   - Ask Credentials: true

2. "CTF Connectivity Test"  
   - Playbook: sub-controllers/connectivity-test-playbook.yml
   - Ask Variables: true
   - Ask Inventory: true
   - Ask Credentials: true
```

### **Execution Workflow**

**Triggered by Central CTF Tracker:**
```
Central CTF Tracker (Web Interface)
       │ (HTTP API call)
       ▼
Sub Controller AAP (Job Template Execution)
       │ (Ansible playbook run)
       ▼
RHEL Host (Challenge/Connectivity Testing)
       │ (Results collection)
       ▼
Sub Controller AAP (Job completion)
       │ (Webhook HTTP POST)
       ▼
Central CTF Tracker (Score update)
```

**API Integration Points:**
```bash
# Central Tracker → Sub Controller
GET /api/v2/job_templates/{template_id}/launch/
POST /api/v2/job_templates/{template_id}/launch/
  {
    "extra_vars": {
      "target_host": "rhel-host-01",
      "attendee_id": "student-123",
      "ctf_tracker_url": "https://ctf-tracker.apps.openshift.com",
      "ctf_tracker_token": "webhook-auth-token"
    }
  }

# Sub Controller → Central Tracker (Webhook)
POST /api/challenge_results
  {
    "hostname": "rhel-host-01",
    "attendee_id": "student-123", 
    "challenge_results": {...},
    "summary": {
      "total_points": 50,
      "completion_percentage": 100.0
    }
  }
```

## 📊 Results Reporting and Webhooks

### **Challenge Results Webhook**

**Endpoint**: `{{ ctf_tracker_url }}/api/challenge_results`
**Method**: POST
**Authentication**: Bearer token in Authorization header

**Payload Structure:**
```json
{
  "hostname": "rhel-host-01.east.local",
  "attendee_id": "student-123",
  "timestamp": "2023-10-12T15:30:45Z",
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
    },
    "nginx_check": {
      "completed": false,
      "points_earned": 6,
      "max_points": 10,
      "details": {
        "package_installed": true,
        "service_running": false,
        "config_exists": true,
        "port_accessible": false
      }
    }
  },
  "summary": {
    "total_points": 16,
    "max_possible_points": 20,
    "challenges_completed": 1,
    "total_challenges": 2,
    "completion_percentage": 50.0
  }
}
```

### **Connectivity Results Webhook**

**Endpoint**: `{{ ctf_tracker_url }}/api/connectivity_test`
**Method**: POST  
**Authentication**: Bearer token

**Payload Structure:**
```json
{
  "hostname": "rhel-host-01.east.local",
  "ip_address": "192.168.1.100",
  "attendee_id": "student-123",
  "test_type": "connectivity",
  "timestamp": "2023-10-12T15:25:30Z",
  "connectivity_results": {
    "basic_connectivity": {
      "ping_success": true,
      "ansible_reachable": true
    },
    "system_info": {
      "hostname": "rhel-host-01",
      "ip_address": "192.168.1.100",
      "os_family": "RedHat",
      "distribution": "RedHat",
      "distribution_version": "8.4",
      "architecture": "x86_64",
      "processor_count": 4,
      "memory_mb": 8192,
      "uptime": "up 2 days, 14:23"
    },
    "network_tests": {
      "dns_resolution": true,
      "internet_access": true
    },
    "security_status": {
      "selinux_status": "Enforcing",
      "firewall_running": true
    },
    "rhel_info": {
      "version": "Red Hat Enterprise Linux release 8.4 (Ootpa)",
      "subscription_status": true
    }
  },
  "connectivity_score": 85,
  "connectivity_status": "excellent",
  "connectivity_ready": true
}
```

## 🔧 Advanced Configuration and Customization

### **Challenge Configuration Examples**

**1. Custom Apache + SSL Challenge:**
```yaml
challenge_config:
  challenge_types:
    - apache_check
  custom_commands:
    - name: "ssl_certificate_check"
      command: "openssl x509 -in /etc/ssl/certs/apache.crt -text -noout"
      points: 5
    - name: "ssl_config_check"  
      command: "grep -q 'SSLEngine on' /etc/httpd/conf.d/ssl.conf"
      points: 3
    - name: "https_port_check"
      command: "ss -tuln | grep :443"
      points: 2
```

**2. Container-based Challenge:**
```yaml
challenge_config:
  challenge_types:
    - custom_command
  custom_commands:
    - name: "docker_installed"
      command: "docker --version"
      points: 5
    - name: "container_running"
      command: "docker ps | grep nginx"
      points: 10
    - name: "container_accessible"
      command: "curl -s http://localhost:8080 | grep Welcome"
      points: 5
```

**3. Security Hardening Challenge:**
```yaml
challenge_config:
  challenge_types:
    - firewall_check
    - user_check
  required_users:
    - security_admin
    - audit_user
  custom_commands:
    - name: "selinux_enforcing"
      command: "getenforce | grep Enforcing"
      points: 10
    - name: "ssh_key_only"
      command: "grep -q 'PasswordAuthentication no' /etc/ssh/sshd_config"
      points: 8
    - name: "fail2ban_active"
      command: "systemctl is-active fail2ban"
      points: 7
```

### **Performance Optimization**

**Parallel Execution Configuration:**
```yaml
# In playbook execution
strategy: linear          # Sequential execution (default)
strategy: free           # Parallel where possible
serial: 1                # One host at a time
serial: "30%"           # 30% of hosts in parallel
```

**Timeout Configuration:**
```yaml
# Custom timeouts for long-running tasks
- name: Complex service installation
  package:
    name: "{{ item }}"
    state: present
  loop: "{{ complex_packages }}"
  async: 300             # 5 minute timeout
  poll: 10              # Check every 10 seconds
```

**Fact Caching for Performance:**
```yaml
# In ansible.cfg
[defaults]
fact_caching = memory
fact_caching_timeout = 3600
gathering = smart
```

### **Error Handling and Resilience**

**Retry Logic:**
```yaml
- name: Network-dependent task
  uri:
    url: "{{ ctf_tracker_url }}/api/challenge_results"
    method: POST
    body_format: json
    body: "{{ results }}"
  register: webhook_result
  until: webhook_result.status == 200
  retries: 3
  delay: 5
  ignore_errors: yes
```

**Graceful Degradation:**
```yaml
- name: Optional challenge component
  command: "{{ optional_command }}"
  register: optional_result
  failed_when: false      # Don't fail playbook if this fails
  changed_when: false     # Don't report as changed
```

## 🎮 Challenge Development Guide

### **Creating New Challenge Types**

**Step 1: Define Challenge Logic**
```yaml
# Add to comprehensive-ctf-playbook.yml
- name: Check Custom Service Challenge
  block:
    - name: Check custom service package
      package_facts:
        manager: auto
    
    - name: Check custom service status
      systemd:
        name: "{{ custom_service_name | default('myservice') }}"
      register: custom_service
      ignore_errors: yes
    
    - name: Evaluate custom service challenge
      set_fact:
        custom_installed: "{{ custom_service_name in ansible_facts.packages }}"
        custom_running: "{{ custom_service.status.ActiveState == 'active' if custom_service.status is defined else false }}"
    
    - name: Calculate custom service points
      set_fact:
        custom_points: "{{ ((custom_installed | int * 6) + (custom_running | int * 4)) }}"
        custom_max_points: 10
        
  when: "'custom_service_check' in (challenge_config.challenge_types | default([]))"
```

**Step 2: Update Scoring Logic**
```yaml
- name: Update challenge results with custom service
  set_fact:
    challenge_results: "{{ challenge_results | combine({'custom_service_check': {
      'completed': custom_points | int >= custom_max_points | int,
      'points_earned': custom_points,
      'max_points': custom_max_points,
      'details': {
        'package_installed': custom_installed,
        'service_running': custom_running
      }
    }}) }}"
```

**Step 3: Register in Central Tracker**
```sql
-- Add to CTF Tracker database
INSERT INTO challenge_types (name, description, max_points, challenge_config, active)
VALUES (
    'custom_service_check',
    'Custom Service Verification',
    10,
    '{"custom_service_name": "myservice", "required_packages": ["myservice"]}',
    TRUE
);
```

### **Testing New Challenges**

**Local Testing:**
```bash
# Test challenge logic locally
ansible-playbook comprehensive-ctf-playbook.yml \
  -i localhost, \
  -c local \
  -e "target_host=localhost" \
  -e "attendee_id=test-user" \
  -e "ctf_tracker_url=http://localhost:5000" \
  -e "challenge_config={challenge_types: ['custom_service_check']}" \
  --check \
  -v
```

**Sub Controller Testing:**
```bash
# Deploy to test sub controller
ansible-playbook ../central-controller/deploy-to-sub-controllers.yml \
  -i test-inventory.ini \
  -e "scm_branch=feature-new-challenge" \
  --limit test-sub-controller
```

## 🛠️ Troubleshooting Guide

### **Common Playbook Issues**

**1. Target Host Unreachable**
```bash
# Diagnosis
ansible target-host -m ping -i inventory.ini

# Common causes
- SSH key authentication failure
- Network connectivity issues  
- Firewall blocking SSH (port 22)
- Wrong hostname/IP in inventory

# Solutions
- Verify SSH connectivity: ssh user@target-host
- Check firewall rules: firewall-cmd --list-services
- Validate inventory: ansible-inventory --list -i inventory.ini
```

**2. Challenge Validation Failures**
```bash
# Check specific challenge components
ansible target-host -m package_facts -i inventory.ini
ansible target-host -m systemd -a "name=httpd" -i inventory.ini  
ansible target-host -m command -a "ss -tuln | grep :80" -i inventory.ini

# Verify expected state
ansible target-host -m shell -a "systemctl is-active httpd" -i inventory.ini
ansible target-host -m stat -a "path=/etc/httpd/conf/httpd.conf" -i inventory.ini
```

**3. Webhook Reporting Failures**
```bash
# Test webhook endpoint manually
curl -X POST https://ctf-tracker.apps.openshift.com/api/challenge_results \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Common issues
- Invalid authentication token
- Network policies blocking egress
- CTF Tracker application down
- Malformed JSON payload

# Debug network connectivity
ansible target-host -m uri -a "url=https://ctf-tracker.apps.openshift.com/api/health" -i inventory.ini
```

**4. Performance Issues**
```bash
# Monitor playbook execution time
ansible-playbook comprehensive-ctf-playbook.yml \
  -i inventory.ini \
  -e "target_host=slow-host" \
  --start-at-task="Check Apache HTTP Server Challenge" \
  -v

# Optimize slow tasks
- Use package_facts instead of multiple package checks
- Cache gathered facts with gather_facts: no (when not needed)
- Use async for long-running tasks
- Implement proper when conditions to skip unnecessary tasks
```

### **Debugging Techniques**

**Verbose Output Analysis:**
```bash
# Different verbosity levels
-v      # Standard verbose (task names and results)
-vv     # More verbose (task arguments)
-vvv    # Debug level (connection debugging)
-vvvv   # SSH debugging (very detailed)

# Focus on specific tasks
ansible-playbook playbook.yml --start-at-task="Task Name" -v
ansible-playbook playbook.yml --tags="challenge_apache" -v
```

**Variable Inspection:**
```yaml
- name: Debug challenge configuration
  debug:
    var: challenge_config
    verbosity: 1

- name: Debug gathered facts
  debug:
    var: ansible_facts.packages
    verbosity: 2
    
- name: Debug calculated points
  debug:
    msg: |
      Apache Challenge Results:
      - Package Installed: {{ apache_installed }}
      - Service Running: {{ apache_running }}
      - Port Accessible: {{ apache_port_open }}
      - Points Earned: {{ apache_points }}/{{ apache_max_points }}
```

**State Verification:**
```bash
# Check system state during execution
ansible target-host -m setup -i inventory.ini | grep -A5 -B5 "httpd"
ansible target-host -m service_facts -i inventory.ini
ansible target-host -m command -a "systemctl list-units --type=service --state=running" -i inventory.ini
```

---

**🎯 Your CTF challenge playbooks are ready to test RHEL skills comprehensively!** 🏆
