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

// Calculate totals from sales data
function calculateTotals() {
    let totalCash = 0;
    let totalOnline = 0;
    let totalOrders = salesData.items.length;

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

// Apply Filters
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const paymentFilter = document.getElementById('paymentFilter').value;

    let filteredData = [...salesData.items];

    // Filter by date range
    if (startDate) {
        filteredData = filteredData.filter(item => item.date >= startDate);
    }
    if (endDate) {
        filteredData = filteredData.filter(item => item.date <= endDate);
    }

    // Filter by payment method
    if (paymentFilter !== 'all') {
        filteredData = filteredData.filter(item => item.payment === paymentFilter);
    }

    // Update table with filtered data
    populateSalesTable(filteredData);

    // Show notification
    showNotification(`Filters applied! Found ${filteredData.length} records.`);
}

// Export Report to CSV
function exportReport() {
    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Item Name,Quantity,Unit Price,Total,Payment Method\n";

    salesData.items.forEach(item => {
        const total = item.qty * item.price;
        const row = `${item.date},${item.name},${item.qty},${item.price},${total},${item.payment}`;
        csvContent += row + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Report exported successfully!');
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
    calculateTotals();
    initDailySalesChart();
    initPaymentChart();
    initTopItemsChart();
    populateSalesTable();
});