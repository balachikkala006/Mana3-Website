(function () {
  const cfg = window.MANA3_BOOKING || {};
  const form = document.getElementById('booking-form');
  const calGrid = document.getElementById('cal-grid');
  const calMonth = document.getElementById('cal-month');
  const calHint = document.getElementById('cal-hint');
  const statusEl = document.getElementById('form-status');
  const eventDateInput = document.getElementById('event-date');
  const eventDaysJsonInput = document.getElementById('event-days-json');
  const eventDaysContainer = document.getElementById('event-days');
  const eventRangeSummary = document.getElementById('event-range-summary');
  const eventDaysProgress = document.getElementById('event-days-progress');
  const selectedDatesList = document.getElementById('selected-dates-list');
  const bookingLayout = document.querySelector('.booking-layout');
  const eventSpanSelect = document.getElementById('event-span');
  const eventSpanHint = document.getElementById('event-span-hint');
  const eventTypeSelect = document.getElementById('event-type');
  const serviceSelect = document.getElementById('service');
  const packageSelect = document.getElementById('package');

  let availability = [];
  let viewDate = new Date();
  let activeDayIndex = 0;

  const PACKAGES = {
    dj: [
      { id: 'wedding-silver', label: 'Silver Wedding — $2,000' },
      { id: 'wedding-gold', label: 'Gold Wedding — $3,000' },
      { id: 'wedding-platinum', label: 'Platinum Wedding — $4,000' },
      { id: 'friends', label: 'Friends & Family — $800' },
      { id: 'classy', label: 'Classy & Elegant — $1,000' },
      { id: 'deluxe', label: 'Deluxe Dance — $1,300' },
      { id: 'custom', label: 'Custom quote' }
    ],
    photo: [
      { id: 'silver', label: 'Wedding Silver — $350/hr' },
      { id: 'gold', label: 'Wedding Gold — $500/hr' },
      { id: 'platinum', label: 'Wedding Platinum — $800/hr' },
      { id: 'essential', label: 'Event Essential — $250/hr' },
      { id: 'signature', label: 'Event Signature — $275/hr' },
      { id: 'premium', label: 'Event Premium — $300/hr' },
      { id: 'custom', label: 'Custom quote' }
    ],
    both: [
      { id: 'bundle', label: 'DJ + Photography bundle' },
      { id: 'custom', label: 'Custom quote' }
    ]
  };

  const TIME_SLOTS = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
    'Full day'
  ];

  const FUNCTION_OPTIONS = [
    'Half saree ceremony',
    'Dhoti ceremony',
    'Haldi',
    'Mehndi',
    'Sangeet',
    'Sangeet / Mehndi',
    'Wedding ceremony',
    'Reception',
    'Pre-wedding shoot',
    'Engagement',
    'Housewarming',
    'Birthday party',
    'Corporate program',
    'Gender reveal',
    'Other'
  ];

  const WEDDING_DAY_DEFAULTS = {
    1: ['Wedding ceremony'],
    2: ['Sangeet / Mehndi', 'Wedding ceremony'],
    3: ['Sangeet / Mehndi', 'Wedding ceremony', 'Reception'],
    4: ['Haldi', 'Sangeet / Mehndi', 'Wedding ceremony', 'Reception'],
    5: ['Haldi', 'Mehndi', 'Sangeet', 'Wedding ceremony', 'Reception']
  };

  const HALF_SAREE_DEFAULTS = {
    1: ['Half saree ceremony'],
    2: ['Half saree ceremony', 'Dhoti ceremony'],
    3: ['Half saree ceremony', 'Dhoti ceremony', 'Reception']
  };

  const EVENT_PRESETS = {
    'Full wedding (multi-day)': {
      defaultSpan: 3,
      minSpan: 2,
      maxSpan: 5,
      hint: 'Most weddings run 3–5 days. Label each function — Sangeet, Wedding, Reception, etc.'
    },
    'Half saree / Dhoti ceremony': {
      defaultSpan: 1,
      minSpan: 1,
      maxSpan: 3,
      hint: 'Often 1 day, or paired with other wedding functions across 2–3 days.'
    },
    'Sangeet / Mehndi': {
      defaultSpan: 1,
      minSpan: 1,
      maxSpan: 2,
      hint: 'Usually one evening; can span 2 days for larger celebrations.'
    },
    'Pre-wedding': { defaultSpan: 1, minSpan: 1, maxSpan: 2, hint: 'Typically a single shoot day.' },
    'Wedding reception': { defaultSpan: 1, minSpan: 1, maxSpan: 2, hint: 'Reception is usually one evening.' },
    Birthday: { defaultSpan: 1, minSpan: 1, maxSpan: 1, hint: 'Single-day celebration.' },
    'Sweet 16': { defaultSpan: 1, minSpan: 1, maxSpan: 1, hint: 'Single-day celebration.' },
    Housewarming: { defaultSpan: 1, minSpan: 1, maxSpan: 1, hint: 'Single-day event.' },
    Corporate: { defaultSpan: 1, minSpan: 1, maxSpan: 1, hint: 'Single-day program.' },
    'Gender reveal': { defaultSpan: 1, minSpan: 1, maxSpan: 1, hint: 'Single-day event.' },
    Other: { defaultSpan: 1, minSpan: 1, maxSpan: 5, hint: 'Choose how many days you need coverage.' }
  };

  function apiBase() {
    return (cfg.apiBase || '').replace(/\/$/, '');
  }

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'form-status ' + (type || '');
  }

  function fillPackages(service) {
    if (!packageSelect) return;
    const list = PACKAGES[service] || PACKAGES.both;
    packageSelect.innerHTML = '<option value="">Select package</option>' +
      list.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDisplayDate(key) {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function isDateBookable(key) {
    const today = dateKey(new Date());
    if (key < today) return false;
    const st = statusForDay(key);
    return st !== 'booked' && st !== 'blocked';
  }

  function datesUsedByOtherDays(excludeIndex) {
    return readDayRows()
      .filter((_, i) => i !== excludeIndex)
      .map(r => r.date)
      .filter(Boolean);
  }

  function dateDayIndexMap() {
    const map = new Map();
    readDayRows().forEach((r, i) => {
      if (r.date) map.set(r.date, i + 1);
    });
    return map;
  }

  function updateBookingLayout() {
    if (!bookingLayout) return;
    bookingLayout.classList.toggle('booking-layout--multi', getSpan() > 1);
  }

  function renderSelectedDatesList() {
    if (!selectedDatesList) return;
    const span = getSpan();
    const rows = readDayRows();

    if (span <= 1) {
      selectedDatesList.hidden = true;
      selectedDatesList.innerHTML = '';
      return;
    }

    selectedDatesList.hidden = false;
    selectedDatesList.innerHTML = rows.map((r, i) => {
      const isActive = i === activeDayIndex;
      const when = r.date
        ? (r.time ? `${formatDisplayDate(r.date)} · ${r.time}` : formatDisplayDate(r.date))
        : 'Tap calendar to pick date';
      return `<button type="button" class="selected-date-chip${isActive ? ' is-active' : ''}${r.date ? '' : ' is-empty'}" data-day="${i}">
        <strong>Day ${r.day}</strong>
        <span>${r.function || 'Event'} — ${when}</span>
      </button>`;
    }).join('');

    selectedDatesList.querySelectorAll('.selected-date-chip').forEach(chip => {
      chip.addEventListener('click', () => setActiveDay(parseInt(chip.dataset.day, 10)));
    });
  }

  function updateDaysProgress() {
    if (!eventDaysProgress) return;
    const span = getSpan();
    const filled = readDayRows().filter(r => r.date).length;
    if (span <= 1) {
      eventDaysProgress.textContent = '';
      return;
    }
    eventDaysProgress.textContent = `${filled} of ${span} dates selected — pick each date on the calendar (they can be any open days, not necessarily back-to-back).`;
  }

  function assignDateToDay(dayIndex, key) {
    if (!key) return false;
    if (!isDateBookable(key)) {
      setStatus(`${formatDisplayDate(key)} isn't available — choose an open date.`, 'error');
      return false;
    }
    if (datesUsedByOtherDays(dayIndex).includes(key)) {
      setStatus(`${formatDisplayDate(key)} is already selected for another day.`, 'error');
      return false;
    }

    const inp = eventDaysContainer?.querySelector(`.day-date[data-day="${dayIndex}"]`);
    if (inp) inp.value = key;
    const row = eventDaysContainer?.querySelector(`.event-day-row[data-day="${dayIndex}"]`);
    const label = row?.querySelector('.day-date-label');
    if (label) label.textContent = formatDaySchedule(key, readTimeFromRow(row));
    if (row) row.classList.add('has-date');

    setStatus('', '');
    syncHiddenFields();
    updateCalHint();
    renderSelectedDatesList();
    updateDaysProgress();

    const rows = readDayRows();
    const nextEmpty = rows.findIndex((r, i) => i > dayIndex && !r.date);
    if (nextEmpty >= 0) {
      setActiveDay(nextEmpty);
    } else {
      const firstEmpty = rows.findIndex(r => !r.date);
      if (firstEmpty >= 0) setActiveDay(firstEmpty);
      else renderCalendar();
    }
    return true;
  }

  function updateRangeSummary() {
    if (!eventRangeSummary) return;
    const rows = readDayRows().filter(r => r.date);
    if (!rows.length) {
      eventRangeSummary.hidden = true;
      eventRangeSummary.textContent = '';
      return;
    }
    eventRangeSummary.hidden = false;
    eventRangeSummary.innerHTML = rows
      .map(r => {
        const when = r.time ? `${formatDisplayDate(r.date)} · ${r.time}` : formatDisplayDate(r.date);
        return `Day ${r.day}: <strong>${when}</strong> — ${r.function || 'TBD'}`;
      })
      .join('<br>');
  }

  function getSpan() {
    return parseInt(eventSpanSelect?.value || '1', 10) || 1;
  }

  function getPreset() {
    const type = eventTypeSelect?.value || '';
    return EVENT_PRESETS[type] || { defaultSpan: 1, minSpan: 1, maxSpan: 5, hint: '' };
  }

  function defaultFunctionsForSpan(span) {
    const type = eventTypeSelect?.value || '';
    if (type === 'Half saree / Dhoti ceremony') {
      return HALF_SAREE_DEFAULTS[span] || HALF_SAREE_DEFAULTS[1];
    }
    if (type === 'Sangeet / Mehndi') {
      return span === 2 ? ['Mehndi', 'Sangeet'] : ['Sangeet / Mehndi'];
    }
    if (type === 'Pre-wedding') {
      return span === 2 ? ['Pre-wedding shoot', 'Engagement'] : ['Pre-wedding shoot'];
    }
    if (type === 'Wedding reception') {
      return ['Reception'];
    }
    if (['Birthday', 'Sweet 16', 'Housewarming', 'Corporate', 'Gender reveal'].includes(type)) {
      return [type];
    }
    if (type === 'Full wedding (multi-day)' || type === 'Other') {
      return WEDDING_DAY_DEFAULTS[span] || WEDDING_DAY_DEFAULTS[1];
    }
    return WEDDING_DAY_DEFAULTS[span] || ['Other'];
  }

  function functionOptionsHtml(selected) {
    const opts = FUNCTION_OPTIONS.map(f =>
      `<option value="${f}"${f === selected ? ' selected' : ''}>${f}</option>`
    ).join('');
    return opts + '<option value="Custom"' + (selected === 'Custom' ? ' selected' : '') + '>Custom label…</option>';
  }

  function timeOptionsHtml(selected, customValue) {
    const isCustom = selected && !TIME_SLOTS.includes(selected);
    const opts = ['<option value="">Select time</option>']
      .concat(TIME_SLOTS.map(t => `<option value="${t}"${t === selected ? ' selected' : ''}>${t}</option>`))
      .concat(`<option value="Custom"${isCustom ? ' selected' : ''}>Other time…</option>`);
    return opts.join('');
  }

  function readTimeFromRow(row) {
    const sel = row.querySelector('.day-time');
    const custom = row.querySelector('.day-time-custom');
    if (!sel?.value) return '';
    if (sel.value === 'Custom') return custom?.value.trim() || '';
    return sel.value;
  }

  function formatDaySchedule(date, time) {
    if (!date) return 'Pick a date';
    let text = formatDisplayDate(date);
    if (time) text += ` · ${time}`;
    return text;
  }

  function updateDayRowLabel(dayIndex) {
    const row = eventDaysContainer?.querySelector(`.event-day-row[data-day="${dayIndex}"]`);
    if (!row) return;
    const label = row.querySelector('.day-date-label');
    if (!label) return;
    label.textContent = formatDaySchedule(
      row.querySelector('.day-date')?.value || '',
      readTimeFromRow(row)
    );
  }

  function readDayRows() {
    if (!eventDaysContainer) return [];
    return [...eventDaysContainer.querySelectorAll('.event-day-row')].map((row, i) => {
      const fnSelect = row.querySelector('.day-function');
      const fnCustom = row.querySelector('.day-function-custom');
      let fn = fnSelect?.value || '';
      if (fn === 'Custom') fn = fnCustom?.value.trim() || 'Custom';
      const time = readTimeFromRow(row);
      return {
        day: i + 1,
        date: row.querySelector('.day-date')?.value || '',
        time,
        function: fn
      };
    });
  }

  function syncHiddenFields() {
    const rows = readDayRows();
    const orderedDates = rows.map(r => r.date).filter(Boolean);
    eventDaysJsonInput.value = JSON.stringify(rows);
    eventDateInput.value = orderedDates.length ? orderedDates.join(', ') : '';
    updateRangeSummary();
    renderSelectedDatesList();
    updateDaysProgress();
  }

  function updateSpanOptions() {
    if (!eventSpanSelect) return;
    const preset = getPreset();
    const current = getSpan();
    [...eventSpanSelect.options].forEach(opt => {
      const n = parseInt(opt.value, 10);
      opt.disabled = n < preset.minSpan || n > preset.maxSpan;
    });
    let next = current;
    if (current < preset.minSpan) next = preset.minSpan;
    if (current > preset.maxSpan) next = preset.maxSpan;
    if (!eventTypeSelect?.value) next = 1;
    eventSpanSelect.value = String(next);
    if (eventSpanHint) {
      eventSpanHint.textContent = eventTypeSelect?.value ? (preset.hint || '') : 'Select an event type to see suggested day counts.';
    }
  }

  function renderEventDays() {
    if (!eventDaysContainer) return;
    const span = getSpan();
    const existing = readDayRows();
    const defaults = defaultFunctionsForSpan(span);

    let html = '';
    for (let i = 0; i < span; i++) {
      const prev = existing[i] || {};
      const fn = prev.function || defaults[i] || defaults[defaults.length - 1] || 'Other';
      const isCustom = fn && !FUNCTION_OPTIONS.includes(fn);
      const dateVal = prev.date || '';
      const timeVal = prev.time || '';
      const isTimeCustom = timeVal && !TIME_SLOTS.includes(timeVal);
      const dateLabel = formatDaySchedule(dateVal, timeVal);
      html += `
        <div class="event-day-row${i === activeDayIndex ? ' is-active' : ''}${dateVal ? ' has-date' : ''}" data-day="${i}">
          <div class="event-day-head">
            <span class="event-day-num">Day ${i + 1}</span>
            <button type="button" class="day-pick-btn" data-pick="${i}">Pick on calendar</button>
          </div>
          <p class="day-date-label">${dateLabel}</p>
          <div class="event-day-fields">
            <div class="event-day-fn">
              <label class="sr-only" for="day-fn-${i}">Function for day ${i + 1}</label>
              <select class="day-function" id="day-fn-${i}" data-day="${i}">${functionOptionsHtml(isCustom ? 'Custom' : fn)}</select>
              <input type="text" class="day-function-custom${isCustom ? '' : ' hidden'}" data-day="${i}"
                placeholder="e.g. Half saree, Varapuja…" value="${isCustom ? fn.replace(/"/g, '&quot;') : ''}">
            </div>
            <div class="event-day-schedule">
              <div class="event-day-date-wrap">
                <label class="field-mini" for="day-date-${i}">Date</label>
                <input type="date" class="day-date" id="day-date-${i}" data-day="${i}" value="${dateVal}">
              </div>
              <div class="event-day-time-wrap">
                <label class="field-mini" for="day-time-${i}">Time (AM / PM)</label>
                <select class="day-time" id="day-time-${i}" data-day="${i}">${timeOptionsHtml(isTimeCustom ? 'Custom' : timeVal, timeVal)}</select>
                <input type="text" class="day-time-custom${isTimeCustom ? '' : ' hidden'}" data-day="${i}"
                  placeholder="e.g. 4:30 PM" value="${isTimeCustom ? timeVal.replace(/"/g, '&quot;') : ''}">
              </div>
            </div>
          </div>
        </div>`;
    }
    eventDaysContainer.innerHTML = html;
    if (activeDayIndex >= span) activeDayIndex = span - 1;

    eventDaysContainer.querySelectorAll('.day-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => setActiveDay(parseInt(btn.dataset.pick, 10)));
    });

    eventDaysContainer.querySelectorAll('.day-function').forEach(sel => {
      sel.addEventListener('change', () => {
        const row = sel.closest('.event-day-row');
        const custom = row?.querySelector('.day-function-custom');
        if (!custom) return;
        if (sel.value === 'Custom') {
          custom.classList.remove('hidden');
          custom.focus();
        } else {
          custom.classList.add('hidden');
          custom.value = '';
        }
        syncHiddenFields();
        updateCalHint();
      });
    });

    eventDaysContainer.querySelectorAll('.day-function-custom').forEach(inp => {
      inp.addEventListener('input', syncHiddenFields);
    });

    eventDaysContainer.querySelectorAll('.day-date').forEach(inp => {
      inp.addEventListener('change', () => {
        const dayIndex = parseInt(inp.dataset.day, 10);
        if (inp.value) assignDateToDay(dayIndex, inp.value);
        else {
          updateDayRowLabel(dayIndex);
          syncHiddenFields();
          renderCalendar();
        }
      });
      inp.addEventListener('focus', () => setActiveDay(parseInt(inp.dataset.day, 10)));
    });

    eventDaysContainer.querySelectorAll('.day-time').forEach(sel => {
      sel.addEventListener('change', () => {
        const dayIndex = parseInt(sel.dataset.day, 10);
        const row = sel.closest('.event-day-row');
        const custom = row?.querySelector('.day-time-custom');
        if (!custom) return;
        if (sel.value === 'Custom') {
          custom.classList.remove('hidden');
          custom.focus();
        } else {
          custom.classList.add('hidden');
          custom.value = '';
        }
        updateDayRowLabel(dayIndex);
        syncHiddenFields();
      });
    });

    eventDaysContainer.querySelectorAll('.day-time-custom').forEach(inp => {
      inp.addEventListener('input', () => {
        updateDayRowLabel(parseInt(inp.dataset.day, 10));
        syncHiddenFields();
      });
    });

    syncHiddenFields();
    updateBookingLayout();
    updateDaysProgress();
    updateCalHint();
    renderSelectedDatesList();
    renderCalendar();
  }

  function setActiveDay(index) {
    activeDayIndex = index;
    eventDaysContainer?.querySelectorAll('.event-day-row').forEach((row, i) => {
      row.classList.toggle('is-active', i === index);
    });
    updateCalHint();
    renderSelectedDatesList();
    renderCalendar();
    eventDaysContainer?.querySelector(`.event-day-row[data-day="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateCalHint() {
    if (!calHint) return;
    const span = getSpan();
    const rows = readDayRows();
    const filled = rows.filter(r => r.date).length;

    if (span === 1) {
      calHint.textContent = 'Tap an open date on the calendar — booked and blocked days are greyed out.';
      return;
    }

    const row = rows[activeDayIndex];
    const fn = row?.function || `Day ${activeDayIndex + 1}`;
    calHint.textContent = `Now picking Day ${activeDayIndex + 1} (${fn}). Choose any open date — days do not need to be consecutive. (${filled}/${span} selected)`;
  }

  function allSelectedDates() {
    return readDayRows().map(r => r.date).filter(Boolean);
  }

  function statusForDay(key) {
    const hits = availability.filter(a => a.date === key);
    if (hits.some(h => h.status === 'booked')) return 'booked';
    if (hits.some(h => h.status === 'blocked')) return 'blocked';
    if (hits.some(h => h.status === 'hold')) return 'hold';
    return 'available';
  }

  function renderCalendar() {
    if (!calGrid || !calMonth) return;
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    calMonth.textContent = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = dateKey(new Date());
    const rows = readDayRows();
    const slotMap = dateDayIndexMap();
    const takenByOthers = new Set(datesUsedByOtherDays(activeDayIndex));
    const activeDate = rows[activeDayIndex]?.date || '';

    let html = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span class="cal-dow">${d}</span>`).join('');
    for (let i = 0; i < startPad; i++) html += '<span class="cal-day empty"></span>';

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const key = dateKey(d);
      const st = statusForDay(key);
      const past = key < today;
      const unavailable = past || st === 'booked' || st === 'blocked';
      const slot = slotMap.get(key);
      const taken = takenByOthers.has(key);
      const disabled = unavailable;
      const selected = Boolean(slot);
      const isActive = key === activeDate;
      const badge = slot ? `<span class="cal-slot-badge">D${slot}</span>` : '';
      html += `<button type="button" class="cal-day ${st}${selected ? ' selected' : ''}${isActive ? ' active-pick' : ''}${taken ? ' taken' : ''}${disabled ? ' disabled' : ''}"
        data-date="${key}" ${disabled ? 'disabled' : ''} title="${slot ? `Day ${slot} — click to view or change` : (taken ? 'Selected for another day — click to switch' : '')}">
        <span>${day}</span>${badge}</button>`;
    }
    calGrid.innerHTML = html;

    calGrid.querySelectorAll('.cal-day:not(.empty):not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.date;
        const existingIndex = readDayRows().findIndex(r => r.date === key);
        if (existingIndex >= 0) {
          setActiveDay(existingIndex);
          return;
        }
        assignDateToDay(activeDayIndex, key);
      });
    });
  }

  function applyEventTypePreset() {
    const preset = getPreset();
    if (eventTypeSelect?.value) {
      eventSpanSelect.value = String(preset.defaultSpan);
    }
    updateSpanOptions();
    renderEventDays();
  }

  async function loadAvailability() {
    const base = apiBase();
    if (base) {
      try {
        const svc = serviceSelect?.value || 'all';
        const res = await fetch(`${base}/api/availability?service=${encodeURIComponent(svc)}`);
        const data = await res.json();
        availability = data.availability || [];
      } catch (e) {
        console.warn('Availability load failed', e);
        availability = [];
      }
      renderCalendar();
      return;
    }
    try {
      const res = await fetch('../data/availability.json');
      if (res.ok) {
        const data = await res.json();
        availability = data.availability || data || [];
      } else {
        availability = JSON.parse(localStorage.getItem('mana3_availability') || '[]');
      }
    } catch (e) {
      availability = JSON.parse(localStorage.getItem('mana3_availability') || '[]');
    }
    renderCalendar();
  }

  function formatEventDaysForMessage(days) {
    if (!days?.length) return '';
    return days
      .filter(d => d.date)
      .map(d => {
        const when = d.time ? `${formatDisplayDate(d.date)} at ${d.time}` : formatDisplayDate(d.date);
        return `  Day ${d.day}: ${when} — ${d.function || 'TBD'}`;
      })
      .join('\n');
  }

  function buildQuoteMessage(booking) {
    let days = [];
    try {
      days = typeof booking.event_days === 'string'
        ? JSON.parse(booking.event_days)
        : (booking.event_days || []);
    } catch (e) { /* ignore */ }

    const dateBlock = days.length
      ? `Dates (${days.length} day${days.length > 1 ? 's' : ''}):\n${formatEventDaysForMessage(days)}`
      : (booking.event_date ? `Date: ${booking.event_date}` : '');

    const lines = [
      '*Mana3 Event Inquiry*',
      `Service: ${booking.service}`,
      booking.package_name ? `Package: ${booking.package_name}` : '',
      booking.event_type ? `Event: ${booking.event_type}` : '',
      booking.event_span ? `Coverage: ${booking.event_span} day${booking.event_span > 1 ? 's' : ''}` : '',
      dateBlock,
      `Name: ${booking.client_name}`,
      booking.phone ? `Phone: ${booking.phone}` : '',
      booking.whatsapp ? `WhatsApp: ${booking.whatsapp}` : '',
      booking.instagram ? `Instagram: @${booking.instagram.replace(/^@/, '')}` : '',
      booking.email ? `Email: ${booking.email}` : '',
      booking.preferred_contact ? `Preferred: ${booking.preferred_contact}` : '',
      booking.message ? `\n${booking.message}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }

  function openWhatsApp(booking) {
    const num = (cfg.whatsapp || '').replace(/\D/g, '');
    if (!num) return;
    const text = encodeURIComponent(buildQuoteMessage(booking));
    window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener');
  }

  function quoteEndpoint() {
    return (cfg.quoteEndpoint || cfg.telegramWorkerUrl || '').replace(/\/$/, '');
  }

  async function sendTelegramQuote(booking) {
    const endpoint = quoteEndpoint();
    if (!endpoint) return false;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking,
        message: buildQuoteMessage(booking)
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not reach Telegram');
    return true;
  }

  function openTelegramBotFallback(booking) {
    const text = encodeURIComponent(buildQuoteMessage(booking).slice(0, 900));
    window.open(`https://t.me/share/url?text=${text}`, '_blank', 'noopener');
  }

  function saveLocal(booking) {
    const list = JSON.parse(localStorage.getItem('mana3_bookings') || '[]');
    list.unshift(booking);
    localStorage.setItem('mana3_bookings', JSON.stringify(list.slice(0, 100)));
  }

  function validateEventDays() {
    const rows = readDayRows();
    const span = getSpan();
    if (rows.length !== span) return 'Please set up all event days.';
    const missingDate = rows.find(r => !r.date);
    if (missingDate) {
      return `Please pick a date for Day ${missingDate.day} on the calendar.`;
    }
    for (const r of rows) {
      if (!isDateBookable(r.date)) {
        return `${formatDisplayDate(r.date)} (Day ${r.day}) isn't available — choose another open date.`;
      }
    }
    const dates = rows.map(r => r.date);
    if (new Set(dates).size !== dates.length) {
      return 'Each day needs a different date.';
    }
    for (const r of rows) {
      if (!r.time) return `Please select a time (AM/PM) for Day ${r.day}.`;
      if (!/am|pm|full day/i.test(r.time)) {
        return `Please enter a time with AM or PM for Day ${r.day} (e.g. 4:30 PM).`;
      }
    }
    for (const r of rows) {
      if (!r.function) return `Please label Day ${r.day} (e.g. Half saree, Sangeet, Wedding).`;
      if (r.function === 'Custom') {
        const custom = eventDaysContainer?.querySelector(`.day-function-custom[data-day="${r.day - 1}"]`);
        if (!custom?.value.trim()) return 'Please enter a custom label for each day.';
      }
    }
    return '';
  }

  async function submitBooking(payload) {
    const base = apiBase();
    if (base) {
      const res = await fetch(`${base}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      return data.booking;
    }
    const booking = {
      id: 'local-' + Date.now(),
      created_at: new Date().toISOString(),
      status: 'pending',
      ...payload
    };
    saveLocal(booking);
    return booking;
  }

  function prefillFromQuery() {
    const q = new URLSearchParams(location.search);
    if (q.get('service') && serviceSelect) {
      serviceSelect.value = q.get('service');
      fillPackages(q.get('service'));
    }
    if (q.get('package') && packageSelect) {
      setTimeout(() => { packageSelect.value = q.get('package'); }, 0);
    }
    if (q.get('addons') && document.getElementById('message')) {
      document.getElementById('message').value = 'DJ add-ons estimate: ' + q.get('addons');
    }
    if (q.get('event') && eventTypeSelect) {
      const evMap = {
        sangeet: 'Sangeet / Mehndi',
        wedding: 'Full wedding (multi-day)',
        reception: 'Wedding reception'
      };
      const raw = q.get('event').toLowerCase();
      const ev = evMap[raw] || q.get('event');
      const match = [...eventTypeSelect.options].find(o => o.value === ev || o.value.toLowerCase() === raw);
      if (match) eventTypeSelect.value = match.value;
    }
  }

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
  });

  serviceSelect?.addEventListener('change', () => {
    fillPackages(serviceSelect.value);
    loadAvailability();
  });

  eventTypeSelect?.addEventListener('change', applyEventTypePreset);
  eventSpanSelect?.addEventListener('change', () => {
    updateSpanOptions();
    renderEventDays();
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();

    const dayError = validateEventDays();
    if (dayError) {
      setStatus(dayError, 'error');
      return;
    }

    setStatus('Sending your quote request…', 'loading');
    const rows = readDayRows();
    const span = getSpan();

    const payload = {
      service: serviceSelect.value,
      package_name: packageSelect.options[packageSelect.selectedIndex]?.text || packageSelect.value,
      event_type: eventTypeSelect?.value || '',
      event_span: span,
      event_days: rows,
      event_date: eventDateInput.value,
      client_name: document.getElementById('client-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      instagram: document.getElementById('instagram').value.trim().replace(/^@/, ''),
      preferred_contact: document.getElementById('preferred-contact').value,
      message: document.getElementById('message').value.trim(),
      addon_estimate: document.getElementById('addon-estimate')?.value || '',
      source: 'website'
    };

    try {
      let booking;
      if (apiBase()) {
        booking = await submitBooking(payload);
      } else {
        booking = {
          id: 'web-' + Date.now(),
          created_at: new Date().toISOString(),
          status: 'pending',
          ...payload
        };
        saveLocal(booking);
      }

      const sentTelegram = quoteEndpoint()
        ? await sendTelegramQuote(booking)
        : false;

      if (sentTelegram) {
        setStatus('Quote sent! We\'ll reach out on Telegram — WhatsApp groups are set up after we confirm.', 'success');
      } else if (cfg.telegramBot) {
        openTelegramBotFallback(booking);
        setStatus('Opening Telegram — send the pre-filled message to complete your quote request.', 'success');
      } else if (cfg.openWhatsAppAfterSubmit !== false && (cfg.whatsapp || '').replace(/\D/g, '')) {
        openWhatsApp(booking);
        setStatus('Request saved! Opening WhatsApp so we can confirm your dates.', 'success');
      } else {
        setStatus('Quote request received! We\'ll contact you soon.', 'success');
      }

      form.reset();
      activeDayIndex = 0;
      fillPackages(serviceSelect.value);
      updateSpanOptions();
      renderEventDays();
      loadAvailability();
    } catch (err) {
      setStatus(err.message || 'Could not send quote. Check your connection or contact us on Instagram.', 'error');
    }
  });

  fillPackages(serviceSelect?.value || 'dj');
  prefillFromQuery();
  updateSpanOptions();
  renderEventDays();
  loadAvailability();

  document.querySelectorAll('[data-wa]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const num = (cfg.whatsapp || '').replace(/\D/g, '');
      if (!num) return;
      const text = encodeURIComponent(el.dataset.waText || 'Hi Mana3, I would like a quote for my event.');
      window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener');
    });
  });

  document.querySelectorAll('[data-ig]').forEach(el => {
    const handle = (el.dataset.ig || cfg.instagram || '').replace(/^@/, '');
    if (handle) el.href = `https://instagram.com/${handle}`;
  });
})();
