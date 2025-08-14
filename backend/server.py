from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import pymongo
import os
from bson import ObjectId
import uuid
import json
import hashlib
import jwt
import secrets
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from passlib.context import CryptContext
import re

app = FastAPI(title="RafflekTM360 API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = pymongo.MongoClient(MONGO_URL)
db = client.raffle_db

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'raffle-secret-key-change-in-production-2024')
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')  # Gmail address
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')  # Gmail app password

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = pwd_context.hash("admin123")

# Pydantic models
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    date_of_birth: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    date_of_birth: str
    is_verified: bool
    created_at: datetime

class RaffleItem(BaseModel):
    id: str
    title: str
    description: str
    image_url: str
    category: str
    value: float
    ticket_price: float
    total_tickets: int
    sold_tickets: int
    draw_date: datetime
    location: Optional[str] = None
    status: str = "active"

class RaffleCreate(BaseModel):
    title: str
    description: str
    image_url: str
    category: str
    value: float
    ticket_price: float
    total_tickets: int
    draw_date: datetime
    location: Optional[str] = None

class RaffleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    value: Optional[float] = None
    ticket_price: Optional[float] = None
    total_tickets: Optional[int] = None
    draw_date: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None

class TicketPurchase(BaseModel):
    raffle_id: str
    ticket_quantity: int

class AdminLogin(BaseModel):
    username: str
    password: str

class Winner(BaseModel):
    raffle_id: str
    user_id: str
    user_name: str
    user_email: str
    winning_ticket_ids: List[str]
    announced_date: datetime

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Helper functions
def serialize_doc(doc):
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return serialize_doc(user)

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    username = payload.get("username")
    role = payload.get("role")
    
    if not username or role != "admin":
        raise HTTPException(status_code=401, detail="Admin access required")
    return username

async def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    """Send email using Gmail SMTP"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print(f"Email would be sent to {to_email}: {subject}")
            return True

        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject

        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def generate_cryptographic_winner(raffle_id: str, participants: List[dict]) -> dict:
    """Generate cryptographically secure random winner"""
    if not participants:
        return None
    
    # Create a seed using raffle details and current timestamp
    seed_string = f"{raffle_id}-{datetime.now().isoformat()}-{secrets.token_hex(32)}"
    seed_hash = hashlib.sha256(seed_string.encode()).hexdigest()
    
    # Use the hash to select winner
    hash_int = int(seed_hash[:16], 16)  # Use first 16 hex chars
    winner_index = hash_int % len(participants)
    
    winner = participants[winner_index]
    
    # Store draw details for transparency
    draw_record = {
        "raffle_id": raffle_id,
        "draw_timestamp": datetime.now(),
        "seed_string": seed_string,
        "seed_hash": seed_hash,
        "total_participants": len(participants),
        "winner_index": winner_index,
        "winner_user_id": winner["user_id"]
    }
    
    db.draw_records.insert_one(draw_record)
    return winner

# Sample data initialization
@app.on_event("startup")
async def startup_event():
    # Create indexes for better performance
    db.users.create_index("email", unique=True)
    db.users.create_index("id", unique=True)
    db.raffles.create_index("id", unique=True)
    db.tickets.create_index([("user_id", 1), ("raffle_id", 1)])
    
    # Check if raffles collection is empty and populate with sample data
    if db.raffles.count_documents({}) == 0:
        sample_raffles = [
            {
                "id": str(uuid.uuid4()),
                "title": "Luxury Modern Villa with Pool",
                "description": "Win this stunning 4-bedroom modern villa with swimming pool, located in prime residential area. Fully furnished with premium amenities.",
                "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBob3VzZXxlbnwwfHx8fDE3NTI1MDQ0MTN8MA&ixlib=rb-4.1.0&q=85",
                "category": "House",
                "value": 15000000,
                "ticket_price": 500,
                "total_tickets": 5000,
                "sold_tickets": 2847,
                "draw_date": datetime.now() + timedelta(days=15),
                "location": "Kathmandu, Nepal",
                "status": "active"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Porsche 911 Sports Car",
                "description": "Brand new Porsche 911 Carrera S with premium interior, advanced technology, and unmatched performance.",
                "image_url": "https://images.unsplash.com/photo-1628519592419-bf288f08cef5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxzcG9ydHMlMjBjYXJ8ZW58MHx8fHwxNzUyNTA0NDIwfDA&ixlib=rb-4.1.0&q=85",
                "category": "Car",
                "value": 12000000,
                "ticket_price": 500,
                "total_tickets": 4000,
                "sold_tickets": 1923,
                "draw_date": datetime.now() + timedelta(days=22),
                "location": "Kathmandu, Nepal",
                "status": "active"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Prime Land Property - 10 Ropani",
                "description": "10 Ropani premium land in developing area with road access, electricity, and water facility. Perfect for investment.",
                "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eXxlbnwwfHx8fDE3NTI1MDQ0MzR8MA&ixlib=rb-4.1.0&q=85",
                "category": "Land",
                "value": 8000000,
                "ticket_price": 500,
                "total_tickets": 3000,
                "sold_tickets": 1456,
                "draw_date": datetime.now() + timedelta(days=30),
                "location": "Pokhara, Nepal",
                "status": "active"
            }
        ]
        
        db.raffles.insert_many(sample_raffles)
        print("Sample raffles inserted successfully!")

# User Authentication Routes
@app.post("/api/auth/register")
async def register_user(user_data: UserRegister, background_tasks: BackgroundTasks):
    """Register new user"""
    try:
        # Validate age (must be 18+)
        birth_date = datetime.strptime(user_data.date_of_birth, "%Y-%m-%d")
        age = (datetime.now() - birth_date).days / 365.25
        if age < 18:
            raise HTTPException(status_code=400, detail="Must be 18 years or older to participate")
        
        # Validate phone number (Nepal format)
        if not re.match(r'^(\+977|977)?[0-9]{10}$', user_data.phone.replace(' ', '').replace('-', '')):
            raise HTTPException(status_code=400, detail="Please enter a valid Nepali phone number")
        
        # Check if user exists
        existing_user = db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_id = str(uuid.uuid4())
        verification_token = secrets.token_urlsafe(32)
        
        new_user = {
            "id": user_id,
            "full_name": user_data.full_name,
            "email": user_data.email,
            "phone": user_data.phone,
            "password_hash": hash_password(user_data.password),
            "date_of_birth": user_data.date_of_birth,
            "is_verified": False,
            "verification_token": verification_token,
            "created_at": datetime.now(),
            "total_tickets_purchased": 0,
            "total_amount_spent": 0
        }
        
        db.users.insert_one(new_user)
        
        # Send verification email
        verification_link = f"http://localhost:3000/verify-email?token={verification_token}"
        email_body = f"""
        Welcome to RafflekTM360!
        
        Thank you for registering. Please verify your email by clicking the link below:
        
        {verification_link}
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        RafflekTM360 Team
        """
        
        background_tasks.add_task(send_email, user_data.email, "Verify Your Email - RafflekTM360", email_body)
        
        return {
            "success": True,
            "message": "Registration successful! Please check your email to verify your account.",
            "user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    """User login"""
    try:
        user = db.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user.get("is_verified", False):
            raise HTTPException(status_code=401, detail="Please verify your email first")
        
        # Create JWT token
        token_data = {"user_id": user["id"], "email": user["email"]}
        token = create_jwt_token(token_data)
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "phone": user["phone"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/verify-email")
async def verify_email(token: str):
    """Verify user email"""
    try:
        user = db.users.find_one({"verification_token": token})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        db.users.update_one(
            {"id": user["id"]},
            {"$set": {"is_verified": True}, "$unset": {"verification_token": ""}}
        )
        
        return {
            "success": True,
            "message": "Email verified successfully! You can now login."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "phone": current_user["phone"],
        "date_of_birth": current_user["date_of_birth"],
        "is_verified": current_user["is_verified"],
        "created_at": current_user["created_at"],
        "total_tickets_purchased": current_user.get("total_tickets_purchased", 0),
        "total_amount_spent": current_user.get("total_amount_spent", 0)
    }

# Public Raffle Routes
@app.get("/api/raffles")
async def get_raffles(category: Optional[str] = None):
    """Get all active raffles, optionally filtered by category"""
    try:
        query = {"status": "active"}
        if category:
            query["category"] = category
        
        raffles = list(db.raffles.find(query))
        return [serialize_doc(raffle) for raffle in raffles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/raffles/{raffle_id}")
async def get_raffle_by_id(raffle_id: str):
    """Get specific raffle by ID"""
    try:
        raffle = db.raffles.find_one({"id": raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        return serialize_doc(raffle)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tickets/purchase")
async def purchase_tickets(purchase: TicketPurchase, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Purchase raffle tickets (authenticated users only)"""
    try:
        # Get raffle details
        raffle = db.raffles.find_one({"id": purchase.raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        if raffle["status"] != "active":
            raise HTTPException(status_code=400, detail="Raffle is not active")
        
        # Check availability
        remaining_tickets = raffle["total_tickets"] - raffle["sold_tickets"]
        if purchase.ticket_quantity > remaining_tickets:
            raise HTTPException(status_code=400, detail=f"Only {remaining_tickets} tickets remaining")
        
        # Calculate total amount
        total_amount = raffle["ticket_price"] * purchase.ticket_quantity
        
        # Generate ticket IDs
        ticket_ids = [str(uuid.uuid4()) for _ in range(purchase.ticket_quantity)]
        
        # Create purchase record
        purchase_record = {
            "id": str(uuid.uuid4()),
            "raffle_id": purchase.raffle_id,
            "user_id": current_user["id"],
            "user_name": current_user["full_name"],
            "user_email": current_user["email"],
            "user_phone": current_user["phone"],
            "ticket_quantity": purchase.ticket_quantity,
            "total_amount": total_amount,
            "ticket_ids": ticket_ids,
            "purchase_date": datetime.now(),
            "status": "confirmed"
        }
        
        # Update raffle sold tickets
        db.raffles.update_one(
            {"id": purchase.raffle_id},
            {"$inc": {"sold_tickets": purchase.ticket_quantity}}
        )
        
        # Update user statistics
        db.users.update_one(
            {"id": current_user["id"]},
            {
                "$inc": {
                    "total_tickets_purchased": purchase.ticket_quantity,
                    "total_amount_spent": total_amount
                }
            }
        )
        
        # Save purchase record
        db.tickets.insert_one(purchase_record)
        
        # Send confirmation email
        email_body = f"""
        Dear {current_user['full_name']},
        
        Your ticket purchase has been confirmed!
        
        Raffle: {raffle['title']}
        Tickets: {purchase.ticket_quantity}
        Ticket IDs: {', '.join(ticket_ids)}
        Total Amount: NPR {total_amount:,}
        Purchase Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Draw Date: {raffle['draw_date'].strftime('%Y-%m-%d %H:%M:%S')}
        
        Good luck!
        
        RafflekTM360 Team
        """
        
        background_tasks.add_task(send_email, current_user["email"], "Ticket Purchase Confirmation - RafflekTM360", email_body)
        
        return {
            "success": True,
            "message": "Tickets purchased successfully!",
            "ticket_ids": ticket_ids,
            "purchase_id": purchase_record["id"],
            "total_amount": total_amount
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/tickets")
async def get_user_tickets(current_user: dict = Depends(get_current_user)):
    """Get user's tickets"""
    try:
        tickets = list(db.tickets.find({"user_id": current_user["id"]}))
        
        # Get raffle details for each ticket
        for ticket in tickets:
            raffle = db.raffles.find_one({"id": ticket["raffle_id"]})
            if raffle:
                ticket["raffle"] = {
                    "title": raffle["title"],
                    "image_url": raffle["image_url"],
                    "draw_date": raffle["draw_date"],
                    "status": raffle["status"]
                }
        
        return [serialize_doc(ticket) for ticket in tickets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin Authentication Routes
@app.post("/api/admin/login")
async def admin_login(login_data: AdminLogin):
    """Admin login"""
    try:
        if login_data.username != ADMIN_USERNAME or not verify_password(login_data.password, ADMIN_PASSWORD_HASH):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_jwt_token({"username": login_data.username, "role": "admin"})
        return {
            "success": True,
            "token": token,
            "message": "Admin login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/verify")
async def verify_admin(current_admin: str = Depends(get_current_admin)):
    """Verify admin token"""
    return {"success": True, "username": current_admin, "role": "admin"}

# Admin Raffle Management
@app.get("/api/admin/raffles")
async def get_all_raffles_admin(current_admin: str = Depends(get_current_admin)):
    """Get all raffles for admin"""
    try:
        raffles = list(db.raffles.find({}))
        return [serialize_doc(raffle) for raffle in raffles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/raffles")
async def create_raffle(raffle_data: RaffleCreate, current_admin: str = Depends(get_current_admin)):
    """Create new raffle"""
    try:
        new_raffle = {
            "id": str(uuid.uuid4()),
            **raffle_data.dict(),
            "sold_tickets": 0,
            "status": "active",
            "created_at": datetime.now(),
            "created_by": current_admin
        }
        
        db.raffles.insert_one(new_raffle)
        return {
            "success": True,
            "message": "Raffle created successfully",
            "raffle_id": new_raffle["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/raffles/{raffle_id}")
async def update_raffle(raffle_id: str, raffle_data: RaffleUpdate, current_admin: str = Depends(get_current_admin)):
    """Update raffle"""
    try:
        existing_raffle = db.raffles.find_one({"id": raffle_id})
        if not existing_raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        update_data = raffle_data.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now()
            update_data["updated_by"] = current_admin
            
            db.raffles.update_one({"id": raffle_id}, {"$set": update_data})
        
        return {"success": True, "message": "Raffle updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/raffles/{raffle_id}")
async def delete_raffle(raffle_id: str, current_admin: str = Depends(get_current_admin)):
    """Delete or cancel raffle"""
    try:
        existing_raffle = db.raffles.find_one({"id": raffle_id})
        if not existing_raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        if existing_raffle.get("sold_tickets", 0) > 0:
            db.raffles.update_one(
                {"id": raffle_id},
                {"$set": {"status": "cancelled", "cancelled_at": datetime.now(), "cancelled_by": current_admin}}
            )
            return {"success": True, "message": "Raffle cancelled (had sold tickets)"}
        else:
            db.raffles.delete_one({"id": raffle_id})
            return {"success": True, "message": "Raffle deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Winner Draw System
@app.post("/api/admin/raffles/{raffle_id}/draw")
async def conduct_draw(raffle_id: str, background_tasks: BackgroundTasks, current_admin: str = Depends(get_current_admin)):
    """Conduct winner draw for a raffle"""
    try:
        raffle = db.raffles.find_one({"id": raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        if raffle["status"] != "active":
            raise HTTPException(status_code=400, detail="Raffle is not active")
        
        # Check if draw date has passed
        if raffle["draw_date"] > datetime.now():
            raise HTTPException(status_code=400, detail="Draw date has not arrived yet")
        
        # Get all participants
        participants = []
        tickets = list(db.tickets.find({"raffle_id": raffle_id, "status": "confirmed"}))
        
        for ticket in tickets:
            for _ in range(ticket["ticket_quantity"]):
                participants.append({
                    "user_id": ticket["user_id"],
                    "user_name": ticket["user_name"],
                    "user_email": ticket["user_email"],
                    "ticket_id": random.choice(ticket["ticket_ids"])
                })
        
        if not participants:
            raise HTTPException(status_code=400, detail="No participants found")
        
        # Generate cryptographic winner
        winner = generate_cryptographic_winner(raffle_id, participants)
        
        # Create winner record
        winner_record = {
            "id": str(uuid.uuid4()),
            "raffle_id": raffle_id,
            "user_id": winner["user_id"],
            "user_name": winner["user_name"],
            "user_email": winner["user_email"],
            "winning_ticket_id": winner["ticket_id"],
            "announced_date": datetime.now(),
            "announced_by": current_admin,
            "prize_value": raffle["value"],
            "prize_title": raffle["title"]
        }
        
        db.winners.insert_one(winner_record)
        
        # Update raffle status
        db.raffles.update_one(
            {"id": raffle_id},
            {"$set": {"status": "completed", "winner_id": winner["user_id"], "draw_completed_at": datetime.now()}}
        )
        
        # Send winner email
        winner_email_body = f"""
        🎉 CONGRATULATIONS! YOU'VE WON! 🎉
        
        Dear {winner['user_name']},
        
        We are thrilled to announce that you are the winner of:
        
        🏆 {raffle['title']}
        💰 Prize Value: NPR {raffle['value']:,}
        🎫 Winning Ticket: {winner['ticket_id']}
        📅 Draw Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Our team will contact you within 24 hours to arrange prize collection.
        
        Congratulations once again!
        
        RafflekTM360 Team
        """
        
        # Send announcement email to all participants
        announcement_email_body = f"""
        🎯 Draw Results - {raffle['title']}
        
        The draw has been completed for "{raffle['title']}"
        
        Winner: {winner['user_name'][:2]}*** (Privacy Protected)
        Winning Ticket: {winner['ticket_id']}
        Prize Value: NPR {raffle['value']:,}
        
        Thank you for participating! Stay tuned for more exciting raffles.
        
        RafflekTM360 Team
        """
        
        background_tasks.add_task(send_email, winner["user_email"], "🎉 YOU WON! - RafflekTM360", winner_email_body)
        
        # Send to all participants (in background)
        unique_emails = set()
        for ticket in tickets:
            if ticket["user_email"] != winner["user_email"]:
                unique_emails.add(ticket["user_email"])
        
        for email in unique_emails:
            background_tasks.add_task(send_email, email, f"Draw Results - {raffle['title']}", announcement_email_body)
        
        return {
            "success": True,
            "message": "Draw completed successfully!",
            "winner": {
                "user_name": winner["user_name"],
                "winning_ticket": winner["ticket_id"],
                "prize_value": raffle["value"]
            },
            "total_participants": len(participants)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/winners")
async def get_all_winners(current_admin: str = Depends(get_current_admin)):
    """Get all winners"""
    try:
        winners = list(db.winners.find({}))
        return [serialize_doc(winner) for winner in winners]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statistics
@app.get("/api/stats")
async def get_stats():
    """Get platform statistics"""
    try:
        total_raffles = db.raffles.count_documents({"status": "active"})
        total_participants = db.tickets.count_documents({})
        total_prize_value = list(db.raffles.aggregate([
            {"$match": {"status": "active"}},
            {"$group": {"_id": None, "total": {"$sum": "$value"}}}
        ]))
        
        return {
            "total_raffles": total_raffles,
            "total_participants": total_participants,
            "total_prize_value": total_prize_value[0]["total"] if total_prize_value else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(current_admin: str = Depends(get_current_admin)):
    """Get comprehensive admin statistics"""
    try:
        total_raffles = db.raffles.count_documents({})
        active_raffles = db.raffles.count_documents({"status": "active"})
        completed_raffles = db.raffles.count_documents({"status": "completed"})
        cancelled_raffles = db.raffles.count_documents({"status": "cancelled"})
        
        total_users = db.users.count_documents({})
        verified_users = db.users.count_documents({"is_verified": True})
        
        total_tickets_sold = list(db.raffles.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$sold_tickets"}}}
        ]))
        
        total_revenue = list(db.tickets.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]))
        
        recent_purchases = list(db.tickets.find({}).sort("purchase_date", -1).limit(10))
        
        return {
            "total_raffles": total_raffles,
            "active_raffles": active_raffles,
            "completed_raffles": completed_raffles,
            "cancelled_raffles": cancelled_raffles,
            "total_users": total_users,
            "verified_users": verified_users,
            "total_tickets_sold": total_tickets_sold[0]["total"] if total_tickets_sold else 0,
            "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
            "recent_purchases": [serialize_doc(ticket) for ticket in recent_purchases]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    """Get all available categories"""
    try:
        categories = db.raffles.distinct("category", {"status": "active"})
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/winners")
async def get_public_winners():
    """Get recent public winners (privacy protected)"""
    try:
        winners = list(db.winners.find({}).sort("announced_date", -1).limit(10))
        
        # Protect privacy
        for winner in winners:
            name = winner["user_name"]
            winner["user_name"] = f"{name[:2]}***"
            winner.pop("user_email", None)
            winner.pop("user_id", None)
        
        return [serialize_doc(winner) for winner in winners]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)