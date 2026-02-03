#!/usr/bin/env python3
"""Script to create the first admin user"""
import sys
import os
import getpass

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User
from app.core.security import get_password_hash


def create_admin():
    """Create an admin user interactively"""
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        print("\n=== Erstelle Admin-Benutzer ===\n")

        username = input("Benutzername: ").strip()
        if not username:
            print("Fehler: Benutzername darf nicht leer sein")
            return

        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"Fehler: Benutzer '{username}' existiert bereits")
            return

        email = input("E-Mail: ").strip()
        if not email or "@" not in email:
            print("Fehler: Ungültige E-Mail-Adresse")
            return

        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            print(f"Fehler: E-Mail '{email}' ist bereits registriert")
            return

        full_name = input("Vollständiger Name (optional): ").strip() or None

        while True:
            password = getpass.getpass("Passwort (min. 8 Zeichen): ")
            if len(password) < 8:
                print("Fehler: Passwort muss mindestens 8 Zeichen lang sein")
                continue

            password_confirm = getpass.getpass("Passwort bestätigen: ")
            if password != password_confirm:
                print("Fehler: Passwörter stimmen nicht überein")
                continue

            break

        admin_user = User(
            username=username,
            email=email,
            full_name=full_name,
            password_hash=get_password_hash(password),
            role="admin",
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"\n✓ Admin-Benutzer '{username}' erfolgreich erstellt!")
        print(f"  ID: {admin_user.id}")
        print(f"  E-Mail: {admin_user.email}")
        print(f"  Rolle: {admin_user.role}")

    except Exception as e:
        print(f"\nFehler beim Erstellen des Admin-Benutzers: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
