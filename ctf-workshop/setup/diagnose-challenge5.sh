#!/bin/bash
# Challenge 5 Diagnostic Script
# This script checks the exact state of Challenge 5 after each phase

echo "=================================="
echo "Challenge 5 Firewall Diagnostic"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking node3 Challenge 5 status..."
echo ""

echo "1. Checking httpd service status:"
echo "-----------------------------------"
ansible node3 -m shell -a "systemctl is-active httpd" | grep -v ">>>"
ansible node3 -m shell -a "systemctl is-enabled httpd" | grep -v ">>>"
echo ""

echo "2. Checking firewalld service status:"
echo "--------------------------------------"
ansible node3 -m shell -a "systemctl is-active firewalld" | grep -v ">>>"
echo ""

echo "3. Checking if HTTP is in firewall (current/runtime):"
echo "------------------------------------------------------"
HTTP_RUNTIME=$(ansible node3 -m shell -a "firewall-cmd --query-service=http" 2>&1 | grep -v ">>>" | tail -1)
if [[ "$HTTP_RUNTIME" == *"yes"* ]]; then
    echo -e "${RED}✗ HTTP IS ALLOWED (runtime) - Challenge 5 is SOLVED${NC}"
    echo "  This means the firewall is NOT blocking HTTP right now"
elif [[ "$HTTP_RUNTIME" == *"no"* ]]; then
    echo -e "${GREEN}✓ HTTP IS BLOCKED (runtime) - Challenge 5 is UNSOLVED${NC}"
    echo "  This is correct! The challenge exists."
else
    echo -e "${YELLOW}? Cannot determine HTTP status (runtime)${NC}"
    echo "  Output: $HTTP_RUNTIME"
fi
echo ""

echo "4. Checking if HTTP is in firewall (permanent):"
echo "------------------------------------------------"
HTTP_PERMANENT=$(ansible node3 -m shell -a "firewall-cmd --permanent --query-service=http" 2>&1 | grep -v ">>>" | tail -1)
if [[ "$HTTP_PERMANENT" == *"yes"* ]]; then
    echo -e "${RED}✗ HTTP IS ALLOWED (permanent) - Will persist after reboot${NC}"
elif [[ "$HTTP_PERMANENT" == *"no"* ]]; then
    echo -e "${GREEN}✓ HTTP IS BLOCKED (permanent) - Correct state${NC}"
else
    echo -e "${YELLOW}? Cannot determine HTTP status (permanent)${NC}"
    echo "  Output: $HTTP_PERMANENT"
fi
echo ""

echo "5. Listing all allowed services:"
echo "---------------------------------"
ansible node3 -m shell -a "firewall-cmd --list-services" | grep -v ">>>"
echo ""

echo "6. Testing web access from node3:"
echo "----------------------------------"
ansible node3 -m shell -a "curl -s -o /dev/null -w '%{http_code}' http://localhost" | grep -v ">>>"
echo "(200 = accessible, 000 = connection refused/blocked)"
echo ""

echo "=================================="
echo "INTERPRETATION:"
echo "=================================="
echo ""
echo "For Challenge 5 to be UNSOLVED (correct state after setup):"
echo "  - httpd: active ✓"
echo "  - firewalld: active ✓"
echo "  - HTTP in firewall (runtime): no ✓"
echo "  - HTTP in firewall (permanent): no ✓"
echo "  - curl from localhost: 200 (httpd works locally) ✓"
echo ""
echo "For Challenge 5 to be SOLVED (after participant solution):"
echo "  - httpd: active ✓"
echo "  - firewalld: active ✓"
echo "  - HTTP in firewall (runtime): yes ✓"
echo "  - HTTP in firewall (permanent): yes ✓"
echo ""
echo "=================================="
echo "NEXT STEPS IF CHALLENGE IS SOLVED:"
echo "=================================="
echo ""
echo "1. Run the SETUP playbook again (don't run RESET):"
echo "   This will block HTTP again"
echo ""
echo "2. Re-run this diagnostic to confirm HTTP is blocked"
echo ""
echo "3. Run the validator - should show 0 points for Challenge 5"
echo ""
echo "=================================="

