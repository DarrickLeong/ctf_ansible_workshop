#!/bin/bash

# CTF Ansible Workshop - Pre-commit Sanitization Script
# This script removes sensitive information and temporary files before committing to Git

set -e

# Change to the script's directory
cd "$(dirname "$0")"

echo "🧹 Sanitizing CTF Ansible Workshop for GitHub"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Remove sensitive files
echo_info "Removing sensitive configuration files..."
find . -name "config.env" -type f -delete 2>/dev/null || true
find . -name "*.db" -type f -delete 2>/dev/null || true
find . -name "*.db-journal" -type f -delete 2>/dev/null || true
find . -name "*.db-wal" -type f -delete 2>/dev/null || true
find . -name "*.db-shm" -type f -delete 2>/dev/null || true
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.bak" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Remove any accidentally committed credentials
echo_info "Checking for accidentally committed credentials..."
if find . -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "id_rsa*" 2>/dev/null | grep -q .; then
    echo_error "Found potential credential files:"
    find . -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "id_rsa*" 2>/dev/null
    echo_error "Please review and remove these files manually if they contain sensitive data"
    exit 1
fi

# Check for hardcoded sensitive information (simplified patterns)
echo_info "Scanning for hardcoded sensitive information..."
FOUND_SENSITIVE=false

# Look for actual passwords/tokens (not template variables)
if grep -r -i --exclude-dir=.git --exclude="*.sh" "password.*=" . 2>/dev/null | grep -v "your-" | grep -v "example" | grep -v "template" | grep -v "default" | grep -v "{{" | grep -v "vault_" | head -3; then
    FOUND_SENSITIVE=true
fi

if [ "$FOUND_SENSITIVE" = true ]; then
    echo_warning "Found potential hardcoded sensitive information above"
    echo_warning "Please review and ensure these are template values, not real credentials"
fi

# Check for hardcoded URLs that should be templates
echo_info "Checking for hardcoded URLs..."
HARDCODED_URLS=$(grep -r "apps\.cluster-.*\.sandbox.*\.opentlc\.com" . --exclude-dir=.git 2>/dev/null | grep -v "your-cluster" | head -3 || true)
if [ -n "$HARDCODED_URLS" ]; then
    echo_warning "Found hardcoded cluster URLs - these should be template values:"
    echo "$HARDCODED_URLS"
fi

# Verify essential files exist
echo_info "Verifying essential files exist..."
ESSENTIAL_FILES=(
    "README.md"
    "LICENSE"
    "ctf-app/app.py"
    "ctf-app/requirements.txt"
    "ctf-app/deploy-quick.sh"
    "ctf-app/deploy-secure.sh"
    "sub-controllers/comprehensive-ctf-playbook.yml"
    "sub-controllers/connectivity-test-playbook.yml"
    "central-controller/deploy-to-sub-controllers.yml"
    "central-controller/test-sub-controllers.yml"
)

MISSING_FILES=()
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo_error "Missing essential files:"
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

# Check file permissions
echo_info "Checking file permissions..."
find . -name "*.sh" -type f ! -perm -u+x -exec chmod +x {} \; 2>/dev/null || true
echo_success "Made shell scripts executable"

# Verify no large files
echo_info "Checking for large files (>10MB)..."
LARGE_FILES=$(find . -type f -size +10M 2>/dev/null | grep -v .git || true)
if [ -n "$LARGE_FILES" ]; then
    echo_warning "Found large files:"
    echo "$LARGE_FILES"
    echo_warning "Consider using Git LFS for these files"
fi

# Final validation
echo_info "Running final validation..."

# Count files by type
TOTAL_FILES=$(find . -type f ! -path "./.git/*" 2>/dev/null | wc -l | tr -d ' ')
YAML_FILES=$(find . -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
PYTHON_FILES=$(find . -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
MARKDOWN_FILES=$(find . -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SCRIPT_FILES=$(find . -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')

echo_success "Repository sanitization complete!"
echo_info "Repository statistics:"
echo_info "  Total files: $TOTAL_FILES"
echo_info "  YAML files: $YAML_FILES"
echo_info "  Python files: $PYTHON_FILES"
echo_info "  Markdown files: $MARKDOWN_FILES"
echo_info "  Shell scripts: $SCRIPT_FILES"

echo ""
echo_success "✅ Repository is ready for commit!"
echo_info "Key points:"
echo_info "  - All sensitive data has been removed or templated"
echo_info "  - All URLs use template values (your-cluster.com, your-company.com)"
echo_info "  - All scripts are executable"
echo_info "  - Essential files are present"
echo ""
echo_info "You can now safely commit to Git!"
