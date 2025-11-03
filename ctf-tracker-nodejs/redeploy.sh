#!/bin/bash
# CTF Tracker Redeployment Script
# Redeploys the CTF tracker to apply the latest fixes

set -e

echo "=========================================="
echo "CTF Tracker Redeployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to OpenShift${NC}"
    echo "Please run: oc login"
    exit 1
fi

echo -e "${GREEN}✓ Logged in as: $(oc whoami)${NC}"
echo ""

# Find the CTF tracker project
echo "Looking for CTF tracker project..."
CTF_PROJECT=$(oc projects -q | grep -i "ctf" | head -1)

if [ -z "$CTF_PROJECT" ]; then
    echo -e "${RED}❌ Could not find CTF project${NC}"
    echo "Available projects:"
    oc projects
    echo ""
    echo "Please specify your CTF tracker project name:"
    read -p "Project name: " CTF_PROJECT
fi

echo -e "${GREEN}✓ Using project: $CTF_PROJECT${NC}"
oc project "$CTF_PROJECT"
echo ""

# Check if deployment exists
echo "Checking for CTF tracker deployment..."
if ! oc get deployment ctf-tracker-nodejs &> /dev/null; then
    echo -e "${YELLOW}⚠️  Deployment 'ctf-tracker-nodejs' not found${NC}"
    echo ""
    echo "Available deployments:"
    oc get deployments
    echo ""
    echo "Please specify your CTF tracker deployment name:"
    read -p "Deployment name: " DEPLOYMENT_NAME
else
    DEPLOYMENT_NAME="ctf-tracker-nodejs"
    echo -e "${GREEN}✓ Found deployment: $DEPLOYMENT_NAME${NC}"
fi
echo ""

# Option 1: Try to trigger a new build from Git
echo "=========================================="
echo "OPTION 1: Rebuild from Git (Recommended)"
echo "=========================================="
echo ""

if oc get bc "$DEPLOYMENT_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ BuildConfig found${NC}"
    echo "Starting new build from latest Git commit..."
    
    oc start-build "$DEPLOYMENT_NAME" --follow
    
    echo ""
    echo -e "${GREEN}✓ Build complete!${NC}"
    echo ""
    
    # Wait for deployment to roll out
    echo "Waiting for deployment to complete..."
    oc rollout status deployment/"$DEPLOYMENT_NAME"
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
else
    echo -e "${YELLOW}⚠️  No BuildConfig found${NC}"
    echo "Falling back to Option 2..."
    echo ""
    
    # Option 2: Rollout restart
    echo "=========================================="
    echo "OPTION 2: Rollout Restart"
    echo "=========================================="
    echo ""
    
    echo "⚠️  WARNING: This will restart with the existing image."
    echo "   The latest code changes will NOT be applied unless"
    echo "   you rebuild the image from Git first."
    echo ""
    read -p "Continue with rollout restart? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Restarting deployment..."
        oc rollout restart deployment/"$DEPLOYMENT_NAME"
        
        echo ""
        echo "Waiting for deployment to complete..."
        oc rollout status deployment/"$DEPLOYMENT_NAME"
        echo ""
        echo -e "${GREEN}✓ Restart complete!${NC}"
    else
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
echo "=========================================="
echo "Deployment Information"
echo "=========================================="
echo ""

# Get pod status
echo "Pod Status:"
oc get pods -l app="$DEPLOYMENT_NAME"
echo ""

# Get route
echo "Application Route:"
oc get route -l app="$DEPLOYMENT_NAME" -o jsonpath='{.items[0].spec.host}' 2>/dev/null || echo "No route found"
echo ""
echo ""

# Get recent logs
echo "Recent Logs (last 20 lines):"
echo "----------------------------"
POD_NAME=$(oc get pods -l app="$DEPLOYMENT_NAME" -o jsonpath='{.items[0].metadata.name}')
if [ -n "$POD_NAME" ]; then
    oc logs "$POD_NAME" --tail=20
else
    echo "No pods found"
fi

echo ""
echo "=========================================="
echo "✅ CTF Tracker Redeployment Complete!"
echo "=========================================="
echo ""
echo "What was fixed:"
echo "  ✓ Challenge scoring deduplication (5 pts instead of 15)"
echo "  ✓ Hide 0-point activities from feed"
echo ""
echo "Next steps:"
echo "  1. Access the CTF Tracker dashboard"
echo "  2. Click 'Clear All Data' to reset the database"
echo "  3. Run validator again"
echo "  4. Verify Challenge 1 shows 5 points (not 15)"
echo "  5. Verify no 0-point activities appear"
echo ""

