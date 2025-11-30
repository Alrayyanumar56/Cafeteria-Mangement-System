// ===== Sample Offline Sales Data =====
const sales24 = [
    {
        id: 1,
        items: [
            { id: 5, name: "Sandwich", price: 150, qty: 1 },
            { id: 4, name: "Coffee", price: 100, qty: 1 },
            { id: 3, name: "Tea", price: 70, qty: 1 }
        ],
        total: 320,
        payment: "cash",
        date: new Date("2025-11-30 21:16:49")
    },
    {
        id: 2,
        items: [
            { id: 3, name: "Tea", price: 70, qty: 2 }
        ],
        total: 140,
        payment: "online",
        date: new Date("2025-11-30 22:10:00")
    }
];

// ===== Populate Table =====
function populateSalesTable(bills) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    bills.forEach(b => {
        b.items.forEach(it => {
            tbody.innerHTML += `<tr>
                <td>${b.date.toLocaleString()}</td>
                <td>${it.name}</td>
                <td>${it.qty}</td>
                <td>PKR ${it.price}</td>
                <td>PKR ${it.qty * it.price}</td>
                <td>${b.payment}</td>
            </tr>`;
        });
    });
    if(bills.length === 0) tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records</td></tr>';
}

// ===== Calculate Totals =====
function calculateTotals(bills) {
    let cash = 0, online = 0;
    bills.forEach(b => b.payment === 'cash' ? cash += b.total : online += b.total);
    document.getElementById('totalCash').textContent = `PKR ${cash}`;
    document.getElementById('totalOnline').textContent = `PKR ${online}`;
    document.getElementById('totalAmount').textContent = `PKR ${cash + online}`;
    document.getElementById('totalOrders').textContent = bills.length;
}

// ===== Filters =====
function applyFilters() {
    const start = document.getElementById('startDate').value ? new Date(document.getElementById('startDate').value) : null;
    const end = document.getElementById('endDate').value ? new Date(document.getElementById('endDate').value) : null;
    const payment = document.getElementById('paymentFilter').value;

    const filtered = sales24.filter(b => {
        let ok = true;
        if(start) ok = ok && b.date >= start;
        if(end) ok = ok && b.date <= end;
        if(payment !== 'all') ok = ok && b.payment === payment;
        return ok;
    });

    populateSalesTable(filtered);
    calculateTotals(filtered);
}

// ===== Export CSV =====
function exportReport() {
    let csv = 'Date,Item,Qty,Price,Total,Payment\n';
    sales24.forEach(b => {
        b.items.forEach(it => {
            csv += `${b.date.toLocaleString()},${it.name},${it.qty},${it.price},${it.qty*it.price},${b.payment}\n`;
        });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Sales_Report.csv';
    a.click();
}

// ===== Charts =====
function initCharts(bills) {
    const itemsFlat = [];
    bills.forEach(b => b.items.forEach(it => itemsFlat.push({ ...it, payment: b.payment, date: b.date })));

    // Daily Sales Chart
    const dailyCtx = document.getElementById('dailySalesChart').getContext('2d');
    const dates = [...new Set(itemsFlat.map(i => i.date.toISOString().split('T')[0]))].sort();
    const cashDaily = dates.map(d => itemsFlat.filter(i => i.date.toISOString().startsWith(d) && i.payment==='cash').reduce((a,b)=>a+b.qty*b.price,0));
    const onlineDaily = dates.map(d => itemsFlat.filter(i => i.date.toISOString().startsWith(d) && i.payment==='online').reduce((a,b)=>a+b.qty*b.price,0));
    new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                { label: 'Cash', data: cashDaily, backgroundColor:'rgba(25,135,84,0.7)' },
                { label: 'Online', data: onlineDaily, backgroundColor:'rgba(13,202,240,0.7)' }
            ]
        }
    });

    // Payment Method Chart
    const payCtx = document.getElementById('paymentChart').getContext('2d');
    const totalCash = itemsFlat.filter(i=>i.payment==='cash').reduce((a,b)=>a+b.qty*b.price,0);
    const totalOnline = itemsFlat.filter(i=>i.payment==='online').reduce((a,b)=>a+b.qty*b.price,0);
    new Chart(payCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cash','Online'],
            datasets: [{ data: [totalCash,totalOnline], backgroundColor:['rgba(25,135,84,0.8)','rgba(13,202,240,0.8)'] }]
        }
    });

    // Top Items Chart
    const topMap = {};
    itemsFlat.forEach(it => topMap[it.name] = (topMap[it.name]||0)+it.qty);
    const topItems = Object.entries(topMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const topCtx = document.getElementById('topItemsChart').getContext('2d');
    new Chart(topCtx, {
        type: 'bar',
        data: {
            labels: topItems.map(t=>t[0]),
            datasets: [{ label: 'Quantity Sold', data: topItems.map(t=>t[1]), backgroundColor:'rgba(13,110,253,0.7)' }]
        },
        options: { indexAxis:'y' }
    });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    populateSalesTable(sales24);
    calculateTotals(sales24);
    initCharts(sales24);
});
