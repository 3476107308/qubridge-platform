// Apply the saved desktop width before the first paint. Storage is optional.
try { if (localStorage.getItem('qubridge.nav.collapsed') === 'true') document.documentElement.classList.add('nav-is-collapsed'); } catch (_) {}
