#!/bin/bash

# CTF Tracker Interactive Deployment Script for OpenShift
# This script collects user input and deploys the CTF application securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_prompt() {
    echo -e "${PURPLE}[INPUT]${NC} $1"
}

# Configuration file paths
CONFIG_FILE="config.env"
CONFIG_TEMPLATE="config.template"

# Function to generate random secret key
generate_secret_key() {
    openssl rand -hex 32
}

# Function to encode string to base64
encode_base64() {
    echo -n "$1" | base64 | tr -d '\n'
}

# Function to collect user input
collect_user_input() {
    echo_info "Starting CTF Tracker Deployment Configuration"
    echo "============================================="
    echo ""
    
    # OpenShift Configuration
    echo_info "OpenShift Configuration"
    echo_prompt "Enter your OpenShift cluster domain (e.g., apps.cluster-xyz.sandbox.opentlc.com):"
    read -r OPENSHIFT_CLUSTER_DOMAIN
    
    echo_prompt "Enter OpenShift project name [ctf-project]:"
    read -r OPENSHIFT_PROJECT_NAME
    OPENSHIFT_PROJECT_NAME=${OPENSHIFT_PROJECT_NAME:-ctf-project}
    
    # Storage Configuration
    echo ""
    echo_info "Storage Configuration"
    echo_prompt "Enter storage class [gp3-csi]:"
    read -r STORAGE_CLASS
    STORAGE_CLASS=${STORAGE_CLASS:-gp3-csi}
    
    echo_prompt "Enter storage size [1Gi]:"
    read -r STORAGE_SIZE
    STORAGE_SIZE=${STORAGE_SIZE:-1Gi}
    
    # Application Security
    echo ""
    echo_info "Application Security"
    echo_prompt "Generate random secret key? [Y/n]:"
    read -r GENERATE_SECRET
    if [[ $GENERATE_SECRET =~ ^[Nn]$ ]]; then
        echo_prompt "Enter your application secret key:"
        read -s -r APP_SECRET_KEY
        echo ""
    else
        APP_SECRET_KEY=$(generate_secret_key)
        echo_info "Generated random secret key"
    fi
    
    # Default AAP Configuration (Optional)
    echo ""
    echo_info "Default AAP Configuration (Optional)"
    echo_warning "You can skip this and add AAP clusters via the web interface later"
    echo_prompt "Configure default AAP cluster? [y/N]:"
    read -r CONFIGURE_AAP
    
    if [[ $CONFIGURE_AAP =~ ^[Yy]$ ]]; then
        DEFAULT_AAP_ENABLED=true
        echo_prompt "Enter AAP base URL (e.g., https://controller.example.com):"
        read -r DEFAULT_AAP_BASE_URL
        
        echo_prompt "Enter AAP username:"
        read -r DEFAULT_AAP_USERNAME
        
        echo_prompt "Enter AAP password:"
        read -s -r DEFAULT_AAP_PASSWORD
        echo ""
        
        echo_prompt "Enter AAP job template ID for challenge verification [1]:"
        read -r DEFAULT_AAP_JOB_TEMPLATE_ID
        DEFAULT_AAP_JOB_TEMPLATE_ID=${DEFAULT_AAP_JOB_TEMPLATE_ID:-1}
        
        echo_prompt "Enter AAP job template ID for connectivity testing [2]:"
        read -r DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID
        DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID=${DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID:-2}
        
        echo_prompt "Verify SSL certificates? [Y/n]:"
        read -r VERIFY_SSL
        if [[ $VERIFY_SSL =~ ^[Nn]$ ]]; then
            DEFAULT_AAP_VERIFY_SSL=false
        else
            DEFAULT_AAP_VERIFY_SSL=true
        fi
    else
        DEFAULT_AAP_ENABLED=false
        DEFAULT_AAP_BASE_URL=""
        DEFAULT_AAP_USERNAME=""
        DEFAULT_AAP_PASSWORD=""
        DEFAULT_AAP_JOB_TEMPLATE_ID=1
        DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID=2
        DEFAULT_AAP_VERIFY_SSL=true
    fi
    
    # Application Settings
    echo ""
    echo_info "Application Settings"
    echo_prompt "Auto-refresh interval in seconds [30]:"
    read -r AUTO_REFRESH_INTERVAL
    AUTO_REFRESH_INTERVAL=${AUTO_REFRESH_INTERVAL:-30}
    
    echo_prompt "Maximum concurrent checks [5]:"
    read -r MAX_CONCURRENT_CHECKS
    MAX_CONCURRENT_CHECKS=${MAX_CONCURRENT_CHECKS:-5}
    
    echo_prompt "Enable debug mode? [y/N]:"
    read -r DEBUG_MODE
    if [[ $DEBUG_MODE =~ ^[Yy]$ ]]; then
        FLASK_DEBUG=true
    else
        FLASK_DEBUG=false
    fi
}

# Function to validate inputs
validate_inputs() {
    echo_info "Validating configuration..."
    
    if [[ -z "$OPENSHIFT_CLUSTER_DOMAIN" ]]; then
        echo_error "OpenShift cluster domain is required"
        exit 1
    fi
    
    if [[ -z "$APP_SECRET_KEY" ]]; then
        echo_error "Application secret key is required"
        exit 1
    fi
    
    if [[ $DEFAULT_AAP_ENABLED == true ]]; then
        if [[ -z "$DEFAULT_AAP_BASE_URL" || -z "$DEFAULT_AAP_USERNAME" || -z "$DEFAULT_AAP_PASSWORD" ]]; then
            echo_error "AAP configuration is incomplete"
            exit 1
        fi
        
        # Test AAP connectivity
        echo_info "Testing AAP connectivity..."
        if ! curl -k -s --connect-timeout 10 "${DEFAULT_AAP_BASE_URL}/api/v2/ping/" > /dev/null; then
            echo_warning "Warning: Could not connect to AAP cluster. Proceeding anyway..."
        else
            echo_success "AAP connectivity test passed"
        fi
    fi
    
    echo_success "Configuration validation passed"
}

# Function to save configuration
save_configuration() {
    echo_info "Saving configuration to $CONFIG_FILE..."
    
    cat > "$CONFIG_FILE" << EOF
# CTF Tracker Configuration
# Generated on $(date)

# OpenShift Cluster Configuration
OPENSHIFT_CLUSTER_DOMAIN=$OPENSHIFT_CLUSTER_DOMAIN
OPENSHIFT_PROJECT_NAME=$OPENSHIFT_PROJECT_NAME

# Default AAP Configuration
DEFAULT_AAP_ENABLED=$DEFAULT_AAP_ENABLED
DEFAULT_AAP_BASE_URL=$DEFAULT_AAP_BASE_URL
DEFAULT_AAP_USERNAME=$DEFAULT_AAP_USERNAME
DEFAULT_AAP_PASSWORD=$DEFAULT_AAP_PASSWORD
DEFAULT_AAP_JOB_TEMPLATE_ID=$DEFAULT_AAP_JOB_TEMPLATE_ID
DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID=$DEFAULT_AAP_CONNECTIVITY_TEMPLATE_ID
DEFAULT_AAP_VERIFY_SSL=$DEFAULT_AAP_VERIFY_SSL

# Application Configuration
APP_SECRET_KEY=$APP_SECRET_KEY
DATABASE_DIR=/app/data
AUTO_REFRESH_INTERVAL=$AUTO_REFRESH_INTERVAL
MAX_CONCURRENT_CHECKS=$MAX_CONCURRENT_CHECKS

# Storage Configuration
STORAGE_CLASS=$STORAGE_CLASS
STORAGE_SIZE=$STORAGE_SIZE

# Security Configuration
FLASK_DEBUG=$FLASK_DEBUG
EOF

    echo_success "Configuration saved"
}

# Function to generate deployment files from templates
generate_deployment_files() {
    echo_info "Generating deployment files from templates..."
    
    # Load configuration
    source "$CONFIG_FILE"
    
    # Generate base64 encoded values
    APP_SECRET_KEY_B64=$(encode_base64 "$APP_SECRET_KEY")
    DEFAULT_AAP_USERNAME_B64=$(encode_base64 "$DEFAULT_AAP_USERNAME")
    DEFAULT_AAP_PASSWORD_B64=$(encode_base64 "$DEFAULT_AAP_PASSWORD")
    
    # Generate openshift-configs.yaml
    envsubst << 'EOF' > openshift-configs.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ctf-tracker-config
  labels:
    app: ctf-tracker
data:
  # SSH configuration for connecting to RHEL machines
  ssh_config: |
    Host *
        StrictHostKeyChecking no
        UserKnownHostsFile /dev/null
        ConnectTimeout 10
        ServerAliveInterval 60
        ServerAliveCountMax 3
  
  # Application configuration
  app_config.py: |
    import os
    
    # Flask configuration
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-in-production')
    
    # Database configuration
    DATABASE_PATH = os.getenv('DATABASE', '${DATABASE_DIR}/ctf_tracker.db')
    
    # AAP integration settings
    AAP_BASE_URL = os.getenv('AAP_BASE_URL', '${DEFAULT_AAP_BASE_URL}')
    AAP_USERNAME = os.getenv('AAP_USERNAME', '')
    AAP_PASSWORD = os.getenv('AAP_PASSWORD', '')
    AAP_JOB_TEMPLATE_ID = os.getenv('AAP_JOB_TEMPLATE_ID', '${DEFAULT_AAP_JOB_TEMPLATE_ID}')
    AAP_VERIFY_SSL = os.getenv('AAP_VERIFY_SSL', '${DEFAULT_AAP_VERIFY_SSL}').lower() == 'true'
    
    # Application settings
    AUTO_REFRESH_INTERVAL = int(os.getenv('AUTO_REFRESH_INTERVAL', '${AUTO_REFRESH_INTERVAL}'))
    MAX_CONCURRENT_CHECKS = int(os.getenv('MAX_CONCURRENT_CHECKS', '${MAX_CONCURRENT_CHECKS}'))
---
apiVersion: v1
kind: Secret
metadata:
  name: ctf-tracker-secrets
  labels:
    app: ctf-tracker
type: Opaque
data:
  secret-key: ${APP_SECRET_KEY_B64}
  aap-username: ${DEFAULT_AAP_USERNAME_B64}
  aap-password: ${DEFAULT_AAP_PASSWORD_B64}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ctf-tracker-role
  labels:
    app: ctf-tracker
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ctf-tracker-rolebinding
  labels:
    app: ctf-tracker
subjects:
- kind: ServiceAccount
  name: default
  namespace: ${OPENSHIFT_PROJECT_NAME}
roleRef:
  kind: Role
  name: ctf-tracker-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ctf-tracker-netpol
  labels:
    app: ctf-tracker
spec:
  podSelector:
    matchLabels:
      app: ctf-tracker
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 22
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
EOF

    # Generate openshift-deployment.yaml
    envsubst << 'EOF' > openshift-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ctf-tracker
  labels:
    app: ctf-tracker
    app.kubernetes.io/component: backend
    app.kubernetes.io/instance: ctf-tracker
    app.kubernetes.io/name: ctf-tracker
    app.kubernetes.io/part-of: ctf-tracker-app
    app.openshift.io/runtime: python
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ctf-tracker
  template:
    metadata:
      labels:
        app: ctf-tracker
        deploymentconfig: ctf-tracker
    spec:
      containers:
      - name: ctf-tracker
        image: ctf-tracker:latest
        ports:
        - containerPort: 8080
          protocol: TCP
        env:
        - name: FLASK_ENV
          value: "production"
        - name: FLASK_DEBUG
          value: "${FLASK_DEBUG}"
        - name: DATABASE_DIR
          value: "${DATABASE_DIR}"
        - name: AAP_BASE_URL
          value: "${DEFAULT_AAP_BASE_URL}"
        - name: AAP_USERNAME
          valueFrom:
            secretKeyRef:
              name: ctf-tracker-secrets
              key: aap-username
        - name: AAP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ctf-tracker-secrets
              key: aap-password
        - name: AAP_JOB_TEMPLATE_ID
          value: "${DEFAULT_AAP_JOB_TEMPLATE_ID}"
        - name: AAP_VERIFY_SSL
          value: "${DEFAULT_AAP_VERIFY_SSL}"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: ctf-tracker-secrets
              key: secret-key
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          capabilities:
            drop:
            - ALL
          seccompProfile:
            type: RuntimeDefault
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: ctf-tracker-data
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
---
apiVersion: v1
kind: Service
metadata:
  name: ctf-tracker-service
  labels:
    app: ctf-tracker
spec:
  ports:
  - name: 8080-tcp
    port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    app: ctf-tracker
  type: ClusterIP
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ctf-tracker-route
  labels:
    app: ctf-tracker
spec:
  host: ctf-tracker-${OPENSHIFT_PROJECT_NAME}.${OPENSHIFT_CLUSTER_DOMAIN}
  to:
    kind: Service
    name: ctf-tracker-service
    weight: 100
  port:
    targetPort: 8080-tcp
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
  wildcardPolicy: None
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ctf-tracker-data
  labels:
    app: ctf-tracker
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: ${STORAGE_SIZE}
  storageClassName: ${STORAGE_CLASS}
EOF

    echo_success "Deployment files generated successfully"
}

# Function to check OpenShift login
check_openshift_login() {
    echo_info "Checking OpenShift login status..."
    if ! oc whoami &> /dev/null; then
        echo_error "Not logged into OpenShift. Please run 'oc login' first."
        exit 1
    fi
    echo_success "OpenShift login verified"
}

# Function to setup project
setup_project() {
    source "$CONFIG_FILE"
    
    echo_info "Setting up OpenShift project: $OPENSHIFT_PROJECT_NAME"
    
    if oc get project "$OPENSHIFT_PROJECT_NAME" &> /dev/null; then
        echo_info "Project $OPENSHIFT_PROJECT_NAME already exists, switching to it"
        oc project "$OPENSHIFT_PROJECT_NAME"
    else
        echo_info "Creating new project: $OPENSHIFT_PROJECT_NAME"
        oc new-project "$OPENSHIFT_PROJECT_NAME" --display-name="CTF Tracker Application"
    fi
    echo_success "Project setup complete"
}

# Function to build image
build_image() {
    echo_info "Building application image..."
    
    # Create a build config if it doesn't exist
    if ! oc get bc ctf-tracker &> /dev/null; then
        echo_info "Creating new build configuration"
        oc new-build --strategy docker --binary --name ctf-tracker
    fi
    
    # Start the build
    echo_info "Starting binary build..."
    oc start-build ctf-tracker --from-dir=. --follow
    
    echo_success "Image build complete"
}

# Function to deploy application
deploy_application() {
    echo_info "Deploying application..."
    
    # Apply the deployment configurations
    echo_info "Applying OpenShift configurations..."
    oc apply -f openshift-configs.yaml
    oc apply -f openshift-deployment.yaml
    
    echo_success "Application deployed"
}

# Function to wait for deployment
wait_for_deployment() {
    echo_info "Waiting for deployment to be ready..."
    oc rollout status deployment/ctf-tracker --timeout=300s
    echo_success "Deployment is ready"
}

# Function to show deployment info
show_deployment_info() {
    source "$CONFIG_FILE"
    
    echo_info "Deployment Information:"
    echo "======================"
    
    # Get route URL
    ROUTE_URL="https://ctf-tracker-${OPENSHIFT_PROJECT_NAME}.${OPENSHIFT_CLUSTER_DOMAIN}"
    echo_success "Application URL: $ROUTE_URL"
    
    # Show pod status
    echo ""
    echo_info "Pod Status:"
    oc get pods -l app=ctf-tracker
    
    # Show service status
    echo ""
    echo_info "Service Status:"
    oc get svc ctf-tracker-service
    
    echo ""
    echo_info "Configuration Summary:"
    echo "- Project: $OPENSHIFT_PROJECT_NAME"
    echo "- Storage: $STORAGE_SIZE ($STORAGE_CLASS)"
    echo "- AAP Integration: $([ "$DEFAULT_AAP_ENABLED" = "true" ] && echo "Enabled" || echo "Disabled")"
    echo "- Debug Mode: $FLASK_DEBUG"
    
    echo ""
    echo_info "To view logs, run: oc logs -f deployment/ctf-tracker"
    echo_info "To access the application shell, run: oc rsh deployment/ctf-tracker"
}

# Main deployment function
main() {
    echo_info "CTF Tracker Interactive Deployment"
    echo "=================================="
    echo ""
    
    # Check if config file exists
    if [[ -f "$CONFIG_FILE" ]]; then
        echo_warning "Configuration file $CONFIG_FILE already exists."
        echo_prompt "Use existing configuration? [Y/n]:"
        read -r USE_EXISTING
        if [[ ! $USE_EXISTING =~ ^[Nn]$ ]]; then
            echo_info "Using existing configuration"
        else
            collect_user_input
            validate_inputs
            save_configuration
        fi
    else
        collect_user_input
        validate_inputs
        save_configuration
    fi
    
    generate_deployment_files
    check_openshift_login
    setup_project
    build_image
    deploy_application
    wait_for_deployment
    show_deployment_info
    
    echo ""
    echo_success "CTF Tracker deployment completed successfully!"
    echo_info "You can now access the application and add additional AAP clusters via the web interface."
}

# Handle script arguments
case "${1:-deploy}" in
    "configure")
        collect_user_input
        validate_inputs
        save_configuration
        echo_success "Configuration saved. Run './deploy.sh' to deploy."
        ;;
    "deploy")
        main
        ;;
    "generate")
        if [[ ! -f "$CONFIG_FILE" ]]; then
            echo_error "Configuration file not found. Run './deploy.sh configure' first."
            exit 1
        fi
        generate_deployment_files
        echo_success "Deployment files generated"
        ;;
    "clean")
        source "$CONFIG_FILE" 2>/dev/null || true
        PROJECT_NAME=${OPENSHIFT_PROJECT_NAME:-ctf-project}
        echo_warning "This will delete the entire CTF Tracker application and project: $PROJECT_NAME"
        echo_prompt "Are you sure? (y/N): "
        read -r -n 1 REPLY
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            check_openshift_login
            oc delete project "$PROJECT_NAME"
            rm -f openshift-configs.yaml openshift-deployment.yaml "$CONFIG_FILE"
            echo_success "Application and project deleted"
        else
            echo_info "Cleanup cancelled"
        fi
        ;;
    "help")
        echo "CTF Tracker Interactive Deployment Script"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  configure  - Only collect and save configuration"
        echo "  deploy     - Full deployment (default)"
        echo "  generate   - Generate deployment files from existing config"
        echo "  clean      - Delete the application and project"
        echo "  help       - Show this help message"
        ;;
    *)
        echo_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac


