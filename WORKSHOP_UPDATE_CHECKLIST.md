# Workshop Content Update Checklist

## 🎯 Purpose
Ensure ALL workshop components are synchronized whenever making changes to challenges, solutions, or documentation.

---

## ✅ Complete Change Propagation Checklist

### Phase 1: Code Changes
- [ ] Update solution playbooks in `ctf-workshop/solutions/`
- [ ] Update setup playbooks in `ctf-workshop/setup/` (if applicable)
- [ ] Update reset playbooks in `ctf-workshop/setup/` (if applicable)
- [ ] Update validator in `sub-controllers/ctf-challenge-validator.yml` (if applicable)
- [ ] Test changes locally or in dev environment

### Phase 2: Documentation Updates
- [ ] Update `ctf-workshop/CHALLENGES.md` with new requirements
- [ ] Update `ctf-workshop/solutions/README.md` with solution explanations
- [ ] Update `ctf-workshop/INSTRUCTOR_GUIDE.md` (if teaching points changed)
- [ ] Update any related comparison/troubleshooting docs

### Phase 3: Workshop Portal Updates
- [ ] Update `workshop-portal/server.js`:
  - [ ] Challenge scenario descriptions
  - [ ] Requirements section
  - [ ] Hints (in `<details>` tags)
  - [ ] Complete solution code blocks
- [ ] Update `workshop-portal/ctf-workshop-fallback/` (copy from main if needed)
- [ ] **REBUILD** the workshop portal after changes

### Phase 4: Gitea Repository Template Updates
- [ ] Update `gitea-openshift/create-workshop-repos.sh`:
  - [ ] Challenge README content
  - [ ] Playbook templates
  - [ ] Hints and guidance
- [ ] **Re-run** script if repositories need updating (or document for next cohort)

### Phase 5: Git & Deployment
- [ ] Commit all changes with comprehensive message
- [ ] Push to main branch
- [ ] **Rebuild workshop portal** on OpenShift
- [ ] Wait for deployment rollout
- [ ] Verify changes are live

---

## 🚀 Quick Deployment Commands

### Workshop Portal Rebuild
```bash
cd workshop-portal
oc start-build workshop-portal --follow -n ctf-workshop-portal
oc rollout status deployment/workshop-portal -n ctf-workshop-portal
```

### CTF Tracker Rebuild (if needed)
```bash
cd ctf-tracker-nodejs
oc start-build ctf-tracker-nodejs --follow -n ctf-nodejs
oc rollout status deployment/ctf-tracker-nodejs -n ctf-nodejs
```

### Verify Portal URL
```bash
oc get route workshop-portal -n ctf-workshop-portal -o jsonpath='{.spec.host}'
```

---

## 📊 Component Synchronization Map

| Component | Location | Update Method |
|-----------|----------|---------------|
| **Solution Files** | `ctf-workshop/solutions/*.yml` | Direct edit |
| **Setup Files** | `ctf-workshop/setup/*.yml` | Direct edit |
| **Challenge Docs** | `ctf-workshop/CHALLENGES.md` | Direct edit |
| **Portal Content** | `workshop-portal/server.js` | Direct edit + rebuild |
| **Portal Fallback** | `workshop-portal/ctf-workshop-fallback/` | Copy or sync |
| **Gitea Templates** | `gitea-openshift/create-workshop-repos.sh` | Direct edit |
| **Validator** | `sub-controllers/ctf-challenge-validator.yml` | Direct edit |

---

## 🔍 Verification Checklist

After making changes and deploying:

- [ ] **Git**: Verify commit shows all changed files
- [ ] **Workshop Portal**: 
  - [ ] Check hints show new content
  - [ ] Check solution code is updated
  - [ ] Check no cached old content
- [ ] **Solution Files**: Run playbook to ensure it works
- [ ] **Documentation**: Read through for consistency
- [ ] **Validator**: Test scoring logic (if changed)

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Forgetting to rebuild workshop portal after changes**
   - Portal serves from built image, not live Git
   - Always run `oc start-build` after Git push

2. ❌ **Updating solution but not portal hints**
   - Students see outdated guidance
   - Keep hints synchronized with solutions

3. ❌ **Changing validator but not updating challenge docs**
   - Requirements mismatch
   - Students confused about scoring

4. ❌ **Updating one playbook but missing related ones**
   - Example: Update provision but forget rollback
   - Example: Update solution but not setup/reset

5. ❌ **Not testing after changes**
   - Always run playbooks after modifying
   - Verify portal displays correctly

---

## 📝 Change Template

When making changes, use this template for commit messages:

```
CATEGORY: Brief description

ISSUE/REASON:
  What problem this fixes or what feature it adds

CHANGES:
════════════════════════════════════════════════════════════════

📄 ctf-workshop/solutions/[filename]:
   • Change 1
   • Change 2

📄 workshop-portal/server.js:
   • Hints updated
   • Solution code updated

📄 Other files:
   • Brief description

VERIFICATION:
════════════════════════════════════════════════════════════════
✅ Tested locally
✅ Workshop portal rebuilt
✅ Changes verified in portal
✅ Documentation synchronized

DEPLOYMENT:
════════════════════════════════════════════════════════════════
• Build: workshop-portal-XX
• Commit: [hash]
• Status: Deployed
```

---

## 🎯 Quick Reference: "Did I Update Everything?"

For any challenge-related change, ask:

1. **Solution files?** ✅ Updated
2. **Workshop portal?** ✅ Updated AND rebuilt
3. **Documentation?** ✅ Synchronized
4. **Gitea templates?** ✅ Updated (if needed)
5. **Setup/Reset?** ✅ Updated (if needed)
6. **Validator?** ✅ Updated (if scoring changed)

**If all 6 are checked, you're good!**

---

## 📚 Related Documentation

- `docs/COMMIT_CHECKLIST.md` - General commit guidelines
- `workshop-portal/README.md` - Portal deployment guide
- `gitea-openshift/README.md` - Gitea management guide
- `ctf-workshop/IMPLEMENTATION_SUMMARY.md` - Architecture overview

---

## 🚨 Emergency: "I Forgot to Update Something!"

If you discover missing updates after deployment:

1. **Make the corrections** to all affected files
2. **Commit with clear message** ("FIX: Add missing portal update for...")
3. **Rebuild immediately**: `oc start-build workshop-portal --follow`
4. **Notify participants** if workshop is running
5. **Document the mistake** to prevent future occurrences

---

**Remember: Changes are NOT live until workshop portal is rebuilt!** 🚀

