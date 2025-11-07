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
