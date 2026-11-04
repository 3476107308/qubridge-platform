(() => {
  'use strict';
  const root = document.documentElement;
  const content = document.querySelector('.main-content');
  if (!content) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nativeTransitions = 'onpagereveal' in window;
  const routes = new Set([...document.querySelectorAll('.nav-link-item')].map(link => new URL(link.href).pathname));
  const enabled = () => root.dataset.pageMotion === '1' && !reduced.matches;
  const finishEntry = () => root.classList.remove('page-enter-fallback');
  content.addEventListener('animationend', event => {
    if (event.target === content && event.animationName === 'qubridge-page-in') finishEntry();
  });
  reduced.addEventListener('change', finishEntry);
  // Do not intercept navigation: forms, downloads, modifier keys, new tabs and
  // the simulator's existing in-page algorithm handler keep their own behavior.
  document.addEventListener('click', event => {
    if (!enabled() || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !routes.has(url.pathname) || url.pathname === location.pathname) return;
    try { sessionStorage.setItem('qubridge.page.destination', JSON.stringify({href: url.href, time: Date.now()})); } catch (_) {}
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && !nativeTransitions && enabled()) {
      finishEntry();
      // Restart only the content effect when restoring a cached history entry.
      content.getBoundingClientRect();
      root.classList.add('page-enter-fallback');
    }
  });
})();
