"""iCal/ICS export service"""
from typing import List
from datetime import datetime, time as dt_time
from icalendar import Calendar, Event as ICalEvent, vCalAddress, vText
from app.models.event import Event


def generate_ical(events: List[Event]) -> str:
    """
    Generate iCal/ICS format from events

    Args:
        events: List of Event models

    Returns:
        str: iCal formatted string
    """
    cal = Calendar()
    cal.add('prodid', '-//Event Management Calendar//kalender//DE')
    cal.add('version', '2.0')
    cal.add('calscale', 'GREGORIAN')
    cal.add('method', 'PUBLISH')
    cal.add('x-wr-calname', 'Event Kalender')
    cal.add('x-wr-timezone', 'Europe/Berlin')
    cal.add('x-wr-caldesc', 'Genehmigte Events aus dem Event-Management-System')

    for event in events:
        ical_event = ICalEvent()

        ical_event.add('summary', event.title)
        ical_event.add('uid', f'event-{event.id}@kalender.local')

        if event.description:
            ical_event.add('description', event.description)

        if event.location:
            location = event.location
            if event.location_url:
                location += f'\n{event.location_url}'
            ical_event.add('location', vText(location))

        start_datetime = _create_datetime(event.start_date, event.start_time)
        ical_event.add('dtstart', start_datetime)

        if event.end_date:
            end_datetime = _create_datetime(event.end_date, event.end_time)
            ical_event.add('dtend', end_datetime)
        elif event.start_time:
            ical_event.add('dtend', start_datetime)
            ical_event.add('duration', {'hours': 1})

        ical_event.add('dtstamp', datetime.utcnow())
        if event.created_at:
            ical_event.add('created', event.created_at)
        if event.updated_at:
            ical_event.add('last-modified', event.updated_at)

        if event.category:
            ical_event.add('categories', [event.category.name])
            # Add color as X-APPLE-CALENDAR-COLOR (Apple Calendar specific)
            ical_event.add('x-apple-calendar-color', event.category.color)

        ical_event.add('status', 'CONFIRMED')

        if event.submitter_email:
            cn = event.organizer or event.submitter_name or "Unbekannt"
            organizer = vCalAddress(f'mailto:{event.submitter_email}')
            organizer.params['cn'] = vText(cn)
            ical_event.add('organizer', organizer, encode=0)
        elif event.organizer:
            organizer = vCalAddress('mailto:noreply@kalender.local')
            organizer.params['cn'] = vText(event.organizer)
            ical_event.add('organizer', organizer, encode=0)

        cal.add_component(ical_event)

    return cal.to_ical().decode('utf-8')


def _create_datetime(date_obj, time_obj):
    """
    Create datetime from date and optional time

    Args:
        date_obj: date object
        time_obj: time object or None

    Returns:
        datetime or date object
    """
    if time_obj:
        return datetime.combine(date_obj, time_obj)
    else:
        return date_obj
