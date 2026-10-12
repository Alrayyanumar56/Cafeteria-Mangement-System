const box = document.getElementById('box');
let users = [], who = null, pin = '';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function call(method, url, body) {
  const r = await fetch('/api' + url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Error'); return d;
}
const go = u => { location.href = u.role === 'manager' ? 'index.html' : 'billing.html'; };

async function start() {
  const st = await call('GET', '/auth/status');
  users = st.users;
  if (st.needs_setup) return setup();
  box.innerHTML = '<h4 class="mb-3">Who are you?</h4>' + users.map(u => `<button class="who" data-id="${u.id}">${u.role === 'manager' ? '🔑' : '👤'} ${esc(u.name)}</button>`).join('');
}
function setup() {
  box.innerHTML = `<h4>First time setup</h4><p>Create the manager account. Only the manager can change the menu and see reports.</p>
    <input id="n" class="form-control mb-2" placeholder="Manager name">
    <input id="p" type="password" inputmode="numeric" class="form-control mb-2" placeholder="PIN (6 to 10 digits)">
    <input id="p2" type="password" inputmode="numeric" class="form-control mb-2" placeholder="Repeat PIN">
    <div id="err" class="text-danger mb-2"></div><button id="mk" class="pay-btn">Create</button>`;
  document.getElementById('mk').onclick = async () => {
    const e = document.getElementById('err');
    if (document.getElementById('p').value !== document.getElementById('p2').value) { e.textContent = 'The two PINs are different'; return; }
    try { go(await call('POST', '/auth/setup', { name: document.getElementById('n').value, pin: document.getElementById('p').value })); } catch (x) { e.textContent = x.message; }
  };
}
function pinScreen() {
  box.innerHTML = `<h4>${esc(who.name)}</h4><div class="dots" id="dots"></div><div id="err" class="text-danger mb-2" style="min-height:24px"></div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="back">⌫</button><button data-k="0">0</button><button class="ok" data-k="ok">OK</button></div>
    <button class="btn btn-link mt-2" data-k="names">← Not me</button>`;
  dots();
}
const dots = () => { const d = document.getElementById('dots'); if (d) d.textContent = '●'.repeat(pin.length); };
async function submit() {
  const e = document.getElementById('err');
  try { go(await call('POST', '/auth/login', { user_id: who.id, pin })); }
  catch (x) { e.textContent = x.message; pin = ''; dots(); }
}
function press(k) {
  if (k === 'names') { who = null; pin = ''; return start(); }
  if (k === 'back') pin = pin.slice(0, -1);
  else if (k === 'ok') return submit();
  else if (pin.length < 10) pin += k;
  dots();
}
box.addEventListener('click', e => {
  const w = e.target.closest('.who'); if (w) { who = users.find(u => u.id == w.dataset.id); pin = ''; pinScreen(); return; }
  const k = e.target.closest('[data-k]'); if (k) press(k.dataset.k);
});
document.addEventListener('keydown', e => {
  if (!who) return;
  if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('back'); else if (e.key === 'Enter') press('ok');
});
start().catch(e => { box.textContent = e.message; });
