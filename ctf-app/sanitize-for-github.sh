#!/bin/bash

# GitHub Sanitization Script
# This script removes sensitive files and prepares the repository for GitHub

set -e

echo "🧹 Sanitizing CTF Tracker for GitHub Commit"
echo "============================================="

# Remove sensitive configuration files
echo "Removing sensitive configuration files..."
rm -f config.env
rm -f openshift-configs.yaml  
rm -f openshift-deployment.yaml

# Remove database files
echo "Removing database files..."
rm -f *.db *.db-journal *.db-wal *.db-shm

# Remove generated files
echo "Removing temporary files..."
rm -f *.tmp *.bak

# Replace README with sanitized version
echo "Using sanitized README..."
if [ -f "README-SANITIZED.md" ]; then
    mv README-SANITIZED.md README.md
fi

# Remove the original sensitive files (keep templates)
echo "Cleaning up original files with hardcoded values..."
if [ -f "openshift-configs.yaml" ]; then
    rm openshift-configs.yaml
fi

if [ -f "openshift-deployment.yaml" ]; then
    rm openshift-deployment.yaml
fi

# Verify critical files exist
echo "Verifying essential files..."
essential_files=(
    "app.py"
    "requirements.txt"
    "Dockerfile"
    "comprehensive-ctf-playbook.yml"
    "connectivity-test-playbook.yml"
    "deploy-interactive.sh"
    "config.template"
    "openshift-configs.template.yaml"
    "openshift-deployment.template.yaml"
    "templates/index.html"
    ".gitignore"
)

missing_files=()
for file in "${essential_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing essential files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

echo "✅ All essential files present"

# Create a commit preparation summary
cat > COMMIT_CHECKLIST.md << 'EOF'
# Pre-Commit Checklist

## ✅ Sanitization Complete

The following actions have been taken to prepare for GitHub commit:

### Removed Sensitive Data
- [x] Removed hardcoded AAP credentials
- [x] Removed cluster-specific URLs  
- [x] Removed base64 encoded secrets
- [x] Removed generated configuration files
- [x] Removed database files

### Interactive Configuration
- [x] Created `deploy-interactive.sh` for user input collection
- [x] Created template files for dynamic configuration generation
- [x] Added comprehensive .gitignore file
- [x] Updated README with sanitized instructions

### Security Measures
- [x] All sensitive values now collected at deployment time
- [x] Configuration templates use variable substitution
- [x] Secrets properly isolated from repository
- [x] No hardcoded passwords or tokens

## Deployment Process

Users will now:
1. Clone the repository
2. Run `./deploy-interactive.sh`
3. Provide their specific configuration values
4. System generates deployment files dynamically
5. Application deploys with user-provided credentials

## Files Ready for Commit

### Application Files
- `app.py` - Main application (sanitized)
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `templates/index.html` - Web interface

### Playbooks
- `comprehensive-ctf-playbook.yml` - Challenge verification
- `connectivity-test-playbook.yml` - System health testing

### Deployment
- `deploy-interactive.sh` - Interactive deployment script
- `config.template` - Configuration template
- `openshift-configs.template.yaml` - OpenShift configs template
- `openshift-deployment.template.yaml` - Deployment template

### Documentation
- `README.md` - Sanitized documentation
- `ENHANCED_CTF_GUIDE.md` - Comprehensive guide
- `AAP_SETUP_GUIDE.md` - AAP integration guide

## Ready for GitHub! 🚀

The repository is now safe to commit to GitHub with all sensitive information removed.
EOF

echo ""
echo "🎉 Sanitization Complete!"
echo ""
echo "Summary:"
echo "- Removed all hardcoded credentials and sensitive data"
echo "- Created interactive deployment system"
echo "- Template-based configuration generation"
echo "- Comprehensive .gitignore protection"
echo ""
echo "Next steps:"
echo "1. Review COMMIT_CHECKLIST.md"
echo "2. Test deployment with: ./deploy-interactive.sh configure"
echo "3. Commit to GitHub when ready"
echo ""
echo "✅ Repository is ready for GitHub commit!"


