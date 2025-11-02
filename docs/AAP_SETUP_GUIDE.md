# AAP Integration Setup Guide

This guide explains how to configure the CTF Tracker application to work with Ansible Automation Platform (AAP) for checking RHEL machines.

## Prerequisites

1. **Ansible Automation Platform (AAP) cluster** with API access
2. **RHEL machines** managed by AAP in an inventory
3. **AAP credentials** with permissions to launch job templates
4. **Job template** configured in AAP for Apache checking

## AAP Setup Steps

### 1. Create Job Template in AAP

1. Log into your AAP web interface
2. Navigate to **Templates** > **Job Templates**
3. Click **Add** to create a new job template
4. Configure the template:
   - **Name**: `CTF Apache Check`
   - **Job Type**: `Run`
   - **Inventory**: Select your RHEL machines inventory
   - **Project**: Select project containing the playbook
   - **Playbook**: `aap-playbook-apache-check.yml`
   - **Credentials**: Select appropriate machine credentials
   - **Variables**: Enable "Prompt on launch" for:
     - `target_host`
     - `check_type`
     - `attendee_id`

### 2. Configure AAP Credentials

Create or use existing credentials in AAP:
- **Machine Credentials**: For accessing RHEL hosts
- **Service Account**: For API access (used by CTF app)

### 3. Set Up Service Account

Create a service account user in AAP for the CTF application:
1. Navigate to **Access** > **Users**
2. Create new user: `ctf-service-account`
3. Assign appropriate permissions:
   - **Job Template**: Execute permission on CTF Apache Check template
   - **Inventory**: Read permission on RHEL inventory

## CTF Application Configuration

### 1. Update OpenShift Secrets

Replace the placeholder values in `openshift-configs.yaml`:

```bash
# Encode your AAP credentials
echo -n 'your-actual-aap-username' | base64
echo -n 'your-actual-aap-password' | base64

# Update the secret data in openshift-configs.yaml
```

### 2. Update Environment Variables

Edit `openshift-deployment.yaml` and update:

```yaml
env:
- name: AAP_BASE_URL
  value: "https://your-actual-aap-cluster.com"  # Your AAP URL
- name: AAP_JOB_TEMPLATE_ID
  value: "123"  # Your job template ID from AAP
```

### 3. Deploy Updated Configuration

```bash
# Apply updated configurations
oc apply -f openshift-configs.yaml
oc apply -f openshift-deployment.yaml

# Restart deployment to pick up new environment variables
oc rollout restart deployment/ctf-tracker
```

## Playbook Customization

The included `aap-playbook-apache-check.yml` can be customized for additional checks:

### Adding More Services

```yaml
- name: Check nginx installation
  package_facts:
    manager: auto
  register: nginx_check

- name: Set nginx status
  set_fact:
    nginx_installed: "{{ 'nginx' in ansible_facts.packages }}"
```

### Custom Point Values

```yaml
vars:
  apache_points: "{{ apache_points | default(10) }}"
  nginx_points: "{{ nginx_points | default(15) }}"
```

### Multiple Check Types

```yaml
- name: Determine check results
  set_fact:
    check_results:
      apache: "{{ apache_installed }}"
      nginx: "{{ nginx_installed }}"
      total_points: "{{ (apache_points if apache_installed else 0) + (nginx_points if nginx_installed else 0) }}"
```

## Testing the Integration

### 1. Test AAP Connection

```bash
# Check AAP status from the application
curl -X GET http://ctf-tracker.apps.YOUR-CLUSTER.com/api/aap_status
```

### 2. Manual Test Job Launch

```bash
# Trigger manual refresh
curl -X POST http://ctf-tracker.apps.YOUR-CLUSTER.com/api/manual_refresh
```

### 3. Monitor Job Execution

```bash
# View AAP jobs from the application
curl -X GET http://ctf-tracker.apps.YOUR-CLUSTER.com/api/aap_jobs
```

**⚠️ IMPORTANT**: Replace `YOUR-CLUSTER.com` with your actual OpenShift cluster domain!

## Troubleshooting

### Common Issues

1. **AAP Connection Failed**
   - Verify AAP_BASE_URL is correct
   - Check network connectivity from OpenShift to AAP
   - Validate AAP credentials

2. **Job Template Not Found**
   - Verify AAP_JOB_TEMPLATE_ID matches the template ID in AAP
   - Check service account permissions on the template

3. **Job Execution Failures**
   - Review playbook syntax and logic
   - Check RHEL machine connectivity in AAP
   - Verify inventory configuration

### Debug Mode

Enable debug logging by setting environment variable:
```yaml
- name: FLASK_DEBUG
  value: "true"
```

### AAP Job Logs

Monitor job execution in AAP:
1. Navigate to **Views** > **Jobs**
2. Click on specific job ID
3. Review **Output** tab for detailed execution logs

## Security Considerations

1. **Secrets Management**: AAP credentials are stored in OpenShift secrets
2. **Network Policies**: Configure network policies to restrict AAP API access
3. **RBAC**: Use service accounts with minimal required permissions
4. **SSL/TLS**: Always use HTTPS for AAP communication
5. **Credential Rotation**: Regularly rotate AAP service account passwords

## Scaling Considerations

1. **Concurrent Jobs**: AAP has limits on concurrent job execution
2. **API Rate Limits**: Implement appropriate delays between API calls
3. **Job Queuing**: Large numbers of machines may require job queuing
4. **Resource Limits**: Monitor AAP cluster resource usage

## Monitoring and Alerting

Set up monitoring for:
- AAP API availability
- Job execution success rates
- Application error rates
- Response times

Example Prometheus alerts:
```yaml
- alert: AAPConnectionFailed
  expr: ctf_aap_connection_status != 1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "CTF application cannot connect to AAP"
```

