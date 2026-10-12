let users = [];
async function load() {
  users = await api('GET', '/users');
  $('#list').innerHTML = users.map(u => `<div class="d-flex align-items-center gap-2 py-2 border-bottom" data-id="${u.id}" style="${u.active ? '' : 'opacity:.5'}">
    <span class="flex-grow-1 fs-5">${esc(u.name)} <span class="badge bg-${u.role === 'manager' ? 'primary' : 'secondary'}">${u.role}</span>${u.active ? '' : ' <small>(off)</small>'}</span>
    <button class="btn btn-sm btn-outline-primary" data-act="pin">New PIN</button>
    <button class="btn btn-sm btn-outline-secondary" data-act="toggle">${u.active ? 'Turn off' : 'Turn on'}</button></div>`).join('');
}
$('#add').onclick = async () => {
  try { await api('POST', '/users', { name: $('#nm').value, role: $('#rl').value, pin: $('#pn').value }); $('#nm').value = $('#pn').value = ''; $('#msg').textContent = ''; load(); }
  catch (e) { $('#msg').textContent = e.message; }
};
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const u = users.find(x => x.id == b.closest('[data-id]').dataset.id);
  try {
    if (b.dataset.act === 'pin') { const p = prompt(`New PIN for ${u.name} (${u.role === 'manager' ? '6 to 10' : '4 to 6'} digits)`); if (p) { await api('PUT', '/users/' + u.id, { pin: p }); alert('PIN changed'); } }
    else await api('PUT', '/users/' + u.id, { active: !u.active });
    load();
  } catch (err) { alert(err.message); }
});
load();
