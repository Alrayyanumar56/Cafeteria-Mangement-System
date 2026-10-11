const LABEL = { new: ['🔥 Being made', 'warning'], ready: ['✅ Ready', 'success'], served: ['Handed over', 'secondary'], 'no-kitchen': ['Taken at counter', 'secondary'] };
async function load() {
  const t = $('#tk').value.trim();
  try {
    const list = await api('GET', '/orders' + (t ? '?token=' + encodeURIComponent(t) : ''));
    $('#list').innerHTML = list.length ? list.map(o => {
      const [txt, col] = LABEL[o.status] || ['', 'secondary'];
      return `<div class="panel mb-2"><div class="d-flex justify-content-between align-items-center"><span class="fs-2 fw-bold">#${o.token}</span>
        <span class="badge bg-${col} fs-6">${txt}</span></div><div>${o.items.map(i => `${i.qty} × ${esc(i.name)}`).join(', ')}</div>
        <div class="text-muted">${esc(o.name)} ${o.time} · ${money(o.total)}</div></div>`;
    }).join('') : '<div class="text-muted">No order found today.</div>';
  } catch (e) { $('#list').textContent = e.message; }
}
$('#tk').addEventListener('input', load);
load(); setInterval(load, 5000);
