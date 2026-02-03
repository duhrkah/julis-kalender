"""E-Mail-Versand für Event-Benachrichtigungen (Microsoft 365 / SMTP)"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import date, time

from app.config import settings
from app.models.event import Event

logger = logging.getLogger(__name__)


def _get_recipient_email(event: Event) -> Optional[str]:
    """E-Mail-Adresse des Einreichers ermitteln."""
    if event.submitter_email:
        return event.submitter_email
    if event.submitter and event.submitter.email:
        return event.submitter.email
    return None


def _format_datetime(start_date: date, start_time: Optional[time], end_date: Optional[date], end_time: Optional[time]) -> str:
    """Datum und Zeit für E-Mail-Text formatieren."""
    parts = [start_date.strftime("%d.%m.%Y")]
    if start_time:
        parts.append(start_time.strftime("%H:%M"))
    if end_date and end_date != start_date:
        parts.append("–")
        parts.append(end_date.strftime("%d.%m.%Y"))
    if end_time:
        parts.append(end_time.strftime("%H:%M"))
    return " ".join(parts)


def send_event_approved(event: Event) -> bool:
    """
    Benachrichtigung senden, wenn ein Event genehmigt wurde.

    Args:
        event: Das genehmigte Event (mit geladenem submitter und category)

    Returns:
        True wenn E-Mail erfolgreich gesendet, sonst False
    """
    if not settings.email_configured:
        logger.debug("E-Mail deaktiviert oder nicht konfiguriert, überspringe Benachrichtigung")
        return False

    recipient = _get_recipient_email(event)
    if not recipient:
        logger.warning("Keine E-Mail-Adresse für Event %s (Submitter %s)", event.id, event.submitter_id)
        return False

    subject = f'JuLis Kalender: „{event.title}" wurde genehmigt'
    date_str = _format_datetime(
        event.start_date, event.start_time, event.end_date, event.end_time
    )
    category_name = event.category.name if event.category else "–"

    body_plain = f"""Hallo{(" " + event.submitter_name) if event.submitter_name else ""},

Ihr Event „{event.title}" wurde genehmigt und erscheint nun im JuLis Kalender.

Details:
• Datum/Zeit: {date_str}
• Ort: {event.location or "–"}
• Kategorie: {category_name}

Kalender ansehen: {settings.APP_URL}

Viele Grüße,
{settings.SMTP_FROM_NAME}
"""

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5;">
<p>Hallo{(" " + event.submitter_name) if event.submitter_name else ""},</p>
<p>Ihr Event <strong>„{event.title}"</strong> wurde genehmigt und erscheint nun im JuLis Kalender.</p>
<p><strong>Details:</strong></p>
<ul>
<li>Datum/Zeit: {date_str}</li>
<li>Ort: {event.location or "–"}</li>
<li>Kategorie: {category_name}</li>
</ul>
<p><a href="{settings.APP_URL}">Kalender ansehen</a></p>
<p>Viele Grüße,<br>{settings.SMTP_FROM_NAME}</p>
</body>
</html>
"""

    return _send_email(recipient, subject, body_plain, body_html)


def send_event_rejected(event: Event, rejection_reason: str) -> bool:
    """
    Benachrichtigung senden, wenn ein Event abgelehnt wurde.

    Args:
        event: Das abgelehnte Event (mit geladenem submitter und category)
        rejection_reason: Begründung der Ablehnung

    Returns:
        True wenn E-Mail erfolgreich gesendet, sonst False
    """
    if not settings.email_configured:
        logger.debug("E-Mail deaktiviert oder nicht konfiguriert, überspringe Benachrichtigung")
        return False

    recipient = _get_recipient_email(event)
    if not recipient:
        logger.warning("Keine E-Mail-Adresse für Event %s (Submitter %s)", event.id, event.submitter_id)
        return False

    subject = f'JuLis Kalender: „{event.title}" wurde abgelehnt'
    date_str = _format_datetime(
        event.start_date, event.start_time, event.end_date, event.end_time
    )

    body_plain = f"""Hallo{(" " + event.submitter_name) if event.submitter_name else ""},

Ihr Event „{event.title}" wurde leider abgelehnt.

Begründung: {rejection_reason}

Details des eingereichten Events:
• Datum/Zeit: {date_str}
• Ort: {event.location or "–"}

Bei Fragen wenden Sie sich bitte an die Kalender-Verwaltung.

Viele Grüße,
{settings.SMTP_FROM_NAME}
"""

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5;">
<p>Hallo{(" " + event.submitter_name) if event.submitter_name else ""},</p>
<p>Ihr Event <strong>„{event.title}"</strong> wurde leider abgelehnt.</p>
<p><strong>Begründung:</strong> {rejection_reason}</p>
<p><strong>Details des eingereichten Events:</strong></p>
<ul>
<li>Datum/Zeit: {date_str}</li>
<li>Ort: {event.location or "–"}</li>
</ul>
<p>Bei Fragen wenden Sie sich bitte an die Kalender-Verwaltung.</p>
<p>Viele Grüße,<br>{settings.SMTP_FROM_NAME}</p>
</body>
</html>
"""

    return _send_email(recipient, subject, body_plain, body_html)


def _send_email(
    to_email: str,
    subject: str,
    body_plain: str,
    body_html: Optional[str] = None
) -> bool:
    """
    E-Mail über SMTP (Microsoft 365 / Office 365) senden.

    Args:
        to_email: Empfängeradresse
        subject: Betreff
        body_plain: Text-Inhalt
        body_html: Optionaler HTML-Inhalt

    Returns:
        True bei Erfolg, False bei Fehler
    """
    if not settings.email_configured:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    msg.attach(MIMEText(body_plain, "plain", "utf-8"))
    if body_html:
        msg.attach(MIMEText(body_html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        logger.info("E-Mail an %s gesendet: %s", to_email, subject)
        return True
    except Exception as e:
        logger.exception("E-Mail-Versand fehlgeschlagen an %s: %s", to_email, e)
        return False
