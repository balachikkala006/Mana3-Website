# Hosting Mana3 (free)

**Total cost: ~$5/year for your domain only.**

| Piece | Host | Cost |
|-------|------|------|
| Website (DJ Cobra, CapturesRU, booking pages) | **GitHub Pages** | Free |
| Quote → **Telegram bot** | **Cloudflare Worker** | Free |
| Booking calendar (blocked dates) | `data/availability.json` in repo | Free |
| WhatsApp groups | You manage manually after Telegram quote | — |

Paid Python API (`api/booking_server.py`) is **optional** later if you want a live admin dashboard + database.

---

## What happens when someone requests a quote

1. Client fills the form on `/booking/`
2. Message is sent to **your Telegram bot** (instant notification)
3. You reply on Telegram and create **WhatsApp groups** for planning
4. Calendar reads `data/availability.json` — edit that file to block booked dates

Setup details: **[TELEGRAM.md](TELEGRAM.md)**

---

## Step 1 — GitHub repo

```bash
cd "/Users/balachikkala/Mana3 Website"
git init
git add .
git commit -m "Mana3 website — launch"
```

Create a repo on GitHub (public is fine — no secrets in code). Push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mana3-website.git
git branch -M main
git push -u origin main
```

**Production config for GitHub Pages** — create `booking/js/config.js` in the repo with:

```js
window.MANA3_BOOKING = {
  apiBase: '',
  quoteEndpoint: 'https://YOUR-WORKER.workers.dev',
  telegramBot: 'YourBotName',
  openWhatsAppAfterSubmit: false,
  whatsapp: '',
  instagram: 'capturesru',
  instagramDj: 'djcobra',
  adminPin: 'change-me'
};
```

> Bot **token** stays on Cloudflare only — never in GitHub.

---

## Step 2 — Telegram Worker (free)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → sign up (free)
2. **Workers & Pages** → **Create** → **Worker**
3. Paste code from `workers/telegram-quote.js` → **Deploy**
4. **Settings** → **Variables** → add secrets:
   - `TELEGRAM_BOT_TOKEN` — from @BotFather
   - `TELEGRAM_CHAT_ID` — your id or group id (see TELEGRAM.md)
5. Copy worker URL → put in `config.js` as `quoteEndpoint`
6. Commit & push `config.js`

Test: `curl -X POST https://YOUR-WORKER.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"message":"*Test* from Mana3"}'`

---

## Step 3 — GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. **Source:** Deploy from branch `main` → folder **`/ (root)`**
3. Save → site live at `https://YOUR_USERNAME.github.io/mana3-website/`

Links use relative paths, so the hub is:

`https://YOUR_USERNAME.github.io/mana3-website/`

---

## Step 4 — Custom domain (~$5/year)

Buy a domain (Namecheap, **GoDaddy**, Cloudflare Registrar, etc.).

**This project:** `mana3events.com` — see **[LAUNCH.md](LAUNCH.md)** for step-by-step GoDaddy + GitHub setup.

**GitHub Pages custom domain**

1. Repo → **Settings** → **Pages** → **Custom domain** → e.g. `mana3events.com`
2. GitHub shows DNS records — add at your registrar:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` (and `.109`, `.110`, `.111`) |
| CNAME | `www` | `YOUR_USERNAME.github.io` |

3. Enable **Enforce HTTPS** in Pages settings
4. Optional: add `ALLOWED_ORIGIN` secret on Cloudflare Worker = `https://yourdomain.com`

---

## Step 5 — Block dates on the calendar (free)

Edit `data/availability.json` and push:

```json
{
  "availability": [
    { "date": "2026-06-15", "service": "dj", "status": "booked", "note": "Patel wedding" },
    { "date": "2026-07-04", "service": "all", "status": "blocked", "note": "Holiday" }
  ]
}
```

Status: `booked`, `blocked`, or `hold`.

---

## Step 6 — Go-live checklist

- [ ] Telegram test quote received
- [ ] `adminPin` changed (if using admin page locally)
- [ ] Instagram handles correct in `config.js`
- [ ] Domain HTTPS working
- [ ] DJ Cobra + weddings + booking pages load on live URL

---

## Later upgrades (optional)

| Need | Option |
|------|--------|
| Live admin + SQLite | Render free tier or paid disk |
| Auto WhatsApp after submit | Set `openWhatsAppAfterSubmit: true` + `whatsapp` number |
| Supabase | Fill `supabaseUrl` in config |

---

## Quick links after deploy

- Hub: `https://yourdomain.com/`
- DJ: `https://yourdomain.com/dj-cobra/`
- Weddings: `https://yourdomain.com/dj-cobra/weddings.html`
- Book: `https://yourdomain.com/booking/?service=dj`
