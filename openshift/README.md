# OpenShift Deployment Templates

This folder contains OpenShift/Kubernetes deployment templates for the CTF Tracker application.

## 📁 Contents

- **`openshift-deployment.template.yaml`** - Main application deployment template
- **`openshift-configs.template.yaml`** - ConfigMaps and Secrets template

## 🚀 Deployment

These templates are used by the interactive deployment script (`ctf-app/deploy-interactive.sh`) to deploy the CTF Tracker to OpenShift.

### **Template Variables**
The templates use the following variables that get substituted during deployment:

- **`${OPENSHIFT_DOMAIN}`** - Your OpenShift cluster domain
- **`${PROJECT_NAME}`** - OpenShift project/namespace name
- **`${APP_NAME}`** - Application name (default: ctf-tracker)
- **`${STORAGE_CLASS}`** - Storage class for persistent volumes
- **`${CTF_TRACKER_URL}`** - Full URL of the deployed application

### **Manual Deployment**
If you prefer to deploy manually:

```bash
# Set environment variables
export OPENSHIFT_DOMAIN="apps.your-cluster.com"
export PROJECT_NAME="ctf-tracker"
export APP_NAME="ctf-tracker"
export STORAGE_CLASS="gp2"
export CTF_TRACKER_URL="https://ctf-tracker-ctf-tracker.apps.your-cluster.com"

# Process and apply templates
oc process -f openshift-configs.template.yaml \
  --param-file=<(env | grep -E '^(OPENSHIFT_DOMAIN|PROJECT_NAME|APP_NAME)=') \
  | oc apply -f -

oc process -f openshift-deployment.template.yaml \
  --param-file=<(env | grep -E '^(OPENSHIFT_DOMAIN|PROJECT_NAME|APP_NAME|STORAGE_CLASS)=') \
  | oc apply -f -
```

## 🏗️ Architecture

The deployment creates:

### **Application Components**
- **Deployment**: CTF Tracker application pods
- **Service**: Internal service discovery
- **Route**: External access via OpenShift router
- **PersistentVolumeClaim**: Storage for SQLite database

### **Configuration**
- **ConfigMap**: Application configuration
- **Secret**: Sensitive credentials (encrypted)

### **Security**
- **SecurityContext**: Non-root container execution
- **NetworkPolicy**: Traffic restriction rules
- **RBAC**: Minimal required permissions

## 🔧 Customization

### **Resource Requirements**
Modify in `openshift-deployment.template.yaml`:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### **Storage Configuration**
Adjust storage size and class:
```yaml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: ${STORAGE_CLASS}
```

### **Environment Variables**
Add new environment variables in the deployment template:
```yaml
env:
  - name: NEW_SETTING
    value: "${NEW_SETTING}"
```

---

**Container-ready CTF infrastructure!** 🐳
