# OpenShift Deployment Templates

Container deployment templates for the CTF Tracker Node.js application.

## 📁 Templates

- **`openshift-deployment.template.yaml`** - Main application deployment template
- **`openshift-configs.template.yaml`** - ConfigMaps and Secrets template

## 🚀 Usage

### **Recommended: Node.js S2I Deployment**

Deploy the Node.js CTF Tracker using OpenShift's Source-to-Image (S2I) builder:

```bash
cd ctf-tracker-nodejs/

# Deploy using OpenShift Node.js S2I builder
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=ctf-tracker-nodejs \
  --name=ctf-tracker-nodejs

# Expose the service
oc expose service ctf-tracker-nodejs

# Get the route URL
oc get route ctf-tracker-nodejs
```

**⚠️ IMPORTANT**: Replace `YOUR-ORG` with your GitHub organization or username.

### **Alternative: Template-Based Deployment**

If you prefer using OpenShift templates, the provided templates can be customized for the Node.js application.

## 🔧 Template Variables

The templates use these variables (substitute with your actual values):

- **`${OPENSHIFT_DOMAIN}`** - Your OpenShift cluster domain (e.g., `apps.YOUR-CLUSTER.com`)
- **`${PROJECT_NAME}`** - OpenShift project/namespace name  
- **`${APP_NAME}`** - Application name (default: `ctf-tracker-nodejs`)
- **`${STORAGE_CLASS}`** - Storage class for persistent volumes
- **`${CTF_TRACKER_URL}`** - Full URL of the deployed application

**⚠️ SECURITY NOTE**: Never hardcode actual cluster URLs in git-committed files!

## 🏗️ What Gets Created

### **Application Resources**
- **Deployment**: CTF Tracker Node.js application pods with security contexts
- **Service**: Internal service discovery on port 8080
- **Route**: External HTTP/HTTPS access
- **PersistentVolumeClaim**: SQLite database storage (optional)

### **Configuration**
- **ConfigMap**: Application environment variables (PORT, DATABASE_DIR)
- **Secret**: Sensitive credentials if needed (encrypted)

### **Security**
- **SecurityContext**: Non-root container execution
- **NetworkPolicy**: Traffic restriction rules (optional)
- **RBAC**: Minimal required permissions

## 🔧 Manual Template Deployment

If you prefer to deploy using templates instead of S2I:

```bash
# Set environment variables (replace with your actual values)
export OPENSHIFT_DOMAIN="apps.YOUR-CLUSTER.com"
export PROJECT_NAME="ctf-tracker"
export APP_NAME="ctf-tracker-nodejs"
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

**⚠️ IMPORTANT**: Replace `YOUR-CLUSTER.com` with your actual OpenShift cluster domain!

## ✅ Verification

After deployment:

```bash
# Check all resources
oc get all -l app=ctf-tracker-nodejs

# Check persistent storage (if using PVC)
oc get pvc

# Get application URL
oc get route ctf-tracker-nodejs

# Test the application
curl http://$(oc get route ctf-tracker-nodejs -o jsonpath='{.spec.host}')/health
```

Expected health check response:
```json
{"status":"healthy","uptime":123.45}
```

---

**Node.js templates ready for container deployment!** 🐳
