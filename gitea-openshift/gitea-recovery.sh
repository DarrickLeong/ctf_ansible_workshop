#!/bin/bash
#
# Gitea Data Recovery & Backup Script
# Handles data loss from cluster restarts
#

set -e

echo "=========================================="
echo "Gitea - Data Recovery & Backup Tool"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
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
PROJECT_NAME=${GITEA_PROJECT:-gitea}

echo "=========================================="
echo "Main Menu"
echo "=========================================="
echo "1) Check Gitea Status"
echo "2) Backup Gitea Data (to local file)"
echo "3) Restore Gitea Data (from local file)"
echo "4) Full Redeploy (will lose data!)"
echo "5) Export Users CSV"
echo "6) Recreate from Workshop CSV"
echo "7) Exit"
echo ""
read -p "Select option: " OPTION

case $OPTION in
    1)
        echo ""
        echo "=========================================="
        echo "Checking Gitea Status"
        echo "=========================================="
        echo ""
        
        # Check project
        if oc get project "${PROJECT_NAME}" &> /dev/null; then
            echo -e "${GREEN}✓ Project exists: ${PROJECT_NAME}${NC}"
            oc project "${PROJECT_NAME}"
        else
            echo -e "${RED}✗ Project NOT found: ${PROJECT_NAME}${NC}"
            echo ""
            echo "The Gitea project was deleted (likely due to cluster restart)."
            echo "Options:"
            echo "  - Run option 4 to do a full redeploy"
            echo "  - Run option 3 if you have a backup file"
            echo "  - Run option 6 to recreate from workshop CSV"
            exit 1
        fi
        
        echo ""
        
        # Check PVC
        if oc get pvc gitea-data &> /dev/null; then
            PVC_STATUS=$(oc get pvc gitea-data -o jsonpath='{.status.phase}')
            echo -e "${GREEN}✓ PVC exists: gitea-data (${PVC_STATUS})${NC}"
        else
            echo -e "${RED}✗ PVC NOT found: gitea-data${NC}"
        fi
        
        echo ""
        
        # Check deployment
        if oc get deployment gitea &> /dev/null; then
            REPLICAS=$(oc get deployment gitea -o jsonpath='{.status.readyReplicas}')
            echo -e "${GREEN}✓ Deployment exists: gitea (${REPLICAS} ready)${NC}"
        else
            echo -e "${RED}✗ Deployment NOT found${NC}"
        fi
        
        echo ""
        
        # Check pods
        echo "Pods:"
        oc get pods -l app=gitea
        
        echo ""
        
        # Check route
        if oc get route gitea &> /dev/null; then
            ROUTE_URL=$(oc get route gitea -o jsonpath='{.spec.host}')
            echo -e "${GREEN}✓ Route: http://${ROUTE_URL}${NC}"
        else
            echo -e "${RED}✗ Route NOT found${NC}"
        fi
        ;;
        
    2)
        echo ""
        echo "=========================================="
        echo "Backup Gitea Data"
        echo "=========================================="
        echo ""
        
        oc project "${PROJECT_NAME}" 2>/dev/null || {
            echo -e "${RED}Error: Project ${PROJECT_NAME} not found${NC}"
            exit 1
        }
        
        POD_NAME=$(oc get pods -l app=gitea -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$POD_NAME" ]; then
            echo -e "${RED}Error: No Gitea pod found${NC}"
            exit 1
        fi
        
        BACKUP_FILE="gitea-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        
        echo "Creating backup from pod: ${POD_NAME}"
        echo "Backup file: ${BACKUP_FILE}"
        echo ""
        
        # Create backup in pod
        oc exec -i "${POD_NAME}" -- tar czf /tmp/gitea-backup.tar.gz -C /gitea-data .
        
        # Download backup
        oc cp "${POD_NAME}:/tmp/gitea-backup.tar.gz" "${BACKUP_FILE}"
        
        # Cleanup
        oc exec -i "${POD_NAME}" -- rm /tmp/gitea-backup.tar.gz
        
        echo ""
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
        echo ""
        echo "Backup contents:"
        tar tzf "${BACKUP_FILE}" | head -20
        echo ""
        echo "To restore this backup later, run option 3"
        ;;
        
    3)
        echo ""
        echo "=========================================="
        echo "Restore Gitea Data"
        echo "=========================================="
        echo ""
        
        # List available backups
        echo "Available backup files:"
        ls -lh gitea-backup-*.tar.gz 2>/dev/null || echo "No backups found"
        echo ""
        
        read -p "Enter backup file name: " BACKUP_FILE
        
        if [ ! -f "$BACKUP_FILE" ]; then
            echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: This will replace all current Gitea data!${NC}"
        read -p "Continue? (y/n): " CONFIRM
        if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
            echo "Restore cancelled."
            exit 0
        fi
        
        oc project "${PROJECT_NAME}" 2>/dev/null || {
            echo -e "${RED}Error: Project ${PROJECT_NAME} not found${NC}"
            echo "Run option 4 to redeploy Gitea first"
            exit 1
        }
        
        POD_NAME=$(oc get pods -l app=gitea -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$POD_NAME" ]; then
            echo -e "${RED}Error: No Gitea pod found${NC}"
            exit 1
        fi
        
        echo ""
        echo "Restoring backup to pod: ${POD_NAME}"
        
        # Upload backup
        oc cp "${BACKUP_FILE}" "${POD_NAME}:/tmp/gitea-backup.tar.gz"
        
        # Extract backup
        oc exec -i "${POD_NAME}" -- sh -c "rm -rf /gitea-data/* && tar xzf /tmp/gitea-backup.tar.gz -C /gitea-data"
        
        # Cleanup
        oc exec -i "${POD_NAME}" -- rm /tmp/gitea-backup.tar.gz
        
        # Restart Gitea
        echo "Restarting Gitea..."
        oc rollout restart deployment/gitea
        oc rollout status deployment/gitea
        
        echo ""
        echo -e "${GREEN}✓ Restore complete!${NC}"
        echo ""
        echo "Access Gitea at:"
        ROUTE_URL=$(oc get route gitea -o jsonpath='{.spec.host}')
        echo "http://${ROUTE_URL}"
        ;;
        
    4)
        echo ""
        echo "=========================================="
        echo "Full Redeploy"
        echo "=========================================="
        echo ""
        echo -e "${RED}⚠️  WARNING: This will DELETE and recreate Gitea!${NC}"
        echo "All current data will be LOST!"
        echo ""
        read -p "Continue? (type 'yes' to confirm): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Redeploy cancelled."
            exit 0
        fi
        
        echo ""
        echo "Running deploy-gitea.sh..."
        cd "$(dirname "$0")"
        ./deploy-gitea.sh
        ;;
        
    5)
        echo ""
        echo "=========================================="
        echo "Export Users to CSV"
        echo "=========================================="
        echo ""
        
        read -p "Enter Gitea URL [http://gitea-gitea.apps.YOUR-CLUSTER.com]: " GITEA_URL
        read -p "Enter admin token: " ADMIN_TOKEN
        
        if [ -z "$GITEA_URL" ] || [ -z "$ADMIN_TOKEN" ]; then
            echo -e "${RED}Error: URL and token are required${NC}"
            exit 1
        fi
        
        CSV_FILE="gitea-users-$(date +%Y%m%d-%H%M%S).csv"
        
        echo "Fetching users from Gitea..."
        echo ""
        
        # Get users via API
        USERS=$(curl -s "${GITEA_URL}/api/v1/admin/users" \
                     -H "Authorization: token ${ADMIN_TOKEN}")
        
        # Create CSV
        echo "username,email,password,is_admin" > "${CSV_FILE}"
        
        echo "$USERS" | jq -r '.[] | [.login, .email, "RESET_PASSWORD", .is_admin] | @csv' >> "${CSV_FILE}"
        
        echo -e "${GREEN}✓ Users exported to: ${CSV_FILE}${NC}"
        echo ""
        cat "${CSV_FILE}"
        echo ""
        echo "Note: Passwords are set to 'RESET_PASSWORD' (you'll need to update them)"
        ;;
        
    6)
        echo ""
        echo "=========================================="
        echo "Recreate from Workshop CSV"
        echo "=========================================="
        echo ""
        
        echo "This will recreate users and repositories from workshop-users.csv"
        echo ""
        
        read -p "Enter Gitea URL: " GITEA_URL
        read -p "Enter admin token: " ADMIN_TOKEN
        
        if [ -z "$GITEA_URL" ] || [ -z "$ADMIN_TOKEN" ]; then
            echo -e "${RED}Error: URL and token are required${NC}"
            exit 1
        fi
        
        CSV_FILE="workshop-users.csv"
        
        if [ ! -f "$CSV_FILE" ]; then
            echo -e "${RED}Error: ${CSV_FILE} not found${NC}"
            exit 1
        fi
        
        echo ""
        echo "Running create-workshop-repos.sh..."
        cd "$(dirname "$0")"
        ./create-workshop-repos.sh "${GITEA_URL}" "${ADMIN_TOKEN}" "${CSV_FILE}"
        ;;
        
    7)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

