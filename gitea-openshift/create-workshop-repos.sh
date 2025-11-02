#!/bin/bash
#
# Gitea Workshop Setup Script
# Creates users and initializes workshop repositories with challenge structure
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo "Usage: $0 <gitea-url> <admin-token> <users.csv>"
    echo ""
    echo "Example:"
    echo "  $0 http://gitea-gitea.apps.cluster.com YOUR_ADMIN_TOKEN workshop-users.csv"
    echo ""
    echo "Steps to get admin token:"
    echo "  1. Login to Gitea as admin"
    echo "  2. Go to Settings > Applications"
    echo "  3. Generate new token with name 'workshop-setup'"
    echo "  4. Copy the token and use it in this script"
    echo ""
    echo "CSV format: username,email,password,is_admin"
    echo "Example CSV:"
    echo "  username,email,password,is_admin"
    echo "  student1,student1@example.com,pass123,false"
    echo "  student2,student2@example.com,pass456,false"
    exit 1
}

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    show_usage
fi

GITEA_URL=$1
ADMIN_TOKEN=$2
CSV_FILE=$3
REPO_NAME="ansible-ctf-challenges"

if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: File $CSV_FILE not found${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Ansible CTF Workshop Setup"
echo "=========================================="
echo ""
echo -e "${BLUE}Gitea URL:${NC} $GITEA_URL"
echo -e "${BLUE}CSV File:${NC} $CSV_FILE"
echo -e "${BLUE}Repository:${NC} $REPO_NAME"
echo ""
read -p "Proceed with setup? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi
echo ""

# Create temporary directory for repo initialization
TEMP_DIR=$(mktemp -d)

# Function to create user
create_user() {
    local username=$1
    local email=$2
    local password=$3
    local is_admin=$4
    
    echo -e "${BLUE}➜${NC} Creating user: ${GREEN}${username}${NC}..."
    
    RESPONSE=$(curl -s -X POST "${GITEA_URL}/api/v1/admin/users" \
        -H "Authorization: token ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"must_change_password\": false,
            \"send_notify\": false,
            \"visibility\": \"public\"
        }" 2>&1)
    
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ User already exists${NC}"
        return 0
    elif echo "$RESPONSE" | grep -q "\"id\""; then
        echo -e "  ${GREEN}✓ User created successfully${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Failed to create user${NC}"
        echo "  Response: $RESPONSE"
        return 1
    fi
}

# Function to create repository
create_repository() {
    local username=$1
    
    echo -e "${BLUE}➜${NC} Creating repository: ${GREEN}${username}/${REPO_NAME}${NC}..."
    
    RESPONSE=$(curl -s -X POST "${GITEA_URL}/api/v1/admin/users/${username}/repos" \
        -H "Authorization: token ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${REPO_NAME}\",
            \"description\": \"Ansible CTF Workshop - Challenge Playbooks\",
            \"private\": false,
            \"auto_init\": true,
            \"default_branch\": \"main\",
            \"readme\": \"Default\"
        }" 2>&1)
    
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ Repository already exists${NC}"
        return 0
    elif echo "$RESPONSE" | grep -q "\"id\""; then
        echo -e "  ${GREEN}✓ Repository created successfully${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Failed to create repository${NC}"
        echo "  Response: $RESPONSE"
        return 1
    fi
}

# Function to initialize repository with challenge structure
initialize_repo_structure() {
    local username=$1
    local password=$2
    
    echo -e "${BLUE}➜${NC} Initializing repository structure..."
    
    # Clone the repository
    REPO_URL="${GITEA_URL}/${username}/${REPO_NAME}.git"
    REPO_DIR="${TEMP_DIR}/${username}-${REPO_NAME}"
    
    # Extract host from GITEA_URL and embed credentials
    GITEA_HOST=$(echo $GITEA_URL | sed -e 's|^http://||' -e 's|^https://||')
    AUTH_URL="http://${username}:${password}@${GITEA_HOST}/${username}/${REPO_NAME}.git"
    
    git clone "$AUTH_URL" "$REPO_DIR" &>/dev/null || {
        echo -e "  ${RED}✗ Failed to clone repository${NC}"
        return 1
    }
    
    cd "$REPO_DIR"
    
    # Create challenge directories
    mkdir -p challenge1 challenge2 challenge3 challenge4 challenge5 challenge6
    
    # Create main README.md
    cat > README.md <<'EOF'
# Ansible CTF Workshop - Challenge Playbooks

Welcome to the Ansible CTF Workshop! This repository contains directories for each challenge where you'll create your Ansible playbooks.

## Challenge Structure

Each challenge has its own directory:
- `challenge1/` - Out of Sync (5 points)
- `challenge2/` - Malicious Package (10 points)
- `challenge3/` - Rogue User Account (15 points)
- `challenge4/` - Inconsistent Messaging (20 points)
- `challenge5/` - Firewall Anomaly (20 points)
- `challenge6/` - The Phoenix Protocol (30 points + 10 extra credit)

## Getting Started

1. Navigate to each challenge directory
2. Read the README.md for challenge details
3. Create your playbook solution
4. Test your playbook
5. Submit via AAP for scoring

## Tips

- Always test your playbooks before submitting
- Use `ansible-playbook --check` for dry runs
- Check the syntax with `ansible-playbook --syntax-check`
- Use verbose mode `-v` for debugging

## Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Modules Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- Workshop Portal: [Link provided by instructor]

Good luck! 🚀
EOF
    
    # Challenge 1: Out of Sync
    cat > challenge1/README.md <<'EOF'
# Challenge 1: Out of Sync (5 Points)

## The Problem
System clocks are drifting because the time synchronization service (`chronyd`) has been stopped across the environment. This is causing logging and authentication issues.

## Your Mission
Write a playbook that ensures the `chronyd` service is running and enabled on all servers.

## Requirements
- Service must be started
- Service must be enabled (starts on boot)
- Must work on all hosts

## Helpful Hints
- Module to use: `ansible.builtin.service`
- Check the [service module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)

## Testing Your Solution
```bash
# Check service status on all hosts
ansible all -m shell -a "systemctl status chronyd"
```

## Playbook Template
Create your playbook as `challenge1/solution.yml`

```yaml
---
- name: Challenge 1 - Fix Time Sync
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 2: Malicious Package
    cat > challenge2/README.md <<'EOF'
# Challenge 2: Malicious Package (10 Points)

## The Problem
A compliance scan has detected an unauthorized package, `nginx`, installed on the database server (node2). Per security policy, database servers must not run web services.

## Your Mission
Create a playbook that removes the `nginx` package from node2.

## Requirements
- Target only node2
- Remove nginx package
- Ensure package is completely removed

## Helpful Hints
- Module to use: `ansible.builtin.dnf` (or `ansible.builtin.yum`)
- State should be: `absent`
- Check the [dnf module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/dnf_module.html)

## Testing Your Solution
```bash
# Check if nginx is installed on node2
ansible node2 -m shell -a "rpm -q nginx"
```

## Playbook Template
Create your playbook as `challenge2/solution.yml`

```yaml
---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 3: Rogue User Account
    cat > challenge3/README.md <<'EOF'
# Challenge 3: Rogue User Account (15 Points)

## The Problem
A rogue user account, `rogue_user`, was found on node1 and node3. This is a major security vulnerability.

## Your Mission
Write a playbook that ensures the `rogue_user` user is completely removed from any server where it exists.

## Requirements
- Remove the user from all systems
- User's home directory should be removed
- Handle cases where user may not exist (no failures)

## Helpful Hints
- Module to use: `ansible.builtin.user`
- State should be: `absent`
- Use `remove: yes` to delete home directory
- Check the [user module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/user_module.html)

## Testing Your Solution
```bash
# Check if user exists
ansible all -m shell -a "id rogue_user"
```

## Playbook Template
Create your playbook as `challenge3/solution.yml`

```yaml
---
- name: Challenge 3 - Remove Rogue User
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 4: Inconsistent Messaging
    cat > challenge4/README.md <<'EOF'
# Challenge 4: Inconsistent Messaging (20 Points)

## The Problem
The "Message of the Day" (`/etc/motd`) is inconsistent across servers, causing confusion. Some were even defaced!

## Your Mission
Create a standardized MOTD using a template. The message should be "Welcome to {{ ansible_hostname }} - Managed by SRE Team".

## Requirements
- Create a Jinja2 template file
- Deploy to all servers
- Use the `ansible_hostname` fact to personalize each server's message

## Helpful Hints
- Module to use: `ansible.builtin.template`
- Create a template file: `templates/motd.j2`
- Destination: `/etc/motd`
- Check the [template module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/template_module.html)

## Testing Your Solution
```bash
# Check MOTD on all hosts
ansible all -m shell -a "cat /etc/motd"
```

## Playbook Template
Create your playbook as `challenge4/solution.yml` and template as `challenge4/templates/motd.j2`

```yaml
---
- name: Challenge 4 - Fix MOTD
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 5: Firewall Anomaly
    cat > challenge5/README.md <<'EOF'
# Challenge 5: Firewall Anomaly (20 Points)

## The Problem
A backup web service is running on node3, but it's inaccessible because the firewall is blocking HTTP traffic.

## Your Mission
Write a playbook that adds a permanent rule to the firewall on node3 to allow traffic for the `http` service.

## Requirements
- Target only node3
- Add firewall rule for http service
- Rule must be permanent (survives reboot)
- Firewall must be reloaded

## Helpful Hints
- Module to use: `ansible.posix.firewalld`
- Service: `http`
- State should be: `enabled`
- Make it permanent: `permanent: yes`
- Reload after: `immediate: yes`
- Check the [firewalld module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/posix/firewalld_module.html)

## Testing Your Solution
```bash
# Check firewall rules on node3
ansible node3 -m shell -a "firewall-cmd --list-services"
```

## Playbook Template
Create your playbook as `challenge5/solution.yml`

```yaml
---
- name: Challenge 5 - Fix Firewall
  hosts: node3
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 6: The Phoenix Protocol
    cat > challenge6/README.md <<'EOF'
# Challenge 6: The Phoenix Protocol (30 Points + 10 Extra Credit)

## The Disaster
The application stack is not working. The web server (node1) and the database server (node2) are both offline. Packages are missing, services are stopped, and configurations are lost.

## Your Mission
Orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow.

## Requirements

### Create 6 Separate Playbooks:
1. `provision-database.yml` - Set up database server
2. `provision-webserver.yml` - Set up web server
3. `deploy-application.yml` - Deploy the application
4. `validate-service.yml` - Validate everything works
5. `rollback-webserver.yml` - Rollback web server if validation fails
6. `rollback-database.yml` - Rollback database if validation fails

### In AAP:
1. Create 6 Job Templates (one for each playbook)
2. Create a Workflow Template with:
   - **Success Path**: Provision DB → Provision Web → Deploy App → Validate
   - **Failure Path**: From Validate, if fails → Rollback Web → Rollback DB

### Extra Credit (10 Points):
Add a Workflow Approval node before starting the recovery:
- START → Approval Gate → Provision DB → ...
- Requires manual approval before making changes

## Sample Playbook Structure

### provision-database.yml
```yaml
---
- name: Provision Database Server
  hosts: node2
  become: yes
  tasks:
    - name: Install database packages
      ansible.builtin.dnf:
        name:
          - mariadb-server
          - python3-PyMySQL
        state: present
    
    - name: Start and enable mariadb
      ansible.builtin.service:
        name: mariadb
        state: started
        enabled: yes
```

### validate-service.yml
```yaml
---
- name: Validate Application Stack
  hosts: localhost
  tasks:
    - name: Check web server response
      ansible.builtin.uri:
        url: "http://node1"
        status_code: 200
        timeout: 10
```

## Testing Your Solution
Test each playbook individually before creating the workflow:
```bash
ansible-playbook provision-database.yml
ansible-playbook provision-webserver.yml
# ... etc
```

## Tips
- Use `failed_when` to control when validation fails
- Test your rollback playbooks separately
- Use tags to make playbooks more flexible
- Document your workflow design

Good luck with the disaster recovery! 🚀
EOF

    # Create a templates directory with a sample for challenge 4
    mkdir -p challenge4/templates
    cat > challenge4/templates/motd.j2 <<'EOF'
Welcome to {{ ansible_hostname }} - Managed by SRE Team
EOF


    # Create .gitignore
    cat > .gitignore <<'EOF'
# Ansible
*.retry
*.log

# Sensitive files
vault.yml
*_vault.yml

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

    # Git add, commit, and push
    git add .
    git commit -m "Initialize workshop repository with challenge structure

- Challenge 1: Time synchronization (chronyd)
- Challenge 2: Package management (nginx removal)
- Challenge 3: User management (rogue user)
- Challenge 4: Template deployment (MOTD)
- Challenge 5: Firewall configuration (http service)
- Challenge 6: Workflow orchestration (disaster recovery)

Each challenge includes:
- Detailed problem description
- Mission statement
- Requirements
- Helpful hints with module links
- Playbook template

Additional files:
- .gitignore (Ansible best practices)
- templates/motd.j2 (Jinja2 example)" &>/dev/null
    
    git push origin main &>/dev/null 2>&1
    
    cd - &>/dev/null
    rm -rf "$REPO_DIR"
    
    echo -e "  ${GREEN}✓ Repository structure initialized and pushed${NC}"
}

# Counter for statistics
USERS_CREATED=0
USERS_EXISTED=0
REPOS_CREATED=0
REPOS_EXISTED=0
REPOS_INITIALIZED=0

# Main execution
echo "=========================================="
echo "  Processing Users and Repositories"
echo "=========================================="
echo ""

while IFS=',' read -r username email password is_admin; do
    # Skip empty lines
    if [ -z "$username" ]; then
        continue
    fi
    
    # Skip commented lines (starting with #)
    if [[ "$username" =~ ^#.*$ ]] || [[ "$username" =~ ^[[:space:]]*#.*$ ]]; then
        continue
    fi
    
    # Skip header
    if [ "$username" = "username" ]; then
        continue
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  User: $username"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Create user
    if create_user "$username" "$email" "$password" "$is_admin"; then
        if echo "$RESPONSE" | grep -q "already exists"; then
            ((USERS_EXISTED++))
        else
            ((USERS_CREATED++))
        fi
    fi
    
    # Small delay between API calls
    sleep 1
    
    # Create repository
    if create_repository "$username"; then
        if echo "$RESPONSE" | grep -q "already exists"; then
            ((REPOS_EXISTED++))
        else
            ((REPOS_CREATED++))
        fi
    fi
    
    # Wait for repo to be fully ready
    sleep 2
    
    # Initialize repository structure
    if initialize_repo_structure "$username" "$password"; then
        ((REPOS_INITIALIZED++))
    fi
    
    echo ""
    
done < "$CSV_FILE"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "  ✅ Workshop Setup Complete!"
echo "=========================================="
echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo "  • Users created: $USERS_CREATED"
echo "  • Users already existed: $USERS_EXISTED"
echo "  • Repositories created: $REPOS_CREATED"
echo "  • Repositories already existed: $REPOS_EXISTED"
echo "  • Repositories initialized: $REPOS_INITIALIZED"
echo ""
echo -e "${BLUE}📦 Repository Structure:${NC}"
echo "  • Name: ${REPO_NAME}"
echo "  • Challenges: 6 (challenge1 to challenge6)"
echo "  • Each with detailed README and templates"
echo ""
echo -e "${YELLOW}👥 Participant Next Steps:${NC}"
echo "  1. Clone repository:"
echo "     git clone ${GITEA_URL}/USERNAME/${REPO_NAME}.git"
echo ""
echo "  2. Navigate to challenge directory:"
echo "     cd ${REPO_NAME}/challenge1"
echo ""
echo "  3. Read instructions:"
echo "     cat README.md"
echo ""
echo "  4. Create solution playbook:"
echo "     vim solution.yml"
echo ""
echo "  5. Commit and push:"
echo "     git add solution.yml"
echo "     git commit -m 'Complete challenge 1'"
echo "     git push"
echo ""
echo -e "${GREEN}🎯 All set for the workshop!${NC}"
echo "=========================================="
echo ""


# Function to create user
create_user() {
    local username=$1
    local email=$2
    local password=$3
    local is_admin=$4
    
    echo "➜ Creating user: $username..."
    
    RESPONSE=$(curl -s -X POST "${GITEA_URL}/api/v1/admin/users" \
        -H "Authorization: token ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"must_change_password\": false,
            \"send_notify\": false,
            \"visibility\": \"public\"
        }" 2>&1)
    
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ User already exists${NC}"
        return 0
    elif echo "$RESPONSE" | grep -q "\"id\""; then
        echo -e "  ${GREEN}✓ User created${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Failed to create user${NC}"
        echo "  Response: $RESPONSE"
        return 1
    fi
}

# Function to create repository
create_repository() {
    local username=$1
    
    echo "➜ Creating repository: ${username}/${REPO_NAME}..."
    
    RESPONSE=$(curl -s -X POST "${GITEA_URL}/api/v1/admin/users/${username}/repos" \
        -H "Authorization: token ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${REPO_NAME}\",
            \"description\": \"Ansible CTF Workshop - Challenge Playbooks\",
            \"private\": false,
            \"auto_init\": true,
            \"default_branch\": \"main\",
            \"readme\": \"Default\"
        }" 2>&1)
    
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ Repository already exists${NC}"
        return 0
    elif echo "$RESPONSE" | grep -q "\"id\""; then
        echo -e "  ${GREEN}✓ Repository created${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Failed to create repository${NC}"
        echo "  Response: $RESPONSE"
        return 1
    fi
}

# Function to initialize repository with challenge structure
initialize_repo_structure() {
    local username=$1
    local password=$2
    
    echo "➜ Initializing repository structure..."
    
    # Clone the repository
    REPO_URL="${GITEA_URL}/${username}/${REPO_NAME}.git"
    REPO_DIR="${TEMP_DIR}/${username}-${REPO_NAME}"
    
    # Extract host from GITEA_URL and embed credentials
    GITEA_HOST=$(echo $GITEA_URL | sed -e 's|^http://||' -e 's|^https://||')
    AUTH_URL="http://${username}:${password}@${GITEA_HOST}/${username}/${REPO_NAME}.git"
    
    git clone "$AUTH_URL" "$REPO_DIR" &>/dev/null || {
        echo -e "  ${RED}✗ Failed to clone repository${NC}"
        return 1
    }
    
    cd "$REPO_DIR"
    
    # Create challenge directories
    mkdir -p challenge1 challenge2 challenge3 challenge4 challenge5 challenge6
    
    # Create main README.md
    cat > README.md <<'EOF'
# Ansible CTF Workshop - Challenge Playbooks

Welcome to the Ansible CTF Workshop! This repository contains directories for each challenge where you'll create your Ansible playbooks.

## Challenge Structure

Each challenge has its own directory:
- `challenge1/` - Out of Sync (5 points)
- `challenge2/` - Malicious Package (10 points)
- `challenge3/` - Rogue User Account (15 points)
- `challenge4/` - Inconsistent Messaging (20 points)
- `challenge5/` - Firewall Anomaly (20 points)
- `challenge6/` - The Phoenix Protocol (30 points + 10 extra credit)

## Getting Started

1. Navigate to each challenge directory
2. Read the README.md for challenge details
3. Create your playbook solution
4. Test your playbook
5. Submit via AAP for scoring

## Tips

- Always test your playbooks before submitting
- Use `ansible-playbook --check` for dry runs
- Check the syntax with `ansible-playbook --syntax-check`
- Use verbose mode `-v` for debugging

## Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Modules Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- Workshop Portal: [Link provided by instructor]

Good luck! 🚀
EOF
    
    # Challenge 1: Out of Sync
    cat > challenge1/README.md <<'EOF'
# Challenge 1: Out of Sync (5 Points)

## The Problem
System clocks are drifting because the time synchronization service (`chronyd`) has been stopped across the environment. This is causing logging and authentication issues.

## Your Mission
Write a playbook that ensures the `chronyd` service is running and enabled on all servers.

## Requirements
- Service must be started
- Service must be enabled (starts on boot)
- Must work on all hosts

## Helpful Hints
- Module to use: `ansible.builtin.service`
- Check the [service module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)

## Testing Your Solution
```bash
# Check service status on all hosts
ansible all -m shell -a "systemctl status chronyd"
```

## Playbook Template
Create your playbook as `challenge1/solution.yml`

```yaml
---
- name: Challenge 1 - Fix Time Sync
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 2: Malicious Package
    cat > challenge2/README.md <<'EOF'
# Challenge 2: Malicious Package (10 Points)

## The Problem
A compliance scan has detected an unauthorized package, `nginx`, installed on the database server (node2). Per security policy, database servers must not run web services.

## Your Mission
Create a playbook that removes the `nginx` package from node2.

## Requirements
- Target only node2
- Remove nginx package
- Ensure package is completely removed

## Helpful Hints
- Module to use: `ansible.builtin.dnf` (or `ansible.builtin.yum`)
- State should be: `absent`
- Check the [dnf module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/dnf_module.html)

## Testing Your Solution
```bash
# Check if nginx is installed on node2
ansible node2 -m shell -a "rpm -q nginx"
```

## Playbook Template
Create your playbook as `challenge2/solution.yml`

```yaml
---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 3: Rogue User Account
    cat > challenge3/README.md <<'EOF'
# Challenge 3: Rogue User Account (15 Points)

## The Problem
A rogue user account, `rogue_user`, was found on node1 and node3. This is a major security vulnerability.

## Your Mission
Write a playbook that ensures the `rogue_user` user is completely removed from any server where it exists.

## Requirements
- Remove the user from all systems
- User's home directory should be removed
- Handle cases where user may not exist (no failures)

## Helpful Hints
- Module to use: `ansible.builtin.user`
- State should be: `absent`
- Use `remove: yes` to delete home directory
- Check the [user module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/user_module.html)

## Testing Your Solution
```bash
# Check if user exists
ansible all -m shell -a "id rogue_user"
```

## Playbook Template
Create your playbook as `challenge3/solution.yml`

```yaml
---
- name: Challenge 3 - Remove Rogue User
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 4: Inconsistent Messaging
    cat > challenge4/README.md <<'EOF'
# Challenge 4: Inconsistent Messaging (20 Points)

## The Problem
The "Message of the Day" (`/etc/motd`) is inconsistent across servers, causing confusion. Some were even defaced!

## Your Mission
Create a standardized MOTD using a template. The message should be "Welcome to {{ ansible_hostname }} - Managed by SRE Team".

## Requirements
- Create a Jinja2 template file
- Deploy to all servers
- Use the `ansible_hostname` fact to personalize each server's message

## Helpful Hints
- Module to use: `ansible.builtin.template`
- Create a template file: `templates/motd.j2`
- Destination: `/etc/motd`
- Check the [template module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/template_module.html)

## Testing Your Solution
```bash
# Check MOTD on all hosts
ansible all -m shell -a "cat /etc/motd"
```

## Playbook Template
Create your playbook as `challenge4/solution.yml` and template as `challenge4/templates/motd.j2`

```yaml
---
- name: Challenge 4 - Fix MOTD
  hosts: all
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 5: Firewall Anomaly
    cat > challenge5/README.md <<'EOF'
# Challenge 5: Firewall Anomaly (20 Points)

## The Problem
A backup web service is running on node3, but it's inaccessible because the firewall is blocking HTTP traffic.

## Your Mission
Write a playbook that adds a permanent rule to the firewall on node3 to allow traffic for the `http` service.

## Requirements
- Target only node3
- Add firewall rule for http service
- Rule must be permanent (survives reboot)
- Firewall must be reloaded

## Helpful Hints
- Module to use: `ansible.posix.firewalld`
- Service: `http`
- State should be: `enabled`
- Make it permanent: `permanent: yes`
- Reload after: `immediate: yes`
- Check the [firewalld module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/posix/firewalld_module.html)

## Testing Your Solution
```bash
# Check firewall rules on node3
ansible node3 -m shell -a "firewall-cmd --list-services"
```

## Playbook Template
Create your playbook as `challenge5/solution.yml`

```yaml
---
- name: Challenge 5 - Fix Firewall
  hosts: node3
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 6: The Phoenix Protocol
    cat > challenge6/README.md <<'EOF'
# Challenge 6: The Phoenix Protocol (30 Points + 10 Extra Credit)

## The Disaster
The application stack is not working. The web server (node1) and the database server (node2) are both offline. Packages are missing, services are stopped, and configurations are lost.

## Your Mission
Orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow.

## Requirements

### Create 6 Separate Playbooks:
1. `provision-database.yml` - Set up database server
2. `provision-webserver.yml` - Set up web server
3. `deploy-application.yml` - Deploy the application
4. `validate-service.yml` - Validate everything works
5. `rollback-webserver.yml` - Rollback web server if validation fails
6. `rollback-database.yml` - Rollback database if validation fails

### In AAP:
1. Create 6 Job Templates (one for each playbook)
2. Create a Workflow Template with:
   - **Success Path**: Provision DB → Provision Web → Deploy App → Validate
   - **Failure Path**: From Validate, if fails → Rollback Web → Rollback DB

### Extra Credit (10 Points):
Add a Workflow Approval node before starting the recovery:
- START → Approval Gate → Provision DB → ...
- Requires manual approval before making changes

## Sample Playbook Structure

### provision-database.yml
```yaml
---
- name: Provision Database Server
  hosts: node2
  become: yes
  tasks:
    - name: Install database packages
      ansible.builtin.dnf:
        name:
          - mariadb-server
          - python3-PyMySQL
        state: present
    
    - name: Start and enable mariadb
      ansible.builtin.service:
        name: mariadb
        state: started
        enabled: yes
```

### validate-service.yml
```yaml
---
- name: Validate Application Stack
  hosts: localhost
  tasks:
    - name: Check web server response
      ansible.builtin.uri:
        url: "http://node1"
        status_code: 200
        timeout: 10
```

## Testing Your Solution
Test each playbook individually before creating the workflow:
```bash
ansible-playbook provision-database.yml
ansible-playbook provision-webserver.yml
# ... etc
```

## Tips
- Use `failed_when` to control when validation fails
- Test your rollback playbooks separately
- Use tags to make playbooks more flexible
- Document your workflow design

Good luck with the disaster recovery! 🚀
EOF

    # Create a templates directory with a sample for challenge 4
    mkdir -p challenge4/templates
    cat > challenge4/templates/motd.j2 <<'EOF'
Welcome to {{ ansible_hostname }} - Managed by SRE Team
EOF


    # Create .gitignore
    cat > .gitignore <<'EOF'
# Ansible
*.retry
*.log

# Sensitive files
vault.yml
*_vault.yml

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

    # Git add, commit, and push
    git add .
    git commit -m "Initialize workshop repository with challenge structure" &>/dev/null
    git push origin main &>/dev/null
    
    cd - &>/dev/null
    rm -rf "$REPO_DIR"
    
    echo -e "  ${GREEN}✓ Repository structure initialized${NC}"
}

# Main execution
