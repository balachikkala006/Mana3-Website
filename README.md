# Mana3 Event Management — Preview Sites

Three connected preview sites for **Mana3 Event Management**:

| Site | Path | Brand |
|------|------|--------|
| Hub | `index.html` | Mana3 portal |
| Photography | `capturesru/index.html` | CapturesRU Photography |
| DJ | `dj-cobra/index.html` | DJ Cobra |
| **Book & Quote** | `booking/index.html` | Public scheduling + inquiries |
| **Owner dashboard** | `admin/index.html` | Your bookings & calendar |

## Preview locally

**Terminal 1 — website**

```bash
cd "/Users/balachikkala/Mana3 Website"
python3 -m http.server 8080
```

**Terminal 2 — booking database API** (required for live sync)

```bash
cd "/Users/balachikkala/Mana3 Website"
python3 api/booking_server.py
```

Open:

- [http://localhost:8080](http://localhost:8080) — Mana3 hub
- [http://localhost:8080/booking/](http://localhost:8080/booking/) — Book & quote (audience-facing)
- [http://localhost:8080/admin/](http://localhost:8080/admin/) — Owner dashboard (default PIN: `mana3`)

> **Note:** GSAP and Three.js load from CDNs. DJ photos are in `dj-cobra/images/`. CapturesRU uses Pic-Time + YouTube embeds.

## Booking system

1. **Date database** — SQLite at `data/mana3-bookings.db` (created by the API server)
2. **Client form** — Name, email, phone, WhatsApp, Instagram @, preferred contact, event date, package
3. **WhatsApp** — After submit, opens a pre-filled message to your business number
4. **Instagram** — DM link from config; clients can enter their @handle on the form
5. **Owner sync** — Every submission appears in the admin dashboard; new inquiries put the date on **hold**

### Configure your contacts

Edit `booking/js/config.js`:

```js
window.MANA3_BOOKING = {
  apiBase: 'http://localhost:8787',
  whatsapp: '14695551234',   // your number, country code, no +
  instagram: 'capturesru',
  instagramDj: 'djcobra',
  adminPin: 'mana3',          // change this!
};
```

Copy from `booking/js/config.example.js` if needed.

## Features

- **Premium pricing display** — Gradient quote typography on packages (`shared/css/price-display.css`)
- **3D heroes** — Three.js camera lens (photography) and spinning vinyl (DJ)
- **Scroll animations** — GSAP ScrollTrigger
- **Your packages** — Wedding, event, and DJ tiers from your original HTML files
- **DJ add-on calculator** — Links estimate into the booking form

## Before going live

1. Set WhatsApp number and Instagram handles in `booking/js/config.js`
2. Change `adminPin` in config
3. Follow **[DEPLOY.md](DEPLOY.md)** — free GitHub Pages + Telegram (see **[TELEGRAM.md](TELEGRAM.md)**)
4. Replace placeholder emails if any remain
5. Add favicons and your logo

Original reference files: `wedding_packages_card_royal_saffron_ivory.html`, `DJ_Client_Presentation.html`.
