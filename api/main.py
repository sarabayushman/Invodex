from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr


app = FastAPI(
    title="Invodex Sample API",
    description="A small FastAPI backend for the sample React/Vercel app.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Metric(BaseModel):
    label: str
    value: str
    trend: str


class Activity(BaseModel):
    title: str
    detail: str
    time: str


class DashboardSummary(BaseModel):
    generated_at: str
    metrics: List[Metric]
    activity: List[Activity]


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str


@app.get("/")
def root():
    return {
        "message": "Invodex API is running. Try /api/health or /api/summary.",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "invodex-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/summary", response_model=DashboardSummary)
def dashboard_summary():
    return DashboardSummary(
        generated_at=datetime.now(timezone.utc).isoformat(),
        metrics=[
            Metric(label="Monthly revenue", value="₹8.4L", trend="+18%"),
            Metric(label="Open invoices", value="37", trend="-9%"),
            Metric(label="Inventory alerts", value="12", trend="+3"),
        ],
        activity=[
            Activity(
                title="Invoice INV-2048 generated",
                detail="Sent to Aster Retail with GST details attached.",
                time="Today, 10:45 AM",
            ),
            Activity(
                title="Payment reminder queued",
                detail="Follow-up scheduled for 6 overdue invoices.",
                time="Today, 9:20 AM",
            ),
            Activity(
                title="Low-stock items synced",
                detail="Updated reorder list for Delhi warehouse.",
                time="Yesterday, 5:10 PM",
            ),
        ],
    )


@app.post("/api/contact")
def contact(message: ContactMessage):
    return {
        "status": "received",
        "reply": f"Thanks, {message.name}. We received your message.",
    }
