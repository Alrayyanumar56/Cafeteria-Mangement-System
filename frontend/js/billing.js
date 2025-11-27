const cart = [];

// Load custom menu items from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCustomMenuItems();
});

// Load and display custom menu items
function loadCustomMenuItems() {
    const customMenuItems = JSON.parse(localStorage.getItem('customMenuItems')) || [];
    const productGrid = document.getElementById('productGrid');
    
    // Add custom menu items to the product grid
    customMenuItems.forEach(item => {
        const productDiv = document.createElement('div');
        productDiv.className = 'col-6 col-sm-4 col-lg-3 product-item';
        productDiv.setAttribute('data-category', item.category);
        
        productDiv.innerHTML = `
            <div class="card product-card" onclick="addToCart(${item.id},'${item.name}',${item.price})">
                <img src="${item.image}" class="card-img-top" alt="product">
                <div class="card-body p-2 text-center">
                    <p class="price mb-1">Rs ${item.price.toFixed(0)}</p>
                    <p class="name mb-0">${item.name}</p>
                </div>
            </div>
        `;
        
        productGrid.appendChild(productDiv);
    });
}

// Add item to cart
function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, name, price, qty: 1 });
    renderCart();
}

// Render Cart Table
function renderCart() {
    const tbody = document.getElementById('cartTable');
    tbody.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td class="text-end">${item.price.toFixed(2)}</td>
            <td class="text-end">
                ${item.qty} 
                <button class="btn btn-sm btn-danger ms-2" onclick="decreaseQty(${index})">×</button>
            </td>
            <td class="text-end">${subtotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
        total += subtotal;
    });

    document.getElementById('totalAmount').innerText = total.toFixed(2);
    updateBalance();
}

// Decrease quantity by 1, remove if 1
function decreaseQty(index) {
    if (cart[index].qty > 1) cart[index].qty--;
    else cart.splice(index, 1);
    renderCart();
}

// Add custom item
function addCustomItem() {
    const name = document.getElementById('customName').value.trim();
    const price = parseFloat(document.getElementById('customPrice').value);
    const qty = parseInt(document.getElementById('customQty').value);

    if (!name || !price || !qty) {
        alert("Please fill all fields correctly!");
        return;
    }

    const id = Date.now();
    addToCart(id, name, price);
    for (let i = 1; i < qty; i++) addToCart(id, name, price);

    document.getElementById('customItemForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('customItemModal')).hide();
}

// Update balance
function updateBalance() {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const online = parseFloat(document.getElementById('onlineInput').value) || 0;
    const total = parseFloat(document.getElementById('totalAmount').innerText) || 0;
    const paid = cash + online;
    document.getElementById('balance').innerText = (paid - total).toFixed(2);
}

document.getElementById('cashInput')?.addEventListener('input', updateBalance);
document.getElementById('onlineInput')?.addEventListener('input', updateBalance);

// Category Filtering
document.getElementById('categoryList').addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
        const category = e.target.getAttribute('data-category');
        filterProducts(category);
        document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
        e.target.classList.add('active');
    }
});

function filterProducts(category) {
    const items = document.querySelectorAll('.product-item');
    items.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) item.style.display = 'block';
        else item.style.display = 'none';
    });
}

// Search
document.getElementById('productSearch').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    document.querySelectorAll('.product-item').forEach(item => {
        const name = item.querySelector('.name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'block' : 'none';
    });
});

// Checkout
function checkout() {
    const total = parseFloat(document.getElementById('totalAmount').innerText) || 0;
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const online = parseFloat(document.getElementById('onlineInput').value) || 0;
    const paid = cash + online;

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }
    if (paid < total) {
        alert("Insufficient payment!");
        return;
    }

    const balance = (paid - total).toFixed(2);
    alert(`Checkout successful!\nTotal: PKR ${total.toFixed(2)}\nCash: PKR ${cash.toFixed(2)}\nOnline: PKR ${online.toFixed(2)}\nBalance: PKR ${balance}`);

    // Persist sales records to localStorage so the Reports page can read them
    try {
        const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];

        // We'll allocate payments to items: consume cash first, then online for any remainder
        let availableCash = cash;

        cart.forEach(item => {
            const itemTotal = item.price * item.qty;

            // Determine how many units can be covered by cash
            let cashQty = 0;
            if (availableCash > 0) {
                cashQty = Math.min(item.qty, Math.floor(availableCash / item.price));
                availableCash -= cashQty * item.price;
            }

            // If some quantity is covered by cash, add that record
            if (cashQty > 0) {
                salesRecords.push({
                    date: new Date().toISOString().split('T')[0],
                    name: item.name,
                    qty: cashQty,
                    price: item.price,
                    payment: 'cash'
                });
            }

            const remainingQty = item.qty - cashQty;
            if (remainingQty > 0) {
                // Remaining paid by online (or mixed) - we mark as 'online' for reporting
                salesRecords.push({
                    date: new Date().toISOString().split('T')[0],
                    name: item.name,
                    qty: remainingQty,
                    price: item.price,
                    payment: 'online'
                });
            }
        });

        localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
    } catch (e) {
        console.error('Failed to save sales records:', e);
    }

    // Save the checkout as a sale-level bill so Reports can show individual bills
    try {
        const bills = JSON.parse(localStorage.getItem('salesBills')) || [];
        // snapshot items (deep copy current cart before clearing)
        const billItems = cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));
        const billTotal = billItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
        const bill = {
            id: Date.now(),
            date: new Date().toISOString(),
            dateSimple: new Date().toISOString().split('T')[0],
            items: billItems,
            payments: { cash: Number(cash) || 0, online: Number(online) || 0 },
            total: billTotal
        };
        bills.push(bill);
        localStorage.setItem('salesBills', JSON.stringify(bills));
    } catch (e) {
        console.error('Failed to save sale-level bill:', e);
    }

    // Decrement inventory quantities for sold items (persist to localStorage)
    try {
        // Load stored inventory (fall back to window.inventory if available)
        let storedInventory = JSON.parse(localStorage.getItem('inventory')) || null;
        if (!storedInventory && window.inventory) storedInventory = window.inventory;

        if (storedInventory) {
            // For each cart item, find inventory item by name (case-insensitive) and decrement qty
            cart.forEach(item => {
                const name = (item.name || '').toString().toLowerCase();
                const inv = storedInventory.find(ii => (ii.name || '').toString().toLowerCase() === name);
                if (inv) {
                    inv.qty = Math.max(0, (Number(inv.qty) || 0) - Number(item.qty || 0));
                }
            });

            localStorage.setItem('inventory', JSON.stringify(storedInventory));
        }
    } catch (e) {
        console.error('Failed to update inventory after checkout:', e);
    }

    // Clear cart and reset UI
    cart.length = 0;
    renderCart();
    document.getElementById('cashInput').value = '';
    document.getElementById('onlineInput').value = '';
    document.getElementById('balance').innerText = '0.00';
}

// Hold Orders
let heldOrders = [];
function holdOrder() {
    if (cart.length === 0) { alert("Cart is empty!"); return; }
    const orderType = document.getElementById('orderType').value;
    heldOrders.push({ cart: [...cart], orderType, total: parseFloat(document.getElementById('totalAmount').innerText) });
    alert(`Order held! (${heldOrders.length} held orders)`);
    cart.length = 0;
    renderCart();
    document.getElementById('cashInput').value = '';
    document.getElementById('onlineInput').value = '';
    document.getElementById('balance').innerText = '0.00';
}