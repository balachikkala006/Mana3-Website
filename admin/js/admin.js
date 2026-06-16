(function () {
  const cfg = window.MANA3_BOOKING || {};
  const loginScreen = document.getElementById('login-screen');
  const dashboard = document.getElementById('dashboard');
  const pinInput = document.getElementById('pin-input');
  const bookingsList = document.getElementById('bookings-list');
  const availList = document.getElementById('availability-list');
  const pendingCount = document.getElementById('pending-count');

  let adminPin = sessionStorage.getItem('mana3_admin_pin') || '';

  function apiBase() {
    return (cfg.apiBase || '').replace(/\/$/, '');
  }

  function headers() {
    return {
      'Content-Type': 'application/json',
      'X-Admin-Pin': adminPin || cfg.adminPin || 'mana3'
    };
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadAll();
  }

  document.getElementById('pin-submit')?.addEventListener('click', () => {
    adminPin = pinInput.value.trim();
    if (adminPin === (cfg.adminPin || 'mana3')) {
      sessionStorage.setItem('mana3_admin_pin', adminPin);
      showDashboard();
    } else {
      alert('Incorrect PIN');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('mana3_admin_pin');
    location.reload();
  });

  document.getElementById('refresh-btn')?.addEventListener('click', loadAll);

  if (sessionStorage.getItem('mana3_admin_pin') === (cfg.adminPin || 'mana3')) {
    showDashboard();
  }

  async function loadBookings() {
    const base = apiBase();
    let bookings = [];

    if (base) {
      try {
        const res = await fetch(`${base}/api/bookings`, { headers: headers() });
        const data = await res.json();
        bookings = data.bookings || [];
      } catch (e) {
        bookingsList.innerHTML = '<p class="empty-state">Start booking API: python3 api/booking_server.py</p>';
        return;
      }
    } else {
      bookings = JSON.parse(localStorage.getItem('mana3_bookings') || '[]');
    }

    const pending = bookings.filter(b => b.status === 'pending').length;
    if (pendingCount) pendingCount.textContent = pending ? `(${pending})` : '';

    if (!bookings.length) {
      bookingsList.innerHTML = '<p class="empty-state">No inquiries yet.</p>';
      return;
    }

    bookingsList.innerHTML = bookings.map(b => renderCard(b)).join('');
    bookingsList.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.status));
    });
  }

  function formatEventDays(b) {
    let days = [];
    try {
      days = typeof b.event_days === 'string' ? JSON.parse(b.event_days) : (b.event_days || []);
    } catch (e) { /* ignore */ }
    if (!days.length) return escape(b.event_date || 'TBD');
    return days
      .filter(d => d.date)
      .map(d => {
        const when = d.time ? `${escape(d.date)} · ${escape(d.time)}` : escape(d.date);
        return `Day ${d.day}: ${when}${d.function ? ' · ' + escape(d.function) : ''}`;
      })
      .join('<br>');
  }

  function renderCard(b) {
    const ig = b.instagram ? `@${b.instagram.replace(/^@/, '')}` : '';
    const wa = b.whatsapp ? b.whatsapp : '';
    const spanNote = b.event_span && b.event_span > 1 ? ` · ${b.event_span} days` : '';
    return `
      <article class="booking-card">
        <header>
          <h3>${escape(b.client_name)}</h3>
          <span class="status-badge status-${b.status}">${b.status}</span>
        </header>
        <div class="booking-meta">
          <div><strong>${escape(b.service)}</strong> · ${escape(b.package_name || '—')}</div>
          <div>📅 ${formatEventDays(b)}${spanNote}</div>
          <div>${escape(b.event_type || '')}</div>
          ${wa ? `<div>WhatsApp: <a href="https://wa.me/${wa.replace(/\D/g, '')}">${escape(wa)}</a></div>` : ''}
          ${ig ? `<div>Instagram: <a href="https://instagram.com/${ig.replace('@','')}" target="_blank">${escape(ig)}</a></div>` : ''}
          ${b.email ? `<div>Email: ${escape(b.email)}</div>` : ''}
          ${b.message ? `<div style="margin-top:8px">${escape(b.message)}</div>` : ''}
          <div style="margin-top:6px;opacity:0.5">${escape(b.created_at || '')}</div>
        </div>
        <div class="card-actions">
          <button type="button" data-id="${b.id}" data-status="contacted">Mark contacted</button>
          <button type="button" data-id="${b.id}" data-status="confirmed">Confirm</button>
          <button type="button" data-id="${b.id}" data-status="declined">Decline</button>
        </div>
      </article>
    `;
  }

  function escape(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function updateStatus(id, status) {
    const base = apiBase();
    if (base) {
      await fetch(`${base}/api/bookings/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status })
      });
    } else {
      const list = JSON.parse(localStorage.getItem('mana3_bookings') || '[]');
      const item = list.find(x => x.id === id);
      if (item) item.status = status;
      localStorage.setItem('mana3_bookings', JSON.stringify(list));
    }
    loadBookings();
  }

  async function loadAvailability() {
    const base = apiBase();
    let rows = [];
    if (base) {
      try {
        const res = await fetch(`${base}/api/availability`);
        const data = await res.json();
        rows = data.availability || [];
      } catch (e) {
        availList.innerHTML = '<li>API offline</li>';
        return;
      }
    } else {
      rows = JSON.parse(localStorage.getItem('mana3_availability') || '[]');
    }
    if (!rows.length) {
      availList.innerHTML = '<li class="empty-state">No blocked dates yet</li>';
      return;
    }
    availList.innerHTML = rows.slice(0, 40).map(r =>
      `<li><span>${r.date}</span><span>${r.status} · ${r.service}</span></li>`
    ).join('');
  }

  document.getElementById('block-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      date: document.getElementById('block-date').value,
      service: document.getElementById('block-service').value,
      status: document.getElementById('block-status').value,
      note: document.getElementById('block-note').value
    };
    const base = apiBase();
    if (base) {
      await fetch(`${base}/api/availability`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });
    } else {
      const list = JSON.parse(localStorage.getItem('mana3_availability') || '[]');
      const idx = list.findIndex(x => x.date === payload.date && x.service === payload.service);
      if (idx >= 0) list[idx] = payload;
      else list.push(payload);
      localStorage.setItem('mana3_availability', JSON.stringify(list));
    }
    loadAvailability();
    e.target.reset();
  });

  function loadAll() {
    loadBookings();
    loadAvailability();
  }

  setInterval(() => {
    if (!dashboard.classList.contains('hidden')) loadAll();
  }, 30000);
})();
