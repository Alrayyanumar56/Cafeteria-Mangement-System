const LABEL = { new: ['🔥 Being made', 'warning'], ready: ['✅ Ready', 'success'], served: ['Handed over', 'secondary'], 'no-kitchen': ['Taken at counter', 'secondary'] };
async function load() {
  const t = $('#tk').value.trim();
  try {
    const q = []; if (t) q.push('token=' + encodeURIComponent(t)); if ($('#day') && $('#day').value) q.push('date=' + $('#day').value);
    const list = await api('GET', '/orders' + (q.length ? '?' + q.join('&') : ''));
    $('#list').innerHTML = list.length ? list.map(o => {
      const [txt, col] = LABEL[o.status] || ['', 'secondary'];
      return `<div class="panel mb-2"><div class="d-flex justify-content-between align-items-center"><span class="fs-2 fw-bold">#${o.token}</span>
        <span class="badge bg-${col} fs-6">${txt}</span></div><div>${o.items.map(i => `${i.qty} × ${esc(i.name)}`).join(', ')}</div>
        <div class="text-muted">${esc(o.name)}${o.cashier ? " · cashier " + esc(o.cashier) : ""} Paid ${o.time} · ${money(o.total)}</div>
        ${o.ready_time || o.served_time ? `<div class="fw-semibold">${o.ready_time ? 'Ready ' + o.ready_time : ''}${o.served_time ? ' · Handed over ' + o.served_time : ''}</div>` : ''}</div>`;
    }).join('') : '<div class="text-muted">No order found today.</div>';
  } catch (e) { $('#list').textContent = e.message; }
}
$('#tk').addEventListener('input', load);
if ($('#day')) $('#day').addEventListener('change', load);
load(); setInterval(load, 5000);
