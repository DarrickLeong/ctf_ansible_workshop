#!/bin/bash
#
# Gitea User Creation Script (API-based)
# Alternative method using Gitea's REST API
#

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <gitea-url> <admin-token> <users.csv>"
    echo ""
    echo "Example:"
    echo "  $0 http://gitea-gitea.apps.cluster.com YOUR_TOKEN sample-users.csv"
    echo ""
    echo "CSV format: username,email,password,is_admin"
    exit 1
fi

GITEA_URL=$1
ADMIN_TOKEN=$2
CSV_FILE=$3

if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File $CSV_FILE not found"
    exit 1
fi

echo "Creating users via Gitea API..."
echo "Gitea URL: $GITEA_URL"
echo ""

while IFS=',' read -r username email password is_admin; do
    # Skip header
    if [ "$username" = "username" ]; then
        continue
    fi
    
    # Skip commented lines (starting with #)
    if [[ "$username" =~ ^#.*$ ]]; then
        continue
    fi
    
    # Skip empty lines
    if [ -z "$username" ]; then
        continue
    fi
    
    echo "Creating user: $username..."
    
    ADMIN_VALUE="false"
    if [ "$is_admin" = "true" ]; then
        ADMIN_VALUE="true"
    fi
    
    curl -X POST "${GITEA_URL}/api/v1/admin/users" \
        -H "Authorization: token ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"must_change_password\": false,
            \"send_notify\": false,
            \"visibility\": \"public\"
        }" \
        -w "\n  Status: %{http_code}\n" || echo "  ⚠ Failed to create user"
    
    echo ""
done < "$CSV_FILE"

echo "✅ User creation complete!"

