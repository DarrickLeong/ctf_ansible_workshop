# CTF Checkpoint Tracker - Enterprise Edition

A comprehensive containerized web application for tracking Capture the Flag (CTF) game progress, designed to run on OpenShift with Ansible Automation Platform (AAP) integration.

## 🌟 Features

- **Multi-AAP Cluster Support**: Users can onboard their own AAP clusters
- **Comprehensive Challenge Verification**: Advanced playbooks for multiple service types
- **Real-time Connectivity Testing**: RHEL machine health and readiness assessment
- **Interactive Deployment**: Secure configuration collection during deployment
- **Enterprise Security**: Non-root containers, RBAC, network policies
- **Scalable Architecture**: Multi-tenant design with isolated scoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CTF Tracker   │◄──►│   User's AAP     │◄──►│   RHEL Hosts    │
│   (OpenShift)   │    │   Cluster        │    │   (Targets)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Web Dashboard           Job Templates           Challenge
   AAP Management          Playbook Exec          Verification
   Leaderboard            Results Reporting       Point Calculation
```

## 🚀 Quick Start

### Prerequisites

- OpenShift cluster access with `oc` CLI installed and configured
- Ansible Automation Platform cluster (optional for initial deployment)
- Bash shell with `envsubst` utility

### Interactive Deployment

1. **Clone and Navigate**:
   ```bash
   git clone <repository-url>
   cd ctf-tracker
   ```

2. **Login to OpenShift**:
   ```bash
   oc login <your-openshift-cluster-url>
   ```

3. **Run Interactive Deployment**:
   ```bash
   ./deploy-interactive.sh
   ```

   The script will prompt you for:
   - OpenShift cluster domain
   - Project name
   - Storage configuration
   - Application security settings
   - Optional default AAP cluster
   - Application settings

4. **Access Application**:
   The deployment will provide the application URL upon completion.

### Configuration-Only Mode

To only generate configuration without deploying:

```bash
./deploy-interactive.sh configure
```

### Using Existing Configuration

If you have a `config.env` file, the deployment script will offer to reuse it.

## 🎯 Challenge Types

### Built-in Challenges

1. **Apache HTTP Server** (10 points)
   - Package installation verification
   - Service status and configuration
   - Port accessibility testing

2. **Nginx Web Server** (10 points)
   - Installation and service checks
   - Configuration validation
   - Network accessibility

3. **MySQL/MariaDB Database** (10 points)
   - Database server installation
   - Service status verification
   - Port connectivity testing

4. **Firewall Configuration** (10 points)
   - Firewalld service management
   - Zone and rule configuration
   - HTTP service allowlisting

5. **User Management** (10 points)
   - User account creation
   - Sudo configuration validation

6. **Custom Commands** (Variable points)
   - Flexible command execution
   - Configurable point allocation

## 🛠️ AAP Integration Setup

### Required AAP Job Templates

Create the following job templates in your AAP cluster:

#### 1. CTF Challenge Verification
- **Name**: `CTF Challenge Verification`
- **Playbook**: `comprehensive-ctf-playbook.yml`
- **Variables**: Prompt on launch
  - `target_host`
  - `attendee_id`
  - `ctf_tracker_url`
  - `challenge_config`

#### 2. RHEL Connectivity Test
- **Name**: `CTF Connectivity Test`
- **Playbook**: `connectivity-test-playbook.yml`
- **Variables**: Prompt on launch
  - `target_host`
  - `attendee_id`
  - `ctf_tracker_url`
  - `test_type`

### Playbook Upload

Upload these playbooks to your AAP project:
- `comprehensive-ctf-playbook.yml`
- `connectivity-test-playbook.yml`

## 📱 Usage Workflow

### 1. Onboard AAP Clusters
- Access the web dashboard
- Click "Onboard AAP Cluster"
- Enter cluster details and credentials
- System automatically tests connectivity

### 2. Add RHEL Machines
- Register target machines using hostnames from AAP inventory
- Assign machines to attendees
- No SSH credentials required (handled by AAP)

### 3. Test System Readiness
- Run connectivity tests via "Test All Connectivity"
- Review system health scores and recommendations
- Ensure machines are CTF-ready

### 4. Execute Challenges
- Manual trigger: "Check All Machines (AAP)"
- Automatic refresh: Enable 30-second intervals
- Monitor real-time progress and scoring

## 🔧 Configuration

### Environment Variables

The application supports these environment variables:

- `FLASK_DEBUG`: Enable debug mode
- `DATABASE_DIR`: Database storage directory
- `AAP_BASE_URL`: Default AAP cluster URL
- `AAP_USERNAME`/`AAP_PASSWORD`: Default AAP credentials
- `AAP_JOB_TEMPLATE_ID`: Challenge verification template
- `AUTO_REFRESH_INTERVAL`: Dashboard refresh rate
- `MAX_CONCURRENT_CHECKS`: Concurrent job limit

### Custom Challenges

Add custom challenges via database:

```sql
INSERT INTO challenge_types (name, description, max_points, challenge_config, active)
VALUES (
    'custom_service',
    'Custom Service Check',
    15,
    '{"required_packages": ["myservice"], "custom_commands": [{"name": "status", "command": "systemctl is-active myservice", "points": 15}]}',
    TRUE
);
```

## 🔐 Security Features

### Application Security
- Non-root container execution
- Security contexts with dropped capabilities
- Network policies for traffic restriction
- Encrypted secrets management
- RBAC with minimal permissions

### AAP Integration Security
- SSL certificate verification (configurable)
- Secure credential storage in OpenShift secrets
- Token-based API authentication
- Audit logging for all operations

## 📊 API Endpoints

### Core Endpoints
- `GET/POST /api/attendees` - Attendee management
- `GET /api/checkpoints` - Available challenges
- `GET /api/progress` - Progress tracking
- `GET/POST /api/machines` - RHEL machine management

### AAP Integration Endpoints
- `GET/POST /api/aap_clusters` - AAP cluster management
- `POST /api/connectivity_test` - Connectivity results webhook
- `POST /api/challenge_results` - Challenge results webhook
- `GET /api/trigger_connectivity_test/{cluster_id}/{hostname}` - Trigger tests
- `GET /api/trigger_challenge_check/{cluster_id}/{hostname}` - Trigger checks

## 🚨 Troubleshooting

### Common Issues

#### AAP Connection Failed
```bash
# Test connectivity
curl -k https://your-aap-cluster.com/api/v2/ping/

# Check credentials in web interface
# Verify network policies allow egress to AAP
```

#### Build Failures
```bash
# Check build logs
oc logs -f bc/ctf-tracker

# Verify all files are present
ls -la templates/ *.py *.yml
```

#### Deployment Issues
```bash
# Check pod status
oc get pods -l app=ctf-tracker

# View application logs
oc logs -f deployment/ctf-tracker

# Verify secrets
oc get secret ctf-tracker-secrets -o yaml
```

### Debug Mode

Enable debug logging:
```bash
# In deployment
oc set env deployment/ctf-tracker FLASK_DEBUG=true
```

## 🎓 Extending the Platform

### Adding New Challenge Types

1. **Update Playbook**: Add challenge logic to `comprehensive-ctf-playbook.yml`
2. **Database Entry**: Insert challenge type configuration
3. **Frontend Update**: Modify UI if needed for challenge-specific displays

### Custom Integration

The platform supports webhooks and REST API integration for:
- External scoring systems
- Custom notification services
- Third-party monitoring tools

## 📈 Performance Tuning

### Scaling Recommendations
- **Multiple Replicas**: Scale deployment for high availability
- **Database Optimization**: Consider external database for large deployments
- **Job Queuing**: Implement staggered execution for many machines
- **Caching**: Add Redis for frequent queries

### Resource Requirements
- **Minimum**: 2 CPU, 4GB RAM, 1GB storage
- **Recommended**: 4 CPU, 8GB RAM, 5GB storage
- **Network**: Low latency to AAP clusters essential

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with the interactive deployment script
4. Ensure all sensitive data is properly templated
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: See `ENHANCED_CTF_GUIDE.md` for detailed setup
- **Issues**: Use GitHub issues for bug reports
- **Security**: Report security issues privately via email

## 🔄 Migration from Previous Versions

If upgrading from a previous version:

1. **Backup Data**: Export existing attendee and progress data
2. **Clean Deploy**: Use `./deploy-interactive.sh clean` then redeploy
3. **Restore Data**: Import data via web interface or API
4. **Update Playbooks**: Replace old playbooks with new comprehensive versions

---

**Ready to run your enterprise CTF event with confidence!** 🏆


