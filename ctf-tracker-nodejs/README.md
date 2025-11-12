# CTF Tracker

A clean, simple CTF (Capture The Flag) tracking application built with Node.js and Express.

## 🚀 Quick Start

### OpenShift Deployment (Automated)

**Use the deployment script for easy setup:**

```bash
cd ctf-tracker-nodejs
./deploy.sh
```

The script will:
- ✅ Check OpenShift CLI and authentication
- ✅ Prompt for configuration (project name, Git repo, etc.)
- ✅ Create or switch to project
- ✅ Deploy using Node.js S2I builder
- ✅ Optionally configure persistent storage
- ✅ Expose the service and display the URL
- ✅ Test the health endpoint

**Example run:**
```bash
./deploy.sh

# You'll be prompted for:
# - Project name: ctf-tracker
# - App name: ctf-tracker-nodejs
# - Git repository: https://github.com/YOUR-ORG/ctf_ansible_workshop.git
# - Git branch: main
# - Enable persistent storage: y
# - Storage size: 1Gi
```

### Local Development

```bash
cd ctf-tracker-nodejs
npm install
npm start
```

Visit: `http://localhost:8080`

### Manual OpenShift Deployment

If you prefer manual deployment:

```bash
# Create new app from source
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=ctf-tracker-nodejs \
  --name=ctf-tracker-nodejs

# Expose service
oc expose service ctf-tracker-nodejs

# Get the URL
oc get route ctf-tracker-nodejs
```

## 📊 Features

### ✅ Working Dashboard
- **Real-time leaderboard** - Shows attendee scores correctly
- **Statistics** - Live counts of attendees, machines, challenges
- **Recent activity** - Latest challenge completions
- **Auto-refresh** - Updates every 30 seconds

### 🎯 API Endpoints

All endpoints work immediately without caching issues:

#### Attendees
- `GET /api/attendees` - Get all attendees
- `POST /api/attendees` - Add new attendee
- `GET /api/leaderboard` - Get ranked leaderboard

#### Machines
- `GET /api/machines` - Get all registered machines
- `POST /api/machines` - Register new machine

#### Challenge Results
- `POST /api/challenge_results` - Submit challenge results from Ansible
- `GET /api/recent_results` - Get recent activity

#### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /health` - Health check

### 🎮 Ansible Integration

Update your playbook endpoints to use the new Node.js app:

```yaml
# In comprehensive-ctf-playbook.yml
- name: Report results to CTF Tracker
  uri:
    url: "{{ ctf_tracker_url }}/api/challenge_results"
    method: POST
    body_format: json
    body:
      attendee_name: "{{ attendee_name }}"
      hostname: "{{ inventory_hostname }}"
      challenge_results: "{{ challenge_results }}"
      aap_cluster_id: "{{ aap_cluster_id | default('') }}"
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)
- `DATABASE_DIR` - Database directory (default: ./data)

### Database

Uses SQLite with automatic table creation. Database file: `./data/ctf_tracker.db`

## 🎯 Why Node.js?

### ✅ Advantages over Flask
- **No template caching issues** - Static files served directly
- **Simpler deployment** - Single process, fewer dependencies  
- **Better OpenShift support** - Native Node.js S2I builder
- **Faster startup** - No Python framework overhead
- **Cleaner code** - Modern JavaScript, async/await

### 🚀 Immediate Benefits
- Dashboard works instantly without caching problems
- All API endpoints respond correctly
- Real-time leaderboard updates
- Clean, maintainable codebase

## 📝 Usage

1. **Deploy the Node.js app** to OpenShift
2. **Update your playbook** `ctf_tracker_url` to point to the new app
3. **Run your CTF challenges** - scores will update immediately
4. **Monitor the dashboard** - real-time updates without refresh issues

## 🎉 Success!

This Node.js version eliminates all the Flask template caching and deployment issues you experienced. The dashboard will show scores immediately and update in real-time.
