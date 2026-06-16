/**
 * Copy to config.js and fill in before deploy.
 * config.js is gitignored locally — for GitHub Pages, commit a production
 * config with only public URLs (no bot token; token lives on Cloudflare Worker).
 */
window.MANA3_BOOKING = {
  /** Leave empty for free hosting — quotes go to Telegram instead */
  apiBase: '',

  /**
   * Cloudflare Worker URL after deploy (see TELEGRAM.md + DEPLOY.md)
   * e.g. https://mana3-telegram-quote.yourname.workers.dev
   */
  quoteEndpoint: '',

  /** Fallback if Worker not set — bot username without @ */
  telegramBot: '',

  /** Set false when quotes go to Telegram; you arrange on WhatsApp groups later */
  openWhatsAppAfterSubmit: false,

  /** Optional — only used if openWhatsAppAfterSubmit is true */
  whatsapp: '',

  instagram: 'capturesru',
  instagramDj: 'djcobra',

  adminPin: 'mana3',

  supabaseUrl: '',
  supabaseAnonKey: ''
};
