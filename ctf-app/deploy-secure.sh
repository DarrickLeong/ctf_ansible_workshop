#!/bin/bash

# CTF Tracker Secure Interactive Deployment Script for OpenShift
# This script collects user input and deploys the CTF application securely
# NOTE: No sensitive information is stored in files - all handled in-memory

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

# Function to generate random secret key
generate_secret_key() {
    openssl rand -hex 32
}

# Function to encode string to base64
encode_base64() {
    echo -n "$1" | base64 | tr -d '\n'
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    if ! command_exists oc; then
        echo_error "OpenShift CLI (oc) not found. Please install it first."
        exit 1
    fi
    
    if ! oc whoami >/dev/null 2>&1; then
        echo_error "Not logged into OpenShift. Please run 'oc login' first."
        exit 1
    fi
    
    echo_success "Prerequisites check passed"
}

# Function to collect deployment configuration
collect_configuration() {
    echo_info "CTF Tracker Secure Deployment Configuration"
    echo "============================================="
    echo
    
    # OpenShift Configuration
    echo_info "OpenShift Configuration"
    CURRENT_CLUSTER=$(oc whoami --show-server | sed 's|.*//api\.\(.*\):.*|\1|')
    echo_prompt "Enter your OpenShift cluster domain (e.g., apps.your-cluster.sandbox.opentlc.com):"
    read -r OPENSHIFT_CLUSTER_DOMAIN
    OPENSHIFT_CLUSTER_DOMAIN=${OPENSHIFT_CLUSTER_DOMAIN:-apps.$CURRENT_CLUSTER}
    
    echo_prompt "Enter OpenShift project name [ctf-project]:"
    read -r OPENSHIFT_PROJECT_NAME
    OPENSHIFT_PROJECT_NAME=${OPENSHIFT_PROJECT_NAME:-ctf-project}
    
    # Registry Authentication
    echo
    echo_info "Container Registry Authentication"
    echo_warning "To resolve image pull issues, we'll configure registry authentication"
    echo_prompt "Do you have Red Hat registry credentials? [y/N]:"
    read -r CONFIGURE_REGISTRY
    
    if [[ $CONFIGURE_REGISTRY =~ ^[Yy]$ ]]; then
        echo_prompt "Enter Red Hat registry username:"
        read -r REGISTRY_USERNAME
        echo_prompt "Enter Red Hat registry password (hidden):"
        read -s REGISTRY_PASSWORD
        echo
        echo_info "Registry credentials will be configured securely"
        REGISTRY_AUTH_ENABLED=true
    else
        echo_info "Using public images only (may have limitations)"
        REGISTRY_AUTH_ENABLED=false
    fi
    
    # Application Configuration
    echo
    echo_info "Application Security"
    echo_prompt "Generate random secret key? [Y/n]:"
    read -r GENERATE_SECRET
    if [[ ! $GENERATE_SECRET =~ ^[Nn]$ ]]; then
        APP_SECRET_KEY=$(generate_secret_key)
        echo_info "Generated random secret key"
    else
        echo_prompt "Enter custom secret key:"
        read -s APP_SECRET_KEY
        echo
    fi
    
    # Storage Configuration
    echo
    echo_info "Storage Configuration"
    AVAILABLE_STORAGE=$(oc get storageclass -o name | head -1 | sed 's|storageclass.storage.k8s.io/||')
    echo_prompt "Enter storage class [$AVAILABLE_STORAGE]:"
    read -r STORAGE_CLASS
    STORAGE_CLASS=${STORAGE_CLASS:-$AVAILABLE_STORAGE}
    
    echo_prompt "Enter storage size [1Gi]:"
    read -r STORAGE_SIZE
    STORAGE_SIZE=${STORAGE_SIZE:-1Gi}
    
    # Application Settings
    echo
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
    
    echo_success "Configuration collected"
}

# Function to create project if it doesn't exist
create_project() {
    echo_info "Setting up OpenShift project..."
    
    if oc get project "$OPENSHIFT_PROJECT_NAME" >/dev/null 2>&1; then
        echo_info "Project $OPENSHIFT_PROJECT_NAME already exists"
        oc project "$OPENSHIFT_PROJECT_NAME"
    else
        oc new-project "$OPENSHIFT_PROJECT_NAME"
        echo_success "Created project $OPENSHIFT_PROJECT_NAME"
    fi
}

# Function to configure registry authentication
configure_registry_auth() {
    if [[ $REGISTRY_AUTH_ENABLED == "true" ]]; then
        echo_info "Configuring container registry authentication..."
        
        # Create registry secret
        oc create secret docker-registry redhat-registry \
            --docker-server=registry.redhat.io \
            --docker-username="$REGISTRY_USERNAME" \
            --docker-password="$REGISTRY_PASSWORD" \
            --docker-email="$REGISTRY_USERNAME@redhat.com" \
            --dry-run=client -o yaml | oc apply -f -
        
        # Link secret to default service account
        oc secrets link default redhat-registry --for=pull
        
        echo_success "Registry authentication configured"
    fi
}

# Function to create application secret
create_app_secret() {
    echo_info "Creating application secret..."
    
    oc create secret generic ctf-tracker-secret \
        --from-literal=app-secret-key="$APP_SECRET_KEY" \
        --dry-run=client -o yaml | oc apply -f -
    
    echo_success "Application secret created"
}

# Function to deploy application using in-memory templates
deploy_application() {
    echo_info "Deploying CTF Tracker application..."
    
    # Generate PVC
    cat <<EOF | oc apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ctf-tracker-data
  labels:
    app: ctf-tracker
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: $STORAGE_CLASS
  resources:
    requests:
      storage: $STORAGE_SIZE
EOF

    # Generate ConfigMap
    cat <<EOF | oc apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: ctf-tracker-config
  labels:
    app: ctf-tracker
data:
  ssh_config: |
    Host *
        StrictHostKeyChecking no
        UserKnownHostsFile /dev/null
        ConnectTimeout 10
        ServerAliveInterval 60
        ServerAliveCountMax 3
EOF

    # Use source-to-image build strategy
    echo_info "Creating application from source..."
    
    if [[ $REGISTRY_AUTH_ENABLED == "true" ]]; then
        # Use Red Hat UBI Python image
        oc new-app registry.access.redhat.com/ubi8/python-39~https://github.com/DarrickLeong/ctf_ansible_workshop.git \
            --context-dir=ctf-app \
            --name=ctf-tracker \
            --env=FLASK_ENV=production \
            --env=FLASK_DEBUG=$FLASK_DEBUG \
            --env=DATABASE_DIR=/app/data \
            --env=AUTO_REFRESH_INTERVAL=$AUTO_REFRESH_INTERVAL \
            --env=MAX_CONCURRENT_CHECKS=$MAX_CONCURRENT_CHECKS
    else
        # Use OpenShift built-in Python image
        oc new-app python:3.9-ubi8~https://github.com/DarrickLeong/ctf_ansible_workshop.git \
            --context-dir=ctf-app \
            --name=ctf-tracker \
            --env=FLASK_ENV=production \
            --env=FLASK_DEBUG=$FLASK_DEBUG \
            --env=DATABASE_DIR=/app/data \
            --env=AUTO_REFRESH_INTERVAL=$AUTO_REFRESH_INTERVAL \
            --env=MAX_CONCURRENT_CHECKS=$MAX_CONCURRENT_CHECKS
    fi
    
    # Wait for build to be created
    sleep 5
    
    # Follow build logs
    echo_info "Following build logs..."
    oc logs -f buildconfig/ctf-tracker || true
    
    # Patch deployment to add persistent storage and secrets
    echo_info "Configuring deployment..."
    
    oc patch deployment/ctf-tracker -p '{
        "spec": {
            "template": {
                "spec": {
                    "containers": [
                        {
                            "name": "ctf-tracker",
                            "env": [
                                {
                                    "name": "SECRET_KEY",
                                    "valueFrom": {
                                        "secretKeyRef": {
                                            "name": "ctf-tracker-secret",
                                            "key": "app-secret-key"
                                        }
                                    }
                                }
                            ],
                            "volumeMounts": [
                                {
                                    "name": "data-volume",
                                    "mountPath": "/app/data"
                                },
                                {
                                    "name": "ssh-config",
                                    "mountPath": "/app/.ssh"
                                }
                            ]
                        }
                    ],
                    "volumes": [
                        {
                            "name": "data-volume",
                            "persistentVolumeClaim": {
                                "claimName": "ctf-tracker-data"
                            }
                        },
                        {
                            "name": "ssh-config",
                            "configMap": {
                                "name": "ctf-tracker-config",
                                "items": [
                                    {
                                        "key": "ssh_config",
                                        "path": "config"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }'
    
    # Expose service if not already exposed
    if ! oc get route ctf-tracker >/dev/null 2>&1; then
        oc expose service/ctf-tracker
    fi
    
    echo_success "Application deployment configured"
}

# Function to display deployment information
show_deployment_info() {
    echo
    echo_success "CTF Tracker Deployment Complete!"
    echo "================================="
    echo
    
    APP_URL=$(oc get route ctf-tracker -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not available")
    echo_info "Application URL: https://$APP_URL"
    echo_info "Project: $OPENSHIFT_PROJECT_NAME"
    echo_info "Storage: $STORAGE_SIZE on $STORAGE_CLASS"
    echo
    
    echo_info "Checking pod status..."
    oc get pods -l app=ctf-tracker
    echo
    
    echo_warning "Next Steps:"
    echo "1. Wait for the build to complete and pods to be running"
    echo "2. Access your CTF Tracker at: https://$APP_URL"
    echo "3. Use this URL in your central controller job template:"
    echo "   ctf_tracker_url: https://$APP_URL"
    echo
    
    echo_info "To monitor deployment:"
    echo "oc get pods -w"
    echo "oc logs -f deployment/ctf-tracker"
}

# Main execution
main() {
    echo_info "CTF Tracker Secure Deployment"
    echo "============================="
    echo
    
    check_prerequisites
    collect_configuration
    create_project
    configure_registry_auth
    create_app_secret
    deploy_application
    show_deployment_info
}

# Run main function
main "$@"
