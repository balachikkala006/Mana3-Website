/**
 * Cloudflare Worker — forwards quote requests to your Telegram bot.
 * Deploy free at workers.cloudflare.com (see DEPLOY.md).
 *
 * Secrets (Worker → Settings → Variables):
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your user or group chat id
 *   ALLOWED_ORIGIN      — optional, e.g. https://yourdomain.com
 */

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  const o = allowed === '*' ? '*' : (origin === allowed ? origin : allowed);
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, origin, env);
    }

    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return json({ error: 'Telegram not configured on server' }, 500, origin, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin, env);
    }

    const text = (body.message || body.text || '').trim();
    if (!text) {
      return json({ error: 'Missing message' }, 400, origin, env);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      const plain = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096),
          disable_web_page_preview: true
        })
      });
      const plainData = await plain.json();
      if (!plain.ok || !plainData.ok) {
        return json({ error: 'Telegram API failed', detail: tgData }, 502, origin, env);
      }
    }

    return json({ ok: true }, 200, origin, env);
  }
};
