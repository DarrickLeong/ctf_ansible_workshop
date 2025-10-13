#!/usr/bin/env python3
"""
CTF Checkpoint Tracker - Main Flask Application
Tracks attendee progress and checks RHEL machines for completed challenges
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
import json
from urllib.parse import urljoin
import logging
import os
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_DIR = os.getenv('DATABASE_DIR', '/app/data')
DATABASE = os.path.join(DATABASE_DIR, 'ctf_tracker.db')

def ensure_database_directory():
    """Ensure the database directory exists and is writable"""
    try:
        os.makedirs(DATABASE_DIR, exist_ok=True)
        # Test write permissions
        test_file = os.path.join(DATABASE_DIR, '.write_test')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        logger.info(f"Database directory ready: {DATABASE_DIR}")
    except Exception as e:
        logger.warning(f"Cannot write to {DATABASE_DIR}, using current directory: {e}")
        # Fallback to current working directory
        global DATABASE
        DATABASE = 'ctf_tracker.db'
        logger.info(f"Using database: {DATABASE}")

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Attendees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            email TEXT,
            total_points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Checkpoints table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            points INTEGER NOT NULL,
            check_type TEXT NOT NULL,
            check_config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Progress table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendee_id INTEGER,
            checkpoint_id INTEGER,
            completed BOOLEAN DEFAULT FALSE,
            points_earned INTEGER DEFAULT 0,
            completed_at TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id),
            FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (id),
            UNIQUE(attendee_id, checkpoint_id)
        )
    ''')
    
    # AAP Clusters table for user-onboarded AAP instances
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aap_clusters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            base_url TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            attendee_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            last_connectivity_test TIMESTAMP,
            connectivity_score INTEGER DEFAULT 0,
            job_template_ids TEXT, -- JSON string storing template IDs
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id)
        )
    ''')
    
    # Challenge Types table for configurable challenges
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenge_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            max_points INTEGER NOT NULL DEFAULT 10,
            challenge_config TEXT, -- JSON configuration
            playbook_template TEXT,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Challenge Results table for storing detailed results
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenge_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendee_id INTEGER,
            hostname TEXT NOT NULL,
            challenge_type TEXT NOT NULL,
            aap_cluster_id INTEGER,
            job_id INTEGER,
            completed BOOLEAN DEFAULT FALSE,
            points_earned INTEGER DEFAULT 0,
            max_points INTEGER DEFAULT 10,
            details TEXT, -- JSON details of the challenge
            last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id),
            FOREIGN KEY (aap_cluster_id) REFERENCES aap_clusters (id)
        )
    ''')
    
    # Connectivity Tests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS connectivity_tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendee_id INTEGER,
            hostname TEXT NOT NULL,
            ip_address TEXT,
            aap_cluster_id INTEGER,
            connectivity_score INTEGER DEFAULT 0,
            connectivity_status TEXT DEFAULT 'unknown',
            connectivity_ready BOOLEAN DEFAULT FALSE,
            test_details TEXT, -- JSON test results
            test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id),
            FOREIGN KEY (aap_cluster_id) REFERENCES aap_clusters (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aap_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            hostname TEXT NOT NULL,
            attendee_id INTEGER,
            job_type TEXT NOT NULL,
            status TEXT DEFAULT 'running',
            result BOOLEAN DEFAULT FALSE,
            launched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id)
        )
    ''')
    
    # Update RHEL machines table to remove SSH credentials (not needed for AAP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rhel_machines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hostname TEXT NOT NULL,
            ip_address TEXT,
            description TEXT,
            attendee_id INTEGER,
            FOREIGN KEY (attendee_id) REFERENCES attendees (id)
        )
    ''')
    
    # Insert default challenge types
    default_challenges = [
        ('apache_check', 'Apache HTTP Server Installation and Configuration', 10, 
         '{"required_packages": ["httpd"], "required_services": ["httpd"], "required_ports": [80]}', 
         'comprehensive-ctf-playbook.yml'),
        ('nginx_check', 'Nginx Web Server Installation and Configuration', 10,
         '{"required_packages": ["nginx"], "required_services": ["nginx"], "required_ports": [80]}',
         'comprehensive-ctf-playbook.yml'),
        ('mysql_check', 'MySQL/MariaDB Database Installation', 10,
         '{"required_packages": ["mariadb-server"], "required_services": ["mariadb"], "required_ports": [3306]}',
         'comprehensive-ctf-playbook.yml'),
        ('firewall_check', 'Firewall Configuration', 10,
         '{"required_services": ["firewalld"], "required_zones": ["public"], "allowed_services": ["http"]}',
         'comprehensive-ctf-playbook.yml'),
        ('user_check', 'User Management and Sudo Configuration', 10,
         '{"required_users": ["webadmin", "developer"], "sudo_config": true}',
         'comprehensive-ctf-playbook.yml')
    ]
    
    for challenge in default_challenges:
        cursor.execute('''
            INSERT OR IGNORE INTO challenge_types (name, description, max_points, challenge_config, playbook_template)
            VALUES (?, ?, ?, ?, ?)
        ''', challenge)
    
    conn.commit()
    conn.close()

class AAPClient:
    """Ansible Automation Platform API Client"""
    
    def __init__(self, base_url, username, password, verify_ssl=True):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.auth = (username, password)
        self.session.verify = verify_ssl
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def launch_job_template(self, template_id, extra_vars=None, inventory_id=None, limit=None):
        """Launch a job template and return job ID"""
        url = f"{self.base_url}/api/v2/job_templates/{template_id}/launch/"
        data = {}
        
        if extra_vars:
            data['extra_vars'] = extra_vars
        if inventory_id:
            data['inventory'] = inventory_id
        if limit:
            data['limit'] = limit
            
        try:
            response = self.session.post(url, json=data)
            response.raise_for_status()
            job_data = response.json()
            logger.info(f"Launched job template {template_id}, job ID: {job_data['id']}")
            return job_data['id']
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to launch job template {template_id}: {e}")
            return None
    
    def get_job_status(self, job_id):
        """Get job status and results"""
        url = f"{self.base_url}/api/v2/jobs/{job_id}/"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get job status {job_id}: {e}")
            return None
    
    def get_job_output(self, job_id):
        """Get job stdout"""
        url = f"{self.base_url}/api/v2/jobs/{job_id}/stdout/?format=json"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get job output {job_id}: {e}")
            return None
    
    def wait_for_job_completion(self, job_id, timeout=300, poll_interval=5):
        """Wait for job to complete and return final status"""
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            job_status = self.get_job_status(job_id)
            if not job_status:
                return None
                
            status = job_status.get('status')
            if status in ['successful', 'failed', 'error', 'canceled']:
                return job_status
                
            time.sleep(poll_interval)
        
        logger.warning(f"Job {job_id} timed out after {timeout} seconds")
        return None

# AAP Configuration
AAP_BASE_URL = os.getenv('AAP_BASE_URL', 'https://your-aap-cluster.com')
AAP_USERNAME = os.getenv('AAP_USERNAME', '')
AAP_PASSWORD = os.getenv('AAP_PASSWORD', '')
AAP_JOB_TEMPLATE_ID = os.getenv('AAP_JOB_TEMPLATE_ID', '1')  # Apache check playbook template
AAP_VERIFY_SSL = os.getenv('AAP_VERIFY_SSL', 'true').lower() == 'true'

# Initialize AAP client
aap_client = None
if AAP_USERNAME and AAP_PASSWORD:
    aap_client = AAPClient(AAP_BASE_URL, AAP_USERNAME, AAP_PASSWORD, AAP_VERIFY_SSL)
    logger.info("AAP client initialized")
else:
    logger.warning("AAP credentials not provided - AAP integration disabled")

def check_apache_via_aap(hostname, attendee_id=None):
    """Check if Apache is installed on a RHEL machine via AAP playbook"""
    if not aap_client:
        logger.error("AAP client not initialized")
        return False
        
    try:
        # Extra variables for the playbook
        extra_vars = {
            "target_host": hostname,
            "check_type": "apache_installation",
            "attendee_id": attendee_id
        }
        
        # Launch the job template
        job_id = aap_client.launch_job_template(
            template_id=AAP_JOB_TEMPLATE_ID,
            extra_vars=extra_vars,
            limit=hostname
        )
        
        if not job_id:
            return False
            
        # Store job information in database for tracking
        store_aap_job(job_id, hostname, attendee_id, 'apache_check')
        
        # Wait for job completion
        job_result = aap_client.wait_for_job_completion(job_id)
        
        if job_result and job_result.get('status') == 'successful':
            # Parse job output to determine if Apache is installed
            job_output = aap_client.get_job_output(job_id)
            apache_found = parse_apache_check_output(job_output)
            
            # Update job status in database
            update_aap_job_status(job_id, 'completed', apache_found)
            
            logger.info(f"Apache check completed for {hostname}: {'found' if apache_found else 'not found'}")
            return apache_found
        else:
            update_aap_job_status(job_id, 'failed', False)
            logger.error(f"AAP job {job_id} failed for {hostname}")
            return False
            
    except Exception as e:
        logger.error(f"Error checking Apache via AAP on {hostname}: {str(e)}")
        return False

def parse_apache_check_output(job_output):
    """Parse AAP job output to determine if Apache is installed"""
    if not job_output:
        return False
        
    try:
        # Look for success indicators in the job output
        # This would depend on your specific playbook output format
        output_text = str(job_output).lower()
        
        # Common indicators that Apache is installed
        apache_indicators = [
            'httpd is installed',
            'apache is running',
            'httpd.service is active',
            'package httpd is installed'
        ]
        
        for indicator in apache_indicators:
            if indicator in output_text:
                return True
                
        return False
        
    except Exception as e:
        logger.error(f"Error parsing job output: {e}")
        return False

def store_aap_job(job_id, hostname, attendee_id, job_type):
    """Store AAP job information in database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO aap_jobs (job_id, hostname, attendee_id, job_type)
        VALUES (?, ?, ?, ?)
    ''', (job_id, hostname, attendee_id, job_type))
    
    conn.commit()
    conn.close()

def update_aap_job_status(job_id, status, result=None):
    """Update AAP job status in database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE aap_jobs 
        SET status = ?, result = ?, completed_at = ?
        WHERE job_id = ?
    ''', (status, result, datetime.now() if status == 'completed' else None, job_id))
    
    conn.commit()
    conn.close()

def get_recent_aap_jobs(limit=50):
    """Get recent AAP jobs for monitoring"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT j.job_id, j.hostname, a.name as attendee_name, j.job_type, 
               j.status, j.result, j.launched_at, j.completed_at
        FROM aap_jobs j
        LEFT JOIN attendees a ON j.attendee_id = a.id
        ORDER BY j.launched_at DESC
        LIMIT ?
    ''', (limit,))
    
    jobs = cursor.fetchall()
    conn.close()
    
    return jobs

def update_attendee_progress(attendee_id, checkpoint_id, completed, points):
    """Update progress for an attendee on a specific checkpoint"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO progress (attendee_id, checkpoint_id, completed, points_earned, completed_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (attendee_id, checkpoint_id, completed, points, 
          datetime.now() if completed else None))
    
    # Update total points for attendee
    cursor.execute('''
        UPDATE attendees SET total_points = (
            SELECT COALESCE(SUM(points_earned), 0) FROM progress WHERE attendee_id = ?
        ) WHERE id = ?
    ''', (attendee_id, attendee_id))
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/attendees', methods=['GET', 'POST'])
def attendees():
    """Get all attendees or add a new one"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            cursor.execute('''
                INSERT INTO attendees (name, email) VALUES (?, ?)
            ''', (data['name'], data.get('email', '')))
            conn.commit()
            attendee_id = cursor.lastrowid
            conn.close()
            return jsonify({'id': attendee_id, 'message': 'Attendee added successfully'})
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Attendee name already exists'}), 400
    
    cursor.execute('''
        SELECT id, name, email, total_points FROM attendees 
        ORDER BY total_points DESC, name
    ''')
    attendees_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': row[0],
        'name': row[1],
        'email': row[2],
        'total_points': row[3],
        'rank': idx + 1
    } for idx, row in enumerate(attendees_data)])

@app.route('/api/checkpoints')
def checkpoints():
    """Get all checkpoints"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, name, description, points FROM checkpoints')
    checkpoints_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'points': row[3]
    } for row in checkpoints_data])

@app.route('/api/progress')
def progress():
    """Get progress for all attendees"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT a.name, c.name, p.completed, p.points_earned, p.completed_at
        FROM attendees a
        CROSS JOIN checkpoints c
        LEFT JOIN progress p ON a.id = p.attendee_id AND c.id = p.checkpoint_id
        ORDER BY a.name, c.id
    ''')
    progress_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'attendee': row[0],
        'checkpoint': row[1],
        'completed': bool(row[2]) if row[2] is not None else False,
        'points_earned': row[3] or 0,
        'completed_at': row[4]
    } for row in progress_data])

@app.route('/api/leaderboard')
def leaderboard():
    """Get leaderboard data formatted for frontend"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, email, total_points FROM attendees 
        ORDER BY total_points DESC, name
    ''')
    attendees_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': row[0],
        'name': row[1],
        'email': row[2],
        'score': row[3],  # Frontend expects 'score' field
        'total_points': row[3],  # Keep this for compatibility
        'rank': idx + 1
    } for idx, row in enumerate(attendees_data)])

@app.route('/api/machines', methods=['GET', 'POST'])
def machines():
    """Get all RHEL machines or add a new one"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor.execute('''
            INSERT INTO rhel_machines (hostname, ip_address, description, attendee_id)
            VALUES (?, ?, ?, ?)
        ''', (data['hostname'], data.get('ip_address'), data.get('description', ''), 
              data.get('attendee_id')))
        conn.commit()
        machine_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': machine_id, 'message': 'Machine added successfully'})
    
    cursor.execute('''
        SELECT m.id, m.hostname, m.ip_address, m.description, a.name as attendee_name
        FROM rhel_machines m
        LEFT JOIN attendees a ON m.attendee_id = a.id
    ''')
    machines_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': row[0],
        'hostname': row[1],
        'ip_address': row[2],
        'description': row[3],
        'attendee_name': row[4]
    } for row in machines_data])

@app.route('/api/check_apache/<int:machine_id>')
def check_apache(machine_id):
    """Check if Apache is installed on a specific machine via AAP"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT hostname, attendee_id
        FROM rhel_machines WHERE id = ?
    ''', (machine_id,))
    machine = cursor.fetchone()
    
    if not machine:
        conn.close()
        return jsonify({'error': 'Machine not found'}), 404
    
    hostname, attendee_id = machine
    
    # Check Apache installation via AAP
    apache_installed = check_apache_via_aap(hostname, attendee_id)
    
    if apache_installed and attendee_id:
        # Get Apache checkpoint ID
        cursor.execute('SELECT id FROM checkpoints WHERE check_type = ?', ('apache_check',))
        checkpoint = cursor.fetchone()
        
        if checkpoint:
            checkpoint_id = checkpoint[0]
            update_attendee_progress(attendee_id, checkpoint_id, True, 10)
    
    conn.close()
    
    return jsonify({
        'machine_id': machine_id,
        'hostname': hostname,
        'apache_installed': apache_installed,
        'points_awarded': 10 if apache_installed else 0,
        'method': 'AAP Playbook'
    })

@app.route('/api/check_all_machines')
def check_all_machines():
    """Check Apache installation on all registered machines via AAP"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, hostname FROM rhel_machines')
    machines = cursor.fetchall()
    conn.close()
    
    results = []
    for machine_id, hostname in machines:
        try:
            # For AAP, we'll trigger jobs asynchronously
            result_response = check_apache(machine_id)
            results.append({
                'machine_id': machine_id,
                'hostname': hostname,
                'status': 'job_launched',
                'result': result_response.get_json()
            })
        except Exception as e:
            results.append({
                'machine_id': machine_id,
                'hostname': hostname,
                'status': 'error',
                'error': str(e)
            })
    
    return jsonify(results)

@app.route('/api/aap_jobs')
def aap_jobs():
    """Get recent AAP jobs for monitoring"""
    jobs = get_recent_aap_jobs(100)
    
    return jsonify([{
        'job_id': row[0],
        'hostname': row[1],
        'attendee_name': row[2],
        'job_type': row[3],
        'status': row[4],
        'result': bool(row[5]) if row[5] is not None else None,
        'launched_at': row[6],
        'completed_at': row[7]
    } for row in jobs])

@app.route('/api/manual_refresh', methods=['POST'])
def manual_refresh():
    """Manually trigger refresh of all machine checks"""
    try:
        # This will launch AAP jobs for all machines
        result = check_all_machines()
        
        return jsonify({
            'message': 'Manual refresh triggered successfully',
            'jobs_launched': len(result.get_json()),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'error': f'Manual refresh failed: {str(e)}'
        }), 500

@app.route('/api/aap_clusters', methods=['GET', 'POST'])
def aap_clusters():
    """Get all AAP clusters or add a new one"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            # Test connection first
            test_client = AAPClient(data['base_url'], data['username'], data['password'], 
                                   data.get('verify_ssl', True))
            
            # Test API connection
            test_response = test_client.session.get(f"{data['base_url']}/api/v2/ping/")
            if test_response.status_code != 200:
                conn.close()
                return jsonify({'error': 'Unable to connect to AAP cluster'}), 400
            
            cursor.execute('''
                INSERT INTO aap_clusters (name, base_url, username, password, attendee_id, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (data['name'], data['base_url'], data['username'], data['password'], 
                  data['attendee_id'], 'connected'))
            
            conn.commit()
            cluster_id = cursor.lastrowid
            conn.close()
            
            return jsonify({
                'id': cluster_id, 
                'message': 'AAP cluster added successfully',
                'status': 'connected'
            })
            
        except Exception as e:
            conn.close()
            return jsonify({'error': f'Failed to add AAP cluster: {str(e)}'}), 400
    
    # GET request - return all clusters for the user
    cursor.execute('''
        SELECT c.id, c.name, c.base_url, c.username, c.status, c.connectivity_score,
               c.last_connectivity_test, a.name as attendee_name
        FROM aap_clusters c
        LEFT JOIN attendees a ON c.attendee_id = a.id
        ORDER BY c.created_at DESC
    ''')
    clusters_data = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': row[0],
        'name': row[1],
        'base_url': row[2],
        'username': row[3],
        'status': row[4],
        'connectivity_score': row[5],
        'last_connectivity_test': row[6],
        'attendee_name': row[7]
    } for row in clusters_data])

@app.route('/api/connectivity_test', methods=['POST'])
def connectivity_test():
    """Receive connectivity test results from playbooks"""
    data = request.get_json()
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO connectivity_tests 
            (attendee_id, hostname, ip_address, aap_cluster_id, connectivity_score, 
             connectivity_status, connectivity_ready, test_details, test_timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('attendee_id'),
            data.get('hostname'),
            data.get('ip_address'),
            data.get('aap_cluster_id'),
            data.get('connectivity_score', 0),
            data.get('connectivity_status', 'unknown'),
            data.get('connectivity_ready', False),
            json.dumps(data.get('connectivity_results', {})),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Connectivity test results received successfully'})
        
    except Exception as e:
        conn.close()
        return jsonify({'error': f'Failed to store connectivity test: {str(e)}'}), 500

@app.route('/api/challenge_results', methods=['POST'])
def challenge_results():
    """Receive challenge results from playbooks"""
    data = request.get_json()
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        attendee_id = data.get('attendee_id')
        hostname = data.get('hostname')
        challenge_results = data.get('challenge_results', {})
        
        # Process each challenge result
        for challenge_type, result in challenge_results.items():
            cursor.execute('''
                INSERT OR REPLACE INTO challenge_results
                (attendee_id, hostname, challenge_type, aap_cluster_id, completed, 
                 points_earned, max_points, details, last_checked)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                attendee_id,
                hostname,
                challenge_type,
                data.get('aap_cluster_id'),
                result.get('completed', False),
                result.get('points_earned', 0),
                result.get('max_points', 10),
                json.dumps(result.get('details', {})),
                datetime.now()
            ))
            
            # Update attendee total points - FIXED: Record all points, not just completed challenges
            # Update or create checkpoint progress
            cursor.execute('''
                SELECT id FROM checkpoints WHERE check_type = ?
            ''', (challenge_type,))
            checkpoint = cursor.fetchone()
            
            if checkpoint:
                checkpoint_id = checkpoint[0]
                # Record points earned regardless of completion status
                points_earned = result.get('points_earned', 0)
                is_completed = result.get('completed', False)
                update_attendee_progress(attendee_id, checkpoint_id, is_completed, points_earned)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Challenge results received successfully',
            'challenges_processed': len(challenge_results)
        })
        
    except Exception as e:
        conn.close()
        return jsonify({'error': f'Failed to store challenge results: {str(e)}'}), 500

@app.route('/api/trigger_connectivity_test/<int:cluster_id>/<hostname>')
def trigger_connectivity_test(cluster_id, hostname):
    """Trigger connectivity test on a specific machine via AAP cluster"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get cluster details
    cursor.execute('''
        SELECT base_url, username, password, attendee_id FROM aap_clusters WHERE id = ?
    ''', (cluster_id,))
    cluster = cursor.fetchone()
    
    if not cluster:
        conn.close()
        return jsonify({'error': 'AAP cluster not found'}), 404
    
    base_url, username, password, attendee_id = cluster
    
    try:
        # Create AAP client for this cluster
        cluster_client = AAPClient(base_url, username, password)
        
        # Launch connectivity test playbook
        extra_vars = {
            "target_host": hostname,
            "attendee_id": attendee_id,
            "ctf_tracker_url": request.host_url.rstrip('/'),
            "ctf_tracker_token": "your-api-token",  # Should be generated/configured
            "test_type": "connectivity"
        }
        
        # Assuming we have a connectivity test template (need to be configured in AAP)
        job_id = cluster_client.launch_job_template(
            template_id=2,  # Connectivity test template ID
            extra_vars=extra_vars,
            limit=hostname
        )
        
        if job_id:
            store_aap_job(job_id, hostname, attendee_id, 'connectivity_test')
            conn.close()
            return jsonify({
                'message': 'Connectivity test triggered successfully',
                'job_id': job_id,
                'hostname': hostname
            })
        else:
            conn.close()
            return jsonify({'error': 'Failed to launch connectivity test'}), 500
            
    except Exception as e:
        conn.close()
        return jsonify({'error': f'Error triggering connectivity test: {str(e)}'}), 500

@app.route('/api/trigger_challenge_check/<int:cluster_id>/<hostname>')
def trigger_challenge_check(cluster_id, hostname):
    """Trigger comprehensive challenge check on a machine via AAP cluster"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get cluster details
    cursor.execute('''
        SELECT base_url, username, password, attendee_id FROM aap_clusters WHERE id = ?
    ''', (cluster_id,))
    cluster = cursor.fetchone()
    
    if not cluster:
        conn.close()
        return jsonify({'error': 'AAP cluster not found'}), 404
    
    base_url, username, password, attendee_id = cluster
    
    # Get active challenge types
    cursor.execute('SELECT name FROM challenge_types WHERE active = TRUE')
    active_challenges = [row[0] for row in cursor.fetchall()]
    
    try:
        # Create AAP client for this cluster
        cluster_client = AAPClient(base_url, username, password)
        
        # Launch comprehensive challenge check playbook
        extra_vars = {
            "target_host": hostname,
            "attendee_id": attendee_id,
            "ctf_tracker_url": request.host_url.rstrip('/'),
            "ctf_tracker_token": "your-api-token",  # Should be generated/configured
            "challenge_config": {
                "challenge_types": active_challenges
            }
        }
        
        # Assuming we have a challenge check template (need to be configured in AAP)
        job_id = cluster_client.launch_job_template(
            template_id=1,  # Challenge check template ID
            extra_vars=extra_vars,
            limit=hostname
        )
        
        if job_id:
            store_aap_job(job_id, hostname, attendee_id, 'challenge_check')
            conn.close()
            return jsonify({
                'message': 'Challenge check triggered successfully',
                'job_id': job_id,
                'hostname': hostname,
                'challenges': active_challenges
            })
        else:
            conn.close()
            return jsonify({'error': 'Failed to launch challenge check'}), 500
            
    except Exception as e:
        conn.close()
        return jsonify({'error': f'Error triggering challenge check: {str(e)}'}), 500

@app.route('/api/aap_status')
def aap_status():
    """Get AAP connection status and configuration"""
    status = {
        'aap_configured': aap_client is not None,
        'aap_url': AAP_BASE_URL if aap_client else None,
        'job_template_id': AAP_JOB_TEMPLATE_ID,
        'ssl_verification': AAP_VERIFY_SSL
    }
    
    if aap_client:
        try:
            # Test AAP connection by making a simple API call
            test_response = aap_client.session.get(f"{AAP_BASE_URL}/api/v2/ping/")
            status['connection_status'] = 'connected' if test_response.status_code == 200 else 'error'
            status['last_test'] = datetime.now().isoformat()
        except Exception as e:
            status['connection_status'] = 'error'
            status['error'] = str(e)
    else:
        status['connection_status'] = 'not_configured'
    
    return jsonify(status)

if __name__ == '__main__':
    ensure_database_directory()
    init_db()
    app.run(host='0.0.0.0', port=8080, debug=True)
