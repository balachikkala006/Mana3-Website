/* CapturesRU — film portfolio page entry + scroll reveals */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = document.getElementById('films-entry');

  function dismissEntry() {
    document.body.classList.remove('loading');
    entry?.classList.add('done');
  }

  window.addEventListener('load', () => {
    setTimeout(dismissEntry, reduced ? 0 : 900);
  });
  setTimeout(dismissEntry, 2800);

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
      scrollTrigger: { trigger: el, start: 'top 88%' },
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out'
    });
  });
})();
