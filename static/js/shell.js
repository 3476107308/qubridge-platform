(() => {
  'use strict';
  const sidebar = document.getElementById('site-sidebar');
  if (!sidebar) return;
  const root = document.documentElement;
  const mobile = matchMedia('(max-width: 768px)');
  const collapse = sidebar.querySelector('.nav-collapse-button');
  const mobileToggle = document.querySelector('.site-mobile-toggle');
  const backdrop = document.querySelector('.site-nav-backdrop');
  const content = document.querySelector('.main-content');
  const tip = document.getElementById('nav-tooltip');
  const simulator = sidebar.querySelector('.nav-item-simulator');
  const algoToggle = sidebar.querySelector('.nav-algorithm-toggle');
  const algorithms = document.getElementById('nav-algorithms');
  const logout = sidebar.querySelector('.nav-logout');
  root.dataset.navigationMotion = sidebar.dataset.navigationMotion;
  let flyoutOpen = false, leaveTimer, suppressFocusOpen = false;
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const compact = () => !mobile.matches && root.classList.contains('nav-is-collapsed');
  const hideTip = () => { tip.hidden = true; };

  function showTip(target) {
    if (!compact() || flyoutOpen) return;
    tip.textContent = target.dataset.label;
    tip.hidden = false;
    const box = target.getBoundingClientRect();
    tip.style.left = `${sidebar.getBoundingClientRect().right + 10}px`;
    tip.style.top = `${Math.max(8, Math.min(innerHeight - tip.offsetHeight - 8, box.top + (box.height - tip.offsetHeight) / 2))}px`;
  }
  function closeFlyout() {
    const wasFlyout = flyoutOpen;
    clearTimeout(leaveTimer); flyoutOpen = false;
    // Returning a floating menu to the rail must not animate an inline gap.
    if (wasFlyout) algorithms.style.transition = 'none';
    algorithms.classList.remove('is-flyout');
    algorithms.style.removeProperty('top'); algorithms.style.removeProperty('left');
    setPanel(algorithms, !compact() && algoToggle.getAttribute('aria-expanded') === 'true');
    if (wasFlyout) { algorithms.getBoundingClientRect(); algorithms.style.removeProperty('transition'); }
  }
  // CSS grid keeps the natural height and reverses smoothly during rapid toggles.
  // Inert removes closed links from keyboard navigation while they fade out.
  function setPanel(panel, open) {
    panel.classList.toggle('is-closed', !open);
    panel.inert = !open;
  }
  function openFlyout() {
    if (!compact()) return;
    clearTimeout(leaveTimer); hideTip(); flyoutOpen = true;
    algorithms.classList.add('is-flyout'); setPanel(algorithms, true);
    const box = simulator.getBoundingClientRect();
    algorithms.style.left = `${sidebar.getBoundingClientRect().right + 10}px`;
    algorithms.style.top = `${Math.max(10, Math.min(innerHeight - algorithms.offsetHeight - 10, box.top))}px`;
  }
  function syncWidth() {
    closeFlyout(); hideTip();
    const collapsed = compact();
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.setAttribute('aria-label', collapsed ? '展开导航' : '折叠导航');
    collapse.dataset.label = collapsed ? '展开导航' : '折叠导航';
    logout.inert = collapsed;
    logout.setAttribute('aria-hidden', String(collapsed));
    algoToggle.inert = collapsed;
    sidebar.querySelectorAll('.nav-group').forEach(group => {
      const button = group.querySelector('.nav-group-toggle');
      button.inert = collapsed;
      setPanel(group.querySelector('.nav-group-panel'), collapsed || button.getAttribute('aria-expanded') === 'true');
    });
  }
  function setMobile(open, restoreFocus = false) {
    root.classList.toggle('nav-mobile-open', open);
    mobileToggle.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    sidebar.inert = mobile.matches && !open;
    content.inert = mobile.matches && open;
    if (open) sidebar.querySelector('.nav-mobile-close').focus();
    else if (restoreFocus) mobileToggle.focus();
  }
  collapse.addEventListener('click', () => {
    root.classList.toggle('nav-is-collapsed');
    save('qubridge.nav.collapsed', String(root.classList.contains('nav-is-collapsed'))); syncWidth();
  });
  sidebar.querySelectorAll('.nav-group').forEach(group => {
    const button = group.querySelector('.nav-group-toggle');
    const key = `qubridge.nav.group.${group.dataset.group}`;
    // Always reveal the destination's group, even if it was closed on another page.
    const isOpen = group.querySelector('[aria-current="page"]') || read(key) !== 'false';
    button.setAttribute('aria-expanded', String(Boolean(isOpen)));
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      setPanel(group.querySelector('.nav-group-panel'), open); save(key, String(open));
    });
  });
  sidebar.querySelectorAll('[data-label]').forEach(target => {
    target.addEventListener('pointerenter', () => showTip(target));
    target.addEventListener('pointerleave', hideTip);
    target.addEventListener('focus', () => showTip(target));
    target.addEventListener('blur', hideTip);
  });
  algoToggle.addEventListener('click', () => {
    if (compact()) { if (flyoutOpen) closeFlyout(); else openFlyout(); return; }
    const open = algoToggle.getAttribute('aria-expanded') !== 'true';
    algoToggle.setAttribute('aria-expanded', String(open)); setPanel(algorithms, open);
  });
  simulator.addEventListener('pointerenter', openFlyout);
  simulator.addEventListener('pointerleave', () => { leaveTimer = setTimeout(closeFlyout, 160); });
  algorithms.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
  algorithms.addEventListener('pointerleave', () => { leaveTimer = setTimeout(closeFlyout, 160); });
  simulator.addEventListener('focusin', () => { if (!suppressFocusOpen) openFlyout(); });
  simulator.addEventListener('focusout', event => { if (!simulator.contains(event.relatedTarget)) closeFlyout(); });
  algorithms.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    save('selectedAlgorithm', link.dataset.algo);
    if (mobile.matches) setMobile(false, true);
    closeFlyout();
  }));
  mobileToggle.addEventListener('click', () => setMobile(true));
  sidebar.querySelector('.nav-mobile-close').addEventListener('click', () => setMobile(false, true));
  backdrop.addEventListener('click', () => setMobile(false, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const restore = flyoutOpen && algorithms.contains(document.activeElement);
      hideTip(); closeFlyout();
      if (restore) { suppressFocusOpen = true; simulator.querySelector('.nav-link-item').focus(); suppressFocusOpen = false; }
      if (mobile.matches) setMobile(false, true);
    }
    if (event.key === 'Tab' && mobile.matches && root.classList.contains('nav-mobile-open')) {
      const items = [...sidebar.querySelectorAll('a[href],button')].filter(el => !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('pointerdown', event => { if (!simulator.contains(event.target)) closeFlyout(); });
  sidebar.querySelector('.nav-scroll').addEventListener('scroll', () => { hideTip(); closeFlyout(); }, {passive: true});
  window.addEventListener('resize', () => { hideTip(); closeFlyout(); });
  mobile.addEventListener('change', () => { setMobile(false); syncWidth(); });
  syncWidth(); setMobile(false);
  // Restore saved layout without an entrance animation, then enable transitions.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('nav-motion-ready')));
})();
