"""API v1 router aggregator"""
from fastapi import APIRouter
from app.api.v1 import auth, categories, public, events, admin, users, tenants

# Create API v1 router
api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(events.router, prefix="/events", tags=["Events (User)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(categories.router, prefix="/admin/categories", tags=["Categories (Admin)"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants (Multi-Tenancy)"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(public.router, prefix="/public", tags=["Public"])
