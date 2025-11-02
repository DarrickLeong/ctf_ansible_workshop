# 🎓 CTF Workshop - Instructor Guide

This guide is for workshop instructors and contains everything needed to run a successful CTF Workshop.

---

## 📋 Pre-Workshop Checklist (1 Day Before)

### Infrastructure Setup

- [ ] **OpenShift Cluster Ready**
  - Node.js CTF Tracker deployed and accessible
  - Route URL noted and shared with team
  
- [ ] **Central AAP Controller Configured**
  - Project created with Git repository
  - Inventory set up with sub-controllers
  - Credentials configured
  - Job templates created

- [ ] **RHEL Servers Prepared**
  - 3 RHEL servers per team (node1, node2, node3)
  - SSH access configured
  - Sudo privileges enabled
  - Basic packages installed (Python, etc.)

- [ ] **Challenge Environment Setup**
  ```bash
  cd ctf-setup
  ansible-playbook setup-all-challenges.yml -i inventory
  ```

### Documentation Prepared

- [ ] **Participant Materials**
  - CHALLENGES.md shared (print or digital)
  - PARTICIPANT_QUICKSTART.md available
  - CTF Tracker URL shared
  - AAP login credentials distributed

- [ ] **Instructor Materials**
  - Solution playbooks tested
  - Backup plans ready
  - Troubleshooting guide reviewed

---

## 🚀 Workshop Day Schedule (3 Hours)

### Hour 1: Introduction & Challenges 1-2 (60 minutes)

**00:00 - 00:15 | Welcome & Introduction**
- Introduce the CTF concept
- Explain the scoring system
- Demonstrate CTF Tracker
- Show AAP interface
- Explain challenge submission process

**00:15 - 00:30 | Challenge 1 Walkthrough**
- Live demonstration of Challenge 1
- Show how to write the playbook
- Show how to create job template
- Show how points appear in tracker
- Answer questions

**00:30 - 00:60 | Participants Work**
- Participants complete Challenge 1
- Participants start Challenge 2
- Instructors provide 1-on-1 help
- Monitor progress on leaderboard

### Hour 2: Challenges 3-5 (60 minutes)

**01:00 - 01:10 | Quick Review**
- Review Challenge 1-2 solutions
- Introduce Challenges 3-5
- Highlight key concepts

**01:10 - 02:00 | Participants Work**
- Participants work on Challenges 3-5
- Instructors circulate and help
- Monitor leaderboard
- Call out milestones

### Hour 3: Challenge 6 & Wrap-up (60 minutes)

**02:00 - 02:15 | Challenge 6 Introduction**
- Explain workflow concept
- Demonstrate workflow builder
- Show success and failure paths
- Explain extra credit

**02:15 - 02:45 | Participants Work**
- Participants work on Challenge 6
- Instructors provide workflow guidance
- Extra credit for fast finishers

**02:45 - 03:00 | Wrap-up**
- Announce final scores
- Recognize top performers
- Review solutions
- Q&A session
- Collect feedback

---

## 🎯 Challenge Setup Details

### Challenge 1: Out of Sync (5 Points)

**Setup Command:**
```bash
ansible all -i inventory -b -m service -a "name=chronyd state=stopped enabled=no"
```

**Verification:**
```bash
ansible all -i inventory -m command -a "systemctl status chronyd"
```

**Solution Highlight:**
- Use `ansible.builtin.service` module
- Set `state: started` and `enabled: yes`

### Challenge 2: Malicious Package (10 Points)

**Setup Command:**
```bash
ansible node2 -i inventory -b -m dnf -a "name=bind-utils state=present"
```

**Verification:**
```bash
ansible node2 -i inventory -m shell -a "rpm -qa | grep bind-utils"
```

**Solution Highlight:**
- Use `ansible.builtin.dnf` module
- Target `hosts: node2` specifically
- Set `state: absent`

### Challenge 3: Rogue User Account (15 Points)

**Setup Command:**
```bash
ansible node1,node3 -i inventory -b -m user -a "name=rogue_user state=present"
```

**Verification:**
```bash
ansible node1,node3 -i inventory -m command -a "id rogue_user"
```

**Solution Highlight:**
- Use `ansible.builtin.user` module
- Set `state: absent` and `remove: yes`
- Use `ignore_errors: yes` to handle missing users

### Challenge 4: Inconsistent Messaging (20 Points)

**Setup Commands:**
```bash
# Run the setup playbook which creates:
# - Defaced MOTD on node1
# - Outdated MOTD on node2
# - Missing MOTD on node3
```

**Verification:**
```bash
ansible all -i inventory -m command -a "cat /etc/motd"
```

**Solution Highlight:**
- Create `templates/motd.j2` file
- Use `ansible.builtin.template` module
- Include `{{ ansible_hostname }}` variable

### Challenge 5: Firewall Anomaly (20 Points)

**Setup Commands:**
```bash
# Run the setup playbook which:
# - Installs httpd on node3
# - Starts the service
# - Blocks HTTP in firewall
```

**Verification:**
```bash
ansible node3 -i inventory -b -m command -a "firewall-cmd --list-services"
curl http://node3-ip  # Should fail before fix
```

**Solution Highlight:**
- Use `ansible.posix.firewalld` module
- Set `service: http`, `permanent: yes`, `state: enabled`
- Ensure `ansible.posix` collection is installed

### Challenge 6: Phoenix Protocol (30 Points + 10 Extra)

**Setup Commands:**
```bash
# Run the setup playbook which:
# - Removes httpd from node1
# - Removes postgresql from node2
```

**Solution Steps:**
1. Create 6 playbooks
2. Create 6 job templates in AAP
3. Create workflow template
4. Link nodes with proper dependencies
5. Add approval gate (extra credit)

**Workflow Diagram:**
```
[START] → [APPROVAL] → [Provision DB] → [Provision Web] → [Deploy App] → [Validate]
                                                                              ↓ (fail)
                                                               [Rollback Web] → [Rollback DB]
```

---

## 💡 Teaching Tips

### General Tips

1. **Start Simple**: Challenge 1 should be very easy to build confidence
2. **Live Demo**: Always demonstrate before letting participants work
3. **Encourage Collaboration**: Teams can help each other
4. **Monitor Leaderboard**: Call out progress to maintain engagement
5. **Provide Hints**: Don't let people get stuck too long

### Challenge-Specific Tips

**Challenge 1**: Perfect for teaching service management basics

**Challenge 2**: Introduce the concept of host targeting

**Challenge 3**: Great opportunity to discuss error handling

**Challenge 4**: Excellent for teaching templates and Jinja2

**Challenge 5**: Good time to discuss security and firewall management

**Challenge 6**: Perfect capstone - combines everything learned

### Common Participant Questions

**Q: "Can I use `command` module instead of the service module?"**
A: Technically yes, but Ansible modules are idempotent and better practice.

**Q: "My playbook worked but I didn't get points"**
A: Check that you're reporting to the correct CTF Tracker URL and using the right attendee name.

**Q: "The template isn't being found"**
A: Ensure the `templates/` directory exists in the same directory as your playbook.

**Q: "Do I need to create the workflow manually?"**
A: Yes, Challenge 6 requires using the AAP workflow builder interface.

---

## 🐛 Troubleshooting Guide

### CTF Tracker Issues

**Tracker not updating:**
```bash
# Check if the tracker is running
oc get pods -n ctf-project

# Check tracker logs
oc logs deployment/ctf-tracker-nodejs -n ctf-project

# Test tracker API
curl http://ctf-tracker-url/api/stats
```

**Participants can't access tracker:**
- Verify route is exposed
- Check network connectivity
- Verify URL is correct

### AAP Issues

**Job templates failing:**
```bash
# Check AAP logs
# Review job output in AAP interface
# Verify credentials are correct
# Check inventory configuration
```

**Collection not found:**
```bash
# Install on execution environment or controller
ansible-galaxy collection install ansible.posix
ansible-galaxy collection install community.postgresql
```

**Workflow not working:**
- Verify all job templates exist
- Check node connections in workflow
- Test individual job templates first
- Review workflow visualizer

### RHEL Host Issues

**SSH connection failures:**
```bash
# Test SSH manually
ssh user@node1

# Verify inventory
ansible all -i inventory -m ping

# Check credentials
ansible all -i inventory -m command -a "whoami"
```

**Permission denied:**
- Verify `become: yes` is set
- Check sudo privileges on RHEL hosts
- Verify credentials have proper permissions

---

## 📊 Scoring & Leaderboard

### Point Distribution

| Points Range | Expected Number of Teams |
|--------------|-------------------------|
| 0-20 | Beginners, struggling |
| 21-50 | Making progress |
| 51-75 | Doing well |
| 76-90 | Very good |
| 91-100 | Excellent |
| 100+ | Perfect (with extra credit) |

### Time to Complete

**Fast teams**: 2-2.5 hours
**Average teams**: 2.5-3 hours  
**Slower teams**: 3+ hours

### Leaderboard Management

The CTF Tracker automatically:
- Updates points in real-time
- Ranks teams by total points
- Shows completion status
- Displays recent activity

---

## 🎓 Solution Review

### After Workshop Solutions Review

**Option 1: Live Demo**
- Walk through each solution
- Explain key concepts
- Answer questions

**Option 2: Share Solutions**
- Email solution files to participants
- Post on shared drive
- Include explanatory notes

**Option 3: Video Recording**
- Record solution walkthrough
- Post to YouTube or internal platform
- Share link with participants

---

## 📝 Post-Workshop Tasks

### Immediate (Same Day)

- [ ] Collect feedback from participants
- [ ] Note any issues encountered
- [ ] Reset environment for next session
  ```bash
  cd ctf-setup
  ansible-playbook reset-environment.yml -i inventory
  ```
- [ ] Backup CTF Tracker database
  ```bash
  oc exec deployment/ctf-tracker-nodejs -- tar czf /tmp/backup.tar.gz /app/data
  oc cp ctf-tracker-nodejs-pod:/tmp/backup.tar.gz ./ctf-backup-$(date +%Y%m%d).tar.gz
  ```

### Follow-up (Within Week)

- [ ] Send thank you email with solutions
- [ ] Share certificates (if applicable)
- [ ] Update workshop materials based on feedback
- [ ] Document lessons learned

---

## 🔧 Workshop Customization

### Adjusting Difficulty

**Make Easier:**
- Provide more hints in challenge descriptions
- Give skeleton playbooks to fill in
- Reduce number of challenges
- Increase time limits

**Make Harder:**
- Add more complex challenges
- Require specific implementation details
- Add time pressure
- Require documentation

### Custom Challenges

You can add your own challenges by:
1. Creating setup playbook in `ctf-setup/`
2. Creating solution playbook in `ctf-solutions/`
3. Updating `CHALLENGES.md`
4. Updating point values in tracker
5. Testing thoroughly

---

## 📚 Resources for Instructors

### Ansible Documentation
- [Ansible Module Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- [AAP Documentation](https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/)
- [Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)

### Workshop Materials
- Setup playbooks: `ctf-setup/`
- Solution playbooks: `ctf-solutions/`
- Participant guide: `PARTICIPANT_QUICKSTART.md`
- Challenge descriptions: `CHALLENGES.md`

---

## 🎉 Success Metrics

A successful workshop should have:

✅ **High Engagement**
- 80%+ of participants complete Challenges 1-3
- 50%+ complete Challenges 4-5
- 20%+ attempt Challenge 6

✅ **Good Learning**
- Participants understand Ansible basics
- Participants can create playbooks independently
- Participants understand AAP workflows

✅ **Positive Feedback**
- Fun and engaging experience
- Clear instructions
- Good difficulty progression
- Helpful instructor support

---

## 📞 Support & Contact

For questions or issues with workshop materials:
- Review the troubleshooting guide above
- Check solution playbooks for reference
- Consult Ansible documentation
- Reach out to workshop organizers

---

**Good luck running an awesome CTF Workshop!** 🏆

---

*Instructor Guide v1.0 - Updated: 2025-11-02*

