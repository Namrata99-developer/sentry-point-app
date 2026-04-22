import hashlib
import io
import os
from fastapi import FastAPI, UploadFile, File, Request
from PIL import Image
from supabase import create_client, Client
from dotenv import load_dotenv

from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI, Request, File, UploadFile, Form # Add Form here
# Load variables from .env file

load_dotenv()

app = FastAPI()

# origins = [
#     "http://localhost:3000",          # Local development
#     "https://your-app.vercel.app",    # Your future Vercel URL
# ]
# Add this right after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your React app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONFIG ---
# We use os.getenv to pull from your .env file safely
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL ERROR: Supabase environment variables are missing!")
    # We initialize with empty strings just to let the app start 
    # so you can see the error in the logs instead of a crash.
    supabase = None 
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_blind_hash(ip_address: str):
    # This fulfills your "Zero Identity Stored" promise
    salt = "hackathon_secret_2026" 
    return hashlib.sha256((ip_address + salt).encode()).hexdigest()

def strip_exif(image_bytes):
    # This fulfills your "EXIF Stripping" promise
    img = Image.open(io.BytesIO(image_bytes))
    data = list(img.getdata())
    clean_img = Image.new(img.mode, img.size)
    clean_img.putdata(data)
    buf = io.BytesIO()
    clean_img.save(buf, format="PNG") 
    return buf.getvalue()

# @app.post("/report")
# async def create_report(
#     request: Request, 
#     incident_type: str, 
#     lat: float, 
#     lon: float, 
#     image: UploadFile = File(None)
# ):
#     masked_user_id = get_blind_hash(request.client.host)
    
#     # Process image if provided
#     if image:
#         file_content = await image.read()
#         cleaned_image = strip_exif(file_content)
#         # For the hackathon demo, you can save this locally or to Supabase Storage
    
#     # Prepare data for PostGIS
#     # IMPORTANT: Ensure your Supabase table has these exact column names
#     report_data = {
#         "user_hash": masked_user_id,
#         "incident_type": incident_type,
#         "location": f"POINT({lon} {lat})", # PostGIS format
#     }

#     # Insert into Supabase
#     try:
#         response = supabase.table("incident_reports").insert(report_data).execute()
#         return {"status": "Success", "data": response.data}
#     except Exception as e:
#         return {"status": "Error", "message": str(e)}

@app.post("/report")
async def create_report(
    request: Request, 
    # Change these to use Form(...)
    incident_type: str = Form(...), 
    lat: float = Form(...), 
    lon: float = Form(...), 
    image: UploadFile = File(None)
):
    masked_user_id = get_blind_hash(request.client.host)
    
    # 1. Process image if provided
    if image:
        file_content = await image.read()
        # cleaned_image = strip_exif(file_content) 
        # For now, let's just make sure the insert works!
    
    # 2. Prepare data for Supabase
    # Note: We use 'incident_type' here to match your React 'cause'
    report_data = {
        "user_hash": masked_user_id,
        "incident_type": incident_type, 
        "location": f"POINT({lon} {lat})", 
    }

    # 3. Insert into Supabase
    try:
        response = supabase.table("incident_reports").insert(report_data).execute()
        return {"status": "Success", "data": response.data}
    except Exception as e:
        print(f"Error: {e}") # This helps you see the error in the terminal
        return {"status": "Error", "message": str(e)}

# Add a test endpoint to verify connection
@app.get("/health")
async def health_check():
    return {"status": "online", "database": "connected"}

@app.get("/map-data")
async def get_map_data(k: int = 3, days: int = 365): # Accept days from React
    try:
        # We must pass BOTH k_value and days_limit to match the new SQL function
        response = supabase.rpc("get_anonymous_clusters", {
            "k_value": k, 
            "days_limit": days
        }).execute()
        
        if not response.data:
            return {
                "status": "Success", 
                "message": "No hotspots found yet.", 
                "clusters": []
            }
            
        return {"status": "Success", "clusters": response.data}
    except Exception as e:
        print(f"RPC Error: {e}") # This helps you debug in the terminal
        return {"status": "Error", "message": str(e)}
    


    # --- ADMIN ANALYTICS ROUTES ---

@app.get("/admin/metrics")
async def get_admin_metrics():
    """
    Fetches the summary numbers for the top boxes:
    Total Reports, 24h Volume, Active Hotspots, and Top Issue.
    """
    try:
        # This calls the RPC function we created in Supabase SQL Editor
        response = supabase.rpc("get_admin_metrics", {}).execute()
        
        if not response.data:
            return {"total_reports": 0, "reports_24h": 0, "active_hotspots": 0, "top_issue": "None"}
            
        return response.data
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return {"error": str(e)}

@app.get("/admin/weekly-stats")
async def get_weekly_stats():
    """
    Fetches the daily counts for the Bar Chart.
    """
    try:
        # This reads directly from the SQL View we created
        response = supabase.table("weekly_stats").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching weekly stats: {e}")
        return {"error": str(e)}