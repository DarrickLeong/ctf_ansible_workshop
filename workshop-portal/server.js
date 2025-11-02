const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure marked for syntax highlighting
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Path to workshop materials
const WORKSHOP_DIR = fs.existsSync(path.join(__dirname, '..', 'ctf-workshop'))
    ? path.join(__dirname, '..', 'ctf-workshop')
    : path.join(__dirname, 'ctf-workshop-fallback');

// Define workshop structure with guided exercises
const workshops = {
    section1: {
        title: "Section 1 - Fundamental Ansible Challenges",
        exercises: [
            {
                id: "challenge1",
                number: "1.1",
                title: "Out of Sync - Service Management",
                points: 5,
                difficulty: "⭐ Easy",
                time: "10 minutes"
            },
            {
                id: "challenge2",
                number: "1.2",
                title: "Malicious Package - Package Management",
                points: 10,
                difficulty: "⭐⭐ Easy+",
                time: "15 minutes"
            },
            {
                id: "challenge3",
                number: "1.3",
                title: "Rogue User Account - User Management",
                points: 15,
                difficulty: "⭐⭐ Medium",
                time: "20 minutes"
            }
        ]
    },
    section2: {
        title: "Section 2 - Advanced Ansible Challenges",
        exercises: [
            {
                id: "challenge4",
                number: "2.1",
                title: "Inconsistent Messaging - Templates & Facts",
                points: 20,
                difficulty: "⭐⭐⭐ Medium+",
                time: "30 minutes"
            },
            {
                id: "challenge5",
                number: "2.2",
                title: "Firewall Anomaly - System Configuration",
                points: 20,
                difficulty: "⭐⭐⭐ Medium+",
                time: "30 minutes"
            },
            {
                id: "challenge6",
                number: "2.3",
                title: "The Phoenix Protocol - Workflows & Orchestration",
                points: 30,
                difficulty: "⭐⭐⭐⭐⭐ Hard",
                time: "90 minutes",
                extra_credit: 10
            }
        ]
    }
};

// Challenge content with step-by-step instructions
const challengeContent = {
    challenge1: {
        objective: "Learn to use the ansible.builtin.service module to manage system services.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>System clocks are drifting because the time synchronization service (<code>chronyd</code>) has been stopped across the environment. This is causing logging and authentication issues.</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a single playbook to ensure the <code>chronyd</code> service is running and enabled on all servers.</p>
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ Service is running on all hosts</li>
                <li>✅ Service is enabled to start on boot</li>
                <li>✅ Playbook is idempotent (can run multiple times safely)</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Create Your Playbook</h4>
                <p>In Ansible Automation Platform, create a new playbook file named <code>challenge1-fix-time-sync.yml</code></p>
                <div class="hint-box">
                    <strong>💡 Hint:</strong> Start with a basic playbook structure:
                    <ul>
                        <li>Define a name</li>
                        <li>Specify hosts (all servers)</li>
                        <li>Add tasks section</li>
                    </ul>
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Add the Service Task</h4>
                <p>Use the <code>ansible.builtin.service</code> module to manage the chronyd service.</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>name</code>: The service name (chronyd)</li>
                        <li><code>state</code>: Desired state (started/stopped)</li>
                        <li><code>enabled</code>: Should it start on boot? (yes/no)</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Task description
  ansible.builtin.service:
    name: service_name
    state: started
    enabled: yes</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Test Your Playbook</h4>
                <p>Run the playbook in AAP and verify:</p>
                <ul>
                    <li>All hosts show "changed" or "ok"</li>
                    <li>No errors in the output</li>
                    <li>Service is running: <code>systemctl status chronyd</code></li>
                </ul>
            </div>

            <div class="step">
                <h4>Step 4: Verify Idempotency</h4>
                <p>Run the playbook again. It should show "ok" (not "changed") because the service is already in the desired state.</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Idempotency means running the same playbook multiple times produces the same result without making unnecessary changes.
                </div>
            </div>

            <div class="step">
                <h4>Step 5: Submit Your Solution</h4>
                <p>Once your playbook succeeds, update the CTF Tracker to earn your 5 points!</p>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> Try to solve it yourself first!
            </div>
            <pre><code class="language-yaml">---
- name: Challenge 1 - Fix Time Synchronization
  hosts: all
  become: yes
  
  tasks:
    - name: Ensure chronyd service is running and enabled
      ansible.builtin.service:
        name: chronyd
        state: started
        enabled: yes</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>hosts: all</code> - Runs on all servers in inventory</li>
                <li><code>become: yes</code> - Escalates privileges (sudo)</li>
                <li><code>name: chronyd</code> - The service to manage</li>
                <li><code>state: started</code> - Ensures service is running</li>
                <li><code>enabled: yes</code> - Service starts automatically on boot</li>
            </ul>

            <h4>Testing the Solution:</h4>
            <pre><code class="language-bash"># Run the playbook
ansible-playbook challenge1-fix-time-sync.yml -i inventory

# Verify service status
ansible all -m shell -a "systemctl status chronyd" -i inventory</code></pre>
        `
    },
    challenge2: {
        objective: "Understand how to manage software packages using the ansible.builtin.dnf module.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A compliance scan has detected an unauthorized package, <code>nginx</code>, installed on the database server (node2). Per security policy, database servers must not run web services. It needs to be removed immediately.</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Create a playbook that removes the <code>nginx</code> package from <code>node2</code>.</p>
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ nginx package is removed from node2</li>
                <li>✅ Other servers are not affected</li>
                <li>✅ Playbook targets only the correct host</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Target the Right Host</h4>
                <p>This time, you need to target only <code>node2</code>, not all servers.</p>
                <div class="hint-box">
                    <strong>💡 Hint:</strong> Use <code>hosts: node2</code> in your playbook header.
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Choose the Package Module</h4>
                <p>For RHEL systems, use the <code>ansible.builtin.dnf</code> module (or <code>ansible.builtin.package</code> for cross-platform compatibility).</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>name</code>: Package name (nginx)</li>
                        <li><code>state</code>: absent (to remove), present (to install)</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Remove a package
  ansible.builtin.dnf:
    name: package_name
    state: absent</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Test Your Playbook</h4>
                <p>Before running, verify nginx is installed:</p>
                <pre><code class="language-bash">ansible node2 -m shell -a "rpm -qa | grep nginx" -i inventory</code></pre>
                <p>Run your playbook, then verify it's removed.</p>
            </div>

            <div class="step">
                <h4>Step 4: Verify Only node2 Was Affected</h4>
                <p>Check that node1 and node3 were not modified by your playbook.</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Always target the correct hosts using the <code>hosts:</code> parameter. Use patterns like <code>all</code>, specific host names, or groups.
                </div>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> Try to solve it yourself first!
            </div>
            <pre><code class="language-yaml">---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2
  become: yes
  
  tasks:
    - name: Remove nginx package from database server
      ansible.builtin.dnf:
        name: nginx
        state: absent</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>hosts: node2</code> - Targets only the database server</li>
                <li><code>state: absent</code> - Removes the package if installed</li>
                <li>Idempotent - Safe to run multiple times</li>
            </ul>

            <h4>Alternative Solution (Cross-platform):</h4>
            <pre><code class="language-yaml">- name: Remove nginx using generic package module
  ansible.builtin.package:
    name: nginx
    state: absent</code></pre>

            <h4>Verification:</h4>
            <pre><code class="language-bash"># Check if nginx is removed
ansible node2 -m shell -a "rpm -qa | grep nginx" -i inventory
# Should return empty (no output)</code></pre>
        `
    },
    challenge3: {
        objective: "Master user account management with the ansible.builtin.user module and learn conditional execution.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A rogue user account, <code>rogue_user</code>, was found on node1 and node3. This is a major security vulnerability that must be addressed immediately.</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a playbook that ensures the <code>rogue_user</code> user is completely removed from any server where it exists.</p>
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ rogue_user is removed from all affected servers</li>
                <li>✅ Playbook doesn't fail if user doesn't exist</li>
                <li>✅ User's home directory is also removed</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Plan Your Approach</h4>
                <p>You need to remove the user from multiple servers. The user might not exist on all servers, so your playbook must handle that gracefully.</p>
                <div class="hint-box">
                    <strong>💡 Good news:</strong> Ansible modules are idempotent by default. The <code>user</code> module won't fail if the user doesn't exist!
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Use the User Module</h4>
                <p>The <code>ansible.builtin.user</code> module manages user accounts.</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>name</code>: Username to manage</li>
                        <li><code>state</code>: absent (to remove), present (to create)</li>
                        <li><code>remove</code>: yes (also delete home directory)</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Remove a user account
  ansible.builtin.user:
    name: username
    state: absent
    remove: yes</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Target All Servers</h4>
                <p>Since we're not sure which servers have the rogue user, target all servers with <code>hosts: all</code>.</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> It's okay to run user removal on all servers. If the user doesn't exist, Ansible will simply report "ok" instead of "changed".
                </div>
            </div>

            <div class="step">
                <h4>Step 4: Test and Verify</h4>
                <p>Before running, check where the user exists:</p>
                <pre><code class="language-bash">ansible all -m shell -a "id rogue_user" -i inventory</code></pre>
                <p>Run your playbook, then verify removal:</p>
                <pre><code class="language-bash">ansible all -m shell -a "id rogue_user || echo 'User not found'" -i inventory</code></pre>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> Try to solve it yourself first!
            </div>
            <pre><code class="language-yaml">---
- name: Challenge 3 - Remove Rogue User Account
  hosts: all
  become: yes
  
  tasks:
    - name: Ensure rogue_user is removed from all servers
      ansible.builtin.user:
        name: rogue_user
        state: absent
        remove: yes</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>hosts: all</code> - Runs on all servers (safe because it's idempotent)</li>
                <li><code>state: absent</code> - Removes the user if exists</li>
                <li><code>remove: yes</code> - Also deletes the home directory</li>
                <li>Won't fail if user doesn't exist - just shows "ok"</li>
            </ul>

            <h4>Verification Commands:</h4>
            <pre><code class="language-bash"># Check user status on all hosts
ansible all -m shell -a "id rogue_user 2>&1" -i inventory

# Verify home directory is gone
ansible all -m shell -a "ls -la /home | grep rogue_user || echo 'Not found'" -i inventory</code></pre>

            <h4>Expected Output:</h4>
            <ul>
                <li><strong>node1:</strong> changed (user was removed)</li>
                <li><strong>node2:</strong> ok (user didn't exist)</li>
                <li><strong>node3:</strong> changed (user was removed)</li>
            </ul>
        `
    },
    challenge4: {
        objective: "Learn to use the ansible.builtin.template module and Ansible facts to deploy custom configuration files.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>The "Message of the Day" (<code>/etc/motd</code>) is inconsistent across servers, causing confusion. Some were even defaced by "Disruptive Dezign".</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Create a standardized MOTD using a Jinja2 template. The message should be "Welcome to {{ ansible_hostname }} - Managed by SRE Team". Deploy this template to all three servers.</p>
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ Template file created with variables</li>
                <li>✅ Each server shows its own hostname</li>
                <li>✅ Consistent message across all servers</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Understand Jinja2 Templates</h4>
                <p>Jinja2 templates allow you to create dynamic files using variables and facts.</p>
                <div class="hint-box">
                    <strong>💡 Key Concepts:</strong>
                    <ul>
                        <li>Templates use <code>{{ variable }}</code> syntax</li>
                        <li>Ansible facts like <code>ansible_hostname</code> are automatically available</li>
                        <li>Templates files typically have <code>.j2</code> extension</li>
                    </ul>
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Create the Template File</h4>
                <p>Create a new file <code>templates/motd.j2</code> in your playbook directory:</p>
                <details>
                    <summary><strong>🔍 Show me the template content</strong></summary>
                    <pre><code>Welcome to {{ ansible_hostname }} - Managed by SRE Team

===============================================
System Information:
- Hostname: {{ ansible_hostname }}
- OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
- IP Address: {{ ansible_default_ipv4.address }}
===============================================

This system is managed by Ansible Automation Platform.
Unauthorized access is prohibited.
</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Use the Template Module</h4>
                <p>In your playbook, use <code>ansible.builtin.template</code> to deploy the file.</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>src</code>: Path to template file (templates/motd.j2)</li>
                        <li><code>dest</code>: Destination on remote server (/etc/motd)</li>
                        <li><code>owner/group</code>: File ownership (root/root)</li>
                        <li><code>mode</code>: File permissions ('0644')</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Deploy template
  ansible.builtin.template:
    src: templates/motd.j2
    dest: /etc/motd
    owner: root
    group: root
    mode: '0644'</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 4: Test Your Template</h4>
                <p>After running the playbook, SSH to each server and check the MOTD:</p>
                <pre><code class="language-bash">ansible all -m shell -a "cat /etc/motd" -i inventory</code></pre>
                <p>Each server should show its own hostname!</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Ansible facts are gathered automatically at the start of each playbook run. You can see all facts with: <code>ansible hostname -m setup</code>
                </div>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> Try to solve it yourself first!
            </div>
            
            <h4>Template File: <code>templates/motd.j2</code></h4>
            <pre><code>Welcome to {{ ansible_hostname }} - Managed by SRE Team

===============================================
System Information:
- Hostname: {{ ansible_hostname }}
- OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
- IP Address: {{ ansible_default_ipv4.address }}
===============================================

This system is managed by Ansible Automation Platform.
Unauthorized access is prohibited.
</code></pre>

            <h4>Playbook: <code>challenge4-deploy-motd.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Challenge 4 - Deploy Standardized MOTD
  hosts: all
  become: yes
  
  tasks:
    - name: Deploy consistent MOTD using template
      ansible.builtin.template:
        src: templates/motd.j2
        dest: /etc/motd
        owner: root
        group: root
        mode: '0644'</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>src: templates/motd.j2</code> - Relative path from playbook</li>
                <li><code>{{ ansible_hostname }}</code> - Automatically replaced with each server's hostname</li>
                <li><code>mode: '0644'</code> - Readable by everyone, writable by root only</li>
            </ul>

            <h4>Verification:</h4>
            <pre><code class="language-bash"># View MOTD on all servers
ansible all -m shell -a "cat /etc/motd" -i inventory

# Or SSH to see it when you login
ssh node1</code></pre>

            <h4>Expected Results:</h4>
            <ul>
                <li><strong>node1:</strong> "Welcome to node1 - Managed by SRE Team"</li>
                <li><strong>node2:</strong> "Welcome to node2 - Managed by SRE Team"</li>
                <li><strong>node3:</strong> "Welcome to node3 - Managed by SRE Team"</li>
            </ul>
        `
    }
    },
    challenge5: {
        objective: "Practice managing firewall rules with the ansible.posix.firewalld module, a critical skill for securing servers.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A backup web service is running on <code>node3</code>, but it's inaccessible because the firewall is blocking HTTP traffic. Users are reporting connection timeouts.</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a playbook that adds a permanent rule to the firewall on <code>node3</code> to allow traffic for the <code>http</code> service.</p>
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ HTTP service allowed in firewall on node3</li>
                <li>✅ Rule is permanent (survives reboot)</li>
                <li>✅ Firewall is reloaded to apply changes</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Understand firewalld</h4>
                <p>RHEL uses <code>firewalld</code> to manage firewall rules with zones and services.</p>
                <div class="hint-box">
                    <strong>💡 Key Concepts:</strong>
                    <ul>
                        <li><strong>Zones:</strong> Define trust levels (public, internal, etc.)</li>
                        <li><strong>Services:</strong> Predefined port/protocol combinations (http = port 80/tcp)</li>
                        <li><strong>Permanent:</strong> Rules that persist after reboot</li>
                        <li><strong>Immediate:</strong> Rules active now but lost on reboot</li>
                    </ul>
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Use the firewalld Module</h4>
                <p>The <code>ansible.posix.firewalld</code> module manages firewall rules.</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>service</code>: Service name (http, https, ssh, etc.)</li>
                        <li><code>permanent</code>: Make rule permanent (yes/no)</li>
                        <li><code>state</code>: enabled or disabled</li>
                        <li><code>immediate</code>: Apply now without reload (yes/no)</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Allow service through firewall
  ansible.posix.firewalld:
    service: service_name
    permanent: yes
    state: enabled
    immediate: yes</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Target node3</h4>
                <p>This firewall change should only apply to <code>node3</code> (the secondary web server).</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Always be specific with firewall changes. Opening unnecessary ports is a security risk!
                </div>
            </div>

            <div class="step">
                <h4>Step 4: Verify the Rule</h4>
                <p>After running the playbook, verify the firewall allows HTTP:</p>
                <pre><code class="language-bash"># Check current firewall rules
ansible node3 -m shell -a "firewall-cmd --list-services" -i inventory

# Check permanent rules
ansible node3 -m shell -a "firewall-cmd --list-services --permanent" -i inventory

# Test HTTP access
curl http://node3</code></pre>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> Try to solve it yourself first!
            </div>
            <pre><code class="language-yaml">---
- name: Challenge 5 - Fix Firewall Anomaly
  hosts: node3
  become: yes
  
  tasks:
    - name: Allow HTTP traffic through firewall
      ansible.posix.firewalld:
        service: http
        permanent: yes
        state: enabled
        immediate: yes</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>hosts: node3</code> - Targets only the secondary web server</li>
                <li><code>service: http</code> - Allows HTTP (port 80/tcp)</li>
                <li><code>permanent: yes</code> - Rule survives reboots</li>
                <li><code>state: enabled</code> - Allow the service through</li>
                <li><code>immediate: yes</code> - Applies without manual reload</li>
            </ul>

            <h4>Alternative: Without immediate flag</h4>
            <pre><code class="language-yaml">tasks:
  - name: Allow HTTP permanently
    ansible.posix.firewalld:
      service: http
      permanent: yes
      state: enabled
  
  - name: Reload firewall to apply changes
    ansible.builtin.service:
      name: firewalld
      state: reloaded</code></pre>

            <h4>Verification Commands:</h4>
            <pre><code class="language-bash"># Check if HTTP is allowed
ansible node3 -m shell -a "firewall-cmd --list-services" -i inventory
# Output should include "http"

# Verify permanent rules
ansible node3 -m shell -a "firewall-cmd --list-services --permanent" -i inventory

# Test HTTP access
curl http://node3
# Should connect successfully</code></pre>

            <h4>Common Firewall Services:</h4>
            <ul>
                <li><code>http</code> - Port 80/tcp</li>
                <li><code>https</code> - Port 443/tcp</li>
                <li><code>ssh</code> - Port 22/tcp</li>
                <li><code>mysql</code> - Port 3306/tcp</li>
                <li><code>postgresql</code> - Port 5432/tcp</li>
            </ul>
        `
    },
    challenge6: {
        objective: "Master the creation of multi-tier AAP workflows with dependent steps. Understand how to build ordered recovery and rollback procedures for a complete application stack.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Disaster</h4>
                <p>The application stack is not working. The web server (node1) and the database server (node2) are both offline. Packages are missing, services are stopped, and configurations are lost.</p>
                <p><strong>This is a full-scale disaster recovery scenario!</strong></p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>You must orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow, ensuring services are brought up and rolled back in the correct order.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li>Create six separate playbooks for each recovery step</li>
                <li>Create six Job Templates in AAP (one for each playbook)</li>
                <li>Create a Workflow Template with proper dependency ordering</li>
                <li>Implement success and failure paths</li>
                <li><strong>Extra Credit:</strong> Add an approval gate before execution</li>
            </ol>

            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ Database provisions before web server</li>
                <li>✅ Web server provisions before app deployment</li>
                <li>✅ App deploys before validation</li>
                <li>✅ Validation failures trigger rollbacks</li>
                <li>✅ Rollbacks execute in reverse order</li>
                <li>✅ <strong>Extra Credit:</strong> Approval gate implemented</li>
            </ul>
        `,
        guide: `
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Create Six Playbooks</h4>
                <p>You need to create separate playbooks for each phase of the recovery:</p>
                
                <h5>1. Provision Database (<code>challenge6-provision-database.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node2</li>
                        <li>Install MySQL/MariaDB packages</li>
                        <li>Start and enable the database service</li>
                        <li>Create database and user</li>
                    </ul>
                </details>

                <h5>2. Provision Web Server (<code>challenge6-provision-webserver.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node1</li>
                        <li>Install Apache/httpd packages</li>
                        <li>Configure web server</li>
                        <li>Start and enable httpd service</li>
                    </ul>
                </details>

                <h5>3. Deploy Application (<code>challenge6-deploy-application.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node1</li>
                        <li>Deploy application code</li>
                        <li>Configure database connection</li>
                        <li>Set permissions</li>
                    </ul>
                </details>

                <h5>4. Validate Service (<code>challenge6-validate-service.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Check HTTP endpoint responds</li>
                        <li>Verify database connectivity</li>
                        <li>Fail if checks don't pass</li>
                    </ul>
                </details>

                <h5>5. Rollback Web Server (<code>challenge6-rollback-webserver.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Stop httpd service</li>
                        <li>Remove application code</li>
                        <li>Clean up configurations</li>
                    </ul>
                </details>

                <h5>6. Rollback Database (<code>challenge6-rollback-database.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Drop database and user</li>
                        <li>Stop database service</li>
                        <li>Clean up data files</li>
                    </ul>
                </details>
            </div>

            <div class="step">
                <h4>Step 2: Create Job Templates in AAP</h4>
                <p>For each playbook, create a Job Template in AAP:</p>
                <ol>
                    <li>Navigate to <strong>Templates</strong> in AAP</li>
                    <li>Click <strong>Add</strong> → <strong>Job Template</strong></li>
                    <li>Fill in:</li>
                    <ul>
                        <li><strong>Name:</strong> "Challenge 6 - Provision Database"</li>
                        <li><strong>Inventory:</strong> Your workshop inventory</li>
                        <li><strong>Project:</strong> Your workshop project</li>
                        <li><strong>Playbook:</strong> challenge6-provision-database.yml</li>
                        <li><strong>Credentials:</strong> Your SSH credentials</li>
                    </ul>
                    <li>Click <strong>Save</strong></li>
                    <li>Repeat for all six playbooks</li>
                </ol>
                
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Job Templates are reusable definitions for running playbooks. Think of them as saved configurations.
                </div>
            </div>

            <div class="step">
                <h4>Step 3: Create the Workflow Template</h4>
                <p>Now comes the orchestration magic!</p>
                
                <ol>
                    <li>Navigate to <strong>Templates</strong> → Click <strong>Add</strong> → <strong>Workflow Template</strong></li>
                    <li>Name it "Challenge 6 - Phoenix Protocol"</li>
                    <li>Click <strong>Save</strong></li>
                    <li>Click <strong>Workflow Visualizer</strong></li>
                </ol>

                <h5>Build the Success Path:</h5>
                <ol>
                    <li>Click <strong>START</strong> → Add "Provision Database"</li>
                    <li>Click "Provision Database" → Select <strong>On Success</strong> → Add "Provision Web Server"</li>
                    <li>Click "Provision Web Server" → Select <strong>On Success</strong> → Add "Deploy Application"</li>
                    <li>Click "Deploy Application" → Select <strong>On Success</strong> → Add "Validate Service"</li>
                </ol>

                <h5>Build the Failure Path:</h5>
                <ol>
                    <li>Click "Validate Service" → Select <strong>On Failure</strong> → Add "Rollback Web Server"</li>
                    <li>Click "Rollback Web Server" → Select <strong>On Success</strong> → Add "Rollback Database"</li>
                </ol>

                <div class="hint-box">
                    <strong>💡 Workflow Logic:</strong>
                    <ul>
                        <li><strong>On Success:</strong> Next step runs if current step succeeds</li>
                        <li><strong>On Failure:</strong> Next step runs if current step fails</li>
                        <li><strong>Always:</strong> Next step runs regardless of result</li>
                    </ul>
                </div>
            </div>

            <div class="step">
                <h4>Step 4: Test the Workflow</h4>
                <p>Launch the workflow and watch it execute:</p>
                <ol>
                    <li>Click <strong>Launch</strong> on your workflow template</li>
                    <li>Watch the workflow visualizer animate</li>
                    <li>Green nodes = success, Red nodes = failure</li>
                    <li>Follow the execution path</li>
                </ol>

                <p><strong>To test the rollback path:</strong></p>
                <ul>
                    <li>Intentionally break the validation step</li>
                    <li>Watch the workflow automatically trigger rollbacks</li>
                    <li>Verify rollbacks execute in reverse order</li>
                </ul>
            </div>

            <div class="step">
                <h4>Step 5: Extra Credit - Add Approval Gate (10 points)</h4>
                <p>Add a manual approval step before the workflow starts modifying servers.</p>
                
                <h5>Implementation:</h5>
                <ol>
                    <li>In Workflow Visualizer, click <strong>START</strong></li>
                    <li>Add a new node → Select <strong>Approval</strong></li>
                    <li>Name it "Go/No-Go Decision"</li>
                    <li>Description: "Approve disaster recovery execution"</li>
                    <li>Timeout: 1 hour</li>
                    <li>Click <strong>Save</strong></li>
                    <li>Link <strong>START</strong> → <strong>Approval</strong> → <strong>Provision Database</strong></li>
                </ol>

                <p>When you launch the workflow:</p>
                <ol>
                    <li>It will pause at the approval gate</li>
                    <li>Go to <strong>Jobs</strong> → Find your workflow</li>
                    <li>You'll see "Pending Approval" status</li>
                    <li>Click <strong>Approve</strong> or <strong>Deny</strong></li>
                    <li>Workflow continues or stops based on your decision</li>
                </ol>

                <div class="alert alert-success">
                    <strong>🎉 Extra Credit Goal:</strong> Learn how to use Workflow Approvals to create manual gates and human decision points in your automation—a key part of safely managing critical infrastructure.
                </div>
            </div>
        `,
        solution: `
            <h3>Complete Solution</h3>
            <div class="alert alert-warning">
                <strong>⚠️ Spoiler Alert!</strong> This is a complex solution with multiple files!
            </div>

            <h4>Playbook 1: <code>challenge6-provision-database.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Provision Database Server
  hosts: node2
  become: yes
  
  tasks:
    - name: Install MariaDB server
      ansible.builtin.dnf:
        name:
          - mariadb-server
          - python3-PyMySQL
        state: present
    
    - name: Start and enable MariaDB
      ansible.builtin.service:
        name: mariadb
        state: started
        enabled: yes
    
    - name: Create application database
      community.mysql.mysql_db:
        name: appdb
        state: present
        login_unix_socket: /var/lib/mysql/mysql.sock
    
    - name: Create database user
      community.mysql.mysql_user:
        name: appuser
        password: "SecurePass123!"
        priv: "appdb.*:ALL"
        host: "%"
        state: present
        login_unix_socket: /var/lib/mysql/mysql.sock</code></pre>

            <h4>Playbook 2: <code>challenge6-provision-webserver.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Provision Web Server
  hosts: node1
  become: yes
  
  tasks:
    - name: Install Apache web server
      ansible.builtin.dnf:
        name:
          - httpd
          - php
          - php-mysqlnd
        state: present
    
    - name: Configure httpd to listen on port 8080
      ansible.builtin.lineinfile:
        path: /etc/httpd/conf/httpd.conf
        regexp: '^Listen '
        line: 'Listen 8080'
    
    - name: Start and enable httpd
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: yes
    
    - name: Allow HTTP through firewall
      ansible.posix.firewalld:
        port: 8080/tcp
        permanent: yes
        state: enabled
        immediate: yes</code></pre>

            <h4>Playbook 3: <code>challenge6-deploy-application.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Deploy Application
  hosts: node1
  become: yes
  
  tasks:
    - name: Create application directory
      ansible.builtin.file:
        path: /var/www/html
        state: directory
        owner: apache
        group: apache
        mode: '0755'
    
    - name: Deploy application code
      ansible.builtin.copy:
        content: |
          <?php
          \$servername = "node2";
          \$username = "appuser";
          \$password = "SecurePass123!";
          \$dbname = "appdb";
          
          \$conn = new mysqli(\$servername, \$username, \$password, \$dbname);
          
          if (\$conn->connect_error) {
              die("Connection failed: " . \$conn->connect_error);
          }
          echo "Application is healthy! Database connected successfully.";
          \$conn->close();
          ?>
        dest: /var/www/html/index.php
        owner: apache
        group: apache
        mode: '0644'
    
    - name: Restart httpd to load PHP
      ansible.builtin.service:
        name: httpd
        state: restarted</code></pre>

            <h4>Playbook 4: <code>challenge6-validate-service.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Validate Application Stack
  hosts: localhost
  gather_facts: no
  
  tasks:
    - name: Check if web service responds
      ansible.builtin.uri:
        url: "http://node1:8080/index.php"
        method: GET
        status_code: 200
        return_content: yes
      register: http_response
      failed_when: "'healthy' not in http_response.content"
    
    - name: Display validation result
      ansible.builtin.debug:
        msg: "✅ Application stack validated successfully!"</code></pre>

            <h4>Playbook 5: <code>challenge6-rollback-webserver.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Rollback Web Server
  hosts: node1
  become: yes
  
  tasks:
    - name: Stop httpd service
      ansible.builtin.service:
        name: httpd
        state: stopped
        enabled: no
      ignore_errors: yes
    
    - name: Remove application code
      ansible.builtin.file:
        path: /var/www/html/index.php
        state: absent
    
    - name: Remove packages
      ansible.builtin.dnf:
        name:
          - httpd
          - php
          - php-mysqlnd
        state: absent</code></pre>

            <h4>Playbook 6: <code>challenge6-rollback-database.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Rollback Database Server
  hosts: node2
  become: yes
  
  tasks:
    - name: Drop database
      community.mysql.mysql_db:
        name: appdb
        state: absent
        login_unix_socket: /var/lib/mysql/mysql.sock
      ignore_errors: yes
    
    - name: Drop database user
      community.mysql.mysql_user:
        name: appuser
        state: absent
        login_unix_socket: /var/lib/mysql/mysql.sock
      ignore_errors: yes
    
    - name: Stop MariaDB
      ansible.builtin.service:
        name: mariadb
        state: stopped
        enabled: no
      ignore_errors: yes</code></pre>

            <h4>Workflow Structure (AAP):</h4>
            <pre>
START
  │
  ▼
[Provision Database] ──Success──▶ [Provision Web Server] ──Success──▶ [Deploy Application] ──Success──▶ [Validate Service]
                                                                                                              │
                                                                                                              Failure
                                                                                                              │
                                                                                                              ▼
                                                                                             [Rollback Web Server] ──Success──▶ [Rollback Database]
            </pre>

            <h4>Extra Credit - With Approval Gate:</h4>
            <pre>
START
  │
  ▼
[Go/No-Go Approval] ──Approved──▶ [Provision Database] ──Success──▶ ...
  │
  Denied
  │
  ▼
END
            </pre>

            <h4>Testing the Solution:</h4>
            <ol>
                <li><strong>Test Success Path:</strong> Launch workflow with clean servers → Should provision everything</li>
                <li><strong>Test Failure Path:</strong> Break validation (stop node2) → Should trigger rollbacks</li>
                <li><strong>Test Approval:</strong> Launch with approval gate → Approve/Deny to control execution</li>
            </ol>

            <div class="alert alert-success">
                <h4>🎉 Congratulations!</h4>
                <p>You've mastered complex workflow orchestration! This pattern is used in real-world disaster recovery, blue/green deployments, and complex multi-tier application management.</p>
            </div>
        `
    }
};

// Helper function to generate HTML template
function generateHTML(title, content, currentPath = '/', section = null) {
    const sectionNav = section ? `
        <div class="section-nav">
            <h3>${section.title}</h3>
            <ul class="exercise-list">
                ${section.exercises.map(ex => `
                    <li class="exercise-item ${currentPath === `/exercise/${ex.id}` ? 'active' : ''}">
                        <a href="/exercise/${ex.id}">
                            <span class="exercise-number">${ex.number}</span>
                            <span class="exercise-title">${ex.title}</span>
                            <span class="exercise-meta">
                                <span class="badge">${ex.points} pts</span>
                                <span class="badge">${ex.difficulty}</span>
                            </span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - CTF Workshop</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #e4e4e7;
            background: #0a0a0b;
        }

        .workshop-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 20px 0;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .workshop-header .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .workshop-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .workshop-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .breadcrumb {
            padding: 15px 0;
            font-size: 14px;
        }

        .breadcrumb a {
            color: #818cf8;
            text-decoration: none;
        }

        .breadcrumb a:hover {
            color: #a5b4fc;
            text-decoration: underline;
        }

        .main-content {
            background: #18181b;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            margin-bottom: 20px;
            border: 1px solid #27272a;
        }

        .content h1 {
            color: #a5b4fc;
            font-size: 32px;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid #6366f1;
        }

        .exercise-meta-bar {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background: #27272a;
            border-radius: 8px;
            font-size: 14px;
            border: 1px solid #3f3f46;
        }

        .exercise-meta-bar .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .content h2 {
            color: #c4b5fd;
            font-size: 24px;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #3f3f46;
        }

        .content h3 {
            color: #d8b4fe;
            font-size: 20px;
            margin-top: 25px;
            margin-bottom: 12px;
        }

        .content h4 {
            color: #e4e4e7;
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .content p {
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .content ul, .content ol {
            margin-left: 30px;
            margin-bottom: 15px;
        }

        .content li {
            margin-bottom: 8px;
        }

        .content pre {
            background: #0f172a;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
            border: 1px solid #1e293b;
        }

        .content code {
            background: #27272a;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 14px;
            color: #f0abfc;
            border: 1px solid #3f3f46;
        }

        .content pre code {
            background: transparent;
            padding: 0;
            color: #e4e4e7;
            border: none;
        }

        .alert {
            padding: 16px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid;
        }

        .alert-danger {
            background: #2d1315;
            border-color: #f87171;
            color: #fecaca;
        }

        .alert-warning {
            background: #2d2512;
            border-color: #fbbf24;
            color: #fef3c7;
        }

        .alert-info {
            background: #171e2d;
            border-color: #818cf8;
            color: #c7d2fe;
        }

        .alert-success {
            background: #14261f;
            border-color: #34d399;
            color: #d1fae5;
        }

        .hint-box {
            background: #2d2512;
            border: 1px solid #facc15;
            border-left: 4px solid #facc15;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
        }

        .step {
            margin: 30px 0;
            padding: 20px;
            background: #1f1f23;
            border-radius: 8px;
            border-left: 4px solid #6366f1;
            border: 1px solid #3f3f46;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            background: #6366f1;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        details {
            margin: 15px 0;
            padding: 15px;
            background: #27272a;
            border-radius: 6px;
            border: 1px solid #3f3f46;
        }

        details summary {
            cursor: pointer;
            font-weight: 600;
            color: #a5b4fc;
            padding: 5px;
        }

        details summary:hover {
            color: #c7d2fe;
        }

        details[open] summary {
            margin-bottom: 15px;
        }

        .nav-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #3f3f46;
        }

        .nav-buttons a {
            display: inline-block;
            padding: 10px 20px;
            background: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
        }

        .nav-buttons a:hover {
            background: #4f46e5;
        }

        .nav-buttons a.secondary {
            background: #3f3f46;
        }

        .nav-buttons a.secondary:hover {
            background: #52525b;
        }

        .section-nav {
            background: #18181b;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            margin-bottom: 20px;
            border: 1px solid #27272a;
        }

        .section-nav h3 {
            color: #a5b4fc;
            margin-bottom: 15px;
        }

        .exercise-list {
            list-style: none;
            margin: 0;
        }

        .exercise-item {
            border-bottom: 1px solid #3f3f46;
        }

        .exercise-item:last-child {
            border-bottom: none;
        }

        .exercise-item a {
            display: block;
            padding: 12px 10px;
            color: #e4e4e7;
            text-decoration: none;
            transition: background 0.2s;
        }

        .exercise-item a:hover {
            background: #27272a;
        }

        .exercise-item.active a {
            background: #1e1b4b;
            color: #c7d2fe;
            font-weight: 600;
        }

        .exercise-number {
            display: inline-block;
            width: 40px;
            color: #9ca3af;
        }

        .exercise-title {
            flex: 1;
        }

        .exercise-meta {
            display: inline-flex;
            gap: 5px;
            margin-left: 10px;
        }

        @media (max-width: 768px) {
            .main-content {
                padding: 20px;
            }

            .exercise-meta-bar {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="workshop-header">
        <div class="container">
            <div class="workshop-title">🎯 Ansible CTF Workshop - Ansible for SRE & DevOps</div>
            <div class="workshop-subtitle">Hands-on Ansible Automation Platform Training</div>
        </div>
    </div>
    
    <div class="container">
        ${content}
    </div>

    <script>
        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>
    `;
}

// Routes

// Home page - Workshop overview
app.get('/', (req, res) => {
    const content = `
        <div class="breadcrumb">
            <a href="/">Home</a>
        </div>
        <div class="main-content">
            <div class="content">
                <h1>Ansible CTF Workshop</h1>
                <p class="lead">Welcome to the hands-on Ansible Automation Platform Capture The Flag Workshop!</p>
                
                <div class="alert alert-info">
                    <h4>📚 About This Workshop</h4>
                    <p>This workshop provides hands-on experience with Ansible through practical, real-world scenarios. You'll learn by solving challenges that progressively build your automation skills.</p>
                </div>

                <h2>Workshop Structure</h2>
                
                <h3>Section 1 - Fundamental Ansible Challenges</h3>
                <p>Master the basics of Ansible playbooks, modules, and best practices.</p>
                <ul class="exercise-list">
                    ${workshops.section1.exercises.map(ex => `
                        <li class="exercise-item">
                            <a href="/exercise/${ex.id}">
                                <span class="exercise-number">Exercise ${ex.number}</span>
                                <span class="exercise-title">${ex.title}</span>
                                <span class="exercise-meta">
                                    <span class="badge">${ex.points} points</span>
                                    <span class="badge">${ex.difficulty}</span>
                                    <span class="badge">⏱️ ${ex.time}</span>
                                </span>
                            </a>
                        </li>
                    `).join('')}
                </ul>

                <h3>Section 2 - Advanced Ansible Challenges</h3>
                <p>Explore advanced features including templates, workflows, and orchestration.</p>
                <ul class="exercise-list">
                    ${workshops.section2.exercises.map(ex => `
                        <li class="exercise-item">
                            <a href="/exercise/${ex.id}">
                                <span class="exercise-number">Exercise ${ex.number}</span>
                                <span class="exercise-title">${ex.title}</span>
                                <span class="exercise-meta">
                                    <span class="badge">${ex.points} points</span>
                                    ${ex.extra_credit ? `<span class="badge" style="background: #28a745;">+${ex.extra_credit} EC</span>` : ''}
                                    <span class="badge">${ex.difficulty}</span>
                                    <span class="badge">⏱️ ${ex.time}</span>
                                </span>
                            </a>
                        </li>
                    `).join('')}
                </ul>

                <h2>How to Use This Workshop</h2>
                <div class="step">
                    <h4>1. Read the Scenario</h4>
                    <p>Each exercise presents a real-world problem you need to solve.</p>
                </div>
                <div class="step">
                    <h4>2. Follow the Step-by-Step Guide</h4>
                    <p>Detailed instructions with hints help you learn the concepts.</p>
                </div>
                <div class="step">
                    <h4>3. Implement Your Solution</h4>
                    <p>Write playbooks in Ansible Automation Platform and test them.</p>
                </div>
                <div class="step">
                    <h4>4. Verify and Learn</h4>
                    <p>Check the complete solution to understand best practices.</p>
                </div>

                <div class="nav-buttons">
                    <a href="/exercise/challenge1">Start with Exercise 1.1 →</a>
                </div>
            </div>
        </div>
    `;
    res.send(generateHTML('Home', content, '/'));
});

// Exercise page
app.get('/exercise/:id', (req, res) => {
    const exerciseId = req.params.id;
    const challenge = challengeContent[exerciseId];
    
    if (!challenge) {
        return res.status(404).send(generateHTML('Not Found', '<div class="main-content"><h1>Exercise not found</h1></div>'));
    }

    // Find the exercise metadata
    let exerciseMeta = null;
    let sectionMeta = null;
    for (const [sectionId, section] of Object.entries(workshops)) {
        const ex = section.exercises.find(e => e.id === exerciseId);
        if (ex) {
            exerciseMeta = ex;
            sectionMeta = section;
            break;
        }
    }

    if (!exerciseMeta) {
        return res.status(404).send(generateHTML('Not Found', '<div class="main-content"><h1>Exercise not found</h1></div>'));
    }

    const content = `
        <div class="breadcrumb">
            <a href="/">Home</a> / <a href="/#${sectionMeta.title.replace(/ /g, '-').toLowerCase()}">${sectionMeta.title}</a> / Exercise ${exerciseMeta.number}
        </div>

        <div class="main-content">
            <div class="content">
                <h1>Exercise ${exerciseMeta.number}: ${exerciseMeta.title}</h1>
                
                <div class="exercise-meta-bar">
                    <div class="meta-item">
                        <strong>Points:</strong> ${exerciseMeta.points}
                        ${exerciseMeta.extra_credit ? ` (+${exerciseMeta.extra_credit} extra credit)` : ''}
                    </div>
                    <div class="meta-item">
                        <strong>Difficulty:</strong> ${exerciseMeta.difficulty}
                    </div>
                    <div class="meta-item">
                        <strong>Estimated Time:</strong> ⏱️ ${exerciseMeta.time}
                    </div>
                    <div class="meta-item">
                        <strong>Objective:</strong> ${challenge.objective}
                    </div>
                </div>

                ${challenge.scenario}
                ${challenge.requirements}
                ${challenge.guide}
                ${challenge.solution}

                <div class="nav-buttons">
                    <a href="/" class="secondary">← Back to Overview</a>
                    <a href="https://your-ctf-tracker-url.com" target="_blank">Submit Solution →</a>
                </div>
            </div>
        </div>
    `;

    res.send(generateHTML(`Exercise ${exerciseMeta.number}`, content, `/exercise/${exerciseId}`, sectionMeta));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🎯 CTF Workshop Portal');
    console.log('==========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📖 Access at: http://localhost:${PORT}`);
    console.log(`📁 Workshop directory: ${WORKSHOP_DIR}`);
    console.log('==========================================');
});
