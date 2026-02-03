# Embed-Verbesserungen & Nutzungshinweise

Die Embed-Version ist für die Einbettung auf externen Seiten (z.B. julis-sh.de/testseite) optimiert.

## URL-Parameter

### Kalender-Embed (`/embed/calendar`)

| Parameter    | Beschreibung                    | Beispiel                    |
|-------------|----------------------------------|-----------------------------|
| `category_id` | Kategorie vorfiltern (ID)       | `?category_id=3`            |
| `category`  | Kategorie nach Name (lesbar)     | `?category=Landesverband`   |
| `search`    | Suchbegriff                      | `?search=Seminar`           |
| `height`    | Höhe in px oder `auto`           | `?height=600`               |
| `compact`   | Kompakte Darstellung             | `?compact=1`                |
| `view`      | Ansicht: `month` oder `list`     | `?view=list`                |
| `theme`     | Light/Dark-Modus                 | `?theme=dark`               |
| `toolbar`   | `0` = Navigation verbergen       | `?toolbar=0`                |
| `event`     | Deep-Link: Event-Modal öffnen    | `?event=123`                |

**Beispiele:**
```
https://kalender.jlssrv.de/embed/calendar
https://kalender.jlssrv.de/embed/calendar?height=500&compact=1
https://kalender.jlssrv.de/embed/calendar?category_id=2&view=list
```

### Listen-Embed (`/embed/list`)

| Parameter    | Beschreibung        | Beispiel         |
|-------------|---------------------|------------------|
| `category_id` | Kategorie filtern  | `?category_id=3` |
| `category`  | Kategorie nach Name | `?category=Landesverband` |
| `search`    | Suchbegriff         | `?search=Workshop` |
| `compact`   | Kompakte Darstellung | `?compact=1`   |
| `theme`     | Light/Dark-Modus    | `?theme=dark`   |
| `event`     | Deep-Link: Event-Modal öffnen | `?event=123` |

## Empfohlene Einbettung für julis-sh.de

```html
<!-- Standard: 600px Höhe, kompakt -->
<iframe
  src="https://kalender.jlssrv.de/embed/calendar?height=600&compact=1"
  width="100%"
  height="600"
  frameborder="0"
  title="JuLis Events"
></iframe>
```

Für Listenansicht (z.B. Sidebar):
```html
<iframe
  src="https://kalender.jlssrv.de/embed/list?height=400&compact=1"
  width="100%"
  height="400"
  frameborder="0"
  title="JuLis Events"
></iframe>
```

## Weitere URL-Parameter (implementiert)

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `theme` | Light/Dark-Modus | `?theme=dark` |
| `event` | Deep-Link: Event-Modal beim Laden öffnen | `?event=123` |
| `category` | Kategorie nach Name (statt ID) | `?category=Landesverband` |
| `toolbar` | Kalender-Navigation verbergen (nur Kalender-Embed) | `?toolbar=0` |

## postMessage für responsive Höhe

Die Host-Seite kann die Embed-Höhe dynamisch setzen:

```javascript
iframe.contentWindow.postMessage({ type: 'embed-resize', height: 800 }, '*');
```
