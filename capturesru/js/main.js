/* CapturesRU — GSAP + Three.js (native scroll — Lenis removed to fix frozen page) */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function unlockPage() {
    document.body.classList.remove('loading');
    document.getElementById('loader')?.classList.add('done');
  }
  window.addEventListener('DOMContentLoaded', unlockPage);
  window.addEventListener('load', unlockPage);
  setTimeout(unlockPage, 2500);

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  const syncNav = () => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 80);
    const heroBottom = hero ? hero.offsetHeight * 0.65 : 400;
    nav?.classList.toggle('at-hero', y < heroBottom);
  };
  window.addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  /* Package tier tabs */
  const tierTabs = document.querySelectorAll('.tier-tab');
  const pkgCards = document.querySelectorAll('.packages-grid .card');
  const packagesGrid = document.querySelector('.packages-grid');

  if (tierTabs.length && pkgCards.length) {
    tierTabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const id = tab.getAttribute('href');
        if (id && id.startsWith('#')) {
          e.preventDefault();
          const card = document.querySelector(id);
          if (!card) return;
          if (packagesGrid && window.innerWidth <= 1100) {
            const left = card.offsetLeft - (packagesGrid.clientWidth - card.offsetWidth) / 2;
            packagesGrid.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
          } else {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    if (window.innerWidth <= 1100 && packagesGrid) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tierTabs.forEach(t => t.classList.toggle('active', t.getAttribute('href') === `#${id}`));
          }
        });
      }, { root: packagesGrid, threshold: 0.6 });
      pkgCards.forEach(c => observer.observe(c));
    }
  }

  /* Other event package tier tabs */
  const eventTabs = document.querySelectorAll('.event-tab');
  const eventCards = document.querySelectorAll('.event-packages-grid .event-card');
  const eventGrid = document.querySelector('.event-packages-grid');

  if (eventTabs.length && eventGrid) {
    eventTabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const id = tab.getAttribute('href');
        if (!id || !id.startsWith('#')) return;
        e.preventDefault();
        const card = document.querySelector(id);
        if (!card) return;
        if (window.innerWidth <= 1100) {
          const left = card.offsetLeft - (eventGrid.clientWidth - card.offsetWidth) / 2;
          eventGrid.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        } else {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    if (window.innerWidth <= 1100) {
      const evtObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            eventTabs.forEach(t => t.classList.toggle('active', t.getAttribute('href') === `#${id}`));
          }
        });
      }, { root: eventGrid, threshold: 0.55 });
      eventCards.forEach(c => evtObserver.observe(c));
    }
  }

  /* Three.js — camera lens */
  if (!reduced && typeof THREE !== 'undefined') {
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
      try {
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 0, 7);

        const lensGroup = new THREE.Group();
        lensGroup.position.set(2.2, 0, 0);
        scene.add(lensGroup);

        const wine = 0x3a0f18;
        const gold = 0xe7c46a;
        const saffron = 0xd9901a;

        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 1.05, 0.5, 48, 1, true),
          new THREE.MeshStandardMaterial({ color: wine, metalness: 0.85, roughness: 0.2, side: THREE.DoubleSide })
        );
        barrel.rotation.x = Math.PI / 2;
        lensGroup.add(barrel);

        const focusRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.02, 0.06, 16, 64),
          new THREE.MeshStandardMaterial({ color: gold, metalness: 1, roughness: 0.12, emissive: saffron })
        );
        focusRing.rotation.x = Math.PI / 2;
        focusRing.position.z = 0.28;
        lensGroup.add(focusRing);

        const glass = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.45),
          new THREE.MeshStandardMaterial({
            color: 0xfff8ee, metalness: 0.1, roughness: 0.05,
            transparent: true, opacity: 0.55, emissive: gold
          })
        );
        glass.rotation.x = -0.2;
        glass.position.z = 0.45;
        lensGroup.add(glass);

        const apertureGroup = new THREE.Group();
        apertureGroup.position.z = 0.32;
        for (let i = 0; i < 8; i++) {
          const blade = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.9),
            new THREE.MeshStandardMaterial({ color: wine, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide })
          );
          blade.rotation.z = (i / 8) * Math.PI * 2;
          blade.position.x = Math.cos(blade.rotation.z) * 0.12;
          blade.position.y = Math.sin(blade.rotation.z) * 0.12;
          apertureGroup.add(blade);
        }
        lensGroup.add(apertureGroup);

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(1.35, 0.03, 8, 80),
          new THREE.MeshBasicMaterial({ color: saffron, transparent: true, opacity: 0.7 })
        );
        halo.rotation.x = Math.PI / 2;
        lensGroup.add(halo);

        const bokehGroup = new THREE.Group();
        [gold, saffron, 0xffeedd].forEach((col, idx) => {
          for (let j = 0; j < 6; j++) {
            const orb = new THREE.Mesh(
              new THREE.CircleGeometry(0.04 + Math.random() * 0.1, 12),
              new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            const angle = Math.random() * Math.PI * 2;
            const dist = 1.8 + Math.random() * 2.2;
            orb.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, (Math.random() - 0.5) * 1.2);
            bokehGroup.add(orb);
          }
        });
        scene.add(bokehGroup);

        const positions = new Float32Array(200 * 3);
        for (let i = 0; i < 200; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 14;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
          color: saffron, size: 0.07, transparent: true, opacity: 0.65,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        scene.add(particles);

        scene.add(new THREE.AmbientLight(0xfff8ee, 0.55));
        const key = new THREE.DirectionalLight(0xe7c46a, 1.8);
        key.position.set(4, 4, 6);
        scene.add(key);
        const rim = new THREE.PointLight(0xd9901a, 2.5, 25);
        rim.position.set(-3, 1, 4);
        scene.add(rim);

        let mx = 0, my = 0;
        let scrollProg = 0;
        let time = 0;

        window.addEventListener('mousemove', e => {
          mx = (e.clientX / window.innerWidth - 0.5) * 2;
          my = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        function layoutLens() {
          const mobile = window.innerWidth < 900;
          lensGroup.position.x = mobile ? 0 : 2.4;
          lensGroup.position.y = mobile ? -0.8 : 0;
          lensGroup.scale.setScalar(mobile ? 0.75 : 1);
          camera.position.x = mobile ? 0 : -0.8;
        }

        function resize() {
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          layoutLens();
        }
        resize();
        window.addEventListener('resize', resize);

        (function tick() {
          requestAnimationFrame(tick);
          time += 0.016;
          lensGroup.rotation.y = Math.sin(time * 0.35) * 0.25 + mx * 0.35;
          lensGroup.rotation.x = -0.15 + my * 0.12;
          focusRing.rotation.z += 0.006;
          halo.rotation.z -= 0.004;
          bokehGroup.rotation.y += 0.001;
          particles.rotation.y += 0.0006;
          apertureGroup.rotation.z = time * 0.15;
          apertureGroup.scale.setScalar(0.5 + scrollProg * 0.35);
          lensGroup.position.x += ((window.innerWidth < 900 ? 0 : 2.4) + mx * 0.25 - lensGroup.position.x) * 0.05;
          lensGroup.position.y += ((window.innerWidth < 900 ? -0.8 : 0) - my * 0.2 - lensGroup.position.y) * 0.05;
          lensGroup.position.z = -scrollProg * 2.5;
          camera.position.z = 7 - scrollProg * 2;
          renderer.render(scene, camera);
        })();

        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.create({
            start: 0,
            end: '30%',
            onUpdate: self => { scrollProg = self.progress; }
          });
        }
      } catch (err) {
        console.warn('CapturesRU 3D:', err);
      }
    }
  }

  if (typeof gsap === 'undefined') return;

  function refreshST() {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }
  window.addEventListener('load', refreshST);
  window.addEventListener('resize', () => setTimeout(refreshST, 200));

  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    gsap.set('.hero-logo, .hero-creds, .hero-title .word, .hero-sub, .hero-actions, .hero-inner, .hero-scroll', { clearProps: 'all', opacity: 1, y: 0 });
    return;
  }

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-logo', { y: 24, opacity: 0, duration: 0.7, immediateRender: false })
    .from('.hero-creds', { y: 20, opacity: 0, duration: 0.7, immediateRender: false }, '-=0.35')
    .from('.hero-title .word', { y: '110%', duration: 1, stagger: 0.08, immediateRender: false }, '-=0.3')
    .from('.hero-sub', { y: 20, opacity: 0, duration: 0.8, immediateRender: false }, '-=0.5')
    .from('.hero-actions', { y: 16, opacity: 0, duration: 0.7, immediateRender: false }, '-=0.45')
    .from('.hero-inner', { scale: 0.96, opacity: 0, duration: 0.9, immediateRender: false }, '-=0.85')
    .from('.hero-scroll', { opacity: 0, duration: 0.6, immediateRender: false }, '-=0.3');

  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      y: 0, opacity: 1, duration: 1, ease: 'power3.out'
    });
  });

    if (packagesGrid) {
      gsap.from('.packages-grid .card', {
        scrollTrigger: { trigger: packagesGrid, start: 'top 85%' },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', immediateRender: false
      });
    }

    if (eventGrid) {
      gsap.from('.event-packages-grid .event-card', {
        scrollTrigger: { trigger: eventGrid, start: 'top 85%' },
        y: 50, opacity: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out', immediateRender: false
      });
    }

  /* Gallery: arrow carousel (after Pic-Time albums load) */
  function initGalleryCarousel() {
    const section = document.querySelector('.gallery-section');
    const viewport = document.getElementById('gallery-viewport');
    const track = document.getElementById('gallery-track');
    const prev = document.getElementById('gallery-prev');
    const next = document.getElementById('gallery-next');
    const status = document.getElementById('gallery-status');
    if (!viewport || !track || !prev || !next || !track.children.length) return;

    section?.classList.add('gallery-carousel-mode');

    function getScrollStep() {
      const item = track.querySelector('.gallery-item');
      if (!item) return 320;
      return item.offsetWidth + 24;
    }

    function currentIndex() {
      const items = [...track.querySelectorAll('.gallery-item')];
      if (!items.length) return 0;
      const left = viewport.scrollLeft;
      let idx = 0;
      items.forEach((item, i) => {
        if (item.offsetLeft <= left + 16) idx = i;
      });
      return idx;
    }

    function updateControls() {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const left = viewport.scrollLeft;
      prev.disabled = left <= 2;
      next.disabled = left >= max - 2;
      const items = track.querySelectorAll('.gallery-item');
      if (status && items.length) {
        status.textContent = `Gallery ${currentIndex() + 1} of ${items.length}`;
      }
    }

    prev.addEventListener('click', () => {
      viewport.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
    next.addEventListener('click', () => {
      viewport.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
    viewport.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    updateControls();
  }

  document.addEventListener('portfolio:ready', () => {
    initGalleryCarousel();
    refreshST();
  });

  gsap.utils.toArray('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      innerText: target, duration: 2, snap: { innerText: 1 }, ease: 'power2.out'
    });
  });

  refreshST();
})();
