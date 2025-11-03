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

    db.run('INSERT INTO machines (hostname, ip_address, region, aap_cluster_id, status) VALUES (?, ?, ?, ?, ?)', 
           [hostname, ip_address || '', region || '', aap_cluster_id || '', 'Active'], function(err) {
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

// API: Register sub controller (called by central controller only)
app.post('/api/register_controller', (req, res) => {
    const { controller_name, controller_host, region, description } = req.body;
    
    if (!controller_name) {
        return res.status(400).json({ error: 'Missing required field: controller_name' });
    }

    db.run(`INSERT OR REPLACE INTO machines (hostname, ip_address, region, aap_cluster_id, status) 
            VALUES (?, ?, ?, ?, ?)`,
           [controller_name, controller_host || '', region || 'sub-controller', controller_name, 'Active'], 
           function(err) {
        if (err) {
            console.error('Error registering controller:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`✅ Registered sub controller: ${controller_name}`);
        res.json({ 
            message: 'Sub controller registered successfully',
            id: this.lastID,
            controller_name,
            status: 'Active'
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
            // Do NOT auto-register controllers from challenge results
            // Controllers should only be registered via the central controller deployment
            
            // NEW LOGIC: Keep existing records, only add NEW or IMPROVED scores
            // This prevents duplicate activities when multiple nodes report the same challenge
            
            let totalPoints = 0;
            const insertPromises = [];

            // Process each challenge result
            Object.entries(challenge_results).forEach(([challenge_type, result]) => {
                const points = result.points_earned || 0;
                totalPoints += points;

                // Only record results with points > 0 to avoid cluttering activity feed
                if (points > 0) {
                    // Check if this challenge already has an equal or higher score
                    insertPromises.push(new Promise((resolve, reject) => {
                        db.get(`SELECT MAX(points_earned) as max_points 
                                FROM challenge_results 
                                WHERE attendee_id = ? AND challenge_type = ?`,
                               [attendee_id, challenge_type], (err, existing) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            const existingPoints = existing?.max_points || 0;
                            
                            // Only insert if this is a NEW achievement or HIGHER score
                            if (points > existingPoints) {
                                db.run(`INSERT INTO challenge_results 
                                        (attendee_id, hostname, challenge_type, points_earned, max_points, completed, details, aap_cluster_id) 
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                       [attendee_id, hostname, challenge_type, points, result.max_points || 0, 
                                        result.completed ? 1 : 0, result.details || '', aap_cluster_id || ''],
                                       function(err) {
                                           if (err) reject(err);
                                           else {
                                               console.log(`🎯 NEW/IMPROVED: ${attendee_name} earned ${points} pts for ${challenge_type} on ${hostname} (previous: ${existingPoints})`);
                                               resolve(this.lastID);
                                           }
                                       });
                            } else {
                                // Challenge already completed with same or higher score - skip duplicate activity
                                console.log(`⏭️  SKIP: ${attendee_name} already has ${existingPoints} pts for ${challenge_type} (${hostname} reporting ${points})`);
                                resolve(null);
                            }
                        });
                    }));
                }
            });

            // Wait for all inserts and recalculate attendee total
            Promise.all(insertPromises)
                .then(() => {
                    // Recalculate total points from all challenge results for this attendee
                    // Use MAX to avoid counting the same challenge multiple times across different hosts
                    db.get(`SELECT SUM(max_points_per_challenge) as total 
                            FROM (
                                SELECT challenge_type, MAX(points_earned) as max_points_per_challenge
                                FROM challenge_results 
                                WHERE attendee_id = ?
                                GROUP BY challenge_type
                            )`,
                           [attendee_id], (err, result) => {
                        if (err) {
                            console.error('Error calculating total points:', err);
                            return res.status(500).json({ error: 'Error calculating points' });
                        }

                        const newTotal = result.total || 0;
                        
                        // Update attendee's total points
                        db.run('UPDATE attendees SET total_points = ? WHERE id = ?', 
                               [newTotal, attendee_id], (err) => {
                            if (err) {
                                console.error('Error updating attendee points:', err);
                                return res.status(500).json({ error: 'Error updating points' });
                            }

                            console.log(`✅ Updated ${attendee_name} total points: ${newTotal} (added ${totalPoints} from ${hostname})`);
                            res.json({ 
                                message: 'Challenge results recorded successfully',
                                attendee_name,
                                hostname,
                                points_added: totalPoints,
                                total_points: newTotal,
                                challenges_processed: Object.keys(challenge_results).length
                            });
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

// API: Get enhanced leaderboard with challenge progress
app.get('/api/leaderboard_enhanced', (req, res) => {
    db.all(`SELECT id, name, email, total_points, created_at FROM attendees ORDER BY total_points DESC, created_at ASC`, (err, attendees) => {
        if (err) {
            console.error('Error fetching attendees:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const attendeePromises = attendees.map((attendee, index) => {
            return new Promise((resolve, reject) => {
                // Get challenge results for this attendee
                db.all(`SELECT challenge_type, points_earned, max_points, completed, timestamp 
                        FROM challenge_results 
                        WHERE attendee_id = ? 
                        ORDER BY timestamp DESC`, [attendee.id], (err, challenges) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Calculate challenge statistics
                    const totalChallenges = challenges.length;
                    const completedChallenges = challenges.filter(c => c.completed).length;
                    const uniqueChallenges = [...new Set(challenges.map(c => c.challenge_type))].length;
                    
                    // Get latest activity timestamp
                    const latestTimestamp = challenges.length > 0 ? challenges[0].timestamp : attendee.created_at;
                    
                    // Format challenge progress
                    const challengeProgress = challenges.reduce((acc, challenge) => {
                        if (!acc[challenge.challenge_type]) {
                            acc[challenge.challenge_type] = {
                                points_earned: 0,
                                max_points: challenge.max_points,
                                completed: false,
                                attempts: 0
                            };
                        }
                        acc[challenge.challenge_type].points_earned += challenge.points_earned;
                        acc[challenge.challenge_type].attempts += 1;
                        if (challenge.completed) {
                            acc[challenge.challenge_type].completed = true;
                        }
                        return acc;
                    }, {});
                    
                    resolve({
                        id: attendee.id,
                        name: attendee.name,
                        email: attendee.email,
                        score: attendee.total_points,
                        total_points: attendee.total_points,
                        rank: index + 1,
                        challenges_completed: completedChallenges,
                        total_challenges: totalChallenges,
                        unique_challenges: uniqueChallenges,
                        completion_rate: totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0,
                        latest_activity: latestTimestamp,
                        challenge_progress: challengeProgress,
                        created_at: attendee.created_at
                    });
                });
            });
        });
        
        Promise.all(attendeePromises)
            .then(enhancedLeaderboard => {
                // Sort by points (desc), then by latest activity (asc - fastest)
                enhancedLeaderboard.sort((a, b) => {
                    if (b.total_points !== a.total_points) {
                        return b.total_points - a.total_points;
                    }
                    return new Date(a.latest_activity) - new Date(b.latest_activity);
                });
                
                // Update ranks after sorting
                enhancedLeaderboard.forEach((attendee, index) => {
                    attendee.rank = index + 1;
                });
                
                res.json(enhancedLeaderboard);
            })
            .catch(err => {
                console.error('Error building enhanced leaderboard:', err);
                res.status(500).json({ error: 'Error building leaderboard' });
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

// API: Get recent challenge results (unique latest results only)
app.get('/api/recent_results', (req, res) => {
    db.all(`SELECT cr.*, a.name as attendee_name 
            FROM challenge_results cr
            JOIN attendees a ON cr.attendee_id = a.id
            WHERE cr.id IN (
                SELECT MAX(id) 
                FROM challenge_results 
                GROUP BY attendee_id, hostname, challenge_type
            )
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
// API: Reset scores and activity only (keep attendees and controllers)
app.delete('/api/reset_scores', (req, res) => {
    db.serialize(() => {
        // Clear challenge results and activity
        db.run('DELETE FROM challenge_results', function(err) {
            if (err) {
                console.error('Error clearing challenge results:', err);
                return res.status(500).json({ error: 'Database error clearing results' });
            }
            
            const resultsCleared = this.changes;
            
            // Clear connectivity tests (activity data)
            db.run('DELETE FROM connectivity_tests', function(err) {
                if (err) {
                    console.error('Error clearing connectivity tests:', err);
                    return res.status(500).json({ error: 'Database error clearing tests' });
                }
                
                const testsCleared = this.changes;
                
                // Reset all attendee points to 0
                db.run('UPDATE attendees SET total_points = 0', function(err) {
                    if (err) {
                        console.error('Error resetting attendee points:', err);
                        return res.status(500).json({ error: 'Database error resetting points' });
                    }
                    
                    const attendeesReset = this.changes;
                    
                    console.log(`🔄 Scores reset: ${resultsCleared} results cleared, ${testsCleared} tests cleared, ${attendeesReset} attendees reset to 0 points`);
                    res.json({ 
                        message: `Scores reset successfully!\n\n• ${resultsCleared} challenge results cleared\n• ${testsCleared} connectivity tests cleared\n• ${attendeesReset} attendees reset to 0 points\n\nAttendees and controllers remain registered.`,
                        cleared: {
                            challenge_results: resultsCleared,
                            connectivity_tests: testsCleared,
                            attendees_reset: attendeesReset
                        },
                        kept: ['attendees', 'machines']
                    });
                });
            });
        });
    });
});

// API: Clear all data for fresh start
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

// API: Clean up invalid controllers
app.delete('/api/cleanup_controllers', (req, res) => {
    db.run(`DELETE FROM machines WHERE 
            hostname LIKE '%unknown%' OR 
            hostname LIKE 'Unknown-%' OR
            hostname LIKE '%.sandbox%' OR
            region NOT LIKE 'sub-controller'`, function(err) {
        if (err) {
            console.error('Error cleaning up controllers:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`🧹 Cleaned up ${this.changes} invalid controllers`);
        res.json({ 
            message: 'Invalid controllers cleaned up',
            removed: this.changes
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
