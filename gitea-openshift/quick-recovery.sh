#!/bin/bash
# Quick Gitea Recovery - Non-interactive deployment

cd /Users/dleong/Documents/ctf_ansible_workshop/gitea-openshift

echo "=========================================="
echo "Quick Gitea Recovery"
echo "=========================================="
echo ""

# Set defaults
export PROJECT_NAME="gitea"
export ADMIN_USER="gitea_admin"  
export ADMIN_PASS="admin123"  # Change this!
export ADMIN_EMAIL="admin@example.com"

echo "Deploying Gitea with defaults:"
echo "  Project: ${PROJECT_NAME}"
echo "  Admin: ${ADMIN_USER}"
echo "  Email: ${ADMIN_EMAIL}"
echo ""
echo "This will take 2-3 minutes..."
echo ""

# Run deployment
./deploy-gitea.sh <<EOF
${PROJECT_NAME}
${ADMIN_USER}
${ADMIN_PASS}
${ADMIN_EMAIL}
y
EOF

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

# Get route
GITEA_URL=$(oc get route gitea -n ${PROJECT_NAME} -o jsonpath='{.spec.host}' 2>/dev/null)

if [ -n "$GITEA_URL" ]; then
    echo "✅ Gitea URL: http://${GITEA_URL}"
    echo ""
    echo "Next steps:"
    echo "1. Open Gitea: http://${GITEA_URL}"
    echo "2. Login: ${ADMIN_USER} / ${ADMIN_PASS}"
    echo "3. Generate admin token:"
    echo "   - Settings → Applications → Generate New Token"
    echo "4. Run:"
    echo "   cd gitea-openshift"
    echo "   ./create-workshop-repos.sh \\"
    echo "       \"http://${GITEA_URL}\" \\"
    echo "       \"YOUR_ADMIN_TOKEN\" \\"
    echo "       \"workshop-users.csv\""
else
    echo "⚠️  Deployment may still be in progress."
    echo "Check status: oc get all -n ${PROJECT_NAME}"
fi

echo ""

