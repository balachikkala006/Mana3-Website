/* CapturesRU — wedding samples gallery page */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid = document.getElementById('weddings-grid');
  let items = [];
  let lightboxIndex = 0;

  function renderItem(item, index) {
    const orientClass = item.orient === 'landscape' ? 'weddings-item--landscape' : 'weddings-item--portrait';
    const featured = index === 0 ? ' weddings-item--featured' : '';
    return `
      <figure class="weddings-item ${orientClass}${featured} reveal" style="aspect-ratio: ${item.w} / ${item.h}" data-index="${index}">
        <img src="${item.src}" alt="${item.caption}" loading="${index < 4 ? 'eager' : 'lazy'}" width="${item.w}" height="${item.h}">
        <figcaption>
          <span class="weddings-item-cap">${item.caption}</span>
          <span class="weddings-item-hint" aria-hidden="true">View full size</span>
        </figcaption>
      </figure>`;
  }

  fetch('data/weddings-gallery.json')
    .then(r => r.json())
    .then(data => {
      items = data;
      if (!grid) return;
      grid.innerHTML = items.map(renderItem).join('');
      const countEl = document.getElementById('weddings-count');
      if (countEl) countEl.textContent = `${items.length} wedding samples`;
      initReveals();
      initLightbox();
    })
    .catch(() => {
      if (grid) grid.innerHTML = '<p class="weddings-error">Could not load gallery. Please refresh.</p>';
    });

  function openLightbox(index) {
    const lb = document.getElementById('weddings-lightbox');
    const lbImg = document.getElementById('weddings-lightbox-img');
    const lbCap = document.getElementById('weddings-lightbox-cap');
    const lbCounter = document.getElementById('weddings-lightbox-counter');
    if (!lb || !lbImg || !items[index]) return;

    lightboxIndex = index;
    const item = items[index];
    lbImg.src = item.src;
    lbImg.alt = item.caption;
    if (lbCap) lbCap.textContent = item.caption;
    if (lbCounter) lbCounter.textContent = `${index + 1} / ${items.length}`;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function initLightbox() {
    const lb = document.getElementById('weddings-lightbox');
    if (!lb) return;

    grid?.addEventListener('click', e => {
      const figure = e.target.closest('.weddings-item');
      if (!figure) return;
      const index = parseInt(figure.dataset.index, 10);
      if (!Number.isNaN(index)) openLightbox(index);
    });

    lb.querySelector('.weddings-lightbox-close')?.addEventListener('click', closeLightbox);
    lb.querySelector('.weddings-lightbox-prev')?.addEventListener('click', e => {
      e.stopPropagation();
      openLightbox((lightboxIndex - 1 + items.length) % items.length);
    });
    lb.querySelector('.weddings-lightbox-next')?.addEventListener('click', e => {
      e.stopPropagation();
      openLightbox((lightboxIndex + 1) % items.length);
    });
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox((lightboxIndex - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight') openLightbox((lightboxIndex + 1) % items.length);
    });

    function closeLightbox() {
      lb.hidden = true;
      const lbImg = document.getElementById('weddings-lightbox-img');
      if (lbImg) lbImg.src = '';
      document.body.style.overflow = '';
    }
  }

  function initReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || reduced) {
      document.querySelectorAll('.reveal').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out'
      });
    });
  }

  document.body.classList.remove('loading');
})();
