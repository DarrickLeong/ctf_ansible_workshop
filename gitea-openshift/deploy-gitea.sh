#!/bin/bash
#
# Gitea OpenShift Deployment Script
# Based on: https://docs.gitea.com/installation/install-on-kubernetes
#

set -e

echo "=========================================="
echo "Gitea - OpenShift Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo -e "${RED}Error: 'oc' command not found${NC}"
    exit 1
fi

# Check if logged in
if ! oc whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to OpenShift${NC}"
    exit 1
fi

echo -e "${GREEN}✓ OpenShift CLI authenticated${NC}"
echo ""

# Configuration
read -p "Enter OpenShift project name [gitea]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-gitea}

read -p "Enter Gitea admin username [gitea_admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-gitea_admin}

read -sp "Enter Gitea admin password: " ADMIN_PASS
echo ""

if [ -z "$ADMIN_PASS" ]; then
    echo -e "${RED}Error: Admin password is required${NC}"
    exit 1
fi

read -p "Enter Gitea admin email [admin@example.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

echo ""
echo "=========================================="
echo "Configuration Summary"
echo "=========================================="
echo "Project: ${PROJECT_NAME}"
echo "Admin User: ${ADMIN_USER}"
echo "Admin Email: ${ADMIN_EMAIL}"
echo ""

read -p "Proceed with deployment? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "Starting Deployment"
echo "=========================================="
echo ""

# Create or switch to project
echo "➜ Creating/switching to project: ${PROJECT_NAME}"
if oc get project "${PROJECT_NAME}" &> /dev/null; then
    oc project "${PROJECT_NAME}"
    echo -e "${GREEN}✓ Switched to existing project${NC}"
else
    oc new-project "${PROJECT_NAME}"
    echo -e "${GREEN}✓ Created new project${NC}"
fi
echo ""

# Create PVC for Gitea data
echo "➜ Creating persistent storage..."
cat <<EOF | oc apply -f -
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
      storage: 5Gi
EOF
echo -e "${GREEN}✓ PVC created${NC}"
echo ""

# Create ConfigMap with initial configuration
echo "➜ Creating Gitea configuration..."
cat <<EOF | oc apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitea-config
  namespace: ${PROJECT_NAME}
data:
  app.ini: |
    APP_NAME = CTF Workshop - Gitea
    RUN_MODE = prod

    [server]
    PROTOCOL = http
    HTTP_PORT = 3000
    DISABLE_SSH = true

    [database]
    DB_TYPE = sqlite3
    PATH = /gitea-data/gitea.db

    [repository]
    ROOT = /gitea-repositories

    [security]
    INSTALL_LOCK = true
    SECRET_KEY = 
    INTERNAL_TOKEN = 

    [service]
    DISABLE_REGISTRATION = false
    REQUIRE_SIGNIN_VIEW = false
    ENABLE_NOTIFY_MAIL = false

    [log]
    MODE = console
    LEVEL = info
EOF
echo -e "${GREEN}✓ ConfigMap created${NC}"
echo ""

# Deploy Gitea
echo "➜ Deploying Gitea application..."
cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitea
  namespace: ${PROJECT_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitea
  template:
    metadata:
      labels:
        app: gitea
      annotations:
        deployment-config: "${ADMIN_USER}-${ADMIN_EMAIL}-$(date +%s)"
    spec:
      initContainers:
      - name: init-config
        image: quay.io/rhpds/gitea:latest
        command:
        - sh
        - -c
        - |
          mkdir -p /gitea-data/conf /home/gitea/conf
          if [ ! -f /gitea-data/conf/app.ini ]; then
            echo "Copying initial config..."
            cp /tmp/gitea-config/app.ini /gitea-data/conf/app.ini
            chmod 666 /gitea-data/conf/app.ini
          fi
          # Also copy to Gitea's default location
          cp /gitea-data/conf/app.ini /home/gitea/conf/app.ini
          chmod 666 /home/gitea/conf/app.ini
          echo "Config ready"
        volumeMounts:
        - name: gitea-data
          mountPath: /gitea-data
        - name: gitea-config-template
          mountPath: /tmp/gitea-config
      containers:
      - name: gitea
        image: quay.io/rhpds/gitea:latest
        ports:
        - containerPort: 3000
          name: http
        volumeMounts:
        - name: gitea-data
          mountPath: /gitea-data
        - name: gitea-repositories
          mountPath: /gitea-repositories
        env:
        - name: GITEA_CUSTOM
          value: "/gitea-data"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 120
          timeoutSeconds: 5
          periodSeconds: 10
          successThreshold: 1
          failureThreshold: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 10
      volumes:
      - name: gitea-data
        persistentVolumeClaim:
          claimName: gitea-data
      - name: gitea-repositories
        emptyDir: {}
      - name: gitea-config-template
        configMap:
          name: gitea-config
EOF
echo -e "${GREEN}✓ Deployment created${NC}"
echo ""

# Create Service
echo "➜ Creating service..."
cat <<EOF | oc apply -f -
apiVersion: v1
kind: Service
metadata:
  name: gitea
  namespace: ${PROJECT_NAME}
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: gitea
EOF
echo -e "${GREEN}✓ Service created${NC}"
echo ""

# Expose route
echo "➜ Exposing route..."
if oc get route gitea -n ${PROJECT_NAME} &> /dev/null; then
    echo -e "${YELLOW}! Route already exists${NC}"
else
    oc expose service gitea -n ${PROJECT_NAME}
    echo -e "${GREEN}✓ Route exposed${NC}"
fi
echo ""

# Wait for deployment
echo "➜ Waiting for Gitea to be ready..."
oc rollout status deployment/gitea -n ${PROJECT_NAME} --timeout=5m
echo -e "${GREEN}✓ Deployment ready${NC}"
echo ""

# Get route URL
GITEA_URL=$(oc get route gitea -n ${PROJECT_NAME} -o jsonpath='{.spec.host}')

# Wait a bit more for Gitea to initialize
echo "➜ Waiting for Gitea to initialize..."
sleep 30

# Create admin user
echo "➜ Creating admin user..."
POD_NAME=$(oc get pods -n ${PROJECT_NAME} -l app=gitea -o jsonpath='{.items[0].metadata.name}')

oc exec -n ${PROJECT_NAME} ${POD_NAME} -- /bin/sh -c "gitea admin user create \
  --username ${ADMIN_USER} \
  --password ${ADMIN_PASS} \
  --email ${ADMIN_EMAIL} \
  --admin \
  --must-change-password=false \
  -c /gitea-data/conf/app.ini" 2>&1 | grep -v "user already exists" || echo -e "${YELLOW}⚠ Admin user may already exist or was just created${NC}"

echo -e "${GREEN}✓ Admin user configured${NC}"
echo ""

# Generate user creation script
echo "➜ Generating user creation script..."
cat > create-gitea-users.sh <<'SCRIPT_EOF'
#!/bin/bash
#
# Gitea User Creation Script
# Creates multiple users from a CSV file
#

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <users.csv>"
    echo ""
    echo "CSV format: username,email,password,is_admin"
    echo "Example:"
    echo "  user1,user1@example.com,password123,false"
    echo "  user2,user2@example.com,password456,true"
    exit 1
fi

CSV_FILE=$1
PROJECT_NAME=${PROJECT_NAME:-gitea}

if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File $CSV_FILE not found"
    exit 1
fi

echo "Creating users from $CSV_FILE..."
echo ""

POD_NAME=$(oc get pods -n ${PROJECT_NAME} -l app=gitea -o jsonpath='{.items[0].metadata.name}')

while IFS=',' read -r username email password is_admin; do
    # Skip header line
    if [ "$username" = "username" ]; then
        continue
    fi
    
    echo "Creating user: $username ($email)..."
    
    ADMIN_FLAG=""
    if [ "$is_admin" = "true" ]; then
        ADMIN_FLAG="--admin"
    fi
    
    oc exec -n ${PROJECT_NAME} ${POD_NAME} -- /bin/sh -c "gitea admin user create \
      --username $username \
      --password $password \
      --email $email \
      $ADMIN_FLAG \
      --must-change-password=false \
      -c /gitea-data/conf/app.ini" || echo "  ⚠ User may already exist"
    
    echo "  ✓ User $username created"
    echo ""
done < "$CSV_FILE"

echo "User creation complete!"
SCRIPT_EOF

chmod +x create-gitea-users.sh
echo -e "${GREEN}✓ User creation script generated${NC}"
echo ""

# Create sample users CSV
cat > sample-users.csv <<EOF
username,email,password,is_admin
workshop_user1,user1@workshop.local,Workshop123!,false
workshop_user2,user2@workshop.local,Workshop123!,false
workshop_user3,user3@workshop.local,Workshop123!,false
instructor,instructor@workshop.local,Instructor123!,true
EOF
echo -e "${GREEN}✓ Sample users CSV created${NC}"
echo ""

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Gitea is now running!${NC}"
echo ""
echo "Gitea URL: http://${GITEA_URL}"
echo ""
echo "Admin Credentials:"
echo "  Username: ${ADMIN_USER}"
echo "  Password: ********"
echo "  Email: ${ADMIN_EMAIL}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Access Gitea:"
echo "   open http://${GITEA_URL}"
echo ""
echo "2. Create multiple users from CSV:"
echo "   ./create-gitea-users.sh sample-users.csv"
echo ""
echo "3. Create custom users:"
echo "   Edit sample-users.csv or create your own CSV file"
echo "   Format: username,email,password,is_admin"
echo ""
echo "4. Useful commands:"
echo "   - View logs: oc logs -f deployment/gitea -n ${PROJECT_NAME}"
echo "   - Check status: oc get pods -n ${PROJECT_NAME}"
echo "   - Delete: oc delete project ${PROJECT_NAME}"
echo ""
echo "=========================================="

