# 🧪 ViralLab – KI für TikTok-, Reels- & Shorts-Ideen

> Du schreibst: **„Ich habe eine Modemarke und will mehr Verkäufe.“**
> ViralLab liefert: einen kompletten Content-Plan mit Hooks, Skripten, Captions, Hashtags, Kalender und Varianten pro Plattform.

```
Montag     🎬 „3 Fehler, die deine Outfits billig aussehen lassen“
Dienstag   🎬 Produktvideo – Hook: „Ich hätte nie gedacht, dass diese Jacke so gut aussieht …“
Mittwoch   🎬 Storytelling – „Vor einem Jahr wollte ich meine Marke fast aufgeben …“
Donnerstag 🎬 Vorher / Nachher
Freitag    🎬 Tutorial / How-to
…
```

![Content-Plan](docs/plan.png)

## Features

| | |
|---|---|
| 🎣 **Hooks** | 3 Varianten pro Post, die stärkste zuerst |
| 🎬 **Skripte** | Szene für Szene mit Zeitfenster, Bild und Voiceover |
| ✍️ **Captions & Hashtags** | Mit Call-to-Action passend zum Ziel (Verkauf, Leads, Reichweite, Marke) |
| 📅 **Content-Kalender** | 3–7 Posts/Woche, 1–4 Wochen, mit Uhrzeiten, Export als `.ics`, Markdown oder CSV |
| 📱 **Plattform-Varianten** | TikTok, Instagram Reels und YouTube Shorts mit eigener Länge, eigenem Overlay und eigenem CTA |
| 🔬 **Nischen-Lab** | Analysiert erfolgreiche Videos deiner Nische (Hook-Muster, Länge, Engagement, Keywords) und entwickelt daraus **neue, eigene** Konzepte, statt Videos zu kopieren |
| 🧱 **Content-Säulen** | Mix aus Reichweite, Vertrauen, Community und Verkauf |
| 🗂 **Verlauf** | Alle Pläne werden gespeichert und lassen sich wieder öffnen |

![Post-Details](docs/post.png)

## Wie das Nischen-Lab funktioniert

Füge erfolgreiche Videos ein, eins pro Zeile (nur der Hook ist Pflicht):

```
3 Fehler, die dein Outfit billig aussehen lassen | 2,1M | 180k | 3,2k | 12k | 0:24
POV: Du findest endlich die perfekte Jeans       | 850k | 92k  | 800  | 4k  | 15
```

`Hook | Views | Likes | Kommentare | Shares | Dauer`, Zahlen wie `1,2M`, `45k` oder `120.000` werden erkannt.

ViralLab
1. ordnet jeden Hook Mustern zu (Fehler-Hook, Zahlen-Liste, POV, Frage, Geheimnis, Vorher/Nachher, Storytelling, Überraschung, Kontroverse, How-to),
2. gewichtet die Muster nach Views und Engagement (`Likes + 2×Kommentare + 3×Shares / Views`),
3. leitet daraus Erkenntnisse ab (Median-Länge, Hook-Länge, Keywords),
4. baut die stärksten Muster in **neue** Konzepte für dein Business ein. Jeder Post zeigt unter „🧬 Inspiriert von“, welche Vorlage dahintersteckt.

## Monetarisierung

| Free | Pro |
|---|---|
| **10 Generierungen** | **9,99 €/Monat**, unbegrenzt |

- Nutzer werden über ein signiertes, anonymes Cookie erkannt, eine Registrierung ist nicht nötig.
- Ist `STRIPE_SECRET_KEY` gesetzt, läuft Pro über ein **Stripe-Checkout-Abo**. Dazu gehören ein Webhook für Abschluss und Kündigung und das Kundenportal.
- Ohne Stripe läuft der **Demo-Modus**: Pro wird 30 Tage lang kostenlos freigeschaltet, so lässt sich der Ablauf lokal testen.

## Schnellstart

```bash
npm install
cp .env.example .env    # optional
npm start               # http://localhost:3000
```

- **Ohne API-Key** erzeugt die eingebaute Offline-Engine Pläne aus 10 handgeschriebenen Viral-Formaten und 7 Branchenprofilen (Mode, Fitness, Food, Beauty, Coaching, Tech, Immobilien).
- **Mit `ANTHROPIC_API_KEY`** schreibt Claude (`claude-opus-5-5`, Structured Outputs) individuelle Pläne. Schlägt der Aufruf fehl, springt automatisch die Offline-Engine ein.

Für Umgebungsvariablen mit Node 20+: `node --env-file=.env server.js`

### Stripe einrichten

1. `STRIPE_SECRET_KEY` setzen. Optional `STRIPE_PRICE_ID` für einen festen 9,99-€-Monatspreis, sonst wird der Preis inline angelegt.
2. Einen Webhook auf `https://<deine-domain>/api/billing/webhook` mit den Events `checkout.session.completed` und `customer.subscription.deleted` anlegen und das Secret als `STRIPE_WEBHOOK_SECRET` setzen.
3. `PUBLIC_URL` auf die öffentliche URL setzen.

## Tests

```bash
npm test
```

Getestet werden Analyzer, Engine, Exporte, das Free-Limit inklusive 402-Paywall, das Pro-Upgrade, die Trennung der Pläne zwischen Nutzern und die Prüfung der Stripe-Webhook-Signatur.

## Architektur

```
server.js            Express-API (Generierung, Analyse, Pläne, Billing)
src/analyzer.js      Nischen-Analyse: Parsing, Hook-Muster, Engagement, Insights
src/engine.js        Offline-Content-Engine (Formate, Kalender, Varianten)
src/industries.js    Branchenprofile & Zielerkennung
src/ai.js            Claude-Integration mit Structured Output + Fallback
src/schema.js        Zod-Schema eines Content-Plans
src/store.js         JSON-Datei-Store (Nutzer, Kontingente, Pläne)
src/billing.js       Stripe Checkout, Portal, Webhook-Verifikation
public/              Frontend (Vanilla JS, ohne Build-Schritt)
```

## API

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/me` | Kontingent & aktive Features |
| `POST` | `/api/analyze` | `{ videos }` → Nischen-Analyse |
| `POST` | `/api/generate` | `{ description, brand?, goal?, tone?, postsPerWeek?, weeks?, nicheVideos?, seed? }` → Plan |
| `GET/DELETE` | `/api/plans[/:id]` | Gespeicherte Pläne |
| `POST` | `/api/billing/checkout` | Pro-Abo starten |
| `POST` | `/api/billing/portal` | Stripe-Kundenportal |
| `POST` | `/api/billing/webhook` | Stripe-Webhook |

## Lizenz

MIT
