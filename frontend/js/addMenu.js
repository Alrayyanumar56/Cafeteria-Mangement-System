let cats = [], items = [], editCat = null, editItem = null, image = '';

async function load() {
  [cats, items] = await Promise.all([api('GET', '/categories'), api('GET', '/menu')]);
  $('#catlist').innerHTML = cats.map(c => `<div class="d-flex align-items-center gap-2 py-1 border-bottom" data-id="${c.id}">
    <span class="flex-grow-1">${esc(c.name)} <small class="text-muted">(${c.item_count})</small>${c.kitchen ? ' 👨‍🍳' : ''}</span>
    <button class="btn btn-sm btn-outline-primary" data-act="cedit">Edit</button>
    <button class="btn btn-sm btn-outline-danger" data-act="cdel">✕</button></div>`).join('');
  const sel = $('#icat'), keep = sel.value;
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join(''); if (keep) sel.value = keep;
  $('#items').innerHTML = items.map(i => `<div class="tile" data-id="${i.id}" style="${i.available ? '' : 'opacity:.5'}">
    <img src="${esc(i.image || '../img/default.svg')}" onerror="this.src='../img/default.svg'" alt="">
    <div class="nm">${esc(i.name)}</div><div class="pr">${money(i.price)}</div>
    <div class="small text-muted">${esc(i.category)}${i.kitchen ? ' · 👨‍🍳' : ''}</div>
    <div class="p-1 d-flex gap-1 justify-content-center"><button class="btn btn-sm btn-outline-primary" data-act="iedit">Edit</button>
    <button class="btn btn-sm btn-outline-secondary" data-act="itoggle">${i.available ? 'Hide' : 'Show'}</button>
    <button class="btn btn-sm btn-outline-danger" data-act="idel">✕</button></div></div>`).join('') || '<div class="text-muted">No items yet.</div>';
}

// ----- categories -----
function resetCat() { editCat = null; $('#catname').value = ''; $('#catkitchen').checked = false; $('#catsave').textContent = 'Add'; }
$('#catsave').onclick = async () => {
  try {
    const body = { name: $('#catname').value, kitchen: $('#catkitchen').checked };
    await (editCat ? api('PUT', '/categories/' + editCat, body) : api('POST', '/categories', body));
    $('#catmsg').textContent = ''; resetCat(); load();
  } catch (e) { $('#catmsg').textContent = e.message; }
};
// ----- items -----
function resetItem() { editItem = null; image = ''; ['#iname', '#iprice', '#iunit', '#ifile'].forEach(s => $(s).value = ''); $('#ikitchen').checked = false;
  $('#iprev').style.display = 'none'; $('#itemtitle').textContent = 'Add item'; $('#icancel').hidden = true; }
$('#icat').onchange = () => { if (!editItem) $('#ikitchen').checked = !!cats.find(c => c.id == $('#icat').value)?.kitchen; };
$('#ifile').onchange = e => {                       // shrink photo to ~320px so the database stays small
  const f = e.target.files[0]; if (!f) return;
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, 320 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    image = c.toDataURL('image/jpeg', .75); $('#iprev').src = image; $('#iprev').style.display = 'block';
  };
  img.src = URL.createObjectURL(f);
};
$('#isave').onclick = async () => {
  try {
    const old = items.find(i => i.id === editItem);
    const body = { name: $('#iname').value, category_id: Number($('#icat').value), price: $('#iprice').value, unit: $('#iunit').value,
      kitchen: $('#ikitchen').checked, image: image || old?.image || '', available: old ? !!old.available : true };
    await (editItem ? api('PUT', '/menu/' + editItem, body) : api('POST', '/menu', body));
    $('#imsg').textContent = ''; resetItem(); load();
  } catch (e) { $('#imsg').textContent = e.message; }
};
$('#icancel').onclick = resetItem;

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const row = b.closest('[data-id]'), id = Number(row.dataset.id);
  try {
    if (b.dataset.act === 'cedit') { const c = cats.find(x => x.id === id); editCat = id; $('#catname').value = c.name; $('#catkitchen').checked = !!c.kitchen; $('#catsave').textContent = 'Save'; }
    if (b.dataset.act === 'cdel' && confirm('Delete this category?')) { await api('DELETE', '/categories/' + id); load(); }
    if (b.dataset.act === 'iedit') {
      const i = items.find(x => x.id === id); editItem = id; image = '';
      $('#iname').value = i.name; $('#icat').value = i.category_id; $('#iprice').value = i.price; $('#iunit').value = i.unit; $('#ikitchen').checked = !!i.kitchen;
      $('#itemtitle').textContent = 'Edit item'; $('#icancel').hidden = false; window.scrollTo(0, 0);
    }
    if (b.dataset.act === 'itoggle') { const i = items.find(x => x.id === id); await api('PUT', '/menu/' + id, { ...i, available: !i.available }); load(); }
    if (b.dataset.act === 'idel' && confirm('Delete this item? Old bills are kept.')) { await api('DELETE', '/menu/' + id); load(); }
  } catch (err) { alert(err.message); }
});
load();
