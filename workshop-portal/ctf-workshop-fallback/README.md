# 🎯 CTF Workshop - Complete Workshop Materials

This directory contains everything needed to run an Ansible Automation Platform CTF (Capture The Flag) Workshop.

## 📁 Directory Structure

```
ctf-workshop/
├── CHALLENGES.md                   # Challenge descriptions and scoring
├── PARTICIPANT_QUICKSTART.md       # Quick-start guide for participants
├── INSTRUCTOR_GUIDE.md             # Complete guide for instructors
├── IMPLEMENTATION_SUMMARY.md       # Technical implementation overview
│
├── setup/                          # Environment setup automation
│   ├── setup-all-challenges.yml    # Create all challenge scenarios
│   ├── reset-environment.yml       # Reset environment between sessions
│   └── README.md                   # Setup documentation
│
└── solutions/                      # Complete solution playbooks
    ├── challenge1-solution.yml     # Challenge 1: Out of Sync (5 pts)
    ├── challenge2-solution.yml     # Challenge 2: Malicious Package (10 pts)
    ├── challenge3-solution.yml     # Challenge 3: Rogue User (15 pts)
    ├── challenge4-solution.yml     # Challenge 4: Inconsistent MOTD (20 pts)
    ├── challenge5-solution.yml     # Challenge 5: Firewall Anomaly (20 pts)
    ├── challenge6-*.yml            # Challenge 6: Phoenix Protocol (30 pts + 10 extra)
    ├── templates/motd.j2           # Template for Challenge 4
    └── README.md                   # Solutions documentation
```

## 🚀 Quick Start

### For Instructors

1. **Read the instructor guide:**
   ```bash
   cat INSTRUCTOR_GUIDE.md
   ```

2. **Setup the environment:**
   ```bash
   cd setup
   ansible-playbook setup-all-challenges.yml -i <your-inventory>
   ```

3. **Share with participants:**
   - `CHALLENGES.md` - Challenge descriptions
   - `PARTICIPANT_QUICKSTART.md` - Getting started guide
   - CTF Tracker URL
   - AAP credentials

4. **Monitor progress:**
   - Use CTF Tracker dashboard
   - Reference solutions in `solutions/` directory

5. **Reset environment:**
   ```bash
   cd setup
   ansible-playbook reset-environment.yml -i <your-inventory>
   ```

### For Participants

1. **Start here:**
   ```bash
   cat PARTICIPANT_QUICKSTART.md
   ```

2. **Review challenges:**
   ```bash
   cat CHALLENGES.md
   ```

3. **Access your resources:**
   - AAP (Ansible Automation Platform)
   - CTF Tracker dashboard
   - 3 RHEL servers (node1, node2, node3)

4. **Complete challenges:**
   - Start with Challenge 1 (easiest)
   - Progress through Challenge 6
   - Earn extra credit!

## 📊 Workshop Overview

### Challenges

| Challenge | Title | Points | Difficulty | Time |
|-----------|-------|--------|------------|------|
| 1 | Out of Sync | 5 | ⭐ Easy | 10 min |
| 2 | Malicious Package | 10 | ⭐⭐ Easy+ | 15 min |
| 3 | Rogue User Account | 15 | ⭐⭐ Medium | 20 min |
| 4 | Inconsistent Messaging | 20 | ⭐⭐⭐ Medium+ | 30 min |
| 5 | Firewall Anomaly | 20 | ⭐⭐⭐ Medium+ | 30 min |
| 6 | Phoenix Protocol | 30 | ⭐⭐⭐⭐⭐ Hard | 90 min |
| Extra | Approval Gate | +10 | ⭐⭐⭐⭐ Advanced | 15 min |
| **Total** | | **100 (+10)** | | **~3 hours** |

### Learning Objectives

Participants will learn:
- ✅ Ansible playbook creation
- ✅ Service management
- ✅ Package management
- ✅ User management
- ✅ Template deployment
- ✅ Firewall configuration
- ✅ AAP workflow orchestration
- ✅ Error handling and rollbacks

## 📖 Documentation

### For Everyone
- **[CHALLENGES.md](CHALLENGES.md)** - Complete challenge descriptions with scoring and hints
- **[PARTICIPANT_QUICKSTART.md](PARTICIPANT_QUICKSTART.md)** - Fast-start guide for participants

### For Instructors Only
- **[INSTRUCTOR_GUIDE.md](INSTRUCTOR_GUIDE.md)** - Complete teaching guide with schedule and tips
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[solutions/README.md](solutions/README.md)** - Solution guide with teaching points
- **[setup/README.md](setup/README.md)** - Environment setup and verification

## 🎯 Workshop Features

- ✅ **Real-time Scoring** - CTF Tracker shows live leaderboard
- ✅ **Progressive Difficulty** - Builds from easy to advanced
- ✅ **Automated Setup** - One command to prepare environment
- ✅ **Complete Solutions** - Full playbooks with explanations
- ✅ **Workflow Experience** - Learn AAP workflows hands-on
- ✅ **Team Competition** - Gamified learning experience
- ✅ **Easy Reset** - Reusable for multiple sessions

## 🔧 Requirements

### Infrastructure
- **Ansible Automation Platform** - Central controller
- **3 RHEL Servers per team** - Target systems (node1, node2, node3)
- **OpenShift Cluster** - For CTF Tracker deployment
- **CTF Tracker** - Scoring and leaderboard application

### Software
- Ansible 2.9+
- Python 3.6+
- `ansible.posix` collection
- `community.mysql` collection (for Challenge 6)

### Access
- SSH access to RHEL servers
- Sudo privileges on target systems
- AAP credentials for participants
- Network connectivity between systems

## 📝 Workshop Schedule (3 Hours)

```
00:00 - 00:15 | Welcome & Introduction
00:15 - 00:30 | Challenge 1 Demo
00:30 - 01:00 | Participants work (Challenges 1-2)
01:00 - 01:10 | Review & Challenges 3-5 intro
01:10 - 02:00 | Participants work (Challenges 3-5)
02:00 - 02:15 | Challenge 6 (Workflow) intro
02:15 - 02:45 | Participants work (Challenge 6)
02:45 - 03:00 | Wrap-up & Awards
```

## 🏆 Success Metrics

A successful workshop should achieve:
- ✅ 80%+ complete Challenges 1-3 (fundamentals)
- ✅ 50%+ complete Challenges 4-5 (intermediate)
- ✅ 20%+ attempt Challenge 6 (advanced)
- ✅ High participant engagement and satisfaction

## 🐛 Troubleshooting

### Quick Fixes

**Challenge environment not working:**
```bash
cd setup
ansible-playbook reset-environment.yml -i inventory
ansible-playbook setup-all-challenges.yml -i inventory
```

**CTF Tracker not updating:**
- Check tracker is running: `oc get pods`
- Verify URL is correct in playbooks
- Check network connectivity

**Playbook failures:**
- Review AAP job output
- Check inventory configuration
- Verify credentials
- Reference solution playbooks

### Getting Help

1. Check `INSTRUCTOR_GUIDE.md` for detailed troubleshooting
2. Review solution playbooks in `solutions/`
3. Check AAP job logs
4. Verify environment setup

## 📚 Additional Resources

- [Ansible Documentation](https://docs.ansible.com)
- [AAP Documentation](https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)

## 🎉 Ready to Start?

1. ✅ Read the documentation
2. ✅ Setup the environment
3. ✅ Deploy CTF Tracker
4. ✅ Run the workshop
5. ✅ Have fun learning Ansible!

---

**Happy Automating!** 🚀

*Version 1.0 - Updated: 2025-11-02*

