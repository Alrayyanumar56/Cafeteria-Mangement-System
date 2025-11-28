// Reports Page JavaScript - Backend Version (MySQL via API)

// Sales Data structure
const salesData = {
    daily: { labels: [], cash: [], online: [] },
    items: [],
    topItems: { labels: [], quantities: [] }
};

// --- API calls to backend ---
async function fetchSalesItems() {
    try {
        const res = await fetch('http://localhost:3000/api/salesRecords');
        const items = await res.json();
        return items.map(r => ({
            date: r.date,
            name: r.name,
            qty: Number(r.qty),
            price: Number(r.price),
            payment: r.payment
        }));
    } catch (err) {
        console.error('Failed to fetch sales items:', err);
        return [];
    }
}

async function fetchSalesBills() {
    try {
        const res = await fetch('http://localhost:3000/api/salesBills');
        const bills = await res.json();
        return bills.map(b => ({
            id: b.id,
            date: b.date,
            dateSimple: b.dateSimple,
            items: b.items,
            payments: b.payments,
            total: b.total
        }));
    } catch (err) {
        console.error('Failed to fetch bills:', err);
        return [];
    }
}

// --- Build aggregates from items ---
function buildAggregatesFromItems() {
    const items = salesData.items;

    // Top items by quantity
    const qtyByItem = {};
    items.forEach(it => qtyByItem[it.name] = (qtyByItem[it.name] || 0) + it.qty);

    const top = Object.entries(qtyByItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    salesData.topItems.labels = top.map(t => t[0]);
    salesData.topItems.quantities = top.map(t => t[1]);

    // Daily aggregates for last 7 days
    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        last7.push(d.toISOString().split('T')[0]);
    }
    salesData.daily.labels = last7;
    salesData.daily.cash = last7.map(() => 0);
    salesData.daily.online = last7.map(() => 0);

    items.forEach(it => {
        const idx = salesData.daily.labels.indexOf(it.date);
        const amount = it.qty * it.price;
        if (idx >= 0) {
            if (it.payment === 'cash') salesData.daily.cash[idx] += amount;
            else salesData.daily.online[idx] += amount;
        }
    });
}

// --- Calculate totals ---
async function calculateTotals() {
    let totalCash = 0, totalOnline = 0;
    const bills = await fetchSalesBills();
    const totalOrders = bills.length;

    salesData.items.forEach(item => {
        const total = item.qty * item.price;
        if (item.payment === 'cash') totalCash += total;
        else totalOnline += total;
    });

    document.getElementById('totalCash').textContent = `PKR ${totalCash.toLocaleString()}`;
    document.getElementById('totalOnline').textContent = `PKR ${totalOnline.toLocaleString()}`;
    document.getElementById('totalAmount').textContent = `PKR ${(totalCash + totalOnline).toLocaleString()}`;
    document.getElementById('totalOrders').textContent = totalOrders;
}

// --- Charts ---
function initDailySalesChart() {
    const ctx = document.getElementById('dailySalesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salesData.daily.labels,
            datasets: [
                { label: 'Cash', data: salesData.daily.cash, backgroundColor: 'rgba(25,135,84,0.7)', borderColor: 'rgb(25,135,84)', borderWidth: 2 },
                { label: 'Online', data: salesData.daily.online, backgroundColor: 'rgba(13,202,240,0.7)', borderColor: 'rgb(13,202,240)', borderWidth: 2 }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: v => 'PKR ' + v } } },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': PKR ' + ctx.parsed.y.toLocaleString() } }
            }
        }
    });
}

function initPaymentChart() {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    let cashTotal = 0, onlineTotal = 0;
    salesData.items.forEach(item => item.payment === 'cash' ? cashTotal += item.qty * item.price : onlineTotal += item.qty * item.price);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Online Payment'],
            datasets: [{ data: [cashTotal, onlineTotal], backgroundColor: ['rgba(25,135,84,0.8)','rgba(13,202,240,0.8)'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
                tooltip: {
                    callbacks: { label: ctx => {
                        const val = ctx.parsed || 0;
                        const total = ctx.dataset.data.reduce((a,b) => a+b,0);
                        const perc = ((val/total)*100).toFixed(1);
                        return `${ctx.label}: PKR ${val.toLocaleString()} (${perc}%)`;
                    }}
                }
            }
        }
    });
}

function initTopItemsChart() {
    const ctx = document.getElementById('topItemsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: { labels: salesData.topItems.labels, datasets: [{ label: 'Quantity Sold', data: salesData.topItems.quantities, backgroundColor: 'rgba(13,110,253,0.7)', borderColor: 'rgb(13,110,253)', borderWidth: 2 }] },
        options: { responsive: true, indexAxis: 'y', scales: { x: { beginAtZero:true, ticks:{stepSize:10} } }, plugins:{legend:{display:false}, tooltip:{callbacks:{label: ctx=>'Sold: '+ctx.parsed.x+' units'}}} }
    });
}

// --- Populate sales table ---
function populateSalesTable(filteredData = null) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const dataToDisplay = filteredData || salesData.items;
    if (!dataToDisplay.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>'; return; }

    dataToDisplay.forEach(item => {
        const total = item.qty * item.price;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.date}</td><td>${item.name}</td><td>${item.qty}</td><td>PKR ${item.price.toLocaleString()}</td><td>PKR ${total.toLocaleString()}</td><td><span class="badge-payment ${item.payment==='cash'?'bg-success':'bg-info'}">${item.payment==='cash'?'Cash':'Online'}</span></td>`;
        tbody.appendChild(row);
    });
}

// --- Render bills list ---
async function renderBillsList(billsInput = null) {
    const container = document.getElementById('billsList'); if(!container) return;
    const bills = billsInput ? billsInput.slice() : await fetchSalesBills();
    bills.reverse();
    if(!bills.length){ container.innerHTML='<div class="text-muted">No bills yet</div>'; return; }
    container.innerHTML='';
    bills.forEach(b => {
        const cash = Number(b.payments?.cash)||0, online=Number(b.payments?.online)||0;
        let payLabel='Mixed', badgeClass='bg-secondary';
        if(cash>0 && online===0){payLabel='Cash';badgeClass='bg-success';}
        else if(online>0 && cash===0){payLabel='Online';badgeClass='bg-info';}

        const el = document.createElement('div');
        el.className='bill-card card mb-2 p-2';
        el.innerHTML = `<div class="d-flex justify-content-between align-items-center"><div><strong>Bill #${b.id}</strong><div class="text-muted small">${new Date(b.date).toLocaleString()}</div></div><div class="text-end"><span class="badge ${badgeClass} mb-1">${payLabel}</span><div class="fw-bold">PKR ${Number(b.total).toLocaleString()}</div><div class="small text-muted">Items: ${b.items.length}</div><button class="btn btn-sm btn-outline-primary mt-1" data-bill-id="${b.id}">View</button></div></div>`;
        container.appendChild(el);
    });

    // Attach handlers
    container.querySelectorAll('button[data-bill-id]').forEach(btn=>btn.addEventListener('click',function(){openBillModal(Number(this.getAttribute('data-bill-id'))) }));
}

// --- Open Bill Modal ---
async function openBillModal(billId){
    const bills = await fetchSalesBills();
    const bill = bills.find(b=>b.id===billId);
    if(!bill){alert('Bill not found');return;}
    const modalTitle=document.getElementById('billModalTitle');
    const modalBody=document.getElementById('billModalBody');
    modalTitle.textContent=`Bill #${bill.id} — ${new Date(bill.date).toLocaleString()}`;
    let html='<div class="table-responsive"><table class="table"><thead><tr><th>Item</th><th class="text-end">Qty</th><th class="text-end">Unit</th><th class="text-end">Total</th></tr></thead><tbody>';
    bill.items.forEach(it=>{ const total=it.qty*it.price; html+=`<tr><td>${it.name}</td><td class="text-end">${it.qty}</td><td class="text-end">PKR ${it.price.toLocaleString()}</td><td class="text-end">PKR ${total.toLocaleString()}</td></tr>`});
    html+='</tbody></table></div>';
    html+=`<div class="mt-2"><strong>Total: PKR ${bill.total.toLocaleString()}</strong></div>`;
    html+=`<div class="small text-muted mt-1">Payments: Cash PKR ${bill.payments.cash.toLocaleString()} | Online PKR ${bill.payments.online.toLocaleString()}</div>`;
    modalBody.innerHTML=html;
    new bootstrap.Modal(document.getElementById('billModal')).show();
}

// --- Filters ---
async function applyFilters(){
    const startDate=document.getElementById('startDate').value;
    const endDate=document.getElementById('endDate').value;
    const paymentFilter=document.getElementById('paymentFilter').value;
    let bills=await fetchSalesBills();
    if(startDate) bills=bills.filter(b=>b.dateSimple>=startDate);
    if(endDate) bills=bills.filter(b=>b.dateSimple<=endDate);
    if(paymentFilter!=='all'){
        bills=bills.filter(b=>{
            if(paymentFilter==='cash') return Number(b.payments?.cash)>0;
            else return Number(b.payments?.online)>0;
        });
    }
    renderBillsList(bills);
    showNotification(`Filters applied! Found ${bills.length} bills.`);
}

// --- CSV Export ---
async function exportReport(){
    const bills=await fetchSalesBills();
    if(!bills.length){showNotification('No bills to export'); return;}
    let csv='BillID,Date,ItemsCount,Total,CashPaid,OnlinePaid,PaymentMethod,Items\n';
    bills.forEach(b=>{
        const cash=Number(b.payments?.cash)||0, online=Number(b.payments?.online)||0;
        let method='Mixed'; if(cash>0&&online===0) method='Cash'; else if(online>0&&cash===0) method='Online';
        const itemsStr=b.items.map(it=>`${it.name} x${it.qty} @${it.price}`).join(' | ');
        csv+=`${b.id},${b.date},${b.items.length},${b.total},${cash},${online},${method},"${itemsStr.replace(/"/g,'""')}"\n`;
    });
    const link=document.createElement('a'); link.setAttribute('href','data:text/csv;charset=utf-8,'+encodeURIComponent(csv));
    link.setAttribute('download',`bills_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showNotification('Bills exported successfully!');
}

function showNotification(msg){alert(msg);}
function setDefaultDates(){ const today=new Date(); const lastWeek=new Date(today.getTime()-7*24*60*60*1000); document.getElementById('endDate').valueAsDate=today; document.getElementById('startDate').valueAsDate=lastWeek; }

// --- Init ---
document.addEventListener('DOMContentLoaded', async function(){
    setDefaultDates();
    salesData.items=await fetchSalesItems();
    buildAggregatesFromItems();
    await calculateTotals();
    initDailySalesChart();
    initPaymentChart();
    initTopItemsChart();
    await renderBillsList();
});
