#!/usr/bin/env python3
"""
Initialize default tenants (Verbände) for the multi-tenancy structure.

This script creates:
- 1 Bundesverband (federal level)
- 16 Landesverbände (state associations)

Run after database migration:
    python scripts/init_tenants.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.tenant import Tenant, TenantLevel

# German state associations (Landesverbände)
# name: Kurzform "JuLis {Verband}" (oder "JuLia" für Sachsen)
# full_name: Langform "Junge Liberale {Verband}"
LANDESVERBAENDE = [
    {"name": "JuLis Baden-Württemberg", "full_name": "Junge Liberale Baden-Württemberg", "slug": "baden-wuerttemberg", "short": "BW"},
    {"name": "JuLis Bayern", "full_name": "Junge Liberale Bayern", "slug": "bayern", "short": "BY"},
    {"name": "JuLis Berlin", "full_name": "Junge Liberale Berlin", "slug": "berlin", "short": "BE"},
    {"name": "JuLis Brandenburg", "full_name": "Junge Liberale Brandenburg", "slug": "brandenburg", "short": "BB"},
    {"name": "JuLis Bremen", "full_name": "Junge Liberale Bremen", "slug": "bremen", "short": "HB"},
    {"name": "JuLis Hamburg", "full_name": "Junge Liberale Hamburg", "slug": "hamburg", "short": "HH"},
    {"name": "JuLis Hessen", "full_name": "Junge Liberale Hessen", "slug": "hessen", "short": "HE"},
    {"name": "JuLis Mecklenburg-Vorpommern", "full_name": "Junge Liberale Mecklenburg-Vorpommern", "slug": "mecklenburg-vorpommern", "short": "MV"},
    {"name": "JuLis Niedersachsen", "full_name": "Junge Liberale Niedersachsen", "slug": "niedersachsen", "short": "NI"},
    {"name": "JuLis Nordrhein-Westfalen", "full_name": "Junge Liberale Nordrhein-Westfalen", "slug": "nordrhein-westfalen", "short": "NW"},
    {"name": "JuLis Rheinland-Pfalz", "full_name": "Junge Liberale Rheinland-Pfalz", "slug": "rheinland-pfalz", "short": "RP"},
    {"name": "JuLis Saarland", "full_name": "Junge Liberale Saarland", "slug": "saarland", "short": "SL"},
    {"name": "JuLia Sachsen", "full_name": "Junge Liberale Sachsen", "slug": "sachsen", "short": "SN"},
    {"name": "JuLis Sachsen-Anhalt", "full_name": "Junge Liberale Sachsen-Anhalt", "slug": "sachsen-anhalt", "short": "ST"},
    {"name": "JuLis Schleswig-Holstein", "full_name": "Junge Liberale Schleswig-Holstein", "slug": "schleswig-holstein", "short": "SH"},
    {"name": "JuLis Thüringen", "full_name": "Junge Liberale Thüringen", "slug": "thueringen", "short": "TH"},
]


def init_tenants():
    """Initialize default tenants in the database."""
    db: Session = SessionLocal()
    
    try:
        # Check if Bundesverband already exists
        bundesverband = db.query(Tenant).filter(
            Tenant.level == TenantLevel.BUNDESVERBAND.value
        ).first()
        
        if bundesverband:
            print("✓ Bundesverband already exists (ID: {})".format(bundesverband.id))
        else:
            # Create Bundesverband
            bundesverband = Tenant(
                name="JuLis Bundesverband",
                slug="bundesverband",
                description="Junge Liberale Bundesverband - Aggregierte Ansicht aller Landesverbände",
                level=TenantLevel.BUNDESVERBAND.value,
                parent_id=None,
                is_active=True,
                primary_color="#FFCC00"  # FDP Yellow
            )
            db.add(bundesverband)
            db.commit()
            db.refresh(bundesverband)
            print("✓ Created Bundesverband (ID: {})".format(bundesverband.id))
        
        # Create Landesverbände
        created_count = 0
        existing_count = 0
        
        for lv_data in LANDESVERBAENDE:
            existing = db.query(Tenant).filter(Tenant.slug == lv_data["slug"]).first()
            
            if existing:
                existing_count += 1
                continue
            
            # Use full_name for description (Langform)
            landesverband = Tenant(
                name=lv_data["name"],  # Kurzform: JuLis {Verband}
                slug=lv_data["slug"],
                description=lv_data["full_name"],  # Langform: Junge Liberale {Verband}
                level=TenantLevel.LANDESVERBAND.value,
                parent_id=bundesverband.id,
                is_active=True,
                primary_color="#FFCC00"  # Default to FDP Yellow
            )
            db.add(landesverband)
            created_count += 1
        
        db.commit()
        
        print(f"✓ Created {created_count} Landesverbände")
        if existing_count > 0:
            print(f"  ({existing_count} already existed)")
        
        # Summary
        total = db.query(Tenant).count()
        print(f"\n📊 Total tenants in database: {total}")
        print("   - 1 Bundesverband")
        print(f"   - {total - 1} Landesverbände")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


def list_tenants():
    """List all tenants in the database."""
    db: Session = SessionLocal()
    
    try:
        tenants = db.query(Tenant).order_by(Tenant.level, Tenant.name).all()
        
        if not tenants:
            print("No tenants found. Run 'init_tenants()' first.")
            return
        
        print("\n📋 Tenants in database:\n")
        
        current_level = None
        for tenant in tenants:
            if tenant.level != current_level:
                current_level = tenant.level
                print(f"\n{current_level.upper()}:")
                print("-" * 40)
            
            status = "✓" if tenant.is_active else "✗"
            print(f"  {status} {tenant.name} (slug: {tenant.slug}, id: {tenant.id})")
    
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize or list tenants")
    parser.add_argument("--list", action="store_true", help="List existing tenants")
    args = parser.parse_args()
    
    if args.list:
        list_tenants()
    else:
        init_tenants()
        print("\n" + "=" * 50)
        list_tenants()
