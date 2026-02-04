# Kalender Event Management System

Eine vollständige Event-Management-Web-App mit Admin-Dashboard, Benutzer-Event-Einreichung mit Freigabe-Workflow und einbettbarem Kalender.

## Features

- ✅ **Admin-Dashboard**: Verwaltung und Genehmigung von Events
- ✅ **Benutzer-Event-Einreichung**: Benutzer können Events zur Genehmigung einreichen
- ✅ **Freigabe-Workflow**: Events werden erst nach Admin-Freigabe öffentlich
- ✅ **E-Mail-Benachrichtigungen**: Automatische Benachrichtigung bei Genehmigung/Ablehnung (Microsoft 365)
- ✅ **Kalender-Ansicht**: Monatliche Kalenderansicht mit FullCalendar
- ✅ **iframe-Embedding**: Kalender kann auf externen Websites eingebettet werden
- ✅ **iCal-Export**: Events als iCal-Datei exportieren
- ✅ **Kategorie-System**: Frei definierbare Event-Kategorien durch Admins
- ✅ **Audit-Logging**: Protokollierung aller Admin-Aktionen
- ✅ **Rollen-System**: Admin (voll), Editor (ohne Benutzerverwaltung), Benutzer
- ✅ **Mandantenfähigkeit**: Multi-Tenancy für Verbandsstruktur (Bundesverband → Landesverband → Bezirksverband)

## Technologie-Stack

### Backend
- **Framework**: FastAPI (Python)
- **Datenbank**: SQLite mit SQLAlchemy ORM
- **Migrationen**: Alembic
- **Authentifizierung**: JWT (JSON Web Tokens)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Kalender**: FullCalendar React

### Infrastruktur
- **Container**: Docker + Docker Compose
- **Entwicklung**: Hot-Reload für Backend und Frontend

## Voraussetzungen

- Docker und Docker Compose
- Git

*Hinweis: Node.js wird nur für lokale Entwicklung ohne Docker benötigt.*

## Installation & Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd kalender
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# Bearbeite .env und setze sichere Werte für Produktion
```

**Wichtig**: Ändere den `JWT_SECRET_KEY` für Produktion!

### 3. Entwicklungsumgebung starten

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Die Anwendung ist nun erreichbar unter:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Dokumentation**: http://localhost:8000/api/docs

### 4. Produktionsumgebung starten (mit Nginx + HTTPS)

```bash
# Produktion (kalender.jlssrv.de)
docker compose up --build -d

# Test (kalender-test.jlssrv.de)
docker compose -f docker-compose.test.yml up --build -d
```

Die Produktions-`docker-compose.yml` enthält:
- **Nginx** als Reverse Proxy (Port 80, 443)
- **Let's Encrypt** (Certbot) für HTTPS-Zertifikate
- Backend und Frontend sind nur intern erreichbar

**Hinweis**: `docker-compose.dev.yml` hat kein Nginx – für lokale Entwicklung.

## Projekt-Struktur

```
kalender/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── models/       # SQLAlchemy Modelle
│   │   ├── schemas/      # Pydantic Schemas
│   │   ├── api/          # API Endpunkte
│   │   ├── core/         # Security & Permissions
│   │   ├── services/     # Business Logic
│   │   └── main.py       # FastAPI App
│   ├── alembic/          # Datenbank-Migrationen
│   └── scripts/          # Utility-Skripte
│
├── frontend/             # Next.js Frontend
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React Components
│   │   ├── lib/          # Utilities & API Clients
│   │   └── types/        # TypeScript Types
│   └── public/           # Statische Dateien
│
└── docker-compose.yml    # Docker Orchestrierung
```

## Datenbank-Setup

Die Datenbank wird automatisch beim ersten Start erstellt. Um Migrationen manuell auszuführen:

```bash
# In den Backend-Container
docker-compose exec backend bash

# Migrationen ausführen
alembic upgrade head
```

## Ersten Admin-Benutzer erstellen

Nach dem ersten Start:

```bash
docker-compose exec backend python scripts/create_admin.py
```

Folge den Anweisungen, um den ersten Admin-Account zu erstellen.

## Mandantenfähigkeit (Multi-Tenancy)

Das System unterstützt eine hierarchische Verbandsstruktur:

```
Bundesverband (sieht alle Events aggregiert)
├── Landesverband Bayern (eigene Instanz)
│   ├── Bezirksverband Oberbayern
│   └── Bezirksverband Schwaben
├── Landesverband Berlin (eigene Instanz)
└── ... (16 Landesverbände)
```

### Verbände initialisieren

Nach der Datenbank-Migration:

```bash
docker-compose exec backend python scripts/init_tenants.py
```

Dies erstellt:
- 1 Bundesverband
- 16 Landesverbände (alle deutschen Bundesländer)

### Verband-Filter in URLs

Der Kalender kann für einen bestimmten Verband gefiltert werden:

```html
<!-- Kalender nur für Bayern -->
<iframe 
  src="https://kalender.example.com/embed/calendar?tenant=bayern" 
  width="100%" 
  height="600"
></iframe>

<!-- Oder per tenant_id -->
<iframe 
  src="https://kalender.example.com/embed/calendar?tenant_id=2" 
  width="100%" 
  height="600"
></iframe>
```

### API mit Tenant-Kontext

Für API-Aufrufe kann der Tenant-Kontext über Header oder Query-Parameter gesetzt werden:

```bash
# Über Header
curl -H "X-Tenant-Slug: bayern" https://kalender.example.com/api/v1/public/events

# Über Query-Parameter
curl "https://kalender.example.com/api/v1/public/events?tenant_id=2"
```

### Sichtbarkeitsregeln

| Rolle | Sichtbarkeit |
|-------|--------------|
| Bundesverband-Admin | Alle Events aus allen Verbänden |
| Landesverband-Admin | Eigene Events + Bezirksverbände |
| Bezirksverband-Admin | Nur eigene Events |
| Öffentlich (ohne Filter) | Alle genehmigten Events |
| Öffentlich (mit Filter) | Genehmigte Events des Verbands |

### Admin-Verwaltung

Unter `/admin/tenants` (nur für Bundesverband-Admins) können Verbände verwaltet werden:
- Neue Verbände anlegen
- Hierarchie definieren
- Primärfarbe und Logo setzen
- Verbände aktivieren/deaktivieren

## API-Dokumentation

Die interaktive API-Dokumentation ist im Entwicklungsmodus verfügbar unter:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## iframe-Embedding

Um den Kalender auf einer externen Website einzubetten:

```html
<!-- Kalender-Ansicht -->
<iframe
  src="http://localhost:3000/embed/calendar"
  width="100%"
  height="800"
  frameborder="0"
></iframe>

<!-- Listen-Ansicht -->
<iframe
  src="http://localhost:3000/embed/list"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

Siehe [public/embed-example.html](frontend/public/embed-example.html) für ein vollständiges Beispiel.

## CI/CD

### Tests (ci.yml)

Bei Push/PR auf `main` oder `develop` läuft eine GitHub-Actions-Pipeline:

- **Backend**: `pytest` (in `backend/`)
- **Frontend**: `npm run lint`, `npm run build`, `npm test` (in `frontend/`)

Workflow-Datei: [.github/workflows/ci.yml](.github/workflows/ci.yml).

### Deploy (deploy.yml)

- **Push auf main** (oder manuell) → Deploy von **Proxy + Produktion + Test** auf einem Server.
- Beide Domains sind danach erreichbar: https://kalender.jlssrv.de und https://kalender-test.jlssrv.de.

**Benötigte GitHub Secrets:**

| Secret | Beschreibung |
|--------|--------------|
| `SSH_HOST` | Hostname/IP des Servers |
| `SSH_USER` | SSH-Benutzer für Deploy |
| `SSH_PRIVATE_KEY` | Privater SSH-Key |
| `DEPLOY_PATH` | Pfad auf dem Server (z.B. `~/kalender`) |
| `CERTBOT_EMAIL` | E-Mail für Let's Encrypt (optional) |

**Wichtig – auf dem Server einmalig:**

- **Docker Compose V2** (erforderlich). Manuelle Installation, falls `apt install docker-compose-plugin` nicht verfügbar: `sudo mkdir -p /usr/local/lib/docker/cli-plugins && sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose` (bei ARM: `docker-compose-linux-aarch64`)
- Der SSH-Benutzer (`SSH_USER`) muss Docker nutzen dürfen, sonst scheitert der Deploy mit `Permission denied`:

```bash
# Auf dem Server als root bzw. mit sudo:
sudo usermod -aG docker DEIN_SSH_USER
# Danach: einmal ausloggen/einloggen oder Session neu aufbauen, damit die Gruppe aktiv wird
```

**Vor dem ersten Deploy auf dem Server:**

```bash
# Repo-Verzeichnis anlegen (wird vom Workflow per rsync befüllt)
mkdir -p ~/kalender
# Docker-Gruppe für SSH_USER siehe oben
```

### Zertifikat-Erneuerung (certbot-renew.yml)

Täglicher Cron (3:00 UTC) erneuert Let's Encrypt-Zertifikate. Nutzt dieselben Secrets wie der Deploy.

## Entwicklung

### Backend-Entwicklung

```bash
# In den Backend-Container
docker-compose -f docker-compose.dev.yml exec backend bash

# Tests ausführen
pytest

# Neue Migration erstellen
alembic revision --autogenerate -m "Beschreibung"
```

### Frontend-Entwicklung

```bash
# In den Frontend-Container
docker-compose -f docker-compose.dev.yml exec frontend sh

# Dependencies installieren
npm install

# Linting
npm run lint
```

## Deployment

Für Produktion:

1. Setze sichere Umgebungsvariablen in `.env`
2. Verwende `docker-compose.yml` (ohne `.dev`)
3. Konfiguriere einen Reverse Proxy (nginx) für HTTPS
4. Richte regelmäßige Backups der SQLite-Datenbank ein

## Troubleshooting

### Port bereits in Verwendung

Falls Port 3000 oder 8000 bereits verwendet wird:

```bash
# Ports in docker-compose.yml ändern, z.B.:
ports:
  - "3001:3000"  # Frontend
  - "8001:8000"  # Backend
```

### Datenbank-Probleme

```bash
# Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
rm -rf data/
docker-compose down -v
docker-compose up --build
```

## Verwendung

### Admin-Funktionen

Nach dem Login als Admin haben Sie Zugriff auf:

1. **Event-Verwaltung** (`/admin/events`)
   - Alle eingereichten Events anzeigen
   - Events nach Status filtern (Ausstehend/Genehmigt/Abgelehnt)
   - Events genehmigen oder mit Begründung ablehnen
   - Events bearbeiten oder löschen
   - Toast-Benachrichtigungen für alle Aktionen

2. **Kategorie-Verwaltung** (`/admin/categories`)
   - Neue Kategorien mit Farbe erstellen
   - Kategorien bearbeiten (Name, Farbe, Beschreibung)
   - Kategorien löschen
   - Kategorien aktivieren/deaktivieren

3. **Benutzer-Verwaltung** (`/admin/users`, nur für Admins)
   - Neue Benutzer-Accounts erstellen
   - Benutzer aktivieren/deaktivieren
   - Benutzerrollen verwalten (Admin/Editor/Benutzer)
   - Benutzernamen bearbeiten
   - Benutzer löschen

4. **Audit-Logs** (`/admin/audit`)
   - Alle Admin-Aktionen nachverfolgen
   - Nach Benutzer, Aktion und Datum filtern

### Benutzer-Funktionen

1. **Event einreichen** (`/dashboard/events/new`)
   - Formular mit Titel, Beschreibung, Datum/Zeit
   - Kategorie auswählen
   - Ort und Ort-URL (optional)
   - Event wird mit Status "Ausstehend" erstellt

2. **Eigene Events verwalten** (`/dashboard`)
   - Übersicht aller eingereichten Events
   - Status-Anzeige (Ausstehend/Genehmigt/Abgelehnt)
   - Ausstehende Events bearbeiten
   - Events löschen

### Öffentlicher Kalender

- Monatliche Kalenderansicht mit FullCalendar
- Nach Kategorien filtern
- Event-Details per Click anzeigen
- iCal-Export für Kalender-Apps

## iCal-Export & Kalender-Abonnement

### Download

Direkt als .ics-Datei herunterladen:
```
http://localhost:8000/api/v1/public/ical
```

Mit Filter nach Kategorie:
```
http://localhost:8000/api/v1/public/ical?category_id=1
```

### Kalender-Abonnement

In Google Calendar, Apple Calendar oder anderen Kalender-Apps:
```
webcal://localhost:8000/api/v1/public/ical
```

Ersetzen Sie `localhost:8000` mit Ihrer Produktions-URL.

## Sicherheit

### Wichtige Sicherheitshinweise

1. **JWT Secret**: Ändern Sie `JWT_SECRET_KEY` in `.env` zu einem sicheren, zufälligen Wert (mindestens 32 Zeichen)
2. **Passwort-Anforderungen**: Mindestens 8 Zeichen
3. **Passwort-Hashing**: bcrypt über passlib
4. **CORS**: Nur vertrauenswürdige Origins in `CORS_ORIGINS` eintragen
5. **SQL Injection**: Geschützt durch SQLAlchemy ORM
6. **Input Validation**: Pydantic Schemas validieren alle Eingaben

### Produktions-Checkliste

- [ ] `JWT_SECRET_KEY` mit starkem, zufälligem Wert ersetzt
- [ ] `CORS_ORIGINS` auf Produktions-URLs beschränkt
- [ ] HTTPS konfiguriert (z.B. mit Let's Encrypt)
- [ ] Regelmäßige Backups der SQLite-Datenbank eingerichtet
- [ ] Starke Admin-Passwörter vergeben
- [ ] Logging und Monitoring aktiv (optional: Sentry für Error-Tracking)
- [x] Rate Limiting für Login-Endpoint (10/Minute, slowapi)

## Backup & Wiederherstellung

### Datenbank sichern

```bash
# Backup erstellen
docker-compose exec backend cp /app/data/calendar.db /app/data/backup-$(date +%Y%m%d).db

# Auf Host-System kopieren
docker cp $(docker-compose ps -q backend):/app/data/calendar.db ./calendar-backup.db
```

### Datenbank wiederherstellen

```bash
# Backup zurückspielen
docker cp ./calendar-backup.db $(docker-compose ps -q backend):/app/data/calendar.db

# Backend neu starten
docker-compose restart backend
```

## API-Endpunkte

### Öffentlich (keine Auth)

- `GET /api/v1/public/events` - Genehmigte Events (mit optionalem `tenant_id` oder `X-Tenant-Slug` Header)
- `GET /api/v1/public/categories` - Aktive Kategorien
- `GET /api/v1/public/tenants` - Liste aller Verbände
- `GET /api/v1/public/ical` - iCal-Export

### Authentifizierung

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Aktueller Benutzer

### Benutzer (Auth erforderlich)

- `GET /api/v1/events` - Eigene Events
- `GET /api/v1/events/stats` - Eigene Event-Statistik (Dashboard)
- `POST /api/v1/events` - Event einreichen
- `PUT /api/v1/events/{id}` - Event bearbeiten
- `DELETE /api/v1/events/{id}` - Event löschen

### Admin (Admin- und Editor-Rolle)

- `GET /api/v1/admin/stats` - Dashboard-Statistiken (mit optionalem `tenant_id` Filter)
- `GET /api/v1/admin/events` - Alle Events (mit Tenant-Filterung basierend auf Benutzerrolle)
- `PUT /api/v1/admin/events/{id}/approve` - Genehmigen
- `PUT /api/v1/admin/events/{id}/reject` - Ablehnen
- `GET /api/v1/admin/users` - Benutzer verwalten (nur Admin)
- `GET /api/v1/admin/categories` - Kategorien verwalten
- `GET /api/v1/admin/audit-logs` - Audit-Logs

### Tenant-Verwaltung (nur Admin)

- `GET /api/v1/tenants` - Alle Verbände
- `GET /api/v1/tenants/{id}` - Verband-Details
- `POST /api/v1/tenants` - Neuen Verband anlegen
- `PUT /api/v1/tenants/{id}` - Verband bearbeiten
- `DELETE /api/v1/tenants/{id}` - Verband löschen
- `GET /api/v1/tenants/{id}/stats` - Statistiken für Verband
- `GET /api/v1/tenants/{id}/aggregated-stats` - Aggregierte Statistiken (Verband + Kinder)

Vollständige API-Dokumentation: http://localhost:8000/docs

## Erweiterte Konfiguration

### PostgreSQL statt SQLite

Für Produktionsumgebungen mit höherem Datenaufkommen:

1. PostgreSQL-Service in `docker-compose.yml` hinzufügen
2. `DATABASE_URL` ändern: `postgresql://user:pass@postgres:5432/calendar`
3. `psycopg2-binary` zu `requirements.txt` hinzufügen
4. Migrationen ausführen

### E-Mail-Benachrichtigungen (Microsoft 365 Business)

Bei Genehmigung oder Ablehnung eines Events wird der Einreicher automatisch per E-Mail benachrichtigt. Unterstützt wird Microsoft 365 Business (Office 365) mit App-Passwort.

**Einrichtung:**

1. **App-Passwort erstellen** (Microsoft-Konto mit 2FA):
   - https://account.microsoft.com/security → „Sicherheitsoptionen“ → „App-Kennwörter“
   - Neues App-Kennwort erstellen und notieren

2. **Umgebungsvariablen in `.env` setzen:**

   ```env
   SMTP_ENABLED=true
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=kalender@ihre-domain.de
   SMTP_PASSWORD=ihr-app-passwort
   SMTP_FROM_EMAIL=kalender@ihre-domain.de
   SMTP_FROM_NAME=JuLis Kalender
   APP_URL=https://kalender.jlssrv.de
   ```

3. **Hinweise:**
   - Ohne `SMTP_ENABLED=true` und gültige Zugangsdaten werden keine E-Mails versendet
   - Die E-Mail-Adresse des Einreichers stammt aus `submitter_email` oder dem Benutzerkonto

### Optional: Sentry für Error-Tracking

Für Produktion kann Sentry (oder ein anderes Error-Tracking-Tool) integriert werden:
- Backend: `sentry-sdk[fastapi]` installieren und in `main.py` vor dem App-Start initialisieren
- Frontend: `@sentry/nextjs` für Next.js einbinden
- DSN über Umgebungsvariable setzen (z. B. `SENTRY_DSN`)

## Lizenz

[Lizenz hier einfügen]

## Credits

Entwickelt mit:
- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [FullCalendar](https://fullcalendar.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Kontakt

[Kontaktinformationen hier einfügen]
