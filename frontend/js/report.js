// ----------------------------
// Helper: Fetch bills from backend
// ----------------------------
async function fetchSalesBills() {
    try {
        const res = await fetch('http://localhost:3000/api/salesBills');
        const data = await res.json();
        // Map bills into usable format
        return data.map(b => ({
            id: b.id,
            date: new Date(b.date),
            items: JSON.parse(b.items || '[]'),
            total: Number(b.total || 0),
            payment: b.payment || 'Mixed'
        }));
    } catch(e) {
        console.error('Error fetching bills:', e);
        return [];
    }
}

// ----------------------------
// Apply filters
// ----------------------------
let filteredBills = [];

function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const paymentFilter = document.getElementById('paymentFilter').value;

    filteredBills = billsData.filter(bill => {
        let keep = true;
        if(startDate) keep = keep && (bill.date >= new Date(startDate));
        if(endDate) keep = keep && (bill.date <= new Date(endDate + 'T23:59:59'));
        if(paymentFilter !== 'all') keep = keep && (bill.payment === paymentFilter);
        return keep;
    });

    renderBills();
    calculateTotals();
    initCharts();
}

// ----------------------------
// Render totals
// ----------------------------
function calculateTotals() {
    const cash = filteredBills.filter(b => b.payment === 'cash')
        .reduce((sum,b) => sum + b.total, 0);
    const online = filteredBills.filter(b => b.payment !== 'cash')
        .reduce((sum,b) => sum + b.total, 0);
    document.getElementById('totalCash').textContent = `PKR ${cash.toLocaleString()}`;
    document.getElementById('totalOnline').textContent = `PKR ${online.toLocaleString()}`;
    document.getElementById('totalAmount').textContent = `PKR ${(cash+online).toLocaleString()}`;
    document.getElementById('totalOrders').textContent = filteredBills.length;
}

// ----------------------------
// Render bills list
// ----------------------------
function renderBills() {
    const container = document.getElementById('billsList');
    container.innerHTML = '';
    if(!filteredBills.length){
        container.innerHTML = '<div class="text-muted">No bills found</div>';
        return;
    }

    filteredBills.slice().reverse().forEach(b => {
        const badgeClass = b.payment === 'cash' ? 'bg-success' :
                           b.payment === 'online' ? 'bg-info' : 'bg-secondary';
        const badgeText = b.payment.charAt(0).toUpperCase() + b.payment.slice(1);

        const div = document.createElement('div');
        div.className = 'bill-card card mb-2 p-2';
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>Bill #${b.id}</strong>
                    <div class="text-muted small">${b.date.toLocaleString()}</div>
                </div>
                <div class="text-end">
                    <span class="badge ${badgeClass} mb-1">${badgeText}</span>
                    <div class="fw-bold">PKR ${b.total.toLocaleString()}</div>
                    <div class="small text-muted">Items: ${b.items.length}</div>
                    <button class="btn btn-sm btn-outline-primary mt-1" onclick="showBillModal(${b.id})">View</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ----------------------------
// Show modal for bill details
// ----------------------------
function showBillModal(billId) {
    const bill = filteredBills.find(b => b.id === billId);
    if(!bill) return;

    document.getElementById('billModalTitle').textContent = `Bill #${bill.id}`;
    const body = document.getElementById('billModalBody');
    body.innerHTML = '<table class="table table-sm"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>' +
        bill.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>PKR ${i.price.toLocaleString()}</td><td>PKR ${(i.qty*i.price).toLocaleString()}</td></tr>`).join('') +
        `</tbody></table>
         <div class="text-end fw-bold mt-2">Total: PKR ${bill.total.toLocaleString()}</div>`;
    const modal = new bootstrap.Modal(document.getElementById('billModal'));
    modal.show();
}

// ----------------------------
// Initialize charts
// ----------------------------
let charts = {};

function initCharts() {
    const items = filteredBills.flatMap(b => b.items.map(i => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        payment: b.payment
    })));

    // Top items
    const agg = {};
    items.forEach(i => agg[i.name] = (agg[i.name]||0)+i.qty);
    const topItems = Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,5);

    // Destroy old charts
    for(const c of Object.values(charts)) if(c) c.destroy();

    // Daily sales (last 7 days)
    const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().split('T')[0]; });
    const dailyCash = last7.map(d=>items.filter(it=>it.payment==='cash' && it.date?.startsWith?.(d)).reduce((a,b)=>a+b.qty*b.price,0));
    const dailyOnline = last7.map(d=>items.filter(it=>it.payment!=='cash' && it.date?.startsWith?.(d)).reduce((a,b)=>a+b.qty*b.price,0));

    charts.daily = new Chart(document.getElementById('dailySalesChart').getContext('2d'),{
        type:'bar',
        data:{
            labels:last7,
            datasets:[
                {label:'Cash',data:dailyCash,backgroundColor:'rgba(25,135,84,0.7)',borderColor:'rgb(25,135,84)',borderWidth:2},
                {label:'Online',data:dailyOnline,backgroundColor:'rgba(13,202,240,0.7)',borderColor:'rgb(13,202,240)',borderWidth:2}
            ]
        }
    });

    // Payment chart
    const totalCash = items.filter(i=>i.payment==='cash').reduce((a,b)=>a+b.qty*b.price,0);
    const totalOnline = items.filter(i=>i.payment!=='cash').reduce((a,b)=>a+b.qty*b.price,0);
    charts.payment = new Chart(document.getElementById('paymentChart').getContext('2d'),{
        type:'doughnut',
        data:{
            labels:['Cash','Online'],
            datasets:[{data:[totalCash,totalOnline],backgroundColor:['rgba(25,135,84,0.8)','rgba(13,202,240,0.8)'],borderColor:'#fff'}]
        }
    });

    // Top items chart
    charts.top = new Chart(document.getElementById('topItemsChart').getContext('2d'),{
        type:'bar',
        data:{
            labels: topItems.map(t=>t[0]),
            datasets:[{label:'Quantity Sold',data:topItems.map(t=>t[1]),backgroundColor:'rgba(13,110,253,0.7)',borderColor:'rgb(13,110,253)',borderWidth:2}]
        },
        options:{indexAxis:'y'}
    });
}

// ----------------------------
// Export to CSV
// ----------------------------
function exportReport() {
    if(!filteredBills.length) return alert('No data to export');
    let csv = 'Bill ID,Date,Payment,Total,Items\n';
    filteredBills.forEach(b => {
        const itemsStr = b.items.map(i=>`${i.name} x${i.qty}`).join('; ');
        csv += `${b.id},"${b.date.toLocaleString()}",${b.payment},${b.total},"${itemsStr}"\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SalesReport.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ----------------------------
// Init page
// ----------------------------
let billsData = [];
document.addEventListener('DOMContentLoaded',async()=>{
    billsData = await fetchSalesBills();
    filteredBills = billsData.slice(); // initially all bills
    applyFilters(); // render everything
});
