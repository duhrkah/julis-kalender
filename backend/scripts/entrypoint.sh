#!/bin/sh
set -e

# Tabellen anlegen (falls DB leer) – create_all ist idempotent
echo "Ensuring database tables exist..."
python -c "
from app.database import Base, engine
from app.models import User, Category, Event, AuditLog
Base.metadata.create_all(bind=engine)
print('Tables OK')
"

# Datenbank-Migrationen ausführen (fügt fehlende Spalten hinzu)
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete."

# Anwendung starten
exec "$@"
