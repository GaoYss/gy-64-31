from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import appointments, customers, dashboard, inspections, procurement, projects


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Decoration company project management API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(appointments.router)
app.include_router(projects.router)
app.include_router(procurement.router)
app.include_router(inspections.router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict:
    return {
        "status": "ok",
        "component": settings.app_component,
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "self": "ok",
        },
    }
