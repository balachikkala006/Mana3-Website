# Telegram quote bot setup

When a client submits the booking form, Mana3 sends a formatted message **directly to your Telegram** (bot or group). You handle WhatsApp groups separately for planning.

## 1. Create the bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow prompts → copy the **bot token** (looks like `123456:ABC-DEF...`)

## 2. Get your chat ID

**Option A — message yourself**

1. Search your new bot → **Start**
2. Send any message (e.g. `hi`)
3. Open in browser (replace `TOKEN`):
   ```
   https://api.telegram.org/botTOKEN/getUpdates
   ```
4. Find `"chat":{"id":123456789` — that number is `TELEGRAM_CHAT_ID`

**Option B — group**

1. Add the bot to your planning group (as admin if private)
2. Send a message in the group
3. Same `getUpdates` URL — use the group’s negative id (e.g. `-1001234567890`)

## 3. Deploy the free Worker

See **[DEPLOY.md](DEPLOY.md)** Step 2. You’ll set:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 4. Wire the website

In `booking/js/config.js`:

```js
quoteEndpoint: 'https://mana3-telegram-quote.YOUR_SUBDOMAIN.workers.dev',
apiBase: '',  // leave empty for free hosting (no paid API)
openWhatsAppAfterSubmit: false,
```

## 5. Test

Submit a test quote on `/booking/` — you should get a Telegram message within seconds.
