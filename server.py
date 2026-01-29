#!/usr/bin/env python3
"""
Portfolio Backend Server
FastAPI-based backend for the 3D Portfolio CMS
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import shutil
import secrets
from datetime import datetime, timedelta
import uvicorn
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Portfolio CMS API",
    description="Backend API for 3D Portfolio with Admin Panel",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CONFIG_PATH = "config/portfolio_config.json"
ASSETS_PATH = "assets/images"
BACKUP_PATH = "backups"

# Create directories if they don't exist
os.makedirs("config", exist_ok=True)
os.makedirs(f"{ASSETS_PATH}/projects", exist_ok=True)
os.makedirs(f"{ASSETS_PATH}/profile", exist_ok=True)
os.makedirs(f"{ASSETS_PATH}/misc", exist_ok=True)
os.makedirs(BACKUP_PATH, exist_ok=True)

# Token storage (in production, use a proper database)
active_tokens = {}

# =====================================================
# MODELS
# =====================================================

class LoginRequest(BaseModel):
    username: str
    password: str

class MessageRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    subject: str
    message: str

class ImageDeleteRequest(BaseModel):
    path: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# =====================================================
# HELPER FUNCTIONS
# =====================================================

def load_config():
    """Load portfolio configuration from JSON file"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return default config if file doesn't exist
        return get_default_config()

def save_config(config):
    """Save portfolio configuration to JSON file"""
    config['meta'] = {
        'last_updated': datetime.now().isoformat(),
        'version': '1.0.0'
    }
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def get_default_config():
    """Return default portfolio configuration"""
    # Get admin credentials from environment variables
    admin_username = os.getenv('ADMIN_USERNAME', 'mamu')
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    
    # Hash the password
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt(rounds=12)).decode()
    
    return {
        "meta": {
            "last_updated": datetime.now().isoformat(),
            "version": "1.0.0"
        },
        "admin": {
            "username": admin_username,
            "password_hash": password_hash
        },
        "personal_info": {
            "name": "Your Name",
            "title": "Your Title",
            "subtitle": "Your Subtitle",
            "email": "email@example.com",
            "phone": "+1 234 567 890",
            "location": "City, Country",
            "bio": "Your bio goes here...",
            "profile_image": "",
            "resume_link": ""
        },
        "social_links": {
            "github": "",
            "linkedin": "",
            "twitter": "",
            "instagram": "",
            "youtube": "",
            "dribbble": ""
        },
        "skills": [],
        "projects": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "messages": [],
        "stats": {
            "total_visitors": 0,
            "total_messages": 0,
            "projects_count": 0,
            "years_experience": 0
        },
        "theme": {
            "primary_color": "#6366f1",
            "secondary_color": "#8b5cf6",
            "accent_color": "#06b6d4"
        }
    }

def hash_password(password: str) -> str:
    """Hash password using bcrypt (secure method)"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode(), hashed_password.encode())
    except:
        return False

def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_hex(32)

def verify_token(authorization: Optional[str] = Header(None)):
    """Verify authentication token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        # Extract token from Bearer scheme
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = parts[1].strip()
        
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
            
        if token not in active_tokens:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check token expiration
        if active_tokens[token] < datetime.now():
            del active_tokens[token]
            raise HTTPException(status_code=401, detail="Token expired")
        
        return token
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# =====================================================
# ROUTES
# =====================================================

# Serve static files
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/admin/assets", StaticFiles(directory="assets"), name="admin-assets")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/admin/js", StaticFiles(directory="admin/js"), name="admin-js")

# Serve HTML files
@app.get("/")
async def serve_index():
    return FileResponse("index.html")

@app.get("/index.html")
async def serve_index_html():
    return FileResponse("index.html")

@app.get("/admin")
@app.get("/admin/")
@app.get("/admin/index.html")
async def serve_admin_login():
    return FileResponse("admin/index.html")

@app.get("/admin/dashboard")
@app.get("/admin/dashboard.html")
async def serve_admin_dashboard():
    return FileResponse("admin/dashboard.html")

# =====================================================
# API ROUTES
# =====================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/config")
async def get_config():
    """Get portfolio configuration (public data only)"""
    config = load_config()
    # Remove sensitive data
    public_config = {k: v for k, v in config.items() if k != 'admin'}
    return public_config

@app.put("/api/config")
async def update_config(config: dict, token: str = Depends(verify_token)):
    """Update portfolio configuration (admin only)"""
    try:
        # Preserve admin settings
        current_config = load_config()
        config['admin'] = current_config.get('admin', {})
        
        save_config(config)
        return {"success": True, "message": "Configuration updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# AUTHENTICATION
# =====================================================

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Admin login"""
    config = load_config()
    admin = config.get('admin', {})
    
    if (request.username == admin.get('username') and 
        verify_password(request.password, admin.get('password_hash', ''))):
        
        token = generate_token()
        active_tokens[token] = datetime.now() + timedelta(hours=24)
        
        return {
            "success": True,
            "token": token,
            "message": "Login successful"
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/logout")
async def logout(token: str = Depends(verify_token)):
    """Admin logout"""
    if token in active_tokens:
        del active_tokens[token]
    return {"success": True, "message": "Logged out"}

@app.post("/api/auth/change-password")
async def change_password(request: ChangePasswordRequest, token: str = Depends(verify_token)):
    """Change admin password (requires old password)"""
    try:
        config = load_config()
        admin = config.get('admin', {})
        
        # Verify old password
        if not verify_password(request.old_password, admin.get('password_hash', '')):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Validate new password
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Hash and save new password
        admin['password_hash'] = hash_password(request.new_password)
        config['admin'] = admin
        save_config(config)
        
        return {"success": True, "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/verify")
async def verify_auth(token: str = Depends(verify_token)):
    """Verify authentication status"""
    return {"success": True, "message": "Token valid"}

# =====================================================
# MESSAGES
# =====================================================

@app.post("/api/messages")
async def create_message(request: MessageRequest):
    """Create a new contact message"""
    config = load_config()
    
    message = {
        "id": f"msg_{int(datetime.now().timestamp())}",
        "firstName": request.firstName,
        "lastName": request.lastName,
        "email": request.email,
        "subject": request.subject,
        "message": request.message,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }
    
    if 'messages' not in config:
        config['messages'] = []
    
    config['messages'].insert(0, message)
    config['stats']['total_messages'] = len(config['messages'])
    
    save_config(config)
    
    return {"success": True, "message": "Message sent successfully"}

@app.get("/api/messages")
async def get_messages(token: str = Depends(verify_token)):
    """Get all messages (admin only)"""
    config = load_config()
    return config.get('messages', [])

@app.put("/api/messages/{message_id}")
async def update_message(message_id: str, data: dict, token: str = Depends(verify_token)):
    """Update a message (e.g., mark as read)"""
    config = load_config()
    
    for msg in config.get('messages', []):
        if msg['id'] == message_id:
            msg.update(data)
            save_config(config)
            return {"success": True, "message": "Message updated"}
    
    raise HTTPException(status_code=404, detail="Message not found")

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str, token: str = Depends(verify_token)):
    """Delete a message"""
    config = load_config()
    
    messages = config.get('messages', [])
    config['messages'] = [m for m in messages if m['id'] != message_id]
    config['stats']['total_messages'] = len(config['messages'])
    
    save_config(config)
    return {"success": True, "message": "Message deleted"}

# =====================================================
# FILE UPLOAD
# =====================================================

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = "misc",
    token: str = Depends(verify_token)
):
    """Upload an image file"""
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, GIF, WebP")
    
    try:
        # Generate unique filename
        ext = file.filename.split('.')[-1].lower()
        if not ext:
            raise HTTPException(status_code=400, detail="File must have an extension")
            
        filename = f"{int(datetime.now().timestamp())}_{secrets.token_hex(4)}.{ext}"
        
        # Determine folder
        folder_map = {
            'profile': 'profile',
            'project': 'projects',
            'misc': 'misc'
        }
        folder = folder_map.get(type, 'misc')
        
        # Create directory if it doesn't exist
        upload_dir = f"{ASSETS_PATH}/{folder}"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = f"{upload_dir}/{filename}"
        
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file was saved
        if not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="File save failed")
        
        return {
            "success": True,
            "path": f"/assets/images/{folder}/{filename}",
            "filename": filename
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.delete("/api/images")
async def delete_image(request: ImageDeleteRequest, token: str = Depends(verify_token)):
    """Delete an image file"""
    try:
        if os.path.exists(request.path):
            os.remove(request.path)
            return {"success": True, "message": "Image deleted"}
        return {"success": False, "message": "File not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# BACKUP
# =====================================================

@app.post("/api/backup")
async def create_backup(token: str = Depends(verify_token)):
    """Create a backup of the configuration"""
    try:
        config = load_config()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"{BACKUP_PATH}/backup_{timestamp}.json"
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        return {"success": True, "file": backup_file}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backups")
async def list_backups(token: str = Depends(verify_token)):
    """List all backups"""
    backups = []
    for file in os.listdir(BACKUP_PATH):
        if file.endswith('.json'):
            path = os.path.join(BACKUP_PATH, file)
            backups.append({
                "name": file,
                "path": path,
                "size": os.path.getsize(path),
                "created": datetime.fromtimestamp(os.path.getctime(path)).isoformat()
            })
    return sorted(backups, key=lambda x: x['created'], reverse=True)

# =====================================================
# STATS
# =====================================================

@app.post("/api/stats/visit")
async def record_visit():
    """Record a page visit"""
    config = load_config()
    config['stats']['total_visitors'] = config['stats'].get('total_visitors', 0) + 1
    save_config(config)
    return {"success": True}

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    # Create default config if it doesn't exist
    if not os.path.exists(CONFIG_PATH):
        save_config(get_default_config())
        print(f"Created default configuration at {CONFIG_PATH}")
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Portfolio CMS Server Started!                          ║
║                                                              ║
║   Portfolio:    http://localhost:8000                        ║
║   Admin Panel:  http://localhost:8000/admin                  ║
║   API Docs:     http://localhost:8000/docs                   ║
║                                                              ║
║   Default Admin Credentials:                                 ║
║   Username: admin                                            ║
║   Password: admin123                                         ║
║                                                              ║
║   Press Ctrl+C to stop the server                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)