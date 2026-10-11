const S = { menu: [], cat: 'all', cart: [], mode: 'cash' };

async function load() {
  S.menu = (await api('GET', '/menu')).filter(i => i.available);
  render();
}
function render() { renderCats(); renderTiles(); renderCart(); }

function renderCats() {
  const names = [...new Set(S.menu.map(i => i.category))];
  if (S.cat !== 'all' && !names.includes(S.cat)) S.cat = 'all';
  $('#cats').innerHTML = ['all', ...names].map(c =>
    `<button class="cat-btn ${c === S.cat ? 'active' : ''}" data-cat="${esc(c)}">${c === 'all' ? 'All items' : esc(c)}</button>`).join('');
}
function renderTiles() {
  const list = S.menu.filter(i => S.cat === 'all' || i.category === S.cat);
  $('#noitems').hidden = list.length > 0;
  $('#tiles').innerHTML = list.map(i => `<div class="tile" data-id="${i.id}">
    <img src="${esc(i.image || '../img/default.svg')}" onerror="this.src='../img/default.svg'" alt="">
    <div class="nm">${esc(i.name)}</div><div class="pr">${money(i.price)}</div>${i.kitchen ? '<div class="kt">👨‍🍳 kitchen</div>' : ''}</div>`).join('');
}
const total = () => S.cart.reduce((s, l) => s + l.price * l.qty, 0);

function renderCart() {
  $('#cart').innerHTML = S.cart.length ? S.cart.map(l => `<div class="cart-row" data-id="${l.id}">
    <span class="nm">${esc(l.name)}</span><button class="qbtn" data-d="-1">−</button><b>${l.qty}</b><button class="qbtn" data-d="1">+</button>
    <span style="width:80px;text-align:right">${money(l.price * l.qty)}</span></div>`).join('') : '<div class="text-muted p-3">Tap a picture to add it.</div>';
  $('#total').textContent = money(total());
  renderPay();
}
function renderPay() {
  const t = total();
  if (S.mode === 'cash') $('#payfields').innerHTML = `<label>Customer gives</label><input id="cash" type="number" min="0" class="form-control form-control-lg" value="${t || ''}">
    <div class="quick">${[t, 500, 1000, 5000].filter(Boolean).map(v => `<button data-q="${v}">${v === t ? 'Exact' : v}</button>`).join('')}</div><div id="chg" class="fs-4 fw-bold"></div>`;
  else if (S.mode === 'online') $('#payfields').innerHTML = `<div class="fs-5">Paid online: <b>${money(t)}</b></div>`;
  else $('#payfields').innerHTML = `<label>Paid online</label><input id="onl" type="number" min="0" class="form-control form-control-lg" placeholder="0">
    <label class="mt-1">Cash given</label><input id="cash" type="number" min="0" class="form-control form-control-lg"><div id="chg" class="fs-4 fw-bold"></div>`;
  check();
}
function amounts() {
  const t = total(), g = id => Number($(id)?.value) || 0;
  if (S.mode === 'online') return { cash: 0, online: t };
  return { cash: g('#cash'), online: S.mode === 'split' ? g('#onl') : 0 };
}
function check() {
  const t = total(), a = amounts();
  const cashDue = t - a.online, change = a.cash - cashDue;
  let err = '';
  if (a.online > t) err = 'Online amount is more than the bill';
  else if (S.mode !== 'online' && a.cash + a.online < t) err = t ? `Short by ${money(t - a.cash - a.online)}` : '';
  $('#msg').textContent = err;
  if ($('#chg')) $('#chg').textContent = !err && change > 0 ? `Give back: ${money(change)}` : (S.mode === 'split' && !err && t ? `Cash to take: ${money(cashDue)}` : '');
  $('#pay').disabled = !S.cart.length || !!err;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-cat],.tile,[data-d],[data-q],.paymode button');
  if (!t) return;
  if (t.dataset.cat) { S.cat = t.dataset.cat; renderCats(); renderTiles(); }
  else if (t.classList.contains('tile')) {
    const m = S.menu.find(i => i.id == t.dataset.id), l = S.cart.find(x => x.id === m.id);
    if (l) l.qty = Math.min(99, l.qty + 1); else S.cart.push({ id: m.id, name: m.name, price: m.price, qty: 1 });
    renderCart();
  } else if (t.dataset.d) {
    const l = S.cart.find(x => x.id == t.closest('.cart-row').dataset.id);
    l.qty = Math.min(99, l.qty + Number(t.dataset.d));
    if (l.qty <= 0) S.cart.splice(S.cart.indexOf(l), 1);
    renderCart();
  } else if (t.dataset.q) { $('#cash').value = t.dataset.q; check(); }
  else if (t.dataset.m) {
    S.mode = t.dataset.m;
    document.querySelectorAll('.paymode button').forEach(b => b.classList.toggle('on', b === t));
    renderPay();
  }
});
document.addEventListener('input', e => { if (e.target.matches('#cash,#onl')) check(); });
$('#clear').onclick = () => { S.cart = []; renderCart(); };

$('#pay').onclick = async () => {
  $('#pay').disabled = true;
  try {
    const a = amounts();
    const r = await api('POST', '/sales', { items: S.cart.map(l => ({ id: l.id, qty: l.qty })), cash_received: a.cash, online_amount: a.online, customer_name: $('#cname').value });
    $('#tok').textContent = '#' + r.token;
    $('#doneinfo').innerHTML = (r.change > 0 ? `Give back <b>${money(r.change)}</b><br>` : '') + (r.to_kitchen ? '👨‍🍳 Sent to kitchen' : 'Take it from the counter');
    $('#done').classList.add('show');
  } catch (err) { $('#msg').textContent = err.message; $('#pay').disabled = false; }
};
$('#next').onclick = () => { $('#done').classList.remove('show'); S.cart = []; $('#cname').value = ''; S.mode = 'cash';
  document.querySelectorAll('.paymode button').forEach(b => b.classList.toggle('on', b.dataset.m === 'cash')); load(); };
load();
