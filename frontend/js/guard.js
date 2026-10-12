// Runs on every page except login. If you are not logged in, the server answers 401 and we go to the login page.
// Also hides what a counter user must not use. (The SERVER enforces the real rule; this only tidies the screen.)
(function () {
  const MANAGER_PAGES = ['addMenu', 'inventory', 'report', 'users'];
  const realFetch = window.fetch;
  window.fetch = async function () {
    const r = await realFetch.apply(this, arguments);
    if (r.status === 401 && !/login\.html$/.test(location.pathname)) location.href = 'login.html';
    return r;
  };
  const page = location.pathname.split('/').pop().replace('.html', '');
  realFetch('/api/auth/me').then(r => (r.ok ? r.json() : null)).then(u => {
    if (!u) { location.href = 'login.html'; return; }
    window.CAFE_USER = u;
    if (u.role !== 'manager' && MANAGER_PAGES.includes(page)) { location.href = 'billing.html'; return; }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => decorate(u)); else decorate(u);
  }).catch(() => {});

  function decorate(u) {
    const manager = u.role === 'manager';
    if (!manager) {
      document.querySelectorAll('a[href]').forEach(a => { if (MANAGER_PAGES.some(p => a.getAttribute('href') === p + '.html')) a.style.display = 'none'; });
      document.querySelectorAll('.card-app').forEach(c => { if (MANAGER_PAGES.some(p => (c.getAttribute('onclick') || '').includes(p + '.html'))) c.style.display = 'none'; });
    }
    const links = document.querySelector('.pos-nav, .app-links');
    if (manager && links && !links.querySelector('a[href="users.html"]'))
      links.insertAdjacentHTML('beforeend', `<a href="users.html" class="${links.classList.contains('app-links') ? 'nav-btn' : ''} ${page === 'users' ? 'active' : ''}">Staff</a>`);
    const host = document.querySelector('.nav-right') || document.querySelector('.pos-nav');
    if (host) {
      host.insertAdjacentHTML('beforeend', `<span style="margin-left:auto;color:#cfd8e3;display:inline-flex;gap:8px;align-items:center">👤 ${String(u.name).replace(/[&<>"']/g, '')} <button id="logoutBtn" class="btn btn-sm btn-outline-light">Log out</button></span>`);
      document.getElementById('logoutBtn').onclick = async () => { await realFetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); location.href = 'login.html'; };
    }
  }
})();
