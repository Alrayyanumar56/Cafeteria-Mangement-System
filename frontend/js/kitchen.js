let sound = false, seen = null;
function beep() {
  try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); o.stop(c.currentTime + .4); } catch (e) {}
}
$('#snd').onclick = () => { sound = !sound; $('#snd').textContent = sound ? '🔔 Sound: on' : '🔔 Sound: off (tap to turn on)'; if (sound) beep(); };

function card(o) {
  const next = o.status === 'new' ? ['ready', 'Ready ✔'] : ['served', 'Handed over'];
  return `<div class="k-card ${o.status}"><div class="d-flex justify-content-between align-items-center">
    <div class="k-token">#${o.token}</div><div class="text-muted">${esc(o.name)} · ${o.time}</div></div>
    <div class="k-items my-2">${o.items.map(i => `${i.qty} × ${esc(i.name)}`).join('<br>')}</div>
    <button data-id="${o.id}" data-s="${next[0]}">${next[1]}</button></div>`;
}
async function poll() {
  try {
    const list = await api('GET', '/kitchen');
    const ids = list.map(o => o.id);
    if (seen && sound && ids.some(id => !seen.includes(id))) beep();
    seen = ids;
    $('#new').innerHTML = list.filter(o => o.status === 'new').map(card).join('');
    $('#ready').innerHTML = list.filter(o => o.status === 'ready').map(card).join('');
    $('#empty').textContent = list.length ? '' : 'No orders waiting 🎉';
  } catch (e) { $('#empty').textContent = 'Cannot reach the server…'; }
}
document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  b.disabled = true;
  try { await api('PUT', '/kitchen/' + b.dataset.id, { status: b.dataset.s }); } catch (err) { alert(err.message); }
  poll();
});
poll(); setInterval(poll, 3000);
