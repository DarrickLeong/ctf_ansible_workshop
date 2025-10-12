# Enhanced CTF Tracker with User-Onboarded AAP Clusters

## 🚀 Complete Solution Overview

This enhanced CTF Tracker now supports a more flexible and scalable architecture where:

1. **Users onboard their own AAP clusters** into the CTF tracker
2. **RHEL connectivity testing** is performed via user's AAP clusters  
3. **Comprehensive challenge verification** using detailed playbooks
4. **Periodic status updates** and real-time monitoring
5. **Multi-cluster support** for distributed environments

## 📋 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CTF Tracker   │◄──►│   User's AAP     │◄──►│   RHEL Hosts    │
│   (OpenShift)   │    │   Cluster        │    │   (Targets)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Leaderboard             Job Templates           Challenge
   Progress Track          Playbook Exec          Verification
   Multi-AAP Mgmt          Results Reporting      Point Calculation
```

## 🛠️ Setup Instructions

### 1. Deploy the Enhanced CTF Tracker

```bash
# Deploy the updated application
cd /Users/dleong/Documents/CTF
./deploy.sh

# Verify deployment
oc get pods
oc get route ctf-tracker-route
```

### 2. Configure AAP Job Templates

Create these job templates in each user's AAP cluster:

#### Job Template 1: Comprehensive CTF Challenge Check
- **Name**: `CTF Challenge Verification`
- **Playbook**: `comprehensive-ctf-playbook.yml`
- **Inventory**: Your RHEL machines inventory
- **Extra Variables**: Prompt on launch
  - `target_host`
  - `attendee_id` 
  - `ctf_tracker_url`
  - `ctf_tracker_token`
  - `challenge_config`

#### Job Template 2: RHEL Connectivity Test
- **Name**: `CTF Connectivity Test`
- **Playbook**: `connectivity-test-playbook.yml`
- **Inventory**: Your RHEL machines inventory
- **Extra Variables**: Prompt on launch
  - `target_host`
  - `attendee_id`
  - `ctf_tracker_url`
  - `ctf_tracker_token`
  - `test_type`

### 3. Upload Playbooks to AAP

Upload these playbooks to your AAP project:
- `comprehensive-ctf-playbook.yml`
- `connectivity-test-playbook.yml`

## 🎯 Usage Workflow

### Step 1: Onboard AAP Clusters

1. **Access CTF Tracker**: https://ctf-tracker-ctf-project.apps.cluster-6zjzq.6zjzq.sandbox5539.opentlc.com
2. **Add Attendees**: Create attendee accounts
3. **Onboard AAP Cluster**:
   - Click "Onboard AAP Cluster"
   - Enter cluster details:
     - Name: `Production AAP`
     - Base URL: `https://controller.lw6q8.sandbox437.opentlc.com`
     - Username: `admin`
     - Password: `R3dh4t1!`
     - Assign to Attendee: Select attendee
   - System tests connectivity automatically

### Step 2: Add RHEL Machines

1. **Add Target Machines**:
   - Click "Add RHEL Machine"
   - Enter hostname (must match AAP inventory)
   - Assign to attendee
   - No SSH credentials needed (handled by AAP)

### Step 3: Test Connectivity

1. **Initial Connectivity Test**:
   - Click "Test All Connectivity" 
   - System triggers connectivity playbooks
   - Results show:
     - Connectivity score (0-100)
     - System readiness for CTF
     - Detailed health metrics

### Step 4: Run Challenge Verification

1. **Manual Trigger**: Click "Check All Machines (AAP)"
2. **Automatic Refresh**: Enable auto-refresh (30s intervals)
3. **Monitor Results**: View real-time progress and scoring

## 🏆 Available Challenges

### 1. Apache HTTP Server (10 points)
- Package installation check
- Service status verification  
- Configuration file validation
- Port accessibility test

### 2. Nginx Web Server (10 points)
- Package installation check
- Service running verification
- Configuration validation
- Port accessibility test

### 3. MySQL/MariaDB Database (10 points)
- Database server installation
- Service status check
- Port accessibility verification

### 4. Firewall Configuration (10 points)
- Firewalld service status
- Zone configuration check
- HTTP service allowlist verification

### 5. User Management (10 points)
- Required user account creation
- Sudo configuration validation

### 6. Custom Commands (Variable points)
- Configurable verification commands
- Custom point allocation
- Flexible challenge definition

## 📊 Monitoring and Reporting

### Real-time Dashboard Features

1. **AAP Cluster Status**:
   - Connection status indicators
   - Connectivity scores
   - Last test timestamps

2. **Challenge Progress**:
   - Individual challenge completion
   - Point accumulation tracking
   - Completion percentages

3. **Job Monitoring**:
   - AAP job execution status
   - Detailed job logs
   - Error reporting and resolution

### Periodic Updates

- **Automatic Refresh**: 30-second intervals (configurable)
- **Manual Refresh**: On-demand updates
- **Background Processing**: Asynchronous job status polling

## 🔧 Configuration Options

### Challenge Configuration

Challenges are configurable via the database:

```sql
-- Add custom challenge
INSERT INTO challenge_types (name, description, max_points, challenge_config, active)
VALUES (
    'custom_service',
    'Custom Service Installation Check',
    15,
    '{"required_packages": ["my-service"], "required_services": ["my-service"], "custom_commands": [{"name": "config_check", "command": "systemctl is-enabled my-service", "points": 5}]}',
    TRUE
);
```

### Playbook Customization

Extend playbooks for additional checks:

```yaml
# Add to comprehensive-ctf-playbook.yml
- name: Check Custom Application
  block:
    - name: Verify custom application
      command: /usr/local/bin/check-app
      register: app_check
      
    - name: Update results
      set_fact:
        custom_app_points: "{{ 20 if app_check.rc == 0 else 0 }}"
```

## 🔐 Security Features

### API Authentication
- Token-based authentication for playbook callbacks
- Secure credential storage in OpenShift secrets
- Network policies restricting access

### AAP Integration Security
- SSL certificate verification (configurable)
- Encrypted credential storage
- Role-based access control

### Data Protection
- Database encryption at rest
- Secure API endpoints
- Audit logging for all operations

## 🚨 Troubleshooting

### Common Issues

#### 1. AAP Connection Failed
```bash
# Check network connectivity
oc rsh deployment/ctf-tracker
curl -k https://controller.lw6q8.sandbox437.opentlc.com/api/v2/ping/

# Verify credentials
# Check AAP cluster status in CTF dashboard
```

#### 2. Playbook Execution Errors
```bash
# Check AAP job logs
# Verify inventory configuration
# Ensure playbooks are uploaded correctly
```

#### 3. Connectivity Test Failures
```bash
# Check RHEL machine network access
# Verify AAP inventory configuration
# Review playbook variables
```

### Debug Mode

Enable debug logging:
```yaml
# In openshift-deployment.yaml
- name: FLASK_DEBUG
  value: "true"
```

## 📈 Performance Optimization

### Scaling Recommendations

1. **Multiple AAP Clusters**: Distribute load across clusters
2. **Job Queuing**: Implement staggered job execution  
3. **Database Optimization**: Index frequently queried columns
4. **Caching**: Implement Redis caching for frequent queries

### Resource Requirements

- **CTF Tracker**: 2 CPU, 4GB RAM minimum
- **Database**: 1GB storage minimum
- **Network**: Low latency to AAP clusters essential

## 🎓 Training Scenarios

### Beginner CTF
- Apache installation and configuration
- Basic firewall setup
- User account management

### Intermediate CTF  
- Multiple service coordination
- Database installation and security
- Custom application deployment

### Advanced CTF
- Full infrastructure automation
- Security hardening verification
- Performance optimization checks

## 📝 API Reference

### New Endpoints

```http
GET /api/aap_clusters
POST /api/aap_clusters
POST /api/connectivity_test
POST /api/challenge_results
GET /api/trigger_connectivity_test/{cluster_id}/{hostname}
GET /api/trigger_challenge_check/{cluster_id}/{hostname}
```

### Webhook Integration

Playbooks can report results back via:
```bash
curl -X POST $CTF_TRACKER_URL/api/challenge_results \
  -H "Authorization: Bearer $CTF_TRACKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d @results.json
```

## 🌟 Advanced Features

### Multi-Tenant Support
- Attendee-specific AAP clusters
- Isolated scoring environments
- Custom challenge sets per attendee

### Integration Capabilities
- Webhook notifications
- External system integration
- Custom reporting endpoints

### Extensibility
- Plugin architecture for custom challenges
- REST API for external integrations
- Configurable scoring algorithms

This enhanced CTF system provides a robust, scalable, and secure platform for running enterprise-grade capture the flag events with real-world infrastructure automation and verification!


