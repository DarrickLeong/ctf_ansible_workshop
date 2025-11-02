#!/bin/bash
#
# Workshop Portal - OpenShift Deployment Script
# This script automates the deployment of the Workshop Portal to OpenShift
#

set -e

echo "=========================================="
echo "Workshop Portal - OpenShift Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo -e "${RED}Error: 'oc' command not found. Please install the OpenShift CLI.${NC}"
    exit 1
fi

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to OpenShift. Please run 'oc login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ OpenShift CLI found and authenticated${NC}"
echo ""

# Get current context
CURRENT_PROJECT=$(oc project -q 2>/dev/null || echo "")
echo "Current OpenShift project: ${CURRENT_PROJECT:-<none>}"
echo ""

# Prompt for configuration
echo "=========================================="
echo "Configuration"
echo "=========================================="
echo ""

# Project name
read -p "Enter OpenShift project name [workshop-portal]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-workshop-portal}

# Application name
read -p "Enter application name [workshop-portal]: " APP_NAME
APP_NAME=${APP_NAME:-workshop-portal}

# Git repository
read -p "Enter Git repository URL: " GIT_REPO
if [ -z "$GIT_REPO" ]; then
    echo -e "${RED}Error: Git repository URL is required${NC}"
    exit 1
fi

# Git branch
read -p "Enter Git branch [main]: " GIT_BRANCH
GIT_BRANCH=${GIT_BRANCH:-main}

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Project: ${PROJECT_NAME}"
echo "App Name: ${APP_NAME}"
echo "Git Repo: ${GIT_REPO}"
echo "Git Branch: ${GIT_BRANCH}"
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

# Deploy application
echo "➜ Deploying Node.js application..."
oc new-app nodejs~${GIT_REPO}#${GIT_BRANCH} \
  --context-dir=workshop-portal \
  --name=${APP_NAME} \
  --namespace=${PROJECT_NAME}

echo -e "${GREEN}✓ Application deployment started${NC}"
echo ""

# Wait for build to start
echo "➜ Waiting for build to start..."
sleep 5

# Follow build logs
echo "➜ Following build logs (Ctrl+C to skip, build will continue)..."
echo ""
oc logs -f bc/${APP_NAME} -n ${PROJECT_NAME} || true
echo ""

# Wait for deployment to complete
echo "➜ Waiting for deployment to complete..."
oc rollout status deployment/${APP_NAME} -n ${PROJECT_NAME} --timeout=5m

echo -e "${GREEN}✓ Deployment completed${NC}"
echo ""

# Expose service
echo "➜ Exposing service..."
if oc get route ${APP_NAME} -n ${PROJECT_NAME} &> /dev/null; then
    echo -e "${YELLOW}! Route already exists${NC}"
else
    oc expose service ${APP_NAME} -n ${PROJECT_NAME}
    echo -e "${GREEN}✓ Service exposed${NC}"
fi
echo ""

# Get route URL
ROUTE_URL=$(oc get route ${APP_NAME} -n ${PROJECT_NAME} -o jsonpath='{.spec.host}')

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Workshop Portal is now running!${NC}"
echo ""
echo "Portal URL: http://${ROUTE_URL}"
echo ""
echo "Available pages:"
echo "  - Home: http://${ROUTE_URL}/"
echo "  - Challenges: http://${ROUTE_URL}/challenges"
echo "  - Participant Guide: http://${ROUTE_URL}/participant-guide"
echo "  - Instructor Guide: http://${ROUTE_URL}/instructor-guide"
echo "  - Setup: http://${ROUTE_URL}/setup"
echo "  - Solutions: http://${ROUTE_URL}/solutions"
echo ""
echo "Useful commands:"
echo "  - View logs: oc logs -f deployment/${APP_NAME} -n ${PROJECT_NAME}"
echo "  - Check status: oc get pods -n ${PROJECT_NAME}"
echo "  - Delete app: oc delete all -l app=${APP_NAME} -n ${PROJECT_NAME}"
echo ""

# Test health endpoint
echo "➜ Testing health endpoint..."
sleep 5
if curl -sf "http://${ROUTE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    echo ""
    curl -s "http://${ROUTE_URL}/health" | python3 -m json.tool 2>/dev/null || curl -s "http://${ROUTE_URL}/health"
else
    echo -e "${YELLOW}⚠ Health check failed (app may still be starting)${NC}"
    echo "   Give it a minute and try: curl http://${ROUTE_URL}/health"
fi

echo ""
echo "=========================================="
echo "🎉 Deployment successful!"
echo "=========================================="

