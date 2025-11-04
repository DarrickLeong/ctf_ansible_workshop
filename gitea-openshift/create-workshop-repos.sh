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
    
    # Extract protocol and host from GITEA_URL
    GITEA_PROTOCOL=$(echo $GITEA_URL | sed -e 's|://.*||')
    GITEA_HOST=$(echo $GITEA_URL | sed -e 's|^http://||' -e 's|^https://||')
    
    # Build authenticated URL (password will be used as-is)
    AUTH_URL="${GITEA_PROTOCOL}://${username}:${password}@${GITEA_HOST}/${username}/${REPO_NAME}.git"
    
    # Try to clone with better error handling
    echo -e "  ${BLUE}Cloning repository...${NC}"
    if git clone "$AUTH_URL" "$REPO_DIR" 2>&1 | tee /tmp/git_clone_$$.log | grep -v "password"; then
        echo -e "  ${GREEN}✓ Repository cloned${NC}"
    else
        if grep -q "already exists and is not an empty directory" /tmp/git_clone_$$.log; then
            echo -e "  ${YELLOW}⚠ Directory exists, cleaning...${NC}"
            rm -rf "$REPO_DIR"
            git clone "$AUTH_URL" "$REPO_DIR" &>/dev/null || {
                echo -e "  ${RED}✗ Failed to clone repository${NC}"
                rm -f /tmp/git_clone_$$.log
                return 1
            }
        else
            echo -e "  ${RED}✗ Failed to clone repository${NC}"
            rm -f /tmp/git_clone_$$.log
            return 1
        fi
    fi
    rm -f /tmp/git_clone_$$.log
    
    cd "$REPO_DIR"
    
    # Create challenge directories
    mkdir -p challenge1 challenge2 challenge3 challenge4 challenge5 challenge6
    
    # Create main README.md
    cat > README.md <<'EOF'
# Ansible CTF Workshop - My Challenge Workspace

This is your personal workspace for creating Ansible playbook solutions for each challenge.

## Challenge Structure

Each challenge has its own directory with detailed instructions:
- `challenge1/` - Out of Sync (5 points)
- `challenge2/` - Malicious Package (10 points)
- `challenge3/` - Rogue User Account (15 points)
- `challenge4/` - Inconsistent Messaging (20 points)
- `challenge5/` - Firewall Anomaly (20 points)
- `challenge6/` - The Phoenix Protocol (30 points)

## Getting Started

1. Navigate to each challenge directory
2. Read the README.md for detailed challenge requirements
3. Create your playbook solution
4. Test your playbook
5. Commit and push your solution
6. Submit via AAP for scoring

## Workflow

```bash
# Navigate to a challenge
cd challenge1

# Read the instructions
cat README.md

# Create your solution
vim solution.yml

# Test it (if possible)
ansible-playbook --syntax-check solution.yml

# Commit and push
git add solution.yml
git commit -m "Complete challenge 1"
git push

# Submit via AAP for scoring
```

## Tips

- Always test your playbooks before submitting
- Use `ansible-playbook --check` for dry runs
- Check the syntax with `ansible-playbook --syntax-check`
- Use verbose mode `-v` for debugging
- Commit frequently with clear messages

## Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Modules Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- Workshop Portal: Check with your instructor

Good luck! 🚀
EOF
    
    # Challenge 1: Out of Sync
    cat > challenge1/README.md <<'EOF'
# Challenge 1: Out of Sync (5 Points)

## 🎯 Target Nodes
**ALL nodes** - node1, node2, and node3

## The Problem
System clocks are drifting because the time synchronization service (`chronyd`) has been stopped across the environment. This is causing logging and authentication issues.

## Your Mission
Write a playbook that ensures the `chronyd` service is running and enabled on **all three nodes**.

## Requirements
- Service must be started on **node1, node2, and node3**
- Service must be enabled (starts on boot) on **all nodes**
- Must work on all hosts in inventory

## Helpful Hints
- Module to use: `ansible.builtin.service`
- Target hosts: Use `hosts: all` or `hosts: web` (the group containing all nodes)
- Check the [service module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)

## Playbook Template
Create your playbook as `challenge1/solution.yml`

```yaml
---
- name: Challenge 1 - Fix Time Sync
  hosts: all  # Targets all nodes
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 2: Malicious Package
    cat > challenge2/README.md <<'EOF'
# Challenge 2: Malicious Package (10 Points)

## 🎯 Target Nodes
**node2 ONLY** - database server

## The Problem
A compliance scan has detected an unauthorized package, `bind-utils`, installed on the database server (node2). Per security policy, database servers must not have DNS utility tools installed.

## Your Mission
Create a playbook that removes the `bind-utils` package from **node2 only**.

## Requirements
- Target only **node2** (NOT node1 or node3)
- Remove bind-utils package
- Ensure package is completely removed
- Other servers must not be affected

## Helpful Hints
- Module to use: `ansible.builtin.dnf` (or `ansible.builtin.yum`)
- State should be: `absent`
- Target hosts: Use `hosts: node2` to target only the database server
- Check the [dnf module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/dnf_module.html)

## Playbook Template
Create your playbook as `challenge2/solution.yml`

```yaml
---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2  # Targets only node2
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 3: Rogue User Account
    cat > challenge3/README.md <<'EOF'
# Challenge 3: Rogue User Account (15 Points)

## 🎯 Target Nodes
**node1 and node3** - NOT node2

## The Problem
A rogue user account, `rogue_user`, was found on **node1 and node3**. This is a major security vulnerability that must be addressed immediately.

## Your Mission
Write a playbook that ensures the `rogue_user` user is completely removed from **node1 and node3**.

## Requirements
- Remove the user from **node1**
- Remove the user from **node3**
- User's home directory should be removed
- Handle cases where user may not exist (no failures)

## Helpful Hints
- Module to use: `ansible.builtin.user`
- State should be: `absent`
- Target hosts: Use `hosts: node1,node3` to target only these two nodes
- Use `remove: yes` to also delete home directory
- Check the [user module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/user_module.html)

## Playbook Template
Create your playbook as `challenge3/solution.yml`

```yaml
---
- name: Challenge 3 - Remove Rogue User
  hosts: node1,node3  # Targets only node1 and node3
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 4: Inconsistent Messaging
    cat > challenge4/README.md <<'EOF'
# Challenge 4: Inconsistent Messaging (20 Points)

## 🎯 Target Nodes
**ALL nodes** - node1, node2, and node3

## The Problem
The "Message of the Day" (`/etc/motd`) is inconsistent across servers, causing confusion:
- **node1**: Defaced by a bad actor
- **node2**: Outdated message
- **node3**: File is missing entirely

## Your Mission
Create a standardized MOTD using a Jinja2 template. The message must:
- Include the text "Welcome to" followed by the server's **actual hostname**
- Include the text "Managed by SRE Team" or "SRE Team"
- Be deployed to `/etc/motd` on **all three servers**
- Each server must display its **own unique hostname** (node1, node2, node3)

## Requirements
- Create a Jinja2 template file in a `templates/` directory
- Deploy to **all servers (node1, node2, node3)**
- Use Ansible facts to dynamically insert each server's hostname
- Ensure the message includes "SRE Team"

## Helpful Hints
- Ansible collects "facts" about each server automatically - these are variables containing system information
- The hostname is available as an Ansible fact
- Template files use Jinja2 syntax with double curly braces `{{ variable_name }}`
- Module to use: `ansible.builtin.template`
- Target hosts: Use `hosts: all` or `hosts: web` to target all nodes
- Create a template file: `templates/motd.j2`
- Destination: `/etc/motd`
- Check the [template module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/template_module.html)

## Playbook Template
Create your playbook as `challenge4/solution.yml` and template as `challenge4/templates/motd.j2`

```yaml
---
- name: Challenge 4 - Fix MOTD
  hosts: all  # Targets all nodes
  become: yes
  
  tasks:
    # Your task here
```

**Remember:** You also need to create `templates/motd.j2` with your template content!
EOF

    # Challenge 5: Firewall Anomaly
    cat > challenge5/README.md <<'EOF'
# Challenge 5: Firewall Anomaly (20 Points)

## 🎯 Target Nodes
**node3 ONLY** - backup web server

## The Problem
A backup web service is running on **node3**, but it's inaccessible because the firewall is blocking HTTP traffic. The `httpd` service is running, but external connections fail.

## Your Mission
Write a playbook that adds a **permanent** rule to the firewall on **node3** to allow traffic for the `http` service.

## Requirements
- Target only **node3** (NOT node1 or node2)
- Add firewall rule for http service
- Rule must be permanent (survives reboot)
- Firewall must be reloaded
- `firewalld` service must be running

## Helpful Hints
- Module to use: `ansible.posix.firewalld`
- Target hosts: Use `hosts: node3` to target only the backup web server
- Service: `http`
- State should be: `enabled`
- Make it permanent: `permanent: yes`
- Reload after: `immediate: yes`
- Check the [firewalld module documentation](https://docs.ansible.com/ansible/latest/collections/ansible/posix/firewalld_module.html)

## Playbook Template
Create your playbook as `challenge5/solution.yml`

```yaml
---
- name: Challenge 5 - Fix Firewall
  hosts: node3  # Targets only node3
  become: yes
  
  tasks:
    # Your task here
```
EOF

    # Challenge 6: The Phoenix Protocol
    cat > challenge6/README.md <<'EOF'
# Challenge 6: The Phoenix Protocol (30 Points)

## 🎯 Target Nodes
**node1 (web server) and node2 (database server)**

## The Disaster
The application stack is completely offline:
- **node1**: Web server (httpd) is stopped, package removed, files missing
- **node2**: Database server (PostgreSQL) is stopped, packages removed

Both services must be restored in the correct order with proper validation.

## Your Mission
Orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow.

## Requirements

### Create 4 Separate Playbooks:
1. `challenge6-provision-database.yml` - Set up database server (node2)
2. `challenge6-provision-webserver.yml` - Set up web server (node1) on port 8080
3. `challenge6-deploy-application.yml` - Deploy the application to node1
4. `challenge6-validate-service.yml` - Validate everything works

### In AAP:
1. Create 4 Job Templates (one for each playbook)
2. Create a Workflow Template with name containing "Phoenix":
   - **Success Path**: Provision DB → Provision Web → Deploy App → Validate
   - All links must be "On Success" (green arrows)
3. Add an Approval Node at the START of the workflow:
   - START → Approval Gate → Provision DB → ...
   - Requires manual approval before making changes

## Scoring Breakdown (30 Points Total)
- **Step 1**: Provision Database (5 pts)
- **Step 2**: Provision Web Server on port 8080 (5 pts)
- **Step 3**: Deploy Application (5 pts)
- **Step 4**: Validate Service (5 pts)
- **Step 5**: Create Workflow Template with all 4 playbooks in order (5 pts)
- **Step 6**: Add Approval Node at workflow start (5 pts)

## Sample Playbook Structure

### challenge6-provision-database.yml
```yaml
---
- name: Provision Database Server
  hosts: node2
  become: yes
  tasks:
    - name: Install database packages
      ansible.builtin.dnf:
        name:
          - postgresql-server
          - python3-psycopg2
        state: present
    
    - name: Initialize PostgreSQL
      ansible.builtin.command: postgresql-setup --initdb
      args:
        creates: /var/lib/pgsql/data/postgresql.conf
    
    - name: Start and enable postgresql
      ansible.builtin.service:
        name: postgresql
        state: started
        enabled: yes
```

### challenge6-validate-service.yml
```yaml
---
- name: Validate Application Stack
  hosts: node1
  tasks:
    - name: Gather service facts
      ansible.builtin.service_facts:
    
    - name: Check httpd is running
      ansible.builtin.assert:
        that:
          - "'httpd.service' in services"
          - "services['httpd.service'].state == 'running'"
    
    - name: Check web server response
      ansible.builtin.uri:
        url: "http://node1:8080/index.php"
        status_code: 200
        return_content: yes
      register: http_test
      failed_when:
        - http_test.status != 200
        - "'healthy' not in http_test.content"
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
- Challenge 2: Package management (bind-utils removal)
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
