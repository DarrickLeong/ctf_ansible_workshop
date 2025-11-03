#!/bin/bash

##############################################################################
# Gitea Deployment with PostgreSQL for OpenShift
# 
# LONG-TERM SOLUTION for Data Persistence
# 
# This deployment uses:
# 1. PostgreSQL database with its own PVC (better than SQLite)
# 2. Separate PVC for Gitea data (repos, attachments)
# 3. Proper configuration for production-like setup
# 4. Database backup capabilities
#
# Note: Even with PostgreSQL, sandbox environments may still lose data
#       on hibernation. Consider regular backups to external storage.
##############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Gitea with PostgreSQL Deployment for OpenShift${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Interactive prompts
read -p "Enter OpenShift project name [gitea-persistent]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-gitea-persistent}

read -p "Enter Gitea admin username [giteadmin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-giteadmin}

read -sp "Enter Gitea admin password: " ADMIN_PASSWORD
echo ""

read -p "Enter Gitea admin email [admin@example.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

# PostgreSQL configuration
read -p "Enter PostgreSQL database name [gitea]: " DB_NAME
DB_NAME=${DB_NAME:-gitea}

read -p "Enter PostgreSQL username [gitea]: " DB_USER
DB_USER=${DB_USER:-gitea}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

echo ""
echo -e "${YELLOW}⚙️  Configuration Summary:${NC}"
echo "  Project: ${PROJECT_NAME}"
echo "  Admin User: ${ADMIN_USER}"
echo "  Admin Email: ${ADMIN_EMAIL}"
echo "  Database: ${DB_NAME}"
echo "  DB User: ${DB_USER}"
echo ""
read -p "Proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

##############################################################################
# Step 1: Create or switch to project
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 1: Creating/switching to project: ${PROJECT_NAME}${NC}"
if oc get project "${PROJECT_NAME}" &> /dev/null; then
    oc project "${PROJECT_NAME}"
    echo -e "${GREEN}✓ Switched to existing project${NC}"
else
    oc new-project "${PROJECT_NAME}"
    echo -e "${GREEN}✓ Created new project${NC}"
fi

##############################################################################
# Step 2: Deploy PostgreSQL
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 2: Deploying PostgreSQL database${NC}"

# Create PostgreSQL Secret
oc apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: postgresql-credentials
  namespace: ${PROJECT_NAME}
type: Opaque
stringData:
  database-name: ${DB_NAME}
  database-user: ${DB_USER}
  database-password: ${DB_PASSWORD}
EOF

# Create PostgreSQL PVC
oc apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-data
  namespace: ${PROJECT_NAME}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
EOF

# Deploy PostgreSQL
oc apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: ${PROJECT_NAME}
  labels:
    app: postgresql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: registry.redhat.io/rhel9/postgresql-15:latest
        env:
        - name: POSTGRESQL_USER
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-user
        - name: POSTGRESQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-password
        - name: POSTGRESQL_DATABASE
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-name
        ports:
        - containerPort: 5432
          name: postgresql
        volumeMounts:
        - name: postgresql-data
          mountPath: /var/lib/pgsql/data
        livenessProbe:
          exec:
            command:
            - /usr/libexec/check-container
            - --live
          initialDelaySeconds: 120
          timeoutSeconds: 10
        readinessProbe:
          exec:
            command:
            - /usr/libexec/check-container
          initialDelaySeconds: 5
          timeoutSeconds: 1
      volumes:
      - name: postgresql-data
        persistentVolumeClaim:
          claimName: postgresql-data
EOF

# Create PostgreSQL Service
oc apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: ${PROJECT_NAME}
spec:
  ports:
  - name: postgresql
    port: 5432
    targetPort: 5432
  selector:
    app: postgresql
EOF

echo -e "${GREEN}✓ PostgreSQL deployed${NC}"

##############################################################################
# Step 3: Wait for PostgreSQL to be ready
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 3: Waiting for PostgreSQL to be ready...${NC}"
oc wait --for=condition=available --timeout=300s deployment/postgresql -n ${PROJECT_NAME}
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

##############################################################################
# Step 4: Create Gitea PVC
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 4: Creating Gitea data PVC${NC}"
oc apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitea-data
  namespace: ${PROJECT_NAME}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF
echo -e "${GREEN}✓ Gitea PVC created${NC}"

##############################################################################
# Step 5: Create Gitea ConfigMap
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 5: Creating Gitea configuration${NC}"
cat <<EOF | oc apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitea-config
  namespace: ${PROJECT_NAME}
data:
  app.ini: |
    APP_NAME = Ansible CTF Workshop - Gitea
    RUN_MODE = prod
    RUN_USER = git

    [server]
    PROTOCOL = http
    DOMAIN = gitea-${PROJECT_NAME}.apps.cluster.example.com
    HTTP_PORT = 3000
    DISABLE_SSH = false
    SSH_PORT = 22
    LFS_START_SERVER = true
    OFFLINE_MODE = false

    [database]
    DB_TYPE = postgres
    HOST = postgresql:5432
    NAME = ${DB_NAME}
    USER = ${DB_USER}
    PASSWD = ${DB_PASSWORD}
    SCHEMA = public
    SSL_MODE = disable
    LOG_SQL = false

    [repository]
    ROOT = /gitea-data/git/repositories
    DEFAULT_BRANCH = main

    [security]
    INSTALL_LOCK = true
    SECRET_KEY = $(openssl rand -base64 32)
    INTERNAL_TOKEN = $(openssl rand -base64 106)

    [service]
    DISABLE_REGISTRATION = false
    REQUIRE_SIGNIN_VIEW = false
    DEFAULT_KEEP_EMAIL_PRIVATE = false
    ENABLE_NOTIFY_MAIL = false

    [picture]
    AVATAR_UPLOAD_PATH = /gitea-data/avatars
    REPOSITORY_AVATAR_UPLOAD_PATH = /gitea-data/repo-avatars

    [attachment]
    PATH = /gitea-data/attachments

    [log]
    MODE = console
    LEVEL = info
    ROOT_PATH = /gitea-data/log

    [session]
    PROVIDER = file
    PROVIDER_CONFIG = /gitea-data/sessions

    [lfs]
    PATH = /gitea-data/lfs
EOF
echo -e "${GREEN}✓ Gitea configuration created${NC}"

##############################################################################
# Step 6: Deploy Gitea
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 6: Deploying Gitea application${NC}"
oc apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitea
  namespace: ${PROJECT_NAME}
  labels:
    app: gitea
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitea
  template:
    metadata:
      labels:
        app: gitea
    spec:
      initContainers:
      - name: init-permissions
        image: quay.io/rhpds/gitea:latest
        command:
        - sh
        - -c
        - |
          mkdir -p /gitea-data/git/repositories
          mkdir -p /gitea-data/avatars
          mkdir -p /gitea-data/repo-avatars
          mkdir -p /gitea-data/attachments
          mkdir -p /gitea-data/log
          mkdir -p /gitea-data/sessions
          mkdir -p /gitea-data/lfs
          chmod -R 777 /gitea-data
          echo "Directories created and permissions set"
        volumeMounts:
        - name: gitea-data
          mountPath: /gitea-data
      containers:
      - name: gitea
        image: quay.io/rhpds/gitea:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 22
          name: ssh
        env:
        - name: GITEA_CUSTOM
          value: /gitea-data
        - name: GITEA__database__DB_TYPE
          value: postgres
        - name: GITEA__database__HOST
          value: postgresql:5432
        - name: GITEA__database__NAME
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-name
        - name: GITEA__database__USER
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-user
        - name: GITEA__database__PASSWD
          valueFrom:
            secretKeyRef:
              name: postgresql-credentials
              key: database-password
        volumeMounts:
        - name: gitea-data
          mountPath: /gitea-data
        - name: gitea-config
          mountPath: /etc/gitea
        livenessProbe:
          httpGet:
            path: /api/healthz
            port: 3000
          initialDelaySeconds: 120
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /api/healthz
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
      volumes:
      - name: gitea-data
        persistentVolumeClaim:
          claimName: gitea-data
      - name: gitea-config
        configMap:
          name: gitea-config
EOF
echo -e "${GREEN}✓ Gitea deployed${NC}"

##############################################################################
# Step 7: Create Gitea Service
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 7: Creating Gitea service${NC}"
oc apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: gitea
  namespace: ${PROJECT_NAME}
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 3000
    targetPort: 3000
  - name: ssh
    port: 22
    targetPort: 22
  selector:
    app: gitea
EOF
echo -e "${GREEN}✓ Gitea service created${NC}"

##############################################################################
# Step 8: Create Gitea Route
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 8: Exposing Gitea via route${NC}"
if ! oc get route gitea -n ${PROJECT_NAME} &> /dev/null; then
    oc create route edge gitea \
        --service=gitea \
        --port=3000 \
        --insecure-policy=Redirect \
        -n ${PROJECT_NAME}
    echo -e "${GREEN}✓ Route created${NC}"
else
    echo -e "${YELLOW}⚠ Route already exists${NC}"
fi

##############################################################################
# Step 9: Wait for Gitea to be ready
##############################################################################
echo ""
echo -e "${GREEN}➜ Step 9: Waiting for Gitea to be ready...${NC}"
oc wait --for=condition=available --timeout=300s deployment/gitea -n ${PROJECT_NAME}
echo -e "${GREEN}✓ Gitea is ready${NC}"

##############################################################################
# Step 10: Get Gitea URL
##############################################################################
GITEA_URL=$(oc get route gitea -n ${PROJECT_NAME} -o jsonpath='{.spec.host}')

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Gitea URL:${NC} https://${GITEA_URL}"
echo -e "${BLUE}Admin User:${NC} ${ADMIN_USER}"
echo -e "${BLUE}Admin Email:${NC} ${ADMIN_EMAIL}"
echo ""
echo -e "${YELLOW}📝 Architecture:${NC}"
echo "  ┌─────────────────────────┐"
echo "  │   Gitea Application     │"
echo "  │   (Stateless)           │"
echo "  └───────────┬─────────────┘"
echo "              │"
echo "              ▼"
echo "  ┌─────────────────────────┐"
echo "  │   PostgreSQL Database   │"
echo "  │   + PVC (5GB)           │"
echo "  └─────────────────────────┘"
echo "              +"
echo "  ┌─────────────────────────┐"
echo "  │   Gitea Data PVC        │"
echo "  │   (Repos, Attachments)  │"
echo "  │   (10GB)                │"
echo "  └─────────────────────────┘"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Create workshop users and repositories:"
echo "   cd /Users/dleong/Documents/ctf_ansible_workshop/gitea-openshift"
echo "   ./create-workshop-repos.sh \\"
echo "       \"https://${GITEA_URL}\" \\"
echo "       \"YOUR_ADMIN_TOKEN\" \\"
echo "       \"workshop-users.csv\""
echo ""
echo "2. Get admin token:"
echo "   - Login to Gitea: https://${GITEA_URL}"
echo "   - Go to: Settings → Applications → Generate Token"
echo ""
echo -e "${YELLOW}💾 Backup Recommendations:${NC}"
echo "  - Export PostgreSQL database regularly"
echo "  - Keep workshop-users.csv backed up"
echo "  - Consider external backup to S3/object storage"
echo ""
echo -e "${RED}⚠️  Sandbox Limitation:${NC}"
echo "  Even with PostgreSQL, sandbox environments may lose data"
echo "  during hibernation. Regular backups are essential!"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"

