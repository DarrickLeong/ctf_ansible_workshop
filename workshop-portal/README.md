# Workshop Portal

A beautiful web application to host and view CTF Workshop documentation and materials.

## 🚀 Features

- **📖 Rich Documentation Viewer** - Converts Markdown to beautiful HTML
- **🎨 Syntax Highlighting** - Code blocks with proper highlighting
- **📁 File Browser** - Browse setup and solution files
- **📱 Responsive Design** - Works on desktop and mobile
- **🔍 Easy Navigation** - Sidebar menu for quick access
- **⚡ Fast** - Lightweight Node.js/Express application

## 📋 What's Included

The portal provides access to:
- **Home** - Workshop overview
- **Challenges** - All 6 CTF challenges with descriptions
- **Participant Guide** - Quick-start guide for participants
- **Instructor Guide** - Complete teaching guide
- **Setup** - Environment setup playbooks
- **Solutions** - Complete solution playbooks (instructor only)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or use nodemon for auto-reload
npm run dev
```

Visit: `http://localhost:8090`

### OpenShift Deployment (Automated)

**Use the deployment script for easy setup:**

```bash
./deploy.sh
```

The script will:
- ✅ Check OpenShift CLI and authentication
- ✅ Prompt for configuration (project name, Git repo, etc.)
- ✅ Deploy using Node.js S2I builder
- ✅ Expose the service and display the URL
- ✅ Test the health endpoint

**Example run:**
```bash
./deploy.sh

# You'll be prompted for:
# - Project name: workshop-portal
# - App name: workshop-portal
# - Git repository: https://github.com/YOUR-ORG/ctf_ansible_workshop.git
# - Git branch: main
```

### Manual OpenShift Deployment

If you prefer manual deployment:

```bash
# Create new app from source
oc new-app nodejs~https://github.com/YOUR-ORG/ctf_ansible_workshop.git#main \
  --context-dir=workshop-portal \
  --name=workshop-portal

# Expose service
oc expose service workshop-portal

# Get the URL
oc get route workshop-portal
```

## 📖 Pages

### For Everyone
- **/** - Home page with workshop overview
- **/challenges** - Complete challenge descriptions
- **/participant-guide** - Quick-start guide for participants

### For Instructors
- **/instructor-guide** - Complete teaching guide with schedule
- **/setup** - Environment setup automation
- **/solutions** - Complete solution playbooks

## 🎨 Design Features

- **Modern UI** - Clean, professional design
- **Gradient Background** - Eye-catching purple gradient
- **Sticky Sidebar** - Navigation always accessible
- **Syntax Highlighting** - GitHub Dark theme for code
- **Responsive Tables** - Mobile-friendly data display
- **Alert Boxes** - Important information stands out

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 8090)

### Customization

The application automatically reads from the `../ctf-workshop` directory. The structure should be:

```
ctf-workshop/
├── README.md
├── CHALLENGES.md
├── PARTICIPANT_QUICKSTART.md
├── INSTRUCTOR_GUIDE.md
├── setup/
│   ├── *.yml
│   └── README.md
└── solutions/
    ├── *.yml
    └── README.md
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Use a different port
PORT=8091 npm start
```

**Workshop files not found:**
```bash
# Verify directory structure
ls ../ctf-workshop/
```

**Build fails on OpenShift:**
```bash
# Check build logs
oc logs -f bc/workshop-portal

# Restart build
oc start-build workshop-portal
```

## 📚 Dependencies

- **express** - Web framework
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **express-handlebars** - Template engine (optional)

## 🎯 Use Cases

### During Workshop
- Share portal URL with participants
- Easy access to all documentation
- No need to distribute files

### For Instructors
- Quick reference during teaching
- Access solutions without searching files
- View setup playbooks easily

### For Reference
- Post-workshop documentation access
- Self-paced learning
- Reference implementation

## ✅ Health Check

The portal includes a health endpoint:

```bash
curl http://workshop-portal-url/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T12:00:00.000Z"
}
```

## 🔒 Security Notes

- **Solutions Page**: Shows warning that solutions are for instructors only
- **No Authentication**: Add authentication if deploying publicly
- **Read-Only**: Portal only reads files, doesn't modify them

## 📝 Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload
npm run dev

# Access at http://localhost:8090
```

## 🎉 Features Highlight

✅ **Beautiful UI** - Modern, professional design
✅ **Markdown Support** - Rich formatted documents
✅ **Code Highlighting** - Syntax highlighting for YAML, Bash, etc.
✅ **File Browser** - Browse setup and solution files
✅ **Responsive** - Works on all devices
✅ **Fast Loading** - Lightweight and quick
✅ **OpenShift Ready** - Easy deployment
✅ **No Database** - Reads directly from filesystem

---

**Enjoy your Workshop Portal!** 🚀

*Version 1.0 - Updated: 2025-11-02*

