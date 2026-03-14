from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Load environment variables from .env file FIRST, before any imports that need them
load_dotenv()

from database import init_db
from routes import auth, expenses, income, stats, receipts, export, debug, subscription, notifications

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Add CORS middleware
# When allow_credentials=True, you cannot use allow_origins=["*"]
# Must specify exact origins
allowed_origins = [
    "https://my-kasa-app.vercel.app",
    "http://localhost:8081",
    "http://localhost:19006",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
    "http://192.168.1.76:8081",
    "http://192.168.1.76:19006",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# Root endpoints
@app.get("/")
@app.head("/")
def read_root():
    return {"status": "ok", "message": "backend is running"}


@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}


# Android APK direct download (for web app "Download Android app" link)
APK_DIR = Path(__file__).resolve().parent / "static" / "apk"
APK_FILENAME = "kasa.apk"


@app.get("/download/android")
async def download_android_apk():
    """Serve the Android APK for direct install. Place kasa.apk in backend/static/apk/."""
    path = APK_DIR / APK_FILENAME
    if not path.is_file():
        raise HTTPException(status_code=404, detail="APK not available")
    return FileResponse(
        path,
        media_type="application/vnd.android.package-archive",
        filename=APK_FILENAME,
    )


# Include routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(stats.router)
app.include_router(receipts.router)
app.include_router(export.router)
app.include_router(debug.router)
app.include_router(subscription.router)
app.include_router(notifications.router)
