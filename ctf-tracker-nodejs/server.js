const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const DATABASE_DIR = process.env.DATABASE_DIR || './data';
const DATABASE_PATH = path.join(DATABASE_DIR, 'ctf_tracker.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure database directory exists
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

// Initialize SQLite Database
const db = new sqlite3.Database(DATABASE_PATH);

// Create tables
db.serialize(() => {
    // Attendees table
    db.run(`CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        email TEXT,
        total_points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Machines table
    db.run(`CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        region TEXT,
        status TEXT DEFAULT 'Unknown',
        aap_cluster_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Challenge results table
    db.run(`CREATE TABLE IF NOT EXISTS challenge_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attendee_id INTEGER,
        hostname TEXT,
        challenge_type TEXT,
        points_earned INTEGER DEFAULT 0,
        max_points INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        details TEXT,
        aap_cluster_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attendee_id) REFERENCES attendees (id)
    )`);

    // Connectivity tests table
    db.run(`CREATE TABLE IF NOT EXISTS connectivity_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT,
        test_type TEXT,
        status TEXT,
        details TEXT,
        aap_cluster_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Database tables initialized');
});

// Routes

// Main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Get all attendees
app.get('/api/attendees', (req, res) => {
    db.all('SELECT * FROM attendees ORDER BY total_points DESC, name', (err, rows) => {
        if (err) {
            console.error('Error fetching attendees:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// API: Add new attendee
app.post('/api/attendees', (req, res) => {
    const { name, email } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    db.run('INSERT INTO attendees (name, email) VALUES (?, ?)', [name, email || ''], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Attendee already exists' });
            }
            console.error('Error adding attendee:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            name, 
            email: email || '',
            total_points: 0,
            message: 'Attendee added successfully' 
        });
    });
});

// API: Get all machines
app.get('/api/machines', (req, res) => {
    db.all('SELECT * FROM machines ORDER BY hostname', (err, rows) => {
        if (err) {
            console.error('Error fetching machines:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// API: Add new machine
app.post('/api/machines', (req, res) => {
    const { hostname, ip_address, region, aap_cluster_id } = req.body;
    
    if (!hostname) {
        return res.status(400).json({ error: 'Hostname is required' });
    }

    db.run('INSERT INTO machines (hostname, ip_address, region, aap_cluster_id) VALUES (?, ?, ?, ?)', 
           [hostname, ip_address || '', region || '', aap_cluster_id || ''], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Machine already exists' });
            }
            console.error('Error adding machine:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            hostname,
            ip_address: ip_address || '',
            region: region || '',
            aap_cluster_id: aap_cluster_id || '',
            status: 'Unknown',
            message: 'Machine added successfully' 
        });
    });
});

// API: Submit challenge results
app.post('/api/challenge_results', (req, res) => {
    const { attendee_name, hostname, challenge_results, aap_cluster_id } = req.body;
    
    if (!attendee_name || !hostname || !challenge_results) {
        return res.status(400).json({ error: 'Missing required fields: attendee_name, hostname, challenge_results' });
    }

    // First, ensure attendee exists
    db.get('SELECT id FROM attendees WHERE name = ?', [attendee_name], (err, attendee) => {
        if (err) {
            console.error('Error finding attendee:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        let attendee_id;
        
        const processResults = (attendee_id) => {
            let totalPoints = 0;
            const insertPromises = [];

            // Process each challenge result
            Object.entries(challenge_results).forEach(([challenge_type, result]) => {
                const points = result.points_earned || 0;
                totalPoints += points;

                insertPromises.push(new Promise((resolve, reject) => {
                    db.run(`INSERT INTO challenge_results 
                            (attendee_id, hostname, challenge_type, points_earned, max_points, completed, details, aap_cluster_id) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                           [attendee_id, hostname, challenge_type, points, result.max_points || 0, 
                            result.completed ? 1 : 0, result.details || '', aap_cluster_id || ''],
                           function(err) {
                               if (err) reject(err);
                               else resolve(this.lastID);
                           });
                }));
            });

            // Wait for all inserts and update attendee total
            Promise.all(insertPromises)
                .then(() => {
                    // Update attendee's total points
                    db.run('UPDATE attendees SET total_points = total_points + ? WHERE id = ?', 
                           [totalPoints, attendee_id], (err) => {
                        if (err) {
                            console.error('Error updating attendee points:', err);
                            return res.status(500).json({ error: 'Error updating points' });
                        }

                        console.log(`✅ Updated ${attendee_name} with ${totalPoints} points from ${hostname}`);
                        res.json({ 
                            message: 'Challenge results recorded successfully',
                            attendee_name,
                            hostname,
                            points_added: totalPoints,
                            challenges_processed: Object.keys(challenge_results).length
                        });
                    });
                })
                .catch(err => {
                    console.error('Error inserting challenge results:', err);
                    res.status(500).json({ error: 'Error recording results' });
                });
        };

        if (attendee) {
            // Attendee exists
            processResults(attendee.id);
        } else {
            // Create new attendee
            db.run('INSERT INTO attendees (name, email) VALUES (?, ?)', [attendee_name, ''], function(err) {
                if (err) {
                    console.error('Error creating attendee:', err);
                    return res.status(500).json({ error: 'Error creating attendee' });
                }
                console.log(`✅ Created new attendee: ${attendee_name}`);
                processResults(this.lastID);
            });
        }
    });
});

// API: Submit connectivity test results
app.post('/api/connectivity_test', (req, res) => {
    const { hostname, test_type, status, details, aap_cluster_id } = req.body;
    
    if (!hostname || !test_type || !status) {
        return res.status(400).json({ error: 'Missing required fields: hostname, test_type, status' });
    }

    db.run('INSERT INTO connectivity_tests (hostname, test_type, status, details, aap_cluster_id) VALUES (?, ?, ?, ?, ?)',
           [hostname, test_type, status, details || '', aap_cluster_id || ''], function(err) {
        if (err) {
            console.error('Error recording connectivity test:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`✅ Connectivity test recorded: ${hostname} - ${test_type} - ${status}`);
        res.json({ 
            message: 'Connectivity test recorded successfully',
            id: this.lastID,
            hostname,
            test_type,
            status
        });
    });
});

// API: Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    db.all(`SELECT id, name, email, total_points, 
                   ROW_NUMBER() OVER (ORDER BY total_points DESC, name) as rank
            FROM attendees 
            ORDER BY total_points DESC, name`, (err, rows) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const leaderboard = rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            score: row.total_points,
            total_points: row.total_points,
            rank: row.rank
        }));
        
        res.json(leaderboard);
    });
});

// API: Get recent challenge results
app.get('/api/recent_results', (req, res) => {
    db.all(`SELECT cr.*, a.name as attendee_name 
            FROM challenge_results cr
            JOIN attendees a ON cr.attendee_id = a.id
            ORDER BY cr.timestamp DESC
            LIMIT 20`, (err, rows) => {
        if (err) {
            console.error('Error fetching recent results:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// API: Get statistics
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    db.get('SELECT COUNT(*) as count FROM attendees', (err, result) => {
        if (err) {
            console.error('Error getting attendee count:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        stats.attendees = result.count;
        
        db.get('SELECT COUNT(*) as count FROM machines', (err, result) => {
            if (err) {
                console.error('Error getting machine count:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            stats.machines = result.count;
            
            db.get('SELECT COUNT(DISTINCT challenge_type) as count FROM challenge_results', (err, result) => {
                if (err) {
                    console.error('Error getting challenge count:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                stats.challenges = result.count;
                
                res.json(stats);
            });
        });
    });
});

// API: Clear all data (for testing)
app.delete('/api/clear_all', (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM challenge_results');
        db.run('DELETE FROM connectivity_tests');
        db.run('DELETE FROM machines');
        db.run('DELETE FROM attendees');
        
        console.log('🗑️ All data cleared for testing');
        res.json({ 
            message: 'All data cleared successfully',
            cleared: ['attendees', 'machines', 'challenge_results', 'connectivity_tests']
        });
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CTF Tracker Node.js server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`💾 Database: ${DATABASE_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CTF Tracker...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
