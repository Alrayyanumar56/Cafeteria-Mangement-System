// Shared helpers: API calls, HTML escaping, navbar.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'Rs ' + Number(n || 0).toLocaleString();
async function api(method, url, body) {
  const r = await fetch('/api' + url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}
(function nav() {
  const links = [['index', 'Home'], ['billing', 'Billing'], ['kitchen', 'Kitchen'], ['orders', 'Orders'], ['addMenu', 'Menu'], ['inventory', 'Inventory'], ['report', 'Reports']];
  const cur = location.pathname.split('/').pop().replace('.html', '');
  const el = document.getElementById('nav'); if (!el) return;
  el.className = 'pos-nav';
  el.innerHTML = '<span class="brand">☕ CafePOS</span>' + links.map(([p, t]) => `<a href="${p}.html" class="${p === cur ? 'active' : ''}">${t}</a>`).join('');
})();
