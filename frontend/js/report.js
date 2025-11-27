// Reports Page JavaScript

// Sample data - Replace with actual data from your backend/database
const salesData = {
    daily: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        cash: [1200, 1900, 800, 1500, 2100, 2800, 3200],
        online: [800, 1200, 600, 900, 1400, 1900, 2100]
    },
    items: [
        { date: '2024-11-27', name: 'Cappuccino', qty: 5, price: 250, payment: 'cash' },
        { date: '2024-11-27', name: 'Latte', qty: 3, price: 280, payment: 'online' },
        { date: '2024-11-27', name: 'Espresso', qty: 8, price: 200, payment: 'cash' },
        { date: '2024-11-26', name: 'Mocha', qty: 4, price: 320, payment: 'online' },
        { date: '2024-11-26', name: 'Croissant', qty: 6, price: 150, payment: 'cash' },
        { date: '2024-11-25', name: 'Cappuccino', qty: 7, price: 250, payment: 'online' },
        { date: '2024-11-25', name: 'Sandwich', qty: 4, price: 350, payment: 'cash' },
        { date: '2024-11-24', name: 'Latte', qty: 5, price: 280, payment: 'cash' },
        { date: '2024-11-24', name: 'Espresso', qty: 6, price: 200, payment: 'online' },
        { date: '2024-11-23', name: 'Mocha', qty: 3, price: 320, payment: 'cash' },
    ],
    topItems: {
        labels: ['Cappuccino', 'Latte', 'Espresso', 'Mocha', 'Croissant'],
        quantities: [45, 38, 52, 28, 35]
    }
};

// Helpers to persist/load sales records in localStorage so billing can write and reports read
function getStoredSales() {
    try {
        const stored = JSON.parse(localStorage.getItem('salesRecords')) || [];
        // Ensure proper shape (date, name, qty, price, payment)
        return stored.map(r => ({
            date: r.date,
            name: r.name,
            qty: Number(r.qty) || 0,
            price: Number(r.price) || 0,
            payment: r.payment || 'cash'
        }));
    } catch (e) {
        console.error('Failed to parse stored sales:', e);
        return [];
    }
}

function buildAggregatesFromItems() {
    const items = getStoredSales();
    if (items.length > 0) {
        salesData.items = items;
    }

    // Top items (by quantity)
    const qtyByItem = {};
    salesData.items.forEach(it => {
        qtyByItem[it.name] = (qtyByItem[it.name] || 0) + (Number(it.qty) || 0);
    });
    const top = Object.entries(qtyByItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    salesData.topItems.labels = top.map(t => t[0]);
    salesData.topItems.quantities = top.map(t => t[1]);

    // Daily aggregates for last 7 days (YYYY-MM-DD)
    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        last7.push(d.toISOString().split('T')[0]);
    }
    salesData.daily.labels = last7.map(d => d);
    salesData.daily.cash = last7.map(() => 0);
    salesData.daily.online = last7.map(() => 0);

    salesData.items.forEach(it => {
        const idx = salesData.daily.labels.indexOf(it.date);
        const amount = (Number(it.qty) || 0) * (Number(it.price) || 0);
        if (idx >= 0) {
            if (it.payment === 'cash') salesData.daily.cash[idx] += amount;
            else salesData.daily.online[idx] += amount;
        }
    });
}

// Calculate totals from sales data
function calculateTotals() {
    let totalCash = 0;
    let totalOnline = 0;
    // totalOrders should reflect number of bills (invoices), not flattened item records
    let totalOrders = getStoredBills().length;

    salesData.items.forEach(item => {
        const itemTotal = item.qty * item.price;
        if (item.payment === 'cash') {
            totalCash += itemTotal;
        } else {
            totalOnline += itemTotal;
        }
    });

    // Update DOM elements
    document.getElementById('totalCash').textContent = `PKR ${totalCash.toLocaleString()}`;
    document.getElementById('totalOnline').textContent = `PKR ${totalOnline.toLocaleString()}`;
    document.getElementById('totalAmount').textContent = `PKR ${(totalCash + totalOnline).toLocaleString()}`;
    document.getElementById('totalOrders').textContent = totalOrders;
}

// Initialize Daily Sales Chart
function initDailySalesChart() {
    const ctx = document.getElementById('dailySalesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salesData.daily.labels,
            datasets: [
                {
                    label: 'Cash',
                    data: salesData.daily.cash,
                    backgroundColor: 'rgba(25, 135, 84, 0.7)',
                    borderColor: 'rgb(25, 135, 84)',
                    borderWidth: 2
                },
                {
                    label: 'Online',
                    data: salesData.daily.online,
                    backgroundColor: 'rgba(13, 202, 240, 0.7)',
                    borderColor: 'rgb(13, 202, 240)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'PKR ' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': PKR ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Initialize Payment Method Chart
function initPaymentChart() {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    // Calculate payment totals
    let cashTotal = 0;
    let onlineTotal = 0;
    
    salesData.items.forEach(item => {
        const itemTotal = item.qty * item.price;
        if (item.payment === 'cash') {
            cashTotal += itemTotal;
        } else {
            onlineTotal += itemTotal;
        }
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Online Payment'],
            datasets: [{
                data: [cashTotal, onlineTotal],
                backgroundColor: [
                    'rgba(25, 135, 84, 0.8)',
                    'rgba(13, 202, 240, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': PKR ' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Initialize Top Items Chart
function initTopItemsChart() {
    const ctx = document.getElementById('topItemsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salesData.topItems.labels,
            datasets: [{
                label: 'Quantity Sold',
                data: salesData.topItems.quantities,
                backgroundColor: 'rgba(13, 110, 253, 0.7)',
                borderColor: 'rgb(13, 110, 253)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Sold: ' + context.parsed.x + ' units';
                        }
                    }
                }
            }
        }
    });
}

// Populate Sales Table
function populateSalesTable(filteredData = null) {
    const tbody = document.getElementById('salesTableBody');
    // If the detailed table was removed from the DOM, do nothing
    if (!tbody) return;
    tbody.innerHTML = '';

    const dataToDisplay = filteredData || salesData.items;

    if (dataToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>';
        return;
    }

    dataToDisplay.forEach(item => {
        const total = item.qty * item.price;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>PKR ${item.price.toLocaleString()}</td>
            <td>PKR ${total.toLocaleString()}</td>
            <td>
                <span class="badge-payment ${item.payment === 'cash' ? 'bg-success' : 'bg-info'}">
                    ${item.payment === 'cash' ? 'Cash' : 'Online'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- Bills (individual sale invoices) ---
function getStoredBills() {
    try {
        return JSON.parse(localStorage.getItem('salesBills')) || [];
    } catch (e) {
        console.error('Failed to parse salesBills', e);
        return [];
    }
}

function renderBillsList(billsInput = null) {
    const container = document.getElementById('billsList');
    if (!container) return;

    const bills = billsInput ? billsInput.slice() : getStoredBills().slice();
    bills.reverse(); // newest first
    if (bills.length === 0) {
        container.innerHTML = '<div class="text-muted">No bills yet</div>';
        return;
    }

    container.innerHTML = '';
    bills.forEach(b => {
        // determine payment method badge
        const cash = Number(b.payments?.cash) || 0;
        const online = Number(b.payments?.online) || 0;
        let payLabel = 'Mixed';
        let badgeClass = 'bg-secondary';
        if (cash > 0 && online === 0) { payLabel = 'Cash'; badgeClass = 'bg-success'; }
        else if (online > 0 && cash === 0) { payLabel = 'Online'; badgeClass = 'bg-info'; }

        const el = document.createElement('div');
        el.className = 'bill-card card mb-2 p-2';
        el.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>Bill #${b.id}</strong>
                    <div class="text-muted small">${new Date(b.date).toLocaleString()}</div>
                </div>
                <div class="text-end">
                    <span class="badge ${badgeClass} mb-1">${payLabel}</span>
                    <div class="fw-bold">PKR ${Number(b.total).toLocaleString()}</div>
                    <div class="small text-muted">Items: ${b.items.length}</div>
                    <button class="btn btn-sm btn-outline-primary mt-1" data-bill-id="${b.id}">View</button>
                </div>
            </div>
        `;
        container.appendChild(el);
    });

    // Attach handlers
    container.querySelectorAll('button[data-bill-id]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = Number(this.getAttribute('data-bill-id'));
            openBillModal(id);
        });
    });
}

function openBillModal(billId) {
    const bills = getStoredBills();
    const bill = bills.find(b => Number(b.id) === Number(billId));
    if (!bill) { alert('Bill not found'); return; }

    // Populate modal content
    const modalTitle = document.getElementById('billModalTitle');
    const modalBody = document.getElementById('billModalBody');
    modalTitle.textContent = `Bill #${bill.id} — ${new Date(bill.date).toLocaleString()}`;
    let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Item</th><th class="text-end">Qty</th><th class="text-end">Unit</th><th class="text-end">Total</th></tr></thead><tbody>';
    bill.items.forEach(it => {
        const total = (Number(it.qty) || 0) * (Number(it.price) || 0);
        html += `<tr><td>${it.name}</td><td class="text-end">${it.qty}</td><td class="text-end">PKR ${Number(it.price).toLocaleString()}</td><td class="text-end">PKR ${total.toLocaleString()}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    html += `<div class="mt-2"><strong>Total: PKR ${Number(bill.total).toLocaleString()}</strong></div>`;
    html += `<div class="small text-muted mt-1">Payments: Cash PKR ${Number(bill.payments.cash).toLocaleString()} | Online PKR ${Number(bill.payments.online).toLocaleString()}</div>`;
    modalBody.innerHTML = html;

    // Show bootstrap modal
    const modalEl = document.getElementById('billModal');
    new bootstrap.Modal(modalEl).show();
}

// Apply Filters
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    // Filter bills instead of per-item table
    let bills = getStoredBills();

    if (startDate) {
        bills = bills.filter(b => b.dateSimple >= startDate);
    }
    if (endDate) {
        bills = bills.filter(b => b.dateSimple <= endDate);
    }

    if (paymentFilter !== 'all') {
        if (paymentFilter === 'cash') bills = bills.filter(b => (Number(b.payments?.cash) || 0) > 0);
        else if (paymentFilter === 'online') bills = bills.filter(b => (Number(b.payments?.online) || 0) > 0);
    }

    renderBillsList(bills);
    showNotification(`Filters applied! Found ${bills.length} bills.`);
}

// Export Report to CSV
function exportReport() {
    // Export bills as CSV (one row per bill)
    const bills = getStoredBills();
    if (!bills.length) { showNotification('No bills to export'); return; }

    let csv = '';
    csv += 'BillID,Date,ItemsCount,Total,CashPaid,OnlinePaid,PaymentMethod,Items\n';
    bills.forEach(b => {
        const cash = Number(b.payments?.cash) || 0;
        const online = Number(b.payments?.online) || 0;
        let method = 'Mixed';
        if (cash > 0 && online === 0) method = 'Cash';
        else if (online > 0 && cash === 0) method = 'Online';
        const itemsStr = b.items.map(it => `${it.name} x${it.qty} @${it.price}`).join(' | ');
        // Escape double quotes
        const escapedItems = '"' + itemsStr.replace(/"/g, '""') + '"';
        csv += `${b.id},${(b.date || '')},${b.items.length},${b.total},${cash},${online},${method},${escapedItems}\n`;
    });

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bills_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Bills exported successfully!');
}

// Show notification (simple alert for now - can be enhanced with toast notifications)
function showNotification(message) {
    alert(message);
}

// Set default dates to last 7 days
function setDefaultDates() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = lastWeek;
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    // Load stored sales and rebuild aggregates
    buildAggregatesFromItems();
    calculateTotals();
    // Initialize charts after aggregates are ready
    initDailySalesChart();
    initPaymentChart();
    initTopItemsChart();
    // Render bills list (this also acts as the detailed sales record)
    renderBillsList();
});