from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import pymongo
import os
from bson import ObjectId
import uuid
import json

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

class TicketPurchase(BaseModel):
    raffle_id: str
    user_name: str
    user_email: str
    user_phone: str
    ticket_quantity: int
    total_amount: float

class Winner(BaseModel):
    raffle_id: str
    user_name: str
    user_email: str
    winning_ticket_id: str
    announced_date: datetime

# Helper function to convert ObjectId to string
def serialize_raffle(raffle):
    if '_id' in raffle:
        raffle['_id'] = str(raffle['_id'])
    return raffle

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

# API Routes
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

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)