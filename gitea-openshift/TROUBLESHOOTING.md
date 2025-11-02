# Gitea OpenShift Deployment - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Installation wizard still shows after setting INSTALL_LOCK=true"

**Symptoms:**
- Seeing "Database settings are invalid: dial tcp 127.0.0.1:5432" error
- Installation wizard appears even though config has `INSTALL_LOCK = true`

**Root Cause:**
Gitea creates a database on first run. If it runs with `INSTALL_LOCK=false`, the database stores this state. Changing the config file later doesn't override the database state.

**Solution:**
Delete the database and restart:
```bash
POD=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec -n gitea $POD -- rm -f /gitea-data/gitea.db
oc delete pod -n gitea -l app=gitea
```

---

### Issue 2: "Config file not found or init container changes don't persist"

**Symptoms:**
- Init container logs show "Config ready" but file doesn't exist in main container
- `/home/gitea/conf/app.ini` is empty or missing

**Root Cause:**
Init containers and main containers don't share filesystem unless using shared volumes. Changes made by init container to non-mounted paths are lost.

**Solution:**
Use an `emptyDir` volume mounted to both containers:
```yaml
volumes:
  - name: gitea-config-runtime
    emptyDir: {}

# Mount in both init and main container:
volumeMounts:
  - name: gitea-config-runtime
    mountPath: /home/gitea/conf
```

---

### Issue 3: "Rerunning deploy script doesn't update config"

**Symptoms:**
- Script completes but Gitea still uses old settings
- ConfigMap is updated but pod config hasn't changed

**Root Cause:**
- Init container had logic: `if [ ! -f /gitea-data/conf/app.ini ]; then` which skipped copying if file existed
- Pod annotation wasn't forcing new deployment

**Solution:**
1. Always copy config (remove the `if` check)
2. Add timestamp annotation to force pod updates:
```yaml
annotations:
  deployment-config: "${ADMIN_USER}-${ADMIN_EMAIL}-$(date +%s)"
```

---

### Issue 4: "Permission denied errors (s6-svscan)"

**Symptoms:**
- Pod fails with "s6-svscan: fatal: unable to open .s6-svscan/lock: Permission denied"

**Root Cause:**
Official Gitea image expects to run as specific UID, but OpenShift uses random UIDs.

**Solution:**
Use the RHPDS OpenShift-optimized Gitea image:
```yaml
image: quay.io/rhpds/gitea:latest
```

Reference: https://github.com/rhpds/openshift-gitea-image

---

## Best Practices

### 1. Volume Strategy
- **PVC** (`gitea-data`): For persistent data (database, repos)
- **emptyDir** (`gitea-repositories`): For temporary git operations
- **emptyDir** (`gitea-config-runtime`): For writable config shared between init and main container
- **ConfigMap** (`gitea-config`): Template for initial configuration

### 2. Config File Locations
- **ConfigMap source**: `/tmp/gitea-config/app.ini` (read-only template)
- **Persistent copy**: `/gitea-data/conf/app.ini` (backup, survives restarts)
- **Runtime copy**: `/home/gitea/conf/app.ini` (where Gitea reads from)

### 3. Init Container Pattern
```bash
# Always copy latest config from ConfigMap
cp /tmp/gitea-config/app.ini /gitea-data/conf/app.ini
cp /tmp/gitea-config/app.ini /home/gitea/conf/app.ini
chmod 666 /gitea-data/conf/app.ini
chmod 666 /home/gitea/conf/app.ini
```

### 4. Force Redeployment
Add annotation to pod template that changes with your config:
```yaml
annotations:
  deployment-config: "${ADMIN_USER}-${ADMIN_EMAIL}-$(date +%s)"
```

---

## Verification Commands

### Check if install wizard is gone:
```bash
GITEA_URL=$(oc get route gitea -n gitea -o jsonpath='{.spec.host}')
curl -s "http://${GITEA_URL}" | grep -qi "install" && echo "Install page" || echo "No install page"
```

### Verify config file:
```bash
POD=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec -n gitea $POD -- cat /home/gitea/conf/app.ini | grep INSTALL_LOCK
```

### Check database:
```bash
POD=$(oc get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}')
oc exec -n gitea $POD -- ls -lh /gitea-data/gitea.db
```

---

## Clean Slate Deployment

If you want to start completely fresh:

```bash
# Delete everything
oc delete project gitea

# Wait for termination
oc get projects | grep gitea

# Redeploy
cd /path/to/ctf_ansible_workshop/gitea-openshift
./deploy-gitea.sh
```

---

## Key Learnings

1. **RHPDS Image is Essential**: Use `quay.io/rhpds/gitea:latest` for OpenShift compatibility
2. **Shared Volumes Matter**: Init containers need `emptyDir` to share files with main container
3. **Database State Wins**: Config file changes don't override existing database state
4. **Always Copy Config**: Don't conditionally copy - always update from ConfigMap
5. **Force Updates**: Use annotations with timestamps to force pod recreation

---

## Success Checklist

✅ No installation wizard appears  
✅ Config file exists at `/home/gitea/conf/app.ini`  
✅ `INSTALL_LOCK = true` in config  
✅ Database file exists at `/gitea-data/gitea.db`  
✅ Pod is running and ready (1/1)  
✅ Route returns HTTP 200  
✅ Gitea login page shows (not install wizard)  

---

## Support

If issues persist:
1. Check logs: `oc logs -f deployment/gitea -n gitea`
2. Check init logs: `oc logs <pod-name> -c init-config -n gitea`
3. Describe pod: `oc describe pod <pod-name> -n gitea`
4. Use management script: `./manage-gitea.sh status`

