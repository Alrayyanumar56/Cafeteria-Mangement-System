const cart = [];

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
