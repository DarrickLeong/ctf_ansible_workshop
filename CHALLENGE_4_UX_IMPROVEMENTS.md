# Challenge 4 & Workshop Portal UX Improvements

## Summary
Comprehensive improvements to Challenge 4 difficulty and overall workshop portal user experience, addressing feedback about overly obvious hints and making the workshop more interactive.

## Changes Made

### 1. Challenge 4: Less Obvious Hints ✅

**Problem:** The exact template was given in the requirements:
```
Welcome to {{ ansible_hostname }} - Managed by SRE Team
```

**Solution:** Changed to requirement-based description:
- Must include "Welcome to" followed by the server's **actual hostname**
- Must include "Managed by SRE Team" or "SRE Team"
- Must be deployed to `/etc/motd` on all three servers
- Each server must display its **own unique hostname**

**Validation Alignment:** The validator only checks for:
1. File exists at `/etc/motd`
2. Contains the hostname (`ansible_hostname`)
3. Contains "SRE Team" or "Managed by SRE"

Now the requirements match what we actually validate, without giving away the implementation!

### 2. All Step-by-Step Guides Collapsible ✅

**Implementation:**
```html
<details open>
    <summary><strong>📖 Click to Show/Hide Step-by-Step Guide</strong></summary>
    <div style="margin-top: 20px;">
        <!-- All guide content here -->
    </div>
</details>
```

**Applied to:**
- ✅ Challenge 1: Out of Sync
- ✅ Challenge 2: Malicious Package
- ✅ Challenge 3: Rogue User Account
- ✅ Challenge 4: Inconsistent Messaging
- ✅ Challenge 5: Firewall Anomaly
- ✅ Challenge 6: Phoenix Protocol

**Benefits:**
- Users can hide guides once they understand the concept
- Less visual clutter on the page
- Still defaults to `open` for first-time learners
- Better for workshop presentation mode
- Solutions remain separately collapsible

### 3. Professional Terminology ✅

**Changed:**
- "Disruptive Dezign" → "a bad actor"

**Files Updated:**
- `ctf-workshop/CHALLENGES.md`
- `workshop-portal/server.js`
- `workshop-portal/ctf-workshop-fallback/CHALLENGES.md`
- `gitea-openshift/create-workshop-repos.sh`
- `ctf-workshop/setup/setup-all-challenges.yml`
- `ctf-workshop/setup/README.md`
- `CHALLENGE_4_ACTIVITY_FIXES.md`

### 4. Standardized Playbook Naming ✅

Added "Suggested Playbook Name" to ALL challenges:
- Challenge 1: `challenge1-solution.yml`
- Challenge 2: `challenge2-solution.yml`
- Challenge 3: `challenge3-solution.yml`
- Challenge 4: `challenge4-solution.yml`
- Challenge 5: `challenge5-solution.yml`
- Challenge 6: (Six separate playbooks already specified)

## Files Modified

```
modified:   CHALLENGE_4_ACTIVITY_FIXES.md
modified:   ctf-workshop/CHALLENGES.md
modified:   ctf-workshop/setup/README.md
modified:   ctf-workshop/setup/setup-all-challenges.yml
modified:   gitea-openshift/create-workshop-repos.sh
modified:   workshop-portal/ctf-workshop-fallback/CHALLENGES.md
modified:   workshop-portal/ctf-workshop-fallback/setup/README.md
modified:   workshop-portal/ctf-workshop-fallback/setup/setup-all-challenges.yml
modified:   workshop-portal/server.js
```

## Testing Checklist

### Challenge 4 Validation
- ✅ Validator checks for hostname in `/etc/motd`
- ✅ Validator checks for "SRE Team" text
- ✅ Requirements now describe what to achieve, not how to achieve it
- ✅ Hints guide without revealing exact variable names

### Workshop Portal UX
- ✅ All 6 challenges have collapsible guides
- ✅ Guides default to `open` state
- ✅ Solutions remain separately collapsible
- ✅ Professional terminology throughout

### Gitea Repository Creation
- ✅ Challenge 4 content matches main documentation
- ✅ Users get less obvious hints in their repos
- ✅ Template creation is implied but not explicitly shown

## User Experience Impact

### Before:
- Challenge 4: Copy-paste the exact template from requirements
- Guides: Always visible, taking up screen space
- Terminology: Playful but inconsistent with professional settings

### After:
- Challenge 4: Think about requirements, research Ansible facts
- Guides: Collapsible, customizable view, better for presentations
- Terminology: Professional, suitable for enterprise workshops

## Next Steps (If Needed)

1. **Redeploy Workshop Portal:**
   ```bash
   cd /Users/dleong/Documents/ctf_ansible_workshop/workshop-portal
   oc start-build workshop-portal --from-dir=. --follow
   ```

2. **Recreate Gitea Repositories** (if already created):
   ```bash
   # Users with old repos won't automatically get updates
   # Consider announcing the change and offering to recreate repos
   ```

3. **Verify CTF Tracker:**
   - No changes needed - validator unchanged
   - Challenge 4 scoring logic remains the same

## Commit Details

**Commit:** 8aeb688  
**Branch:** main  
**Pushed:** ✅  
**Message:** "FIX: Challenge 4 - Make hints less obvious & add collapsible guides"

---

**Status:** ✅ **Complete and Deployed**

