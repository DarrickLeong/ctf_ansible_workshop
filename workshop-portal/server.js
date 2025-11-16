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
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">ALL nodes</strong> - node1, node2, and node3</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a single playbook to ensure the <code>chronyd</code> service is running and enabled on <strong>all three nodes</strong>.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create playbook:</strong> <code>challenge1-fix-time-sync.yml</code></li>
                <li><strong>Target hosts:</strong> All nodes (node1, node2, node3)</li>
                <li><strong>Use module:</strong> <code>ansible.builtin.service</code></li>
                <li><strong>Service name:</strong> <code>chronyd</code></li>
                <li><strong>Required state:</strong> Service must be <code>started</code></li>
                <li><strong>Boot behavior:</strong> Service must be <code>enabled</code> (starts on boot)</li>
            </ol>
            
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ <code>chronyd</code> service is <strong>running</strong> on node1, node2, and node3</li>
                <li>✅ <code>chronyd</code> service is <strong>enabled</strong> to start on boot</li>
                <li>✅ Playbook is idempotent (can run multiple times safely)</li>
                <li>✅ Playbook uses <code>become: yes</code> for privilege escalation</li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
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
            
                </div>
            </details>
        `,
        solution: `
            <details>
                <summary><strong>🔓 Click to Reveal Complete Solution</strong></summary>
                <div class="solution-content">
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
                </div>
            </details>
        `
    },
    challenge2: {
        objective: "Understand how to manage software packages using the ansible.builtin.dnf module.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A compliance scan has detected an unauthorized package, <code>bind-utils</code>, installed on the database server (node2). Per security policy, database servers must not run web services. It needs to be removed immediately.</p>
            </div>
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">node2 ONLY</strong> - database server</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Create a playbook that removes the <code>bind-utils</code> package from <strong>node2 only</strong>.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create playbook:</strong> <code>challenge2-remove-package.yml</code></li>
                <li><strong>Target host:</strong> <code>node2</code> ONLY (database server)</li>
                <li><strong>Use module:</strong> <code>ansible.builtin.dnf</code></li>
                <li><strong>Package name:</strong> <code>bind-utils</code></li>
                <li><strong>Required state:</strong> Package must be <code>absent</code> (removed)</li>
                <li><strong>Privilege escalation:</strong> Use <code>become: yes</code></li>
            </ol>
            
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ <code>bind-utils</code> package is <strong>removed</strong> from node2</li>
                <li>✅ <strong>node1 and node3</strong> are <strong>NOT affected</strong></li>
                <li>✅ Playbook targets only <code>node2</code> in hosts declaration</li>
                <li>✅ Uses <code>ansible.builtin.dnf</code> module with <code>state: absent</code></li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
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
                        <li><code>name</code>: Package name (bind-utils)</li>
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
                <p>Before running, verify bind-utils is installed:</p>
                <pre><code class="language-bash">ansible node2 -m shell -a "rpm -qa | grep bind-utils" -i inventory</code></pre>
                <p>Run your playbook, then verify it's removed.</p>
            </div>

            <div class="step">
                <h4>Step 4: Verify Only node2 Was Affected</h4>
                <p>Check that node1 and node3 were not modified by your playbook.</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Always target the correct hosts using the <code>hosts:</code> parameter. Use patterns like <code>all</code>, specific host names, or groups.
                </div>
            </div>
            
                </div>
            </details>
        `,
        solution: `
            <details style="margin-top: 40px;">
                <summary><strong>🔓 Click to Reveal Complete Solution</strong></summary>
                <div style="margin-top: 20px;">
                    <div class="alert alert-warning">
                        <strong>⚠️ Spoiler Alert!</strong> Make sure you've tried solving it yourself first!
                    </div>
                    <pre><code class="language-yaml">---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2
  become: yes
  
  tasks:
    - name: Remove bind-utils package from database server
      ansible.builtin.dnf:
        name: bind-utils
        state: absent</code></pre>

            <h4>Explanation:</h4>
            <ul>
                <li><code>hosts: node2</code> - Targets only the database server</li>
                <li><code>state: absent</code> - Removes the package if installed</li>
                <li>Idempotent - Safe to run multiple times</li>
            </ul>

            <h4>Alternative Solution (Cross-platform):</h4>
            <pre><code class="language-yaml">- name: Remove bind-utils using generic package module
  ansible.builtin.package:
    name: bind-utils
    state: absent</code></pre>

                    <h4>Verification:</h4>
                    <pre><code class="language-bash"># Check if bind-utils is removed
ansible node2 -m shell -a "rpm -qa | grep bind-utils" -i inventory
# Should return empty (no output)</code></pre>
                </div>
            </details>
        `
    },
    challenge3: {
        objective: "Master user account management with the ansible.builtin.user module and learn conditional execution.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A rogue user account, <code>rogue_user</code>, was found on node1 and node3. This is a major security vulnerability that must be addressed immediately.</p>
            </div>
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">node1 and node3</strong> - NOT node2</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a playbook that ensures the <code>rogue_user</code> user is completely removed from <strong>node1 and node3</strong>.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create playbook:</strong> <code>challenge3-remove-user.yml</code></li>
                <li><strong>Target hosts:</strong> <code>node1</code> and <code>node3</code> (NOT node2)</li>
                <li><strong>Use module:</strong> <code>ansible.builtin.user</code></li>
                <li><strong>Username:</strong> <code>rogue_user</code></li>
                <li><strong>Required state:</strong> User must be <code>absent</code> (removed)</li>
                <li><strong>Remove home directory:</strong> Set <code>remove: yes</code> to delete home folder</li>
                <li><strong>Privilege escalation:</strong> Use <code>become: yes</code></li>
            </ol>
            
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ <code>rogue_user</code> is <strong>removed</strong> from node1</li>
                <li>✅ <code>rogue_user</code> is <strong>removed</strong> from node3</li>
                <li>✅ User's <strong>home directory</strong> is also deleted</li>
                <li>✅ Playbook is idempotent (doesn't fail if user doesn't exist)</li>
                <li>✅ Playbook targets <code>node1,node3</code> or uses proper host pattern</li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
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
            
                </div>
            </details>
        `,
        solution: `
            <details style="margin-top: 40px;">
                <summary><strong>🔓 Click to Reveal Complete Solution</strong></summary>
                <div style="margin-top: 20px;">
                    <div class="alert alert-warning">
                        <strong>⚠️ Spoiler Alert!</strong> Make sure you've tried solving it yourself first!
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
                </div>
            </details>
        `
    },
    challenge4: {
        objective: "Learn to use the ansible.builtin.template module and Ansible facts to deploy custom configuration files with dynamic content.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>The "Message of the Day" (<code>/etc/motd</code>) is inconsistent across servers, causing confusion. Some were even defaced by a bad actor.</p>
            </div>
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">ALL nodes</strong> - node1, node2, and node3</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Create a standardized MOTD using a Jinja2 template that displays each server's unique hostname and system information.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create template file:</strong> <code>templates/motd.j2</code> in your playbook directory</li>
                <li><strong>Template content must include:</strong>
                    <ul>
                        <li>Text "Welcome to" followed by the server's hostname</li>
                        <li>Text "Managed by SRE Team" or "SRE Team"</li>
                        <li>Operating system name and version (e.g., "OS: RedHat 8.5")</li>
                        <li>System architecture (e.g., "Architecture: x86_64")</li>
                        <li>Use Jinja2 variables:
                            <ul>
                                <li>For hostname</li>
                                <li>For OS name</li>
                                <li>For OS version</li>
                                <li>For architecture</li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li><strong>Create playbook:</strong> <code>challenge4-deploy-motd.yml</code></li>
                <li><strong>Target hosts:</strong> All nodes (node1, node2, node3)</li>
                <li><strong>Use module:</strong> <code>ansible.builtin.template</code></li>
                <li><strong>Template file location:</strong> <code>templates/motd.j2</code> (create this directory and file)</li>
                <li><strong>In playbook, use:</strong> <code>src: motd.j2</code> (Ansible automatically looks in templates/ directory)</li>
                <li><strong>Destination:</strong> <code>/etc/motd</code></li>
                <li><strong>File permissions:</strong> Set <code>mode: '0644'</code></li>
                <li><strong>Privilege escalation:</strong> Use <code>become: yes</code></li>
            </ol>
            
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ Template file <code>templates/motd.j2</code> created</li>
                <li>✅ Template uses hostname variable</li>
                <li>✅ Template includes OS information variable</li>
                <li>✅ Template includes architecture variable</li>
                <li>✅ <code>/etc/motd</code> deployed on all three nodes</li>
                <li>✅ Each node shows its <strong>own unique hostname</strong> (node1, node2, node3)</li>
                <li>✅ Message includes "SRE Team" text</li>
                <li>✅ File permissions are <code>0644</code></li>
                <li><strong>⚠️ Take Note</strong> Do not hardcode the hostname, OS, or architecture in the template. Use the Ansible or Special variables instead.</li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
            <div class="step">
                <h4>Step 1: Understand Jinja2 Templates and Ansible Facts</h4>
                <p>Jinja2 templates allow you to create dynamic files using variables. Ansible automatically collects "facts" about each server - these are variables containing system information.</p>
                <div class="hint-box">
                    <strong>💡 Key Concepts:</strong>
                    <ul>
                        <li>Templates use <code>{{ variable_name }}</code> syntax for variable substitution</li>
                        <li>Ansible facts contain information like hostname, IP address, OS version, etc.</li>
                        <li>Template files typically have <code>.j2</code> extension</li>
                        <li>The hostname is available as an Ansible fact</li>
                    </ul>
                </div>
            </div>

            <div class="step">
                <h4>Step 2: Create the Template File</h4>
                <p>Create a new file <code>templates/motd.j2</code> in your playbook directory. The template should include:</p>
                <ul>
                    <li>The text "Welcome to" followed by the hostname</li>
                    <li>The text "Managed by SRE Team"</li>
                    <li>The operating system and version (e.g., "OS: RedHat 8.5")</li>
                    <li>The system architecture (e.g., "Architecture: x86_64")</li>
                </ul>
                <div class="hint-box">
                    <strong>💡 Helpful Ansible Facts:</strong>
                    <ul>
                        <li><code>ansible_hostname</code> - The server's hostname</li>
                        <li><code>ansible_distribution</code> - OS name (RedHat, Ubuntu, etc.)</li>
                        <li><code>ansible_distribution_version</code> - OS version (8.5, 20.04, etc.)</li>
                        <li><code>ansible_architecture</code> - CPU architecture (x86_64, aarch64, etc.)</li>
                        <li>Variables are inserted using double curly braces: <code>{{ variable_name }}</code></li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me an example template structure</strong></summary>
                    <pre><code>Welcome to {{ ansible_hostname }} - Managed by SRE Team
OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
Architecture: {{ ansible_architecture }}</code></pre>
                    <p><em>This is the expected format for full credit.</em></p>
                </details>
            </div>

            <div class="step">
                <h4>Step 3: Use the Template Module</h4>
                <p>In your playbook, use <code>ansible.builtin.template</code> to deploy the file.</p>
                <div class="hint-box">
                    <strong>💡 Module Parameters:</strong>
                    <ul>
                        <li><code>src</code>: Path to template file (relative to playbook)</li>
                        <li><code>dest</code>: Destination on remote server (/etc/motd)</li>
                        <li><code>owner/group</code>: File ownership (root/root)</li>
                        <li><code>mode</code>: File permissions ('0644')</li>
                    </ul>
                </div>
                <details>
                    <summary><strong>🔍 Show me the module syntax</strong></summary>
                    <pre><code class="language-yaml">- name: Deploy MOTD template
  ansible.builtin.template:
    src: motd.j2
    dest: /etc/motd
    owner: root
    group: root
    mode: '0644'</code></pre>
                </details>
            </div>

            <div class="step">
                <h4>Step 4: Test Your Template</h4>
                <p>After running the playbook, verify the MOTD on each server:</p>
                <pre><code class="language-bash">ansible all -m shell -a "cat /etc/motd"</code></pre>
                <p>Each server should show <strong>its own unique hostname</strong>!</p>
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Ansible facts are gathered automatically at the start of each playbook run. You can see all available facts with: <code>ansible hostname -m setup</code>
                </div>
            </div>
            
                </div>
            </details>
        `,
        solution: `
            <details style="margin-top: 40px;">
                <summary><strong>🔓 Click to Reveal Complete Solution</strong></summary>
                <div style="margin-top: 20px;">
                    <div class="alert alert-warning">
                        <strong>⚠️ Spoiler Alert!</strong> Make sure you've tried solving it yourself first!
                    </div>
            
                    <h4>Template File: <code>templates/motd.j2</code></h4>
            <pre><code>Welcome to {{ ansible_hostname }} - Managed by SRE Team
OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
Architecture: {{ ansible_architecture }}
</code></pre>

            <h4>Playbook: <code>challenge4-solution.yml</code></h4>
            <pre><code class="language-yaml">---
- name: Challenge 4 - Deploy Standardized MOTD
  hosts: all
  become: yes
  
  tasks:
    - name: Deploy consistent MOTD using template
      ansible.builtin.template:
        src: motd.j2
        dest: /etc/motd
        owner: root
        group: root
        mode: '0644'</code></pre>

                    <h4>Explanation:</h4>
                    <ul>
                        <li><code>src: motd.j2</code> - Ansible automatically looks in the <code>templates/</code> subdirectory</li>
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
                </div>
            </details>
                `
    },
    challenge5: {
        objective: "Practice managing firewall rules with the ansible.posix.firewalld module, a critical skill for securing servers.",
        scenario: `
            <div class="alert alert-danger">
                <h4>🚨 The Problem</h4>
                <p>A backup web service is running on <code>node3</code>, but it's inaccessible because the firewall is blocking HTTP traffic. Users are reporting connection timeouts.</p>
            </div>
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">node3 ONLY</strong> - backup web server</p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>Write a playbook that adds a permanent rule to the firewall on <strong>node3</strong> to allow traffic for the <code>http</code> service.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create playbook:</strong> <code>challenge5-allow-http.yml</code></li>
                <li><strong>Target host:</strong> <code>node3</code> ONLY (backup web server)</li>
                <li><strong>Use module:</strong> <code>ansible.posix.firewalld</code></li>
                <li><strong>Service to allow:</strong> <code>http</code></li>
                <li><strong>Make it permanent:</strong> Set <code>permanent: yes</code></li>
                <li><strong>Apply immediately:</strong> Set <code>immediate: yes</code> (or use <code>state: enabled</code>)</li>
                <li><strong>Rule state:</strong> <code>state: enabled</code></li>
                <li><strong>Privilege escalation:</strong> Use <code>become: yes</code></li>
            </ol>
            
            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ HTTP service is <strong>allowed</strong> in firewalld on node3</li>
                <li>✅ Rule is <strong>permanent</strong> (survives reboot)</li>
                <li>✅ Rule is <strong>active immediately</strong> (no reboot needed)</li>
                <li>✅ Uses <code>ansible.posix.firewalld</code> module</li>
                <li>✅ Playbook targets only <code>node3</code></li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
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
            
                </div>
            </details>
        `,
        solution: `
            <details>
                <summary><strong>🔓 Click to Reveal Complete Solution</strong></summary>
                <div class="solution-content">
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
                        <li><code>postgresql</code> - Port 5432/tcp</li>
                    </ul>
                </div>
            </details>
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
            <div class="alert alert-primary" style="margin-top: 10px;">
                <h4>🎯 Target Nodes</h4>
                <p><strong style="color: #e74c3c;">node1 (web server) and node2 (database server)</strong></p>
            </div>
        `,
        requirements: `
            <h3>Your Mission</h3>
            <p>You must orchestrate a full, multi-tier server recovery using an Ansible Automation Platform Workflow, ensuring services are brought up and rolled back in the correct order.</p>
            
            <h4>Tasks:</h4>
            <ol>
                <li><strong>Create 6 playbooks</strong> (details below)</li>
                <li><strong>Create 6 Job Templates in AAP</strong> (one for each playbook)</li>
                <li><strong>Create 1 Workflow Template</strong> with proper dependency ordering</li>
                <li><strong>Implement success path:</strong> Database → Web → App → Validation</li>
                <li><strong>Implement failure path:</strong> Validation fail → Rollback Web → Rollback DB</li>
                <li><strong>Extra Credit:</strong> Add an approval gate before execution (+10 pts)</li>
            </ol>

            <h4>Required Playbooks:</h4>
            <ol>
                <li><strong>challenge6-provision-database.yml</strong> (Target: node2)
                    <ul>
                        <li>Install <code>postgresql-server</code>, <code>postgresql</code>, and <code>python3-psycopg2</code> packages</li>
                        <li>Initialize PostgreSQL: <code>postgresql-setup --initdb</code> (use <code>creates:</code> to make idempotent)</li>
                        <li>Start and enable <code>postgresql</code> service</li>
                        <li>Wait for port <code>5432</code> to be ready using <code>wait_for</code> module</li>
                    </ul>
                </li>
                <li><strong>challenge6-provision-webserver.yml</strong> (Target: node1)
                    <ul>
                        <li>Install <code>httpd</code>, <code>php</code>, <code>php-pgsql</code>, and <code>policycoreutils-python-utils</code> packages</li>
                        <li><strong>SELinux:</strong> Check if port 8080 configured, add if not present</li>
                        <li>Configure httpd to listen on port <code>8080</code></li>
                        <li>Start and enable <code>httpd</code> service</li>
                        <li>Allow port <code>8080/tcp</code> in firewalld</li>
                    </ul>
                </li>
                <li><strong>challenge6-deploy-application.yml</strong> (Target: node1)
                    <ul>
                        <li>Deploy pre-existing application from backup location <code>/opt/backup/phoenix-app.php</code></li>
                        <li>Copy to <code>/var/www/html/index.php</code></li>
                        <li>Set owner: apache, group: apache</li>
                        <li>Set mode: 0644</li>
                        <li>Use <code>remote_src: yes</code> to copy from same host</li>
                    </ul>
                </li>
                <li><strong>challenge6-validate-service.yml</strong> (Target: node1)
                    <ul>
                        <li>Check if httpd service is running</li>
                        <li>Check if postgresql service is running on node2</li>
                        <li>Use <code>uri</code> module to test HTTP endpoint on port 8080</li>
                        <li><strong>Fail the playbook if checks don't pass</strong></li>
                    </ul>
                </li>
                <li><strong>Create Workflow Template</strong>
                    <ul>
                        <li><strong>⚠️ Name Requirement:</strong> Must contain "phoenix" OR "challenge6" (case-insensitive)</li>
                        <li><strong>Recommended Name:</strong> <code>challenge6-workflow</code></li>
                        <li>Link job templates in correct order:
                            <ol>
                                <li>Provision Database</li>
                                <li>Provision Web Server</li>
                                <li>Deploy Application</li>
                                <li>Validate Service</li>
                            </ol>
                        </li>
                        <li>All steps must be on the <strong>success path</strong> (On Success links)</li>
                    </ul>
                </li>
                <li><strong>Add Approval Node</strong>
                    <ul>
                        <li>Add an Approval node at the START of the workflow</li>
                        <li>The approval must be BEFORE "Provision Database" starts</li>
                        <li>This creates a Go/No-Go decision point for disaster recovery</li>
                    </ul>
                </li>
            </ol>

            <h4>Success Criteria:</h4>
            <ul>
                <li>✅ All 4 playbooks created and working</li>
                <li>✅ All 4 Job Templates created in AAP</li>
                <li>✅ Workflow Template created with name containing "Phoenix"</li>
                <li>✅ <strong>Correct order:</strong> Database → Web Server → Application → Validation</li>
                <li>✅ <strong>Approval Gate:</strong> Manual approval required before execution starts</li>
                <li>✅ Complete workflow runs successfully from approval to validation</li>
            </ul>
        `,
        guide: `
            <details>
                <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
                <div style="margin-top: 20px;">
            
            <h3>Step-by-Step Guide</h3>
            
            <div class="step">
                <h4>Step 1: Create Six Playbooks</h4>
                <p>You need to create separate playbooks for each phase of the recovery:</p>
                
                <h5>1. Provision Database (<code>challenge6-provision-database.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node2</li>
                        <li>Install MySQL/PostgreSQL packages</li>
                        <li>Start and enable the database service</li>
                        <li>Create database and user</li>
                    </ul>
                </details>

                <h5>2. Provision Web Server (<code>challenge6-provision-webserver.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node1</li>
                        <li>Install Apache/httpd, PHP, and php-pgsql packages</li>
                        <li><strong>CRITICAL:</strong> Install <code>policycoreutils-python-utils</code> (for semanage)</li>
                        <li><strong>SELinux:</strong> Check if port 8080 exists with word boundary check</li>
                        <li>Use <code>shell</code>: <code>semanage port -l | grep "http_port_t" | grep -w "8080"</code></li>
                        <li>Use <code>when</code> condition to only add if not present</li>
                        <li>Add <code>failed_when</code> to handle "already defined" error</li>
                        <li>Configure httpd: Use <code>lineinfile</code> to set Listen 8080</li>
                        <li>Start and enable httpd service</li>
                        <li><strong>Firewall:</strong> Ensure firewalld is started and enabled</li>
                        <li>Use <code>ansible.posix.firewalld</code> module with <code>port: 8080/tcp</code></li>
                        <li>Set <code>permanent: yes</code>, <code>state: enabled</code>, <code>immediate: yes</code></li>
                        <li><strong>Best practice:</strong> Use modules over raw commands for idempotency</li>
                    </ul>
                </details>

                <h5>3. Deploy Application (<code>challenge6-deploy-application.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node1</li>
                        <li><strong>Application file pre-exists at:</strong> <code>/opt/backup/phoenix-app.php</code></li>
                        <li>Use <code>ansible.builtin.copy</code> module</li>
                        <li>Set <code>src: /opt/backup/phoenix-app.php</code></li>
                        <li>Set <code>dest: /var/www/html/index.php</code></li>
                        <li><strong>CRITICAL:</strong> Use <code>remote_src: yes</code> (copying on same host!)</li>
                        <li>Set owner: apache, group: apache, mode: '0644'</li>
                        <li><strong>Real-world scenario:</strong> Restoring application from backup in disaster recovery</li>
                    </ul>
                </details>

                <h5>4. Validate Service (<code>challenge6-validate-service.yml</code>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Target: node1 (use <code>delegate_to: node2</code> for PostgreSQL checks)</li>
                        <li><strong>Requirement 1:</strong> Check httpd service on node1 using <code>service_facts</code> + <code>assert</code></li>
                        <li><strong>Requirement 2:</strong> Check PostgreSQL service on node2 using <code>service_facts</code> with <code>delegate_to: node2</code> + <code>assert</code></li>
                        <li><strong>Requirement 3:</strong> Test HTTP endpoint <code>http://node1:8080/index.php</code> using <code>uri</code> module</li>
                        <li>Use <code>return_content: yes</code> and <code>failed_when</code> to check for "healthy" in response</li>
                        <li><strong>Requirement 4:</strong> Playbook fails automatically if any check doesn't pass (via <code>assert</code>)</li>
                        <li><strong>Tip:</strong> You don't need extra verification tasks or marker files - <code>assert</code> already fails the playbook!</li>
                    </ul>
                </details>

                <h5>5. Create Workflow Template (<strong>Step 5 - 5 Points</strong>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Navigate to <strong>Templates → Add → Workflow Template</strong></li>
                        <li><strong>⚠️ CRITICAL:</strong> Name must contain "phoenix" OR "challenge6" (case-insensitive)</li>
                        <li><strong>Recommended:</strong> Use <code>challenge6-workflow</code></li>
                        <li>Click <strong>Workflow Visualizer</strong></li>
                        <li>Link the 4 job templates in correct order:
                            <ol>
                                <li>START → Provision Database</li>
                                <li>Provision Database → (On Success) → Provision Web Server</li>
                                <li>Provision Web Server → (On Success) → Deploy Application</li>
                                <li>Deploy Application → (On Success) → Validate Service</li>
                            </ol>
                        </li>
                        <li>All links must be "On Success" (green)</li>
                        <li>Save the workflow</li>
                    </ul>
                </details>

                <h5>6. Add Approval Node (<strong>Step 6 - 5 Points</strong>)</h5>
                <details>
                    <summary><strong>🔍 Show me a hint</strong></summary>
                    <ul>
                        <li>Edit your Phoenix Protocol workflow</li>
                        <li>In Workflow Visualizer, click <strong>START</strong></li>
                        <li>Add node → Select <strong>Approval</strong></li>
                        <li>Name: "Go/No-Go Decision" or similar</li>
                        <li>Description: "Approve disaster recovery execution"</li>
                        <li>Timeout: 1 hour (default is fine)</li>
                        <li>Update the workflow structure:
                            <ol>
                                <li>START → Approval Node</li>
                                <li>Approval Node → (On Success) → Provision Database</li>
                                <li>(Rest of workflow stays the same)</li>
                            </ol>
                        </li>
                        <li>Save the workflow</li>
                        <li><strong>Real-world:</strong> Approval gates are critical for production changes requiring human sign-off</li>
                    </ul>
                </details>
            </div>

            <div class="step">
                <h4>Step 2: Create Job Templates in AAP</h4>
                <p>For each of the 4 playbooks, create a Job Template in AAP:</p>
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
                    <li>Repeat for all four playbooks (Database, Web Server, Application, Validation)</li>
                </ol>
                
                <div class="alert alert-info">
                    <strong>📚 Learning Point:</strong> Job Templates are reusable definitions for running playbooks. Think of them as saved configurations.
                </div>
            </div>

            <div class="step">
                <h4>Step 3: Build the Phoenix Protocol Workflow (<strong>Step 5 - 5 Points</strong>)</h4>
                <p>Create a workflow template that orchestrates disaster recovery!</p>
                
                <ol>
                    <li>Navigate to <strong>Templates</strong> → Click <strong>Add</strong> → <strong>Workflow Template</strong></li>
                    <li>Name it "Phoenix Protocol" (must contain "Phoenix")</li>
                    <li>Click <strong>Save</strong></li>
                    <li>Click <strong>Workflow Visualizer</strong></li>
                </ol>

                <h5>Build the Workflow:</h5>
                <ol>
                    <li>Click <strong>START</strong> → Add "Provision Database"</li>
                    <li>Click "Provision Database" → Select <strong>On Success</strong> → Add "Provision Web Server"</li>
                    <li>Click "Provision Web Server" → Select <strong>On Success</strong> → Add "Deploy Application"</li>
                    <li>Click "Deploy Application" → Select <strong>On Success</strong> → Add "Validate Service"</li>
                    <li>Click <strong>Save</strong></li>
                </ol>

                <div class="hint-box">
                    <strong>💡 Workflow Logic:</strong>
                    <ul>
                        <li><strong>On Success:</strong> Next step runs if current step succeeds</li>
                        <li><strong>On Failure:</strong> Next step runs if current step fails</li>
                        <li><strong>Always:</strong> Next step runs regardless of result</li>
                    </ul>
                </div>
                
                <div class="alert alert-warning">
                    <strong>⚠️ Important:</strong> All links must be "On Success" (green arrows). The validator checks for all 4 playbooks in the correct order!
                </div>
            </div>

            <div class="step">
                <h4>Step 4: Add Approval Gate (<strong>Step 6 - 5 Points</strong>)</h4>
                <p>Add a manual approval step BEFORE the workflow starts!</p>
                
                <h5>Implementation:</h5>
                <ol>
                    <li>Edit your "Phoenix Protocol" workflow</li>
                    <li>In Workflow Visualizer, click <strong>START</strong></li>
                    <li>Add a new node → Select <strong>Approval</strong></li>
                    <li>Name it "Go/No-Go Decision" or similar</li>
                    <li>Description: "Approve disaster recovery execution"</li>
                    <li>Timeout: 1 hour (default is fine)</li>
                    <li>Click <strong>Save</strong></li>
                    <li>Now rearrange the flow:
                        <ul>
                            <li>Remove the link from START → Provision Database</li>
                            <li>Add link: START → Approval Node (On Success)</li>
                            <li>Add link: Approval Node → Provision Database (On Success)</li>
                        </ul>
                    </li>
                    <li>Final flow: START → Approval → Database → Web → App → Validate</li>
                    <li>Click <strong>Save</strong></li>
                </ol>

                <div class="alert alert-success">
                    <strong>🎉 Real-World Value:</strong> Approval gates are critical for production changes requiring human sign-off. This is how you safely manage critical infrastructure!
                </div>
            </div>

            <div class="step">
                <h4>Step 5: Test the Complete Workflow</h4>
                <p>Launch the workflow and watch it execute:</p>
                <ol>
                    <li>Click <strong>Launch</strong> on your workflow template</li>
                    <li>It will pause at the approval gate</li>
                    <li>Go to <strong>Jobs</strong> → Find your workflow</li>
                    <li>You'll see "Pending Approval" status</li>
                    <li>Click <strong>Approve</strong></li>
                    <li>Watch the workflow visualizer animate through all steps</li>
                    <li>Green nodes = success!</li>
                </ol>

                <p><strong>After successful run:</strong></p>
                <ul>
                    <li>Run CTF Challenge Validation to get your points!</li>
                    <li>You should earn 30/30 points (5 points per step × 6 steps)</li>
                </ul>
            </div>
            
                </div>
            </details>
        `,
        solution: `
            <details style="margin-top: 40px;">
                <summary><strong>🔓 Click to Reveal Complete Solution (Complex - Multiple Files)</strong></summary>
                <div style="margin-top: 20px;">
                    <div class="alert alert-warning">
                        <strong>⚠️ Spoiler Alert!</strong> This is a complex solution with multiple files. Make sure you've attempted it first!
                    </div>

                    <h4>Playbook 1: <code>challenge6-provision-database.yml</code></h4>
            <pre><code class="language-yaml">---
# Challenge 6 Solution - Part 1: Provision Database
# Phoenix Protocol - Full Stack Disaster Recovery
# 
# This playbook provisions the database server (node2) with PostgreSQL

- name: Challenge 6 - Provision Database Server
  hosts: node2
  become: yes
  gather_facts: yes
  
  tasks:
    # Requirement 1: Install postgresql-server and python3-psycopg2
    - name: Install PostgreSQL packages
      ansible.builtin.dnf:
        name:
          - postgresql-server
          - postgresql
          - python3-psycopg2
        state: present
      register: db_install
    
    # Requirement 2: Initialize PostgreSQL (postgresql-setup --initdb)
    - name: Initialize PostgreSQL database
      ansible.builtin.command: postgresql-setup --initdb
      args:
        creates: /var/lib/pgsql/data/postgresql.conf
      ignore_errors: yes
    
    # Requirement 3: Start and enable postgresql service
    - name: Ensure PostgreSQL service is started and enabled
      ansible.builtin.service:
        name: postgresql
        state: started
        enabled: yes
      register: db_service
    
    # Requirement 4: Wait for port 5432 to be ready
    - name: Wait for PostgreSQL to be ready
      ansible.builtin.wait_for:
        port: 5432
        host: localhost
        timeout: 30
    
    - name: Display result
      ansible.builtin.debug:
        msg: "✅ Database provisioned on {{ inventory_hostname }}!"</code></pre>

            <h4>Playbook 2: <code>challenge6-provision-webserver.yml</code></h4>
            <pre><code class="language-yaml">---
# Challenge 6 Solution - Part 2: Provision Web Server
# Phoenix Protocol - Full Stack Disaster Recovery
# 
# This playbook provisions the web server with httpd on port 8080

- name: Challenge 6 - Provision Web Server
  hosts: node1
  become: yes
  gather_facts: yes
  
  tasks:
    - name: Ensure /var/www/html directory exists
      ansible.builtin.file:
        path: /var/www/html
        state: directory
        owner: apache
        group: apache
        mode: '0755'
    
    # Requirement 1: Install httpd, php, php-pgsql, and policycoreutils-python-utils
    - name: Install Apache (httpd), PHP, and SELinux tools
      ansible.builtin.dnf:
        name:
          - httpd
          - php
          - php-pgsql
          - policycoreutils-python-utils
        state: present
      register: web_install
    
    # Requirement 2: Configure SELinux to allow httpd on port 8080
    # Note: Using shell instead of community.general.seport module due to EE constraints
    - name: Configure SELinux to allow httpd on port 8080
      ansible.builtin.shell: |
        if semanage port -l | grep "http_port_t" | grep -wq "8080"; then
          echo "Port 8080 already configured for http_port_t"
          exit 0
        elif semanage port -m -t http_port_t -p tcp 8080 2&gt;/dev/null; then
          echo "Modified port 8080 to http_port_t"
        else
          semanage port -a -t http_port_t -p tcp 8080
          echo "Added port 8080 to http_port_t"
        fi
      register: selinux_result
      changed_when: "'already configured' not in selinux_result.stdout"
    
    # Requirement 3: Configure httpd to listen on port 8080
    - name: Configure httpd to listen on port 8080
      ansible.builtin.lineinfile:
        path: /etc/httpd/conf/httpd.conf
        regexp: '^Listen '
        line: 'Listen 8080'
        backup: yes
    
    # Requirement 4: Start and enable httpd service
    - name: Start and enable httpd service
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: yes
      register: web_service
    
    # Requirement 5: Allow port 8080/tcp in firewalld
    - name: Ensure firewalld is started and enabled
      ansible.builtin.service:
        name: firewalld
        state: started
        enabled: yes
    
    - name: Allow port 8080 through firewall
      ansible.posix.firewalld:
        port: 8080/tcp
        permanent: yes
        state: enabled
        immediate: yes
    
    - name: Display result
      ansible.builtin.debug:
        msg: "✅ Web server provisioned on {{ inventory_hostname }} - listening on port 8080"</code></pre>

            <h4>Playbook 3: <code>challenge6-deploy-application.yml</code></h4>
            <pre><code class="language-yaml">---
# Challenge 6 Solution - Part 3: Deploy Application
# Phoenix Protocol - Full Stack Disaster Recovery
# 
# This playbook deploys the pre-backed-up application to the web server
# The application file was created during setup in /opt/backup/

- name: Challenge 6 - Deploy Application
  hosts: node1
  become: yes
  
  tasks:
    # Requirement 1: Deploy pre-existing application from /opt/backup/phoenix-app.php
    # Requirement 2: Copy to /var/www/html/index.php
    # Requirement 3: Set owner: apache, group: apache
    # Requirement 4: Set mode: 0644
    # Requirement 5: Use remote_src: yes (copying on same host)
    - name: Deploy application from backup location
      ansible.builtin.copy:
        src: /opt/backup/phoenix-app.php
        dest: /var/www/html/index.php
        owner: apache
        group: apache
        mode: '0644'
        remote_src: yes
    
    - name: Display result
      ansible.builtin.debug:
        msg: "✅ Application deployed on {{ inventory_hostname }} from backup!"</code></pre>

            <h4>Playbook 4: <code>challenge6-validate-service.yml</code></h4>
            <pre><code class="language-yaml">---
# Challenge 6 Solution - Part 4: Validate Service
# Phoenix Protocol - Full Stack Disaster Recovery
# 
# This playbook validates that the application stack is working
# Requirements:
#   1. Check if httpd service is running
#   2. Check if postgresql service is running on node2
#   3. Use uri module to test HTTP endpoint on port 8080
#   4. Fail the playbook if checks don't pass

- name: Challenge 6 - Validate Service
  hosts: node1
  become: yes
  gather_facts: yes
  
  tasks:
    # Requirement 1: Check if httpd service is running
    - name: Check httpd service status
      ansible.builtin.service_facts:
    
    - name: Verify httpd is running
      ansible.builtin.assert:
        that:
          - ansible_facts.services['httpd.service'].state == 'running'
        fail_msg: "❌ httpd service is not running!"
        success_msg: "✅ httpd service is running"
    
    # Requirement 2: Check if postgresql service is running on node2
    - name: Check PostgreSQL service on node2
      ansible.builtin.service_facts:
      delegate_to: node2
    
    - name: Verify PostgreSQL is running on node2
      ansible.builtin.assert:
        that:
          - ansible_facts.services['postgresql.service'].state == 'running'
        fail_msg: "❌ PostgreSQL service is not running on node2!"
        success_msg: "✅ PostgreSQL service is running on node2"
      delegate_to: node2
    
    # Requirement 3: Use uri module to test HTTP endpoint on port 8080
    # Requirement 4: Fail the playbook if checks don't pass
    - name: Test HTTP endpoint on port 8080
      ansible.builtin.uri:
        url: "http://node1:8080/index.php"
        method: GET
        status_code: 200
        return_content: yes
      register: http_test
      failed_when: 
        - http_test.status != 200
        - "'healthy' not in http_test.content"
    
    - name: Display validation success
      ansible.builtin.debug:
        msg: "✅ All validation checks passed! Application stack is operational."</code></pre>

            <h4>Step 5: Create Workflow Template in AAP</h4>
            <p>Create a Workflow Template in AAP that links all 4 playbooks:</p>
            <div class="alert alert-warning">
                <strong>⚠️ IMPORTANT - Workflow Naming Requirement:</strong>
                <p style="margin: 10px 0;">The workflow template name MUST contain one of these keywords (case-insensitive):</p>
                <ul style="margin-left: 20px;">
                    <li>✅ <strong>"phoenix"</strong> - Example: "Phoenix Protocol", "My Phoenix Workflow"</li>
                    <li>✅ <strong>"challenge6"</strong> - Example: "challenge6-workflow", "Challenge 6 Deploy"</li>
                </ul>
                <p style="margin-top: 10px; color: #fbbf24;"><strong>💡 Recommended:</strong> Use <code>challenge6-workflow</code> for consistency</p>
            </div>
            <h5>Workflow Structure:</h5>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0;">
                <p style="margin: 0; font-family: monospace; line-height: 2;">
                    <strong>START</strong><br>
                    &nbsp;&nbsp;↓<br>
                    <span style="background: #fef3c7; padding: 5px 10px; border-radius: 4px;">[Provision Database]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #fef3c7; padding: 5px 10px; border-radius: 4px;">[Provision Web Server]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #fef3c7; padding: 5px 10px; border-radius: 4px;">[Deploy Application]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #fef3c7; padding: 5px 10px; border-radius: 4px;">[Validate Service]</span>
                </p>
            </div>

            <h4>Step 6: Add Approval Node</h4>
            <p>Add an Approval node at the START of the workflow:</p>
            <h5>Complete Workflow with Approval:</h5>
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 15px 0;">
                <p style="margin: 0; font-family: monospace; line-height: 2; color: #065f46;">
                    <strong>START</strong><br>
                    &nbsp;&nbsp;↓<br>
                    <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold;">[Go/No-Go Approval]</span><br>
                    &nbsp;&nbsp;↓ (On Success - Approved)<br>
                    <span style="background: #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 4px;">[Provision Database]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 4px;">[Provision Web Server]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 4px;">[Deploy Application]</span><br>
                    &nbsp;&nbsp;↓ (On Success)<br>
                    <span style="background: #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 4px;">[Validate Service]</span>
                </p>
            </div>

            <h4>Testing the Solution:</h4>
            <ol>
                <li><strong>Create all 4 playbooks</strong> (Database, Web Server, Application, Validation)</li>
                <li><strong>Create 4 Job Templates</strong> in AAP for each playbook</li>
                <li><strong>Create Workflow Template</strong> named "challenge6-workflow" (or anything with "phoenix" or "challenge6") linking all 4 in order</li>
                <li><strong>Add Approval Node</strong> at the START of the workflow</li>
                <li><strong>Launch the Workflow</strong>:
                    <ul>
                        <li>It will pause at the approval gate</li>
                        <li>Click "Approve" to start execution</li>
                        <li>Watch all 4 steps complete successfully</li>
                    </ul>
                </li>
                <li><strong>Run CTF Validation</strong> to earn points:
                    <ul>
                        <li>Step 1: Provision Database (5 pts)</li>
                        <li>Step 2: Provision Web Server (5 pts)</li>
                        <li>Step 3: Deploy Application (5 pts)</li>
                        <li>Step 4: Validate Service (5 pts)</li>
                        <li>Step 5: Workflow Template with correct playbooks (5 pts)</li>
                        <li>Step 6: Approval Node at workflow start (5 pts)</li>
                        <li><strong>Total: 30/30 points!</strong></li>
                    </ul>
                </li>
            </ol>

            <div class="alert alert-success">
                <h4>🎉 Congratulations!</h4>
                <p>You've mastered complex workflow orchestration! This pattern is used in real-world disaster recovery, blue/green deployments, and complex multi-tier application management.</p>
            </div>
                </div>
            </details>
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
            color: #1f2937;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%);
            min-height: 100vh;
        }

        .workshop-header {
            background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%);
            color: #000;
            padding: 20px 0;
            box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
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
            color: #d97706;
            text-decoration: none;
            font-weight: 500;
        }

        .breadcrumb a:hover {
            color: #b45309;
            text-decoration: underline;
        }

        .main-content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
        }

        .content h1 {
            color: #92400e;
            font-size: 32px;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 3px solid #f59e0b;
        }

        .exercise-meta-bar {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 14px;
            border: 1px solid #d1d5db;
        }

        .exercise-meta-bar .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .content h2 {
            color: #b45309;
            font-size: 24px;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #fbbf24;
        }

        .content h3 {
            color: #d97706;
            font-size: 20px;
            margin-top: 25px;
            margin-bottom: 12px;
        }

        .content h4 {
            color: #374151;
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
            background: #1e293b;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
            border: 1px solid #334155;
        }

        .content code {
            background: #fef3c7;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 14px;
            color: #d97706;
            border: 1px solid #fde68a;
        }

        .content pre code {
            background: transparent;
            padding: 0;
            color: #e2e8f0;
            border: none;
        }

        .alert {
            padding: 16px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid;
        }

        .alert-danger {
            background: #fee2e2;
            border-color: #dc2626;
            color: #7f1d1d;
        }

        .alert-warning {
            background: #fef3c7;
            border-color: #f59e0b;
            color: #78350f;
        }

        .alert-info {
            background: #dbeafe;
            border-color: #3b82f6;
            color: #1e3a8a;
        }

        .alert-success {
            background: #d1fae5;
            border-color: #10b981;
            color: #065f46;
        }

        .hint-box {
            background: #fef9c3;
            border: 1px solid #fbbf24;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
            color: #78350f;
        }

        .step {
            margin: 30px 0;
            padding: 20px;
            background: #fffbeb;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            border: 1px solid #fde68a;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            background: #f59e0b;
            color: #000;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        details {
            margin: 15px 0;
            padding: 15px;
            background: #fffbeb;
            border-radius: 6px;
            border: 1px solid #fde68a;
        }

        details summary {
            cursor: pointer;
            font-weight: 600;
            color: #d97706;
            padding: 5px;
        }

        details summary:hover {
            color: #b45309;
        }

        details[open] summary {
            margin-bottom: 15px;
        }

        .nav-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #cbd5e1;
        }

        .nav-buttons a {
            display: inline-block;
            padding: 10px 20px;
            background: #f59e0b;
            color: #000;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
            font-weight: 600;
        }

        .nav-buttons a:hover {
            background: #d97706;
        }

        .nav-buttons a.secondary {
            background: #fbbf24;
        }

        .nav-buttons a.secondary:hover {
            background: #f59e0b;
        }

        .section-nav {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border: 1px solid #fde68a;
        }

        .section-nav h3 {
            color: #92400e;
            margin-bottom: 15px;
        }

        .exercise-list {
            list-style: none;
            margin: 0;
        }

        .exercise-item {
            border-bottom: 1px solid #e5e7eb;
        }

        .exercise-item:last-child {
            border-bottom: none;
        }

        .exercise-item a {
            display: block;
            padding: 12px 10px;
            color: #374151;
            text-decoration: none;
            transition: background 0.2s;
        }

        .exercise-item a:hover {
            background: #f3f4f6;
        }

        .exercise-item.active a {
            background: #fef3c7;
            color: #92400e;
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

                <div class="alert alert-success">
                    <h4>🔗 Workshop Materials & Git Repository</h4>
                    <p><strong>Access your personal Git repository:</strong></p>
                    <p>🌐 <strong>Gitea URL:</strong> <a href="https://gitea-gitea-persistent.apps.cluster-6zjzq.6zjzq.sandbox5539.opentlc.com" target="_blank" style="color: #d97706; text-decoration: underline;">https://gitea-gitea-persistent.apps.cluster-6zjzq.6zjzq.sandbox5539.opentlc.com</a></p>
                    
                    <h5 style="margin-top: 15px;">🔐 Login Credentials:</h5>
                    <div style="background: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-bottom: 15px; color: #065f46;">
                        <p><strong>Username:</strong> Your Ansible controller hostname prefix</p>
                        <p style="margin-top: 8px;"><strong>Example:</strong> If your controller URL is <code>https://controller.zwq8x.sandbox2116.opentlc.com/</code></p>
                        <p style="margin-left: 20px; margin-top: 5px;">→ Username: <code>zwq8x</code></p>
                        <p style="margin-left: 20px;">→ Password: <strong>Same as your Ansible Controller password</strong></p>
                        <p style="margin-top: 10px; color: #b45309;"><strong>💡 Tip:</strong> Your username is the unique identifier from your controller hostname!</p>
                    </div>
                    
                    <h5 style="margin-top: 15px;">📦 What's in Your Repository:</h5>
                    <ul style="margin-left: 20px;">
                        <li><strong>Repository Name:</strong> <code>ansible-ctf-challenges</code></li>
                        <li><strong>6 Challenge Directories:</strong> One for each exercise with problem descriptions and templates</li>
                        <li><strong>Solution Templates:</strong> Starter playbooks to help you begin</li>
                        <li><strong>README Files:</strong> Detailed instructions and hints for each challenge</li>
                    </ul>

                    <h5 style="margin-top: 15px;">🚀 Quick Start:</h5>
                    <ol style="margin-left: 20px;">
                        <li><strong>Login to Gitea</strong> with your provided credentials</li>
                        <li><strong>Find your repository:</strong> <code>your-username/ansible-ctf-challenges</code></li>
                        <li><strong>Clone it:</strong>
                            <pre style="background: #1e293b; padding: 10px; border-radius: 4px; margin-top: 5px; color: #e2e8f0;"><code>git clone https://gitea-gitea-persistent.apps.cluster-6zjzq.6zjzq.sandbox5539.opentlc.com/your-username/ansible-ctf-challenges.git</code></pre>
                        </li>
                        <li><strong>Navigate to challenge folders</strong> (challenge1/ through challenge6/)</li>
                        <li><strong>Write your playbooks</strong> and commit your solutions</li>
                    </ol>

                    <h5 style="margin-top: 15px;">💡 Pro Tips:</h5>
                    <ul style="margin-left: 20px;">
                        <li>Each challenge folder has a README.md with the problem description</li>
                        <li>Use the templates/ directory for Challenge 4 (MOTD template)</li>
                        <li>Commit your work regularly to track your progress</li>
                        <li>You can reference the workshop portal for step-by-step guides</li>
                    </ul>
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
                                    ${ex.extra_credit ? `<span class="badge" style="background: #10b981;">+${ex.extra_credit} EC</span>` : ''}
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

    // Find previous and next exercises
    const allExercises = [...workshops.section1.exercises, ...workshops.section2.exercises];
    const currentIndex = allExercises.findIndex(e => e.id === exerciseId);
    const prevExercise = currentIndex > 0 ? allExercises[currentIndex - 1] : null;
    const nextExercise = currentIndex < allExercises.length - 1 ? allExercises[currentIndex + 1] : null;

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
                    ${prevExercise ? `<a href="/exercise/${prevExercise.id}" class="secondary">← Previous: ${prevExercise.title}</a>` : '<a href="/" class="secondary">← Back to Overview</a>'}
                    ${nextExercise ? `<a href="/exercise/${nextExercise.id}">Next: ${nextExercise.title} →</a>` : '<a href="/" class="secondary">🎉 Back to Overview</a>'}
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

