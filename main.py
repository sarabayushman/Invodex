import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analytics, customers, inventory, invoices, mail, settings


def _origins() -> list[str]:
    configured = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


app = FastAPI(
    title="Invodex API",
    description="GST-compliant sales management API for Indian SMBs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "invodex-api"}


app.include_router(invoices.router)
app.include_router(inventory.router)
app.include_router(customers.router)
app.include_router(mail.router)
app.include_router(analytics.router)
app.include_router(settings.router)
