# Launch mana3events.com

Your domain: **mana3events.com**  
Hosting: **GitHub Pages** (free) + **Cloudflare Worker** for Telegram quotes (free)

---

## Part A — Push site to GitHub (run in Terminal)

Open **Terminal** and run these commands one block at a time:

```bash
cd "/Users/balachikkala/Mana3 Website"

git init
git add .
git commit -m "Launch Mana3 Events website — mana3events.com"
```

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `mana3-website` (or any name you like)
3. **Public** repo → Create repository (no README)
4. Replace `YOUR_GITHUB_USERNAME` below and run:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/mana3-website.git
git push -u origin main
```

---

## Part B — Enable GitHub Pages

1. Open your repo on GitHub → **Settings** → **Pages**
2. **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** → folder **/ (root)**
3. **Custom domain** → enter: `mana3events.com` → Save
4. Wait until DNS check passes, then enable **Enforce HTTPS**

The repo already includes a `CNAME` file with `mana3events.com`.

Temporary URL (works before DNS):  
`https://YOUR_GITHUB_USERNAME.github.io/mana3-website/`

---

## Part C — GoDaddy DNS (mana3events.com)

1. Log in to [GoDaddy](https://www.godaddy.com) → **My Products** → **mana3events.com** → **DNS** / **Manage DNS**
2. **Delete** old parking A records for `@` if they point to GoDaddy parking IPs
3. **Add** these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `185.199.108.153` | 600 (or default) |
| **A** | `@` | `185.199.109.153` | 600 |
| **A** | `@` | `185.199.110.153` | 600 |
| **A** | `@` | `185.199.111.153` | 600 |
| **CNAME** | `www` | `YOUR_GITHUB_USERNAME.github.io` | 600 |

4. Save. DNS can take **15 minutes to 48 hours** (often under 1 hour).

**Optional:** In GoDaddy, set **www** to forward to `https://mana3events.com` if you prefer one canonical URL.

---

## Part D — Telegram quotes (free)

Follow **[TELEGRAM.md](TELEGRAM.md)** then update `booking/js/config.js`:

```js
quoteEndpoint: 'https://YOUR-WORKER.workers.dev',
apiBase: '',
openWhatsAppAfterSubmit: false,
```

Change `adminPin` from the default, then:

```bash
git add booking/js/config.js
git commit -m "Production booking config"
git push
```

---

## Part E — Verify live site

After DNS + HTTPS are green in GitHub Pages:

| Page | URL |
|------|-----|
| Home | https://mana3events.com/ |
| CapturesRU | https://mana3events.com/capturesru/ |
| Wedding samples | https://mana3events.com/capturesru/weddings.html |
| DJ Cobra | https://mana3events.com/dj-cobra/ |
| Book & quote | https://mana3events.com/booking/?service=photo |

Test an image loads:  
https://mana3events.com/capturesru/images/weddings/hero-couple-sunset.jpg

---

## Go-live checklist

- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled (branch `main`, root `/`)
- [ ] Custom domain `mana3events.com` in Pages settings
- [ ] GoDaddy A + CNAME records added
- [ ] HTTPS enforced (green check in GitHub)
- [ ] Telegram Worker deployed + test quote received
- [ ] `adminPin` changed in `config.js`

---

## Need help?

If GitHub shows “DNS check unsuccessful”, wait 30–60 minutes and confirm all four **A** records exist for `@`.

If the site works on `github.io` but not on `mana3events.com`, the issue is almost always GoDaddy DNS — not the website files.
