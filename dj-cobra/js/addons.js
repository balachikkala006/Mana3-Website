/* DJ Cobra — Package + add-on estimate */
(function () {
  const estimate = new Map();
  let selectedPackage = null;
  let pendingEvent = '';

  function formatMoney(n) {
    return '$' + n.toLocaleString('en-US');
  }

  function updatePanel() {
    const list = document.getElementById('estimate-list');
    const totalEl = document.getElementById('estimate-total');
    const pkgRow = document.getElementById('estimate-package-row');
    const pkgLabel = document.getElementById('estimate-package-label');
    const pkgPriceEl = document.getElementById('estimate-package-price');
    if (!list || !totalEl) return;

    list.innerHTML = '';
    let addonTotal = 0;

    if (selectedPackage) {
      if (pkgRow) pkgRow.hidden = false;
      if (pkgLabel) pkgLabel.textContent = selectedPackage.label;
      const pkgAmt = pkgPriceEl?.querySelector('.price-amount');
      if (pkgAmt) pkgAmt.textContent = selectedPackage.price.toLocaleString('en-US');
    } else if (pkgRow) {
      pkgRow.hidden = true;
    }

    if (estimate.size === 0) {
      list.innerHTML = selectedPackage
        ? '<li class="estimate-empty">Package selected — add premium add-ons above if you like.</li>'
        : '<li class="estimate-empty">Select a package or add-ons to build your estimate.</li>';
    } else {
      estimate.forEach((item, key) => {
        addonTotal += item.price;
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${item.label}</span>
          <span>
            <button type="button" aria-label="Remove ${item.label}">×</button>
            ${formatMoney(item.price)}
          </span>
        `;
        li.querySelector('button').addEventListener('click', () => {
          estimate.delete(key);
          const card = document.querySelector(`[data-addon="${key}"]`);
          card?.classList.remove('in-estimate');
          const btn = card?.querySelector('.addon-add-btn');
          if (btn) {
            btn.classList.remove('added');
            btn.textContent = 'Add to estimate';
          }
          updatePanel();
        });
        list.appendChild(li);
      });
    }

    const grandTotal = (selectedPackage?.price || 0) + addonTotal;
    const amountEl = totalEl.querySelector('.price-amount');
    if (amountEl) amountEl.textContent = grandTotal.toLocaleString('en-US');
    else totalEl.textContent = formatMoney(grandTotal);

    const bookLink = document.getElementById('estimate-booking-link');
    if (bookLink) {
      const params = new URLSearchParams({ service: 'dj' });
      if (selectedPackage) {
        params.set('package', selectedPackage.id);
        if (selectedPackage.event) params.set('event', selectedPackage.event);
      } else if (pendingEvent) {
        params.set('event', pendingEvent);
      }
      const lines = [];
      if (selectedPackage) lines.push(`${selectedPackage.label}: ${formatMoney(selectedPackage.price)}`);
      estimate.forEach(item => lines.push(`${item.label}: ${formatMoney(item.price)}`));
      if (lines.length) params.set('addons', lines.join('; '));
      bookLink.href = '../booking/index.html?' + params.toString();
    }
  }

  function setPackage(btn) {
    document.querySelectorAll('.pkg-select-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    btn.textContent = '✓ Selected';
    selectedPackage = {
      id: btn.dataset.package,
      label: btn.dataset.label,
      price: parseInt(btn.dataset.price, 10),
      event: btn.dataset.event || pendingEvent || ''
    };
    pendingEvent = '';
    updatePanel();
    document.getElementById('estimate-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.pkg-select-btn').forEach(btn => {
    btn.addEventListener('click', () => setPackage(btn));
  });

  document.querySelectorAll('.addon-card, .ceremony-card').forEach(card => {
    const key = card.dataset.addon;
    if (!key) return;
    const qtyGroup = card.querySelector('.qty-group');
    const durGroup = card.querySelector('.duration-group');
    const addBtn = card.querySelector('.addon-add-btn');
    const priceDisplay = card.querySelector('.addon-price-display');
    const qtyDisplay = card.querySelector('.addon-qty-display');
    const durLabel = card.querySelector('.dur-label');

    let selectedQty = 0;
    let selectedPrice = 0;
    let selectedLabel = '';

    function refreshQtyUI() {
      if (qtyDisplay) qtyDisplay.textContent = String(selectedQty);
      if (priceDisplay) priceDisplay.textContent = formatMoney(selectedPrice);
      if (addBtn && !addBtn.classList.contains('addon-add-fixed')) {
        addBtn.disabled = selectedQty === 0;
      }
    }

    if (qtyGroup) {
      const unit = parseInt(qtyGroup.dataset.unit, 10);
      qtyGroup.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          qtyGroup.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedQty = parseInt(btn.dataset.qty, 10);
          selectedPrice = unit * selectedQty;
          selectedLabel = `${card.querySelector('h3, h4')?.textContent} × ${selectedQty}`;
          refreshQtyUI();
        });
      });
      refreshQtyUI();
    }

    if (durGroup) {
      const syncDuration = () => {
        const active = durGroup.querySelector('.dur-btn.active');
        if (!active) return;
        selectedPrice = parseInt(active.dataset.price, 10);
        const title = card.querySelector('h3, h4')?.textContent || 'Add-on';
        selectedLabel = `${title} (${active.dataset.label})`;
        if (priceDisplay) priceDisplay.textContent = formatMoney(selectedPrice);
        if (durLabel) durLabel.textContent = `(${active.dataset.label})`;
      };
      durGroup.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          durGroup.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          syncDuration();
        });
      });
      syncDuration();
      selectedPrice = parseInt(durGroup.querySelector('.dur-btn.active')?.dataset.price || '0', 10);
      const title = card.querySelector('h3, h4')?.textContent || 'Add-on';
      selectedLabel = `${title} (${durGroup.querySelector('.dur-btn.active')?.dataset.label || ''})`;
    }

    if (addBtn?.classList.contains('addon-add-fixed')) {
      const fixed = addBtn.dataset.fixed
        ? parseInt(addBtn.dataset.fixed, 10)
        : selectedPrice;
      if (addBtn.dataset.fixed) {
        selectedPrice = fixed;
        selectedLabel = card.querySelector('h3, h4')?.textContent || 'Add-on';
        if (priceDisplay) priceDisplay.textContent = formatMoney(fixed);
      }
    }

    addBtn?.addEventListener('click', () => {
      if (addBtn.disabled) return;

      if (addBtn.classList.contains('addon-add-fixed') && !qtyGroup) {
        selectedPrice = addBtn.dataset.fixed
          ? parseInt(addBtn.dataset.fixed, 10)
          : parseInt(card.querySelector('.dur-btn.active')?.dataset.price || '0', 10);
        const dur = card.querySelector('.dur-btn.active');
        const title = card.querySelector('h3, h4')?.textContent || 'Add-on';
        selectedLabel = dur
          ? `${title} (${dur.dataset.label})`
          : title;
      }

      if (qtyGroup && selectedQty === 0) return;

      estimate.set(key, { label: selectedLabel, price: selectedPrice });
      card.classList.add('in-estimate');
      addBtn.classList.add('added');
      addBtn.textContent = '✓ Added';
      updatePanel();
    });
  });

  window.DJ_COBRA_ESTIMATE = {
    setEventContext(eventName) {
      pendingEvent = eventName;
      if (selectedPackage) selectedPackage.event = eventName;
      updatePanel();
    },
    selectPackageById(id) {
      const btn = document.querySelector(`.pkg-select-btn[data-package="${id}"]`);
      if (btn) setPackage(btn);
    }
  };

  updatePanel();
})();
