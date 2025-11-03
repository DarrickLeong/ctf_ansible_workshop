# Challenge Key Mismatch Analysis

## Issue Found: Challenge 2 Key Mismatch

### Validator (ctf-challenge-validator.yml)
```yaml
Line 100: 'challenge2_package_removal'
```

### Frontend (index.html)
```javascript
Line 524: 'challenge2_nginx_removal'
```

**Result:** Frontend doesn't recognize Challenge 2 completion! ❌

---

## Complete Challenge Key Audit

| Challenge | Validator Key | Frontend Key | Match? | Status |
|-----------|---------------|--------------|--------|--------|
| Challenge 1 | `challenge1_chronyd` | `challenge1_chronyd` | ✅ | OK |
| Challenge 2 | `challenge2_package_removal` | `challenge2_nginx_removal` | ❌ | **MISMATCH** |
| Challenge 3 | `challenge3_rogue_user` | `challenge3_rogue_user` | ✅ | OK |
| Challenge 4 | `challenge4_motd` | `challenge4_motd` | ✅ | OK |
| Challenge 5 | `challenge5_firewall` | `challenge5_firewall` | ✅ | OK |
| Challenge 6 | `challenge6_phoenix` | `challenge6_phoenix` | ✅ | OK |

---

## Root Cause

When we switched from `nginx` to `bind-utils` for Challenge 2, we updated the validator to use:
```yaml
'challenge2_package_removal'  # Generic name
```

But the frontend was never updated and still expects:
```javascript
'challenge2_nginx_removal'  # Old nginx-specific name
```

---

## Impact

**Challenge 2:**
- ✅ Points are recorded (10 pts)
- ✅ Activity feed shows completion
- ❌ Leaderboard shows ⏳ (incomplete) instead of ✅
- ❌ Shows "0/10 pts" instead of "10/10 pts"

**All other challenges:** Working correctly ✅

---

## Fix Required

Update `index.html` line 524 to match validator:

**Before:**
```javascript
{ key: 'challenge2_nginx_removal', name: 'Challenge 2: Malicious Package', points: 10 },
```

**After:**
```javascript
{ key: 'challenge2_package_removal', name: 'Challenge 2: Malicious Package', points: 10 },
```

This will make the frontend recognize Challenge 2 completion status from the database.

