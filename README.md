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
