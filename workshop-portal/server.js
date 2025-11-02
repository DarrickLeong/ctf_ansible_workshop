const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure marked for syntax highlighting
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Path to workshop materials
// Check if running in OpenShift or locally
const WORKSHOP_DIR = fs.existsSync(path.join(__dirname, '..', 'ctf-workshop'))
    ? path.join(__dirname, '..', 'ctf-workshop')
    : path.join(__dirname, 'ctf-workshop-fallback');

// Helper function to read and convert markdown
function readMarkdown(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        return marked(content);
    } catch (error) {
        console.error(`Error reading ${filepath}:`, error);
        return '<p>Error loading content</p>';
    }
}

// Helper function to get file list
function getFileList(dir) {
    try {
        const files = fs.readdirSync(dir);
        return files.filter(f => f.endsWith('.md') || f.endsWith('.yml'));
    } catch (error) {
        return [];
    }
}

// Main navigation structure
const navigation = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Challenges', path: '/challenges', icon: '🎯' },
    { name: 'Participant Guide', path: '/participant-guide', icon: '🚀' },
    { name: 'Instructor Guide', path: '/instructor-guide', icon: '🎓' },
    { name: 'Setup', path: '/setup', icon: '⚙️' },
    { name: 'Solutions', path: '/solutions', icon: '✅' }
];

// HTML template function
function generateHTML(title, content, currentPath = '/') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - CTF Workshop Portal</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            display: flex;
            max-width: 1400px;
            margin: 0 auto;
            min-height: 100vh;
        }

        /* Sidebar Navigation */
        .sidebar {
            width: 260px;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #667eea;
            text-align: center;
        }

        .nav-menu {
            list-style: none;
        }

        .nav-item {
            margin-bottom: 5px;
        }

        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            color: #555;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s;
        }

        .nav-link:hover {
            background: #f0f0f0;
            color: #667eea;
            transform: translateX(5px);
        }

        .nav-link.active {
            background: #667eea;
            color: white;
        }

        .nav-icon {
            margin-right: 12px;
            font-size: 20px;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            background: white;
            margin: 20px;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow-y: auto;
        }

        /* Markdown Content Styles */
        .content h1 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }

        .content h2 {
            color: #764ba2;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        .content h3 {
            color: #555;
            margin-top: 25px;
            margin-bottom: 12px;
        }

        .content p {
            margin-bottom: 15px;
        }

        .content ul, .content ol {
            margin-left: 30px;
            margin-bottom: 15px;
        }

        .content li {
            margin-bottom: 8px;
        }

        .content pre {
            background: #1e1e1e;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
        }

        .content code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }

        .content pre code {
            background: transparent;
            padding: 0;
            color: #e6e6e6;
        }

        .content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .content table th,
        .content table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }

        .content table th {
            background: #667eea;
            color: white;
        }

        .content table tr:nth-child(even) {
            background: #f9f9f9;
        }

        .content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }

        /* File Browser */
        .file-list {
            list-style: none;
            margin-top: 20px;
        }

        .file-item {
            padding: 12px;
            background: #f8f8f8;
            margin-bottom: 8px;
            border-radius: 6px;
            transition: all 0.3s;
        }

        .file-item:hover {
            background: #e8e8e8;
            transform: translateX(5px);
        }

        .file-link {
            color: #667eea;
            text-decoration: none;
            display: flex;
            align-items: center;
        }

        .file-icon {
            margin-right: 10px;
        }

        /* Alert Boxes */
        .alert {
            padding: 15px 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid;
        }

        .alert-info {
            background: #e3f2fd;
            border-color: #2196F3;
            color: #1565C0;
        }

        .alert-warning {
            background: #fff3e0;
            border-color: #ff9800;
            color: #e65100;
        }

        .alert-success {
            background: #e8f5e9;
            border-color: #4caf50;
            color: #2e7d32;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
            }

            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
            }

            .main-content {
                margin: 10px;
                padding: 20px;
            }
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #ddd;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="sidebar">
            <div class="logo">🎯 CTF Workshop</div>
            <ul class="nav-menu">
                ${navigation.map(item => `
                    <li class="nav-item">
                        <a href="${item.path}" class="nav-link ${currentPath === item.path ? 'active' : ''}">
                            <span class="nav-icon">${item.icon}</span>
                            <span>${item.name}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </nav>
        <main class="main-content">
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>CTF Workshop Portal v1.0 | Ansible Automation Platform</p>
            </div>
        </main>
    </div>
</body>
</html>
    `;
}

// Routes

// Home page
app.get('/', (req, res) => {
    const readmePath = path.join(WORKSHOP_DIR, 'README.md');
    const content = readMarkdown(readmePath);
    res.send(generateHTML('Home', content, '/'));
});

// Challenges
app.get('/challenges', (req, res) => {
    const challengesPath = path.join(WORKSHOP_DIR, 'CHALLENGES.md');
    const content = readMarkdown(challengesPath);
    res.send(generateHTML('Challenges', content, '/challenges'));
});

// Participant Guide
app.get('/participant-guide', (req, res) => {
    const guidePath = path.join(WORKSHOP_DIR, 'PARTICIPANT_QUICKSTART.md');
    const content = readMarkdown(guidePath);
    res.send(generateHTML('Participant Guide', content, '/participant-guide'));
});

// Instructor Guide
app.get('/instructor-guide', (req, res) => {
    const guidePath = path.join(WORKSHOP_DIR, 'INSTRUCTOR_GUIDE.md');
    const content = readMarkdown(guidePath);
    res.send(generateHTML('Instructor Guide', content, '/instructor-guide'));
});

// Setup
app.get('/setup', (req, res) => {
    const setupReadme = path.join(WORKSHOP_DIR, 'setup', 'README.md');
    let content = readMarkdown(setupReadme);
    
    // Add file browser for setup directory
    const setupFiles = getFileList(path.join(WORKSHOP_DIR, 'setup'));
    const fileList = `
        <h2>📁 Setup Files</h2>
        <ul class="file-list">
            ${setupFiles.map(file => `
                <li class="file-item">
                    <a href="/setup/file/${file}" class="file-link">
                        <span class="file-icon">${file.endsWith('.yml') ? '📄' : '📖'}</span>
                        <span>${file}</span>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    
    content += fileList;
    res.send(generateHTML('Setup', content, '/setup'));
});

// Setup file viewer
app.get('/setup/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(WORKSHOP_DIR, 'setup', filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).send(generateHTML('Not Found', '<h1>File not found</h1>', '/setup'));
    }
    
    const content = fs.readFileSync(filepath, 'utf8');
    const htmlContent = filename.endsWith('.md') ? marked(content) : 
        `<pre><code class="language-yaml">${hljs.highlight(content, { language: 'yaml' }).value}</code></pre>`;
    
    res.send(generateHTML(filename, htmlContent, '/setup'));
});

// Solutions
app.get('/solutions', (req, res) => {
    const solutionsReadme = path.join(WORKSHOP_DIR, 'solutions', 'README.md');
    let content = `
        <div class="alert alert-warning">
            <strong>⚠️ For Instructors Only!</strong><br>
            These are complete solutions to all challenges. Do not share with participants until after the workshop.
        </div>
    `;
    content += readMarkdown(solutionsReadme);
    
    // Add file browser for solutions directory
    const solutionFiles = getFileList(path.join(WORKSHOP_DIR, 'solutions'));
    const fileList = `
        <h2>📁 Solution Files</h2>
        <ul class="file-list">
            ${solutionFiles.map(file => `
                <li class="file-item">
                    <a href="/solutions/file/${file}" class="file-link">
                        <span class="file-icon">📄</span>
                        <span>${file}</span>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    
    content += fileList;
    res.send(generateHTML('Solutions', content, '/solutions'));
});

// Solution file viewer
app.get('/solutions/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(WORKSHOP_DIR, 'solutions', filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).send(generateHTML('Not Found', '<h1>File not found</h1>', '/solutions'));
    }
    
    const content = fs.readFileSync(filepath, 'utf8');
    const htmlContent = filename.endsWith('.md') ? marked(content) : 
        `<pre><code class="language-yaml">${hljs.highlight(content, { language: 'yaml' }).value}</code></pre>`;
    
    res.send(generateHTML(filename, htmlContent, '/solutions'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🎯 CTF Workshop Portal');
    console.log('==========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📖 Access at: http://localhost:${PORT}`);
    console.log(`📁 Workshop directory: ${WORKSHOP_DIR}`);
    console.log('==========================================');
});

