/* DJ Cobra — GSAP + Three.js */
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
  } else {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  function scrollToPackageCard(card, grid) {
    if (!card) return;
    if (grid && window.innerWidth <= 1024) {
      const left = card.offsetLeft - (grid.clientWidth - card.offsetWidth) / 2;
      grid.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    } else {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function wireTierTabs(tabs, grid) {
    if (!tabs.length || !grid) return;
    const cards = grid.querySelectorAll('.pkg-card');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const id = tab.getAttribute('href');
        if (!id || !id.startsWith('#')) return;
        e.preventDefault();
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        scrollToPackageCard(document.querySelector(id), grid);
      });
    });

    if (window.innerWidth <= 1024) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tabs.forEach(t => t.classList.toggle('active', t.getAttribute('href') === `#${id}`));
          }
        });
      }, { root: grid, threshold: 0.55 });
      cards.forEach(c => observer.observe(c));
    }
  }

  wireTierTabs(
    document.querySelectorAll('.packages-tier-nav .tier-tab'),
    document.querySelector('#packages .packages-grid')
  );
  const weddingGrid = document.querySelector('.wedding-packages-grid');
  if (weddingGrid) {
    wireTierTabs(
      document.querySelectorAll('.wedding-tier-nav .tier-tab'),
      weddingGrid
    );
  }

  const q = new URLSearchParams(location.search);
  const eventLabels = { sangeet: 'Sangeet', wedding: 'Wedding', reception: 'Reception' };
  const eventName = q.get('event');
  const focusId = q.get('focus') || q.get('package');

  const badge = document.getElementById('wedding-event-badge');
  if (badge && eventName && eventLabels[eventName]) {
    badge.textContent = 'Planning: ' + eventLabels[eventName];
  }

  if (eventName && window.DJ_COBRA_ESTIMATE) {
    window.DJ_COBRA_ESTIMATE.setEventContext(eventName);
  }

  if (focusId) {
    setTimeout(() => {
      const card = document.getElementById(focusId);
      const grid = document.querySelector('.wedding-packages-grid');
      const tab = document.querySelector(`.wedding-tier-nav a[href="#${focusId}"]`);
      document.querySelectorAll('.wedding-tier-nav .tier-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      scrollToPackageCard(card, grid);
      if (window.DJ_COBRA_ESTIMATE) {
        const pkgMap = {
          'pkg-wedding-silver': 'wedding-silver',
          'pkg-wedding-gold': 'wedding-gold',
          'pkg-wedding-platinum': 'wedding-platinum'
        };
        const pkgId = pkgMap[focusId] || focusId;
        window.DJ_COBRA_ESTIMATE.selectPackageById(pkgId);
      }
    }, 600);
  } else if (q.get('package') && window.DJ_COBRA_ESTIMATE) {
    setTimeout(() => window.DJ_COBRA_ESTIMATE.selectPackageById(q.get('package')), 500);
  }

  /* Three.js — vinyl */
  if (!reduced && typeof THREE !== 'undefined') {
    const canvas = document.getElementById('dj-canvas');
    if (canvas) {
      try {
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
        camera.position.z = 7;

        const vinylGroup = new THREE.Group();
        vinylGroup.position.set(1.8, 0, 0);
        scene.add(vinylGroup);

        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 2, 0.08, 64),
          new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.6, roughness: 0.3 })
        );
        disc.rotation.x = Math.PI / 2;
        vinylGroup.add(disc);

        const label = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32),
          new THREE.MeshStandardMaterial({ color: 0x00d4ff, metalness: 0.4, roughness: 0.4 })
        );
        label.rotation.x = Math.PI / 2;
        label.position.y = 0.05;
        vinylGroup.add(label);

        const light1 = new THREE.PointLight(0x00d4ff, 2, 20);
        light1.position.set(3, 2, 4);
        scene.add(light1);
        const light2 = new THREE.PointLight(0xd946ef, 1.5, 20);
        light2.position.set(-2, -1, 3);
        scene.add(light2);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));

        function resize() {
          const w = window.innerWidth;
          const h = window.innerHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize);

        function animate() {
          requestAnimationFrame(animate);
          vinylGroup.rotation.z += 0.008;
          renderer.render(scene, camera);
        }
        animate();
      } catch (err) {
        console.warn('Three.js init failed', err);
      }
    }
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        y: 32,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out'
      });
    });

    const packagesGrid = document.querySelector('#packages .packages-grid');
    if (packagesGrid) {
      gsap.from('#packages .packages-grid .pkg-card', {
        scrollTrigger: { trigger: packagesGrid, start: 'top 85%' },
        y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out'
      });
    }

    const weddingGrid = document.querySelector('.wedding-packages-grid');
    if (weddingGrid) {
      gsap.from('.wedding-packages-grid .pkg-card', {
        scrollTrigger: { trigger: weddingGrid, start: 'top 85%', once: true },
        y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out'
      });
    }

    gsap.from('.hero-logo', { opacity: 0, y: 24, duration: 1, delay: 0.2, ease: 'power3.out' });
    gsap.from('.hero h1 .line', {
      y: 80, opacity: 0, duration: 1.1, stagger: 0.12, delay: 0.35, ease: 'power4.out'
    });

    ScrollTrigger.refresh();
  }
})();
