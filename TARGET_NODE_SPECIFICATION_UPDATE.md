# Target Node Specification Update

## Overview
Added explicit target node specifications to all CTF workshop challenges across the repository to eliminate confusion about which nodes each playbook should affect.

## Update Date
November 2, 2025

## Changes Made

### 1. CHALLENGES.md (`ctf-workshop/CHALLENGES.md`)
Added **🎯 Target Nodes** section to each challenge with specific node information:

- **Challenge 1**: ALL nodes (node1, node2, node3)
- **Challenge 2**: node2 ONLY (database server)
- **Challenge 3**: node1 and node3 (NOT node2)
- **Challenge 4**: ALL nodes (node1, node2, node3)
- **Challenge 5**: node3 ONLY (backup web server)
- **Challenge 6**: node1 (web server) and node2 (database server)

### 2. Workshop Portal (`workshop-portal/server.js`)
Added prominent blue alert boxes to each challenge's scenario section displaying target nodes:

```html
<div class="alert alert-primary" style="margin-top: 10px;">
    <h4>🎯 Target Nodes</h4>
    <p><strong style="color: #e74c3c;">node2 ONLY</strong> - database server</p>
</div>
```

**Features:**
- Consistent visual design across all challenges
- Color-coded badges (red text on blue background)
- Descriptive node roles (e.g., "database server", "backup web server")
- Updated success criteria to reference specific nodes
- Enhanced problem descriptions with explicit node details

**Deployment:**
- Committed to Git: `87c3477`
- OpenShift build triggered: `workshop-portal-15`
- Successfully deployed and accessible

### 3. Gitea Workshop Repository Script (`gitea-openshift/create-workshop-repos.sh`)
Updated all challenge README templates to include:

**Target Node Sections:**
```markdown
## 🎯 Target Nodes
**node2 ONLY** - database server
```

**Enhanced Content:**
- Specific node names in problem descriptions
- Clear requirements listing exact target nodes
- Playbook template comments indicating target hosts
- Updated helpful hints with `hosts:` parameter guidance

**Examples:**
- Challenge 2: "Create a playbook that removes the `bind-utils` package from **node2 only**."
- Challenge 3: "Write a playbook that ensures the `rogue_user` user is completely removed from **node1 and node3**."
- Challenge 5: "Write a playbook that adds a **permanent** rule to the firewall on **node3**."

### 4. Playbook Template Comments
Added inline comments to playbook templates:

```yaml
---
- name: Challenge 2 - Remove Malicious Package
  hosts: node2  # Targets only node2
  become: yes
```

```yaml
---
- name: Challenge 3 - Remove Rogue User
  hosts: node1,node3  # Targets only node1 and node3
  become: yes
```

## Benefits

### For Participants:
1. **Eliminates Confusion**: Crystal clear which nodes to target
2. **Prevents Mistakes**: Reduces playbook errors due to incorrect host targeting
3. **Guided Learning**: Helps understand multi-host vs single-host targeting
4. **Visual Clarity**: Prominent badges make target information immediately visible

### For Instructors:
1. **Consistent Messaging**: Same target node information across all platforms
2. **Reduced Support**: Fewer questions about "which nodes should I target?"
3. **Better Scoring**: Correct targeting ensures accurate CTF validation
4. **Professional Presentation**: Polished, modern interface

## Implementation Details

### Challenge-Specific Targeting

| Challenge | Target Nodes | Hosts Parameter | Reason |
|-----------|-------------|-----------------|---------|
| 1 | ALL nodes | `hosts: all` or `hosts: web` | Time sync needed everywhere |
| 2 | node2 ONLY | `hosts: node2` | Database server security policy |
| 3 | node1 and node3 | `hosts: node1,node3` | Rogue user on specific nodes |
| 4 | ALL nodes | `hosts: all` or `hosts: web` | Consistent MOTD across infrastructure |
| 5 | node3 ONLY | `hosts: node3` | Firewall for backup web server |
| 6 | node1 and node2 | Workflow with separate plays | Multi-tier disaster recovery |

### Visual Design Choices

**Color Scheme:**
- Blue alert box (`alert-primary`): Professional, informative
- Red text (`#e74c3c`): High visibility, draws attention
- Emoji indicator (`🎯`): Universal symbol for targeting

**Placement:**
- Immediately after problem description
- Before mission/requirements
- Ensures participants see targets before attempting solution

## Testing Status

✅ **CHALLENGES.md**: Updated and committed  
✅ **Workshop Portal**: Deployed to OpenShift (build #15)  
✅ **Gitea Script**: Updated and committed  
✅ **Git Repository**: All changes pushed to `main` branch  

## Next Steps for Users

### For Existing Gitea Repositories:
If workshop repositories were already created before this update, instructors can:

1. **Option A - Recreate Repositories** (Recommended for new workshops):
   ```bash
   # Delete old repos from Gitea UI
   # Rerun the creation script
   ./create-workshop-repos.sh <GITEA_URL> <ADMIN_TOKEN> workshop-users.csv
   ```

2. **Option B - Manual Update** (For ongoing workshops):
   - Inform participants of the target node specifications
   - Share the updated CHALLENGES.md
   - Direct them to the workshop portal for clear guidance

### For New Workshops:
- Simply run `create-workshop-repos.sh` to create repositories with all updates
- Participants will see target nodes from day one
- No additional communication needed

## Files Modified

1. `ctf-workshop/CHALLENGES.md`
2. `workshop-portal/server.js`
3. `gitea-openshift/create-workshop-repos.sh`

## Commits

```bash
# Commit 1: Main challenges document
87c3477 - Add explicit target node specifications to all challenges

# Commit 2: Challenge 6 badge
b24ff6c - Add target node badge to Challenge 6 in workshop portal

# Commit 3: Workshop portal updates
5810030 - Add explicit target node specifications to workshop portal

# Commit 4: Gitea script updates
8351b90 - Add explicit target node specifications to Gitea workshop repos
```

## Verification

### Workshop Portal Check:
```bash
# Get workshop portal URL
oc get route workshop-portal -n ctf-workshop-portal

# Visit each challenge page
# Verify target node badges are visible
```

### Gitea Repository Check:
```bash
# After running create-workshop-repos.sh
# Clone a test repository
git clone https://gitea-route/student1/ansible-ctf-challenges.git

# Check challenge READMEs
cat ansible-ctf-challenges/challenge1/README.md
cat ansible-ctf-challenges/challenge2/README.md
# etc.

# Verify "🎯 Target Nodes" section is present in each
```

## Summary

This update provides a comprehensive, consistent approach to communicating target node information across all CTF workshop materials. Participants will now have zero ambiguity about which infrastructure components each challenge affects, leading to:

- **Higher success rates** (correct targeting from the start)
- **Faster completion times** (less trial and error)
- **Better learning outcomes** (understanding of host targeting)
- **Professional experience** (polished, modern interface)

All systems are ready for production use! 🎉

