// Restore layout before the first paint. Storage is optional.
(() => {
  const root = document.documentElement;
  const boot = document.currentScript.dataset;
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  root.classList.add('nav-booting');
  root.classList.toggle('nav-is-collapsed', read('qubridge.nav.collapsed') === 'true');
  for (const group of ['overview', 'compute', 'analysis', 'project']) {
    const key = `qubridge.nav.group.${group}`;
    const open = group === boot.activeGroup || read(key) !== 'false';
    root.setAttribute(`data-nav-${group}`, open ? 'open' : 'closed');
    // An automatically revealed destination group stays open when leaving it.
    if (group === boot.activeGroup) save(key, 'true');
  }
  const algorithmKey = 'qubridge.nav.algorithms.expanded';
  const rememberedAlgorithms = read(algorithmKey);
  const open = rememberedAlgorithms === null ? boot.simulator === '1' : rememberedAlgorithms === 'true';
  root.dataset.navAlgorithms = open ? 'open' : 'closed';
  if (rememberedAlgorithms === null && open) save(algorithmKey, 'true');
  root.dataset.pageMotion = boot.pageMotion;

  // A content-only entry also covers slow loads where native transitions skip.
  // Consume the one-time marker even if animation is disabled or navigation changed.
  try {
    const marker = JSON.parse(sessionStorage.getItem('qubridge.page.destination'));
    sessionStorage.removeItem('qubridge.page.destination');
    const navigation = performance.getEntriesByType('navigation')[0];
    if (boot.pageMotion === '1' &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        marker?.href === location.href && Date.now() - marker.time < 60000 &&
        navigation?.type !== 'reload') root.classList.add('page-enter-fallback');
  } catch (_) {}
  // This head listener runs before the first rendering opportunity. Native
  // transitions replace the entry effect, so content is never animated twice.
  window.addEventListener('pagereveal', event => {
    const scroll = document.querySelector('.nav-scroll');
    try {
      if (scroll) scroll.scrollTop = Number(sessionStorage.getItem('qubridge.nav.scroll')) || 0;
    } catch (_) {}
    if (!event.viewTransition) return;
    const hadFallback = root.classList.contains('page-enter-fallback');
    root.classList.remove('page-enter-fallback');
    event.viewTransition.ready.catch(() => {
      if (hadFallback && !matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('page-enter-fallback');
    });
  });
})();
