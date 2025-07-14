from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
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

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = pymongo.MongoClient(MONGO_URL)
db = client.raffle_db

# JWT Secret (in production, use environment variable)
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
security = HTTPBearer()

# Admin credentials (in production, store in database with hashed passwords)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"  # Change this in production!

# Pydantic models
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
    status: str = "active"  # active, completed, cancelled

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
    user_name: str
    user_email: str
    user_phone: str
    ticket_quantity: int
    total_amount: float

class AdminLogin(BaseModel):
    username: str
    password: str

class Winner(BaseModel):
    raffle_id: str
    user_name: str
    user_email: str
    winning_ticket_id: str
    announced_date: datetime

# Helper functions
def serialize_raffle(raffle):
    if '_id' in raffle:
        raffle['_id'] = str(raffle['_id'])
    return raffle

def serialize_ticket(ticket):
    if '_id' in ticket:
        ticket['_id'] = str(ticket['_id'])
    return ticket

def create_jwt_token(data: dict):
    """Create JWT token for admin authentication"""
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = data.copy()
    payload.update({"exp": expire})
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current admin from JWT token"""
    token = credentials.credentials
    payload = verify_jwt_token(token)
    username = payload.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return username

# Sample data initialization
@app.on_event("startup")
async def startup_event():
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
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Luxury Sports Car - BMW M3",
                "description": "High-performance BMW M3 with twin-turbo engine, premium leather seats, and advanced driver assistance.",
                "image_url": "https://images.unsplash.com/photo-1625231334168-35067f8853ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxzcG9ydHMlMjBjYXI8ZW58MHx8fHwxNzUyNTA0NDIwfDA&ixlib=rb-4.1.0&q=85",
                "category": "Car",
                "value": 10000000,
                "ticket_price": 500,
                "total_tickets": 3500,
                "sold_tickets": 2241,
                "draw_date": datetime.now() + timedelta(days=8),
                "location": "Kathmandu, Nepal",
                "status": "active"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Modern Luxury Mansion",
                "description": "Spectacular 6-bedroom mansion with garden, garage, and premium finishing. Located in prestigious neighborhood.",
                "image_url": "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3VzZXxlbnwwfHx8fDE3NTI1MDQ0MTN8MA&ixlib=rb-4.1.0&q=85",
                "category": "House",
                "value": 25000000,
                "ticket_price": 500,
                "total_tickets": 7000,
                "sold_tickets": 3892,
                "draw_date": datetime.now() + timedelta(days=25),
                "location": "Lalitpur, Nepal",
                "status": "active"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Sports Car Collection Winner",
                "description": "Win your choice of premium sports car from our collection. Multiple options available for the winner.",
                "image_url": "https://images.unsplash.com/photo-1541348263662-e068662d82af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXJ8ZW58MHx8fHwxNzUyNTA0NDIwfDA&ixlib=rb-4.1.0&q=85",
                "category": "Car",
                "value": 15000000,
                "ticket_price": 500,
                "total_tickets": 5000,
                "sold_tickets": 4156,
                "draw_date": datetime.now() + timedelta(days=12),
                "location": "Kathmandu, Nepal",
                "status": "active"
            }
        ]
        
        db.raffles.insert_many(sample_raffles)
        print("Sample raffles inserted successfully!")

# Public API Routes (existing)
@app.get("/api/raffles")
async def get_raffles(category: Optional[str] = None):
    """Get all active raffles, optionally filtered by category"""
    try:
        query = {"status": "active"}
        if category:
            query["category"] = category
        
        raffles = list(db.raffles.find(query))
        return [serialize_raffle(raffle) for raffle in raffles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/raffles/{raffle_id}")
async def get_raffle_by_id(raffle_id: str):
    """Get specific raffle by ID"""
    try:
        raffle = db.raffles.find_one({"id": raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        return serialize_raffle(raffle)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tickets/purchase")
async def purchase_tickets(purchase: TicketPurchase):
    """Mock ticket purchase endpoint"""
    try:
        # Mock purchase logic - in real implementation, this would handle payment
        ticket_ids = [str(uuid.uuid4()) for _ in range(purchase.ticket_quantity)]
        
        # Update sold tickets count
        db.raffles.update_one(
            {"id": purchase.raffle_id},
            {"$inc": {"sold_tickets": purchase.ticket_quantity}}
        )
        
        # Store purchase record
        purchase_record = {
            "id": str(uuid.uuid4()),
            "raffle_id": purchase.raffle_id,
            "user_name": purchase.user_name,
            "user_email": purchase.user_email,
            "user_phone": purchase.user_phone,
            "ticket_quantity": purchase.ticket_quantity,
            "total_amount": purchase.total_amount,
            "ticket_ids": ticket_ids,
            "purchase_date": datetime.now(),
            "status": "confirmed"
        }
        
        db.tickets.insert_one(purchase_record)
        
        return {
            "success": True,
            "message": "Tickets purchased successfully!",
            "ticket_ids": ticket_ids,
            "purchase_id": purchase_record["id"]
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

# Admin Authentication Routes
@app.post("/api/admin/login")
async def admin_login(login_data: AdminLogin):
    """Admin login endpoint"""
    try:
        if login_data.username != ADMIN_USERNAME or login_data.password != ADMIN_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        token = create_jwt_token({"username": login_data.username, "role": "admin"})
        return {
            "success": True,
            "token": token,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/verify")
async def verify_admin(current_admin: str = Depends(get_current_admin)):
    """Verify admin token"""
    return {
        "success": True,
        "username": current_admin,
        "role": "admin"
    }

# Admin Raffle Management Routes
@app.get("/api/admin/raffles")
async def get_all_raffles_admin(current_admin: str = Depends(get_current_admin)):
    """Get all raffles for admin (including inactive ones)"""
    try:
        raffles = list(db.raffles.find({}))
        return [serialize_raffle(raffle) for raffle in raffles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/raffles")
async def create_raffle(raffle_data: RaffleCreate, current_admin: str = Depends(get_current_admin)):
    """Create new raffle"""
    try:
        new_raffle = {
            "id": str(uuid.uuid4()),
            "title": raffle_data.title,
            "description": raffle_data.description,
            "image_url": raffle_data.image_url,
            "category": raffle_data.category,
            "value": raffle_data.value,
            "ticket_price": raffle_data.ticket_price,
            "total_tickets": raffle_data.total_tickets,
            "sold_tickets": 0,
            "draw_date": raffle_data.draw_date,
            "location": raffle_data.location,
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
    """Update existing raffle"""
    try:
        # Check if raffle exists
        existing_raffle = db.raffles.find_one({"id": raffle_id})
        if not existing_raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        # Prepare update data
        update_data = {}
        for field, value in raffle_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if update_data:
            update_data["updated_at"] = datetime.now()
            update_data["updated_by"] = current_admin
            
            db.raffles.update_one(
                {"id": raffle_id},
                {"$set": update_data}
            )
        
        return {
            "success": True,
            "message": "Raffle updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/raffles/{raffle_id}")
async def delete_raffle(raffle_id: str, current_admin: str = Depends(get_current_admin)):
    """Delete raffle"""
    try:
        # Check if raffle exists
        existing_raffle = db.raffles.find_one({"id": raffle_id})
        if not existing_raffle:
            raise HTTPException(status_code=404, detail="Raffle not found")
        
        # Check if raffle has any tickets sold
        if existing_raffle.get("sold_tickets", 0) > 0:
            # Instead of deleting, mark as cancelled
            db.raffles.update_one(
                {"id": raffle_id},
                {"$set": {"status": "cancelled", "cancelled_at": datetime.now(), "cancelled_by": current_admin}}
            )
            return {
                "success": True,
                "message": "Raffle cancelled (had sold tickets)"
            }
        else:
            # Safe to delete if no tickets sold
            db.raffles.delete_one({"id": raffle_id})
            return {
                "success": True,
                "message": "Raffle deleted successfully"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin Tickets Management Routes
@app.get("/api/admin/tickets")
async def get_all_tickets(current_admin: str = Depends(get_current_admin)):
    """Get all ticket purchases"""
    try:
        tickets = list(db.tickets.find({}))
        return [serialize_ticket(ticket) for ticket in tickets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/tickets/{raffle_id}")
async def get_tickets_by_raffle(raffle_id: str, current_admin: str = Depends(get_current_admin)):
    """Get tickets for specific raffle"""
    try:
        tickets = list(db.tickets.find({"raffle_id": raffle_id}))
        return [serialize_ticket(ticket) for ticket in tickets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin Statistics Routes
@app.get("/api/admin/stats")
async def get_admin_stats(current_admin: str = Depends(get_current_admin)):
    """Get comprehensive admin statistics"""
    try:
        # Basic stats
        total_raffles = db.raffles.count_documents({})
        active_raffles = db.raffles.count_documents({"status": "active"})
        completed_raffles = db.raffles.count_documents({"status": "completed"})
        cancelled_raffles = db.raffles.count_documents({"status": "cancelled"})
        
        total_tickets_sold = list(db.raffles.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$sold_tickets"}}}
        ]))
        
        total_revenue = list(db.tickets.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]))
        
        # Category breakdown
        category_stats = list(db.raffles.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}, "total_value": {"$sum": "$value"}}}
        ]))
        
        # Recent activity
        recent_purchases = list(db.tickets.find({}).sort("purchase_date", -1).limit(10))
        
        return {
            "total_raffles": total_raffles,
            "active_raffles": active_raffles,
            "completed_raffles": completed_raffles,
            "cancelled_raffles": cancelled_raffles,
            "total_tickets_sold": total_tickets_sold[0]["total"] if total_tickets_sold else 0,
            "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
            "category_stats": category_stats,
            "recent_purchases": [serialize_ticket(ticket) for ticket in recent_purchases]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)