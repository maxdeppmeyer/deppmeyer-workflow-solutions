# DeppFlow / Deppmeyer Workflow Solutions

Statische Webseite für Deppmeyer Workflow Solutions unter der Marke DeppFlow. Die Seite läuft auf Cloudflare Pages und nutzt einen Cloudflare Worker für Kontaktformular, Formularschutz, Rate-Limit-Prüfung und den begrenzten KI-/Ablauf-Assistenten.

## Zentrale Daten

Sichtbare Unternehmens- und Kontaktdaten werden in `site-config.js` gepflegt.

Aktueller Stand:

- Domain: https://deppflow.de
- Marke / Suchbegriff: DeppFlow, DeppFlow Hannover
- E-Mail: info@deppflow.de
- Anbieter: Max Deppmeyer / Deppmeyer Workflow Solutions
- Anschrift: Steinbergstraße 16, 30559 Hannover
- Einsatzgebiet: Hannover und deutschlandweit digital

## Wichtige Dateien

- `index.html`: Startseite und wichtigste SEO-Seite für DeppFlow / DeppFlow Hannover
- `leistungen.html`: Leistungen und Ablauf
- `beispiele.html`: Praxisbeispiele und animierte Abläufe
- `einsatzbereiche.html`: Einsatzbereiche für Unternehmen
- `kontakt.html`: Kontaktformular
- `datenschutz.html`: Datenschutzhinweise zu Webseite, Formular, Worker, n8n und KI-Assistent
- `site-config.js`: zentrale Unternehmensdaten und Turnstile Site Key
- `_worker.js`: API-Endpunkte für Kontaktformular und Chat-Assistent
- `_headers`: Sicherheitsheader und Noindex-Regeln
- `sitemap.xml`: indexierbare Seiten für Suchmaschinen
- `robots.txt`: Crawling-Hinweise und Sitemap-Verweis

## Benötigte Cloudflare-Variablen

Der öffentliche Turnstile Site Key liegt in `site-config.js`. Secret Keys und Webhook-URLs dürfen nicht in statische Dateien geschrieben werden.

Typische Worker-Variablen/Bindings:

- `TURNSTILE_SECRET_KEY`: Secret Key für Cloudflare Turnstile
- `OPENAI_API_KEY`: API-Key für den KI-/Ablauf-Assistenten
- `N8N_WEBHOOK_URL`: n8n Webhook für Kontaktanfragen
- `N8N_CONTACT_SECRET`: optionales Secret, das beim Weiterleiten an n8n als `X-Contact-Secret` gesendet wird
- `CONTACT_FORMS`: KV Binding für Kontaktformular-Speicherung und Rate-Limit-Prüfung
- `CONTACT_ALLOWED_ORIGIN` oder `ALLOWED_ORIGIN`: erlaubte Origin für das Kontaktformular
- `CHAT_ALLOWED_ORIGIN` oder `ALLOWED_ORIGIN`: erlaubte Origin für den Chat-Assistenten
- optional `CONTACT_TTL_SECONDS`, `CONTACT_MAX_BODY_BYTES`, `CHAT_MAX_BODY_BYTES`, `CHAT_MODEL`, `CHAT_RATE_LIMIT_MAX_REQUESTS` und `CHAT_RATE_LIMIT_WINDOW_SECONDS`

## Entfernte Altlasten

Ein nicht mehr gewünschtes Praxisbeispiel wurde entfernt. Dazu gehörten der sichtbare HTML-Abschnitt, die zugehörigen Styles, die JavaScript-Showcase-Funktion und die alten Beispielbilder.

## Nach Änderungen prüfen

Vor dem Veröffentlichen sollten diese Punkte geprüft werden:

1. Seite lokal oder über Cloudflare Preview öffnen.
2. Startseite, Leistungen, Beispiele, Einsatzbereiche, Über mich, Kontakt, Impressum und Datenschutz testen.
3. Kontaktformular inklusive Turnstile testen: Name, E-Mail, Beschreibung, Datenschutz; Thema und Telefon bleiben optional.
4. Chat-Assistent testen.
5. `sitemap.xml` öffnen und prüfen.
6. In der Google Search Console die Startseite und Sitemap neu einreichen.
7. Strukturierte Daten mit dem Rich Results Test prüfen.

## SEO-Hinweis

Die Seite nutzt saubere URLs ohne `.html`, Canonical-Tags, Open-Graph-Bild, strukturierte Daten und natürliche Erwähnungen von DeppFlow und Hannover. Eine hohe Google-Position kann dadurch unterstützt, aber nicht garantiert werden. Wichtig sind zusätzlich Indexierung, Google-Unternehmensprofil, lokale Signale, externe Erwähnungen und regelmäßige echte Inhalte.
