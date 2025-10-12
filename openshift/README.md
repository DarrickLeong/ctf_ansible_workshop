# OpenShift Deployment Templates

Container deployment templates for the CTF Tracker application.

## 📁 Templates

- **`openshift-deployment.template.yaml`** - Main application deployment template
- **`openshift-configs.template.yaml`** - ConfigMaps and Secrets template

## 🚀 Usage

These templates are used automatically by the **CTF app deployment script**:

```bash
cd ctf-app/
./deploy-interactive.sh
```

The script processes these templates with your configuration and deploys to OpenShift.

## 🔧 Template Variables

The templates use these variables (automatically substituted):

- **`${OPENSHIFT_DOMAIN}`** - Your OpenShift cluster domain
- **`${PROJECT_NAME}`** - OpenShift project/namespace name  
- **`${APP_NAME}`** - Application name (default: ctf-tracker)
- **`${STORAGE_CLASS}`** - Storage class for persistent volumes
- **`${CTF_TRACKER_URL}`** - Full URL of the deployed application

## 🏗️ What Gets Created

### **Application Resources**
- **Deployment**: CTF Tracker application pods with security contexts
- **Service**: Internal service discovery  
- **Route**: External HTTPS access
- **PersistentVolumeClaim**: SQLite database storage

### **Configuration**
- **ConfigMap**: Application environment variables
- **Secret**: Sensitive credentials (encrypted)

### **Security**
- **SecurityContext**: Non-root container execution
- **NetworkPolicy**: Traffic restriction rules  
- **RBAC**: Minimal required permissions

## 🔧 Manual Deployment

If you prefer to deploy manually:

```bash
# Set environment variables
export OPENSHIFT_DOMAIN="apps.your-cluster.com"
export PROJECT_NAME="ctf-tracker"
export APP_NAME="ctf-tracker"
export STORAGE_CLASS="gp2"

# Process and apply templates
oc process -f openshift-configs.template.yaml \
  -p OPENSHIFT_DOMAIN=${OPENSHIFT_DOMAIN} \
  -p PROJECT_NAME=${PROJECT_NAME} \
  -p APP_NAME=${APP_NAME} | oc apply -f -

oc process -f openshift-deployment.template.yaml \
  -p OPENSHIFT_DOMAIN=${OPENSHIFT_DOMAIN} \
  -p PROJECT_NAME=${PROJECT_NAME} \
  -p APP_NAME=${APP_NAME} \
  -p STORAGE_CLASS=${STORAGE_CLASS} | oc apply -f -
```

## ✅ Verification

After deployment:

```bash
# Check all resources
oc get all -l app=ctf-tracker

# Check persistent storage
oc get pvc

# Get application URL
oc get route
```

---

**Templates ready for container deployment!** 🐳
