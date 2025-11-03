# Gitea Persistent Storage - Long-Term Solution

## Problem Summary

**Issue:** Gitea data (users, repositories) is lost after OpenShift cluster shutdown/hibernation in sandbox environments.

**Root Cause:** 
- Current deployment uses SQLite database stored on a PVC
- OpenShift sandbox environments don't guarantee PVC data persistence across hibernation cycles
- PVCs may appear "Bound" but data can still be lost

## Long-Term Solution: PostgreSQL Database

### Architecture Comparison

#### ❌ Current (Problematic) Architecture:
```
┌─────────────────────────────────────┐
│   Gitea Pod                         │
│   - Application + SQLite DB         │
│   - All data on single PVC          │
│   ⚠️  Single point of failure       │
└─────────────────────────────────────┘
            ↓
    ┌──────────────┐
    │ PVC (5GB)    │ ← Data lost on hibernation
    └──────────────┘
```

#### ✅ Improved Architecture (PostgreSQL):
```
┌─────────────────────────────────────┐
│   Gitea Pod (Stateless)             │
│   - Application code only           │
│   - Connects to PostgreSQL          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   PostgreSQL Pod + PVC              │
│   - User data, repo metadata        │
│   - Better backup capabilities      │
│   - Production-grade database       │
└─────────────────────────────────────┘
            +
┌─────────────────────────────────────┐
│   Gitea Data PVC                    │
│   - Git repositories                │
│   - Attachments, avatars, LFS       │
└─────────────────────────────────────┘
```

## Benefits of PostgreSQL Solution

### 1. **Better Data Persistence**
- PostgreSQL is designed for production use
- Better at recovering from crashes
- Transaction logs for data integrity
- Proper ACID compliance

### 2. **Backup & Recovery**
```bash
# PostgreSQL backup (can be automated)
oc exec deployment/postgresql -- pg_dump -U gitea gitea > backup.sql

# Restore
oc exec -i deployment/postgresql -- psql -U gitea gitea < backup.sql
```

### 3. **Separation of Concerns**
- Database pod can be managed independently
- Can upgrade Gitea without affecting database
- Can scale database separately if needed

### 4. **Industry Standard**
- PostgreSQL is Gitea's recommended production database
- Better community support
- More documentation available

## Deployment Options

### Option 1: New Deployment with PostgreSQL (Recommended)

Use the new deployment script:

```bash
cd /Users/dleong/Documents/ctf_ansible_workshop/gitea-openshift
./deploy-gitea-with-postgresql.sh
```

**What it does:**
1. Creates separate PostgreSQL deployment with dedicated PVC
2. Deploys Gitea configured to use PostgreSQL
3. Sets up proper health checks and probes
4. Configures secure database connection

### Option 2: Migrate Existing Gitea to PostgreSQL

If you want to keep your current project and migrate:

```bash
# 1. Export existing data (if any remains)
oc exec deployment/gitea -- gitea dump -c /etc/gitea/app.ini

# 2. Deploy PostgreSQL in existing project
# (Steps provided in migration guide below)

# 3. Update Gitea deployment to use PostgreSQL

# 4. Import data
oc exec deployment/gitea -- gitea restore --from backup.zip
```

## Configuration Details

### PostgreSQL Configuration

```yaml
# Database credentials stored in Secret
apiVersion: v1
kind: Secret
metadata:
  name: postgresql-credentials
type: Opaque
stringData:
  database-name: gitea
  database-user: gitea
  database-password: <secure-password>
```

### Gitea Database Configuration

```ini
[database]
DB_TYPE = postgres
HOST = postgresql:5432
NAME = gitea
USER = gitea
PASSWD = <from-secret>
SCHEMA = public
SSL_MODE = disable
LOG_SQL = false
```

## Backup Strategies

### 1. PostgreSQL Automated Backups

Create a CronJob for automated backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: gitea-db-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: registry.redhat.io/rhel9/postgresql-15:latest
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgresql -U gitea gitea | \
              gzip > /backups/gitea-$(date +%Y%m%d-%H%M%S).sql.gz
              # Keep only last 7 days
              find /backups -name "gitea-*.sql.gz" -mtime +7 -delete
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgresql-credentials
                  key: database-password
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: gitea-backups
```

### 2. External Backup to S3 (Best Practice)

```bash
# Install AWS CLI in backup container
# Then sync to S3
aws s3 sync /backups s3://your-bucket/gitea-backups/
```

### 3. Gitea Built-in Backup

```bash
# Manual backup
oc exec deployment/gitea -- gitea dump -c /etc/gitea/app.ini

# Automated via CronJob
kubectl create cronjob gitea-backup \
  --image=quay.io/rhpds/gitea:latest \
  --schedule="0 2 * * *" \
  -- gitea dump -c /etc/gitea/app.ini
```

## Disaster Recovery Procedure

### If Data is Lost:

1. **Redeploy Infrastructure:**
   ```bash
   cd gitea-openshift
   ./deploy-gitea-with-postgresql.sh
   ```

2. **Restore PostgreSQL Database:**
   ```bash
   # From backup
   oc exec -i deployment/postgresql -- psql -U gitea gitea < backup.sql
   ```

3. **Restore Gitea Data (if backed up):**
   ```bash
   oc exec deployment/gitea -- gitea restore --from backup.zip
   ```

4. **Recreate Users/Repos from CSV:**
   ```bash
   ./create-workshop-repos.sh \
       "https://your-gitea-url" \
       "admin-token" \
       "workshop-users.csv"
   ```

## Important Limitations

### ⚠️ OpenShift Sandbox Constraints

Even with PostgreSQL, **sandbox environments have limitations**:

1. **Hibernation Still Affects Storage:**
   - Sandbox clusters hibernate after inactivity
   - PVCs may not survive hibernation
   - This is a sandbox limitation, not a Gitea/PostgreSQL issue

2. **Recommendations for Sandbox:**
   - Keep `workshop-users.csv` updated and backed up
   - Export PostgreSQL database before planned shutdowns
   - Consider this a "best effort" solution in sandbox

3. **For Production:**
   - Use a production OpenShift cluster (not sandbox)
   - Enable automated backups to external storage (S3)
   - Use managed PostgreSQL service (RDS, Cloud SQL, etc.)

## Production-Grade Setup (Beyond Sandbox)

For a truly persistent setup:

### 1. Use Managed Database
```yaml
# Connect to external PostgreSQL
[database]
DB_TYPE = postgres
HOST = your-rds-instance.amazonaws.com:5432
NAME = gitea
USER = gitea
PASSWD = <secure-password>
SSL_MODE = require
```

### 2. Use Object Storage for Git Repos
```ini
[storage]
STORAGE_TYPE = minio
MINIO_ENDPOINT = s3.amazonaws.com
MINIO_ACCESS_KEY_ID = <your-key>
MINIO_SECRET_ACCESS_KEY = <your-secret>
MINIO_BUCKET = gitea-repos
MINIO_LOCATION = us-east-1
MINIO_USE_SSL = true
```

### 3. Enable Automated Backups
- Database: Use managed service backups (RDS, etc.)
- Repositories: S3 versioning enabled
- Configuration: Store in Git repository

## Migration Path

### From SQLite to PostgreSQL:

```bash
# 1. Backup existing Gitea (if data exists)
oc exec deployment/gitea -- gitea dump

# 2. Deploy new PostgreSQL-based Gitea
./deploy-gitea-with-postgresql.sh

# 3. If you had data, restore it
# Extract the dump and import to PostgreSQL
# (Manual SQL migration may be needed)

# 4. Recreate users from CSV
./create-workshop-repos.sh \
    "https://new-gitea-url" \
    "admin-token" \
    "workshop-users.csv"
```

## Testing the Solution

1. **Deploy with PostgreSQL:**
   ```bash
   ./deploy-gitea-with-postgresql.sh
   ```

2. **Create test data:**
   ```bash
   # Create users
   ./create-workshop-repos.sh <url> <token> workshop-users.csv
   ```

3. **Verify PostgreSQL connection:**
   ```bash
   oc exec deployment/postgresql -- psql -U gitea -c "SELECT COUNT(*) FROM repository;"
   ```

4. **Test backup:**
   ```bash
   oc exec deployment/postgresql -- pg_dump -U gitea gitea > test-backup.sql
   ls -lh test-backup.sql
   ```

5. **Simulate cluster restart:**
   ```bash
   oc delete pod -l app=gitea
   oc delete pod -l app=postgresql
   # Wait for pods to restart
   # Verify data still exists
   ```

## Monitoring & Maintenance

### Health Checks:
```bash
# Check PostgreSQL status
oc exec deployment/postgresql -- pg_isready

# Check Gitea health
curl https://your-gitea-url/api/healthz

# Check database size
oc exec deployment/postgresql -- psql -U gitea -c "
SELECT pg_size_pretty(pg_database_size('gitea'));"
```

### Maintenance Tasks:
```bash
# Vacuum PostgreSQL (optimize)
oc exec deployment/postgresql -- psql -U gitea -c "VACUUM ANALYZE;"

# Check for dead tuples
oc exec deployment/postgresql -- psql -U gitea -c "
SELECT schemaname, tablename, n_dead_tup 
FROM pg_stat_user_tables 
ORDER BY n_dead_tup DESC;"
```

## Conclusion

**For Your Workshop Environment:**

1. **Short-term (Current Session):**
   - Use quick recovery script when data is lost
   - Accept that sandbox will lose data

2. **Medium-term (Better Persistence):**
   - Deploy with PostgreSQL using `deploy-gitea-with-postgresql.sh`
   - Schedule regular PostgreSQL backups
   - Keep `workshop-users.csv` updated

3. **Long-term (Production):**
   - Move to non-sandbox OpenShift cluster
   - Use managed PostgreSQL (RDS, Cloud SQL)
   - Enable S3 storage for repositories
   - Automated backups to external storage

**Reality Check:**
Even with PostgreSQL, OpenShift sandbox hibernation may still cause data loss. The best approach is:
- PostgreSQL for better data integrity
- Regular backups
- Accept that sandbox is not production
- Keep recovery scripts ready

---

**Created:** 2025-11-03  
**Status:** ✅ Deployment script ready  
**Script:** `deploy-gitea-with-postgresql.sh`

