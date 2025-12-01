// ../js/report.js
// Unified, robust reports frontend for the Cafe POS app
// Works with backend endpoints:
//   GET /api/salesRecords  -> [{ date, name, qty, price, payment }, ...]
//   GET /api/salesBills    -> [{ id, date, dateSimple, items, payments, total }, ...]

let ALL_BILLS = [];
let ALL_ITEMS = [];
let currentFilteredBills = [];

// ---------- Fetch helpers ----------
async function fetchSalesRecords() {
  try {
    const res = await fetch('http://localhost:3000/api/salesRecords');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(r => ({
      date: typeof r.date === 'string' ? r.date : (r.date ? new Date(r.date).toISOString().split('T')[0] : ''),
      name: r.name,
      qty: Number(r.qty || 0),
      price: Number(r.price || 0),
      payment: r.payment || 'cash'
    }));
  } catch (e) {
    console.error('fetchSalesRecords error:', e);
    return [];
  }
}

async function fetchSalesBills() {
  try {
    const res = await fetch('http://localhost:3000/api/salesBills');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(b => ({
      id: b.id,
      date: (typeof b.date === 'string') ? b.date : (b.date ? new Date(b.date).toISOString() : ''),
      dateSimple: b.dateSimple || (b.date ? new Date(b.date).toISOString().split('T')[0] : ''),
      items: Array.isArray(b.items) ? b.items.map(it => ({
        id: it.id, name: it.name, qty: Number(it.qty || 0), price: Number(it.price || 0)
      })) : [],
      payments: b.payments || { cash: 0, online: 0 },
      total: Number(b.total || 0)
    }));
  } catch (e) {
    console.error('fetchSalesBills error:', e);
    return [];
  }
}

// ---------- UI helpers ----------
function formatPKR(n) {
  if (Number.isNaN(n)) n = 0;
  return `PKR ${Number(n).toLocaleString()}`;
}

function showNoDataIfNeeded() {
  const billsList = document.getElementById('billsList');
  const salesTableBody = document.getElementById('salesTableBody');
  if (!ALL_BILLS.length) {
    if (billsList) billsList.innerHTML = '<div class="text-muted">No bills yet</div>';
    if (salesTableBody) salesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records</td></tr>';
  }
}

// ---------- Table & Bills rendering ----------
function populateSalesTable(bills) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const rows = [];
  bills.forEach(b => {
    const billDate = b.dateSimple || (b.date ? (new Date(b.date).toISOString().split('T')[0]) : '');
    const billTime = b.date ? (new Date(b.date).toLocaleString()) : billDate;
    b.items.forEach(it => {
      rows.push(`<tr>
        <td>${billTime}</td>
        <td>${escapeHtml(it.name || '')}</td>
        <td>${it.qty}</td>
        <td>${formatPKR(it.price)}</td>
        <td>${formatPKR(it.qty * it.price)}</td>
        <td>${escapeHtml(detectPaymentLabel(b.payments, b))}</td>
      </tr>`);
    });
  });
  tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>';
}

function renderBillsList(bills) {
  const container = document.getElementById('billsList');
  if (!container) return;
  container.innerHTML = '';
  if (!bills.length) {
    container.innerHTML = '<div class="text-muted">No bills yet</div>';
    return;
  }
  bills.slice().reverse().forEach(b => {
    const cash = Number((b.payments && b.payments.cash) || 0);
    const online = Number((b.payments && b.payments.online) || 0);
    let badgeClass = 'bg-secondary';
    let payLabel = 'Mixed';
    if (cash > 0 && online === 0) { badgeClass = 'bg-success'; payLabel = 'Cash'; }
    else if (online > 0 && cash === 0) { badgeClass = 'bg-info'; payLabel = 'Online'; }
    const el = document.createElement('div');
    el.className = 'bill-card card mb-2 p-2';
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div><strong>Bill #${b.id}</strong><div class="text-muted small">${new Date(b.date).toLocaleString()}</div></div>
        <div class="text-end">
          <span class="badge ${badgeClass} mb-1">${payLabel}</span>
          <div class="fw-bold">${formatPKR(b.total)}</div>
          <div class="small text-muted">Items: ${b.items.length}</div>
          <button class="btn btn-sm btn-outline-primary mt-1" data-bill-id="${b.id}">View</button>
        </div>
      </div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('button[data-bill-id]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const id = Number(ev.currentTarget.getAttribute('data-bill-id'));
      openBillModal(id);
    });
  });
}

function openBillModal(billId) {
  const bill = ALL_BILLS.find(b => Number(b.id) === Number(billId));
  if (!bill) { alert('Bill not found'); return; }
  const modalTitle = document.getElementById('billModalTitle');
  const modalBody = document.getElementById('billModalBody');
  modalTitle.textContent = `Bill #${bill.id} — ${new Date(bill.date).toLocaleString()}`;
  let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Item</th><th class="text-end">Qty</th><th class="text-end">Unit Price</th><th class="text-end">Total</th></tr></thead><tbody>';
  bill.items.forEach(it => {
    html += `<tr><td>${escapeHtml(it.name)}</td><td class="text-end">${it.qty}</td><td class="text-end">${formatPKR(it.price)}</td><td class="text-end">${formatPKR(it.qty * it.price)}</td></tr>`;
  });
  html += `</tbody></table></div><div class="mt-2"><strong>Total: ${formatPKR(bill.total)}</strong></div>`;
  html += `<div class="small text-muted mt-1">Payments: Cash PKR ${Number(bill.payments?.cash || 0).toLocaleString()} | Online PKR ${Number(bill.payments?.online || 0).toLocaleString()}</div>`;
  modalBody.innerHTML = html;
  try { new bootstrap.Modal(document.getElementById('billModal')).show(); } catch(e){ console.warn('Bootstrap modal show failed', e);}
}

// ---------- Utilities ----------
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function detectPaymentLabel(payments, bill) {
  if (payments && (Number(payments.cash) || Number(payments.online))) {
    const cash = Number(payments.cash || 0), online = Number(payments.online || 0);
    if (cash > 0 && online === 0) return 'Cash';
    if (online > 0 && cash === 0) return 'Online';
    if (cash > 0 && online > 0) return 'Mixed';
  }
  return 'Unknown';
}

// ---------- Charts ----------
let CHARTS = { daily: null, payment: null, top: null };

function buildItemFlatListFromBills(bills) {
  const itemsFlat = [];
  bills.forEach(b => {
    const billDateIso = b.date ? new Date(b.date).toISOString() : (b.dateSimple || '');
    const cashPayment = Number(b.payments?.cash || 0);
    const onlinePayment = Number(b.payments?.online || 0);
    const totalBill = Number(b.total || 0);
    b.items.forEach(it => {
      const itemTotal = Number(it.qty || 0) * Number(it.price || 0);
      let cashShare = 0, onlineShare = 0;
      if (cashPayment > 0 && onlinePayment === 0) {
        cashShare = itemTotal;
      } else if (onlinePayment > 0 && cashPayment === 0) {
        onlineShare = itemTotal;
      } else if (cashPayment > 0 && onlinePayment > 0) {
        const ratio = itemTotal / totalBill;
        cashShare = ratio * cashPayment;
        onlineShare = ratio * onlinePayment;
      }
      itemsFlat.push({
        date: billDateIso,
        name: it.name,
        qty: Number(it.qty || 0),
        price: Number(it.price || 0),
        cashAmount: cashShare,
        onlineAmount: onlineShare
      });
    });
  });
  return itemsFlat;
}

function initChartsFromItems(itemsFlat) {
  try { if (CHARTS.daily) CHARTS.daily.destroy(); } catch(e){}
  try { if (CHARTS.payment) CHARTS.payment.destroy(); } catch(e){}
  try { if (CHARTS.top) CHARTS.top.destroy(); } catch(e){}

  const today = new Date();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7.push(d.toISOString().split('T')[0]);
  }

  const dailyCash = last7.map(d => itemsFlat.filter(it => (it.date || '').startsWith(d)).reduce((a,b)=>a + b.cashAmount,0));
  const dailyOnline = last7.map(d => itemsFlat.filter(it => (it.date || '').startsWith(d)).reduce((a,b)=>a + b.onlineAmount,0));

  const dailyCtx = document.getElementById('dailySalesChart')?.getContext('2d');
  if (dailyCtx) {
    CHARTS.daily = new Chart(dailyCtx, {
      type: 'bar',
      data: { labels: last7, datasets: [{ label: 'Cash', data: dailyCash }, { label: 'Online', data: dailyOnline }] },
      options: { responsive: true }
    });
  }

  const totalCash = itemsFlat.reduce((a,b)=>a + b.cashAmount,0);
  const totalOnline = itemsFlat.reduce((a,b)=>a + b.onlineAmount,0);
  const paymentCtx = document.getElementById('paymentChart')?.getContext('2d');
  if (paymentCtx) {
    CHARTS.payment = new Chart(paymentCtx, {
      type: 'doughnut',
      data: { labels: ['Cash','Online'], datasets: [{ data: [totalCash, totalOnline] }] },
      options: { responsive: true }
    });
  }

  const map = {};
  itemsFlat.forEach(it => map[it.name] = (map[it.name]||0) + it.qty);
  const top = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topLabels = top.map(t => t[0]), topQty = top.map(t => t[1]);
  const topCtx = document.getElementById('topItemsChart')?.getContext('2d');
  if (topCtx) {
    CHARTS.top = new Chart(topCtx, {
      type: 'bar',
      data: { labels: topLabels, datasets: [{ label: 'Quantity Sold', data: topQty }] },
      options: { indexAxis: 'y', responsive: true }
    });
  }
}

// ---------- Filters and totals ----------
function applyFilters() {
  const startDateVal = document.getElementById('startDate')?.value || '';
  const endDateVal = document.getElementById('endDate')?.value || '';
  const paymentFilter = document.getElementById('paymentFilter')?.value || 'all';

  let filtered = ALL_BILLS.slice();

  if (startDateVal) {
    const s = new Date(startDateVal);
    filtered = filtered.filter(b => new Date(b.date || b.dateSimple) >= new Date(s.getFullYear(), s.getMonth(), s.getDate()));
  }
  if (endDateVal) {
    const e = new Date(endDateVal);
    filtered = filtered.filter(b => new Date(b.date || b.dateSimple) <= new Date(e.getFullYear(), e.getMonth(), e.getDate(),23,59,59,999));
  }

  if (paymentFilter !== 'all') {
    filtered = filtered.filter(b => {
      const cash = Number(b.payments?.cash || 0), online = Number(b.payments?.online || 0);
      if (paymentFilter === 'cash') return cash > 0 && online === 0;
      if (paymentFilter === 'online') return online > 0 && cash === 0;
      return true;
    });
  }

  currentFilteredBills = filtered;
  populateSalesTable(filtered);
  renderBillsList(filtered);

  const itemsFlat = buildItemFlatListFromBills(filtered);
  const totalCash = itemsFlat.reduce((a,b)=>a + b.cashAmount,0);
  const totalOnline = itemsFlat.reduce((a,b)=>a + b.onlineAmount,0);

  document.getElementById('totalCash').textContent = formatPKR(totalCash);
  document.getElementById('totalOnline').textContent = formatPKR(totalOnline);
  document.getElementById('totalAmount').textContent = formatPKR(totalCash + totalOnline);
  document.getElementById('totalOrders').textContent = filtered.length;

  initChartsFromItems(itemsFlat);
}

// ---------- Export CSV ----------
function exportReport() {
  const bills = currentFilteredBills.length ? currentFilteredBills : ALL_BILLS;
  if (!bills.length) { alert('No bills to export'); return; }

  let csv = 'BillID,Date,ItemsCount,Total,Cash,Online,PaymentMethod,Items\n';
  bills.forEach(b => {
    const cash = Number(b.payments?.cash || 0), online = Number(b.payments?.online || 0);
    let method = 'Mixed';
    if (cash > 0 && online === 0) method = 'Cash';
    else if (online > 0 && cash === 0) method = 'Online';
    const itemsStr = b.items.map(it => `${it.name} x${it.qty} @${it.price}`).join(' | ');
    csv += `${b.id || ''},"${new Date(b.date).toISOString()}",${b.items.length},${b.total},${cash},${online},${method},"${itemsStr.replace(/"/g,'""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bills_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------- Init ----------
async function initReportsPage() {
  const [items, bills] = await Promise.all([fetchSalesRecords(), fetchSalesBills()]);
  ALL_ITEMS = items;
  ALL_BILLS = bills;

  currentFilteredBills = ALL_BILLS.slice();
  populateSalesTable(ALL_BILLS);
  renderBillsList(ALL_BILLS);

  const itemsFlat = buildItemFlatListFromBills(ALL_BILLS);
  const totalCash = itemsFlat.reduce((a,b)=>a + b.cashAmount,0);
  const totalOnline = itemsFlat.reduce((a,b)=>a + b.onlineAmount,0);

  document.getElementById('totalCash').textContent = formatPKR(totalCash);
  document.getElementById('totalOnline').textContent = formatPKR(totalOnline);
  document.getElementById('totalAmount').textContent = formatPKR(totalCash + totalOnline);
  document.getElementById('totalOrders').textContent = ALL_BILLS.length;

  initChartsFromItems(itemsFlat);

  document.getElementById('startDate')?.addEventListener('change', applyFilters);
  document.getElementById('endDate')?.addEventListener('change', applyFilters);
  document.getElementById('paymentFilter')?.addEventListener('change', applyFilters);

  showNoDataIfNeeded();
}

// Kick off
document.addEventListener('DOMContentLoaded', () => {
  initReportsPage().catch(e => console.error('initReportsPage error:', e));
});
