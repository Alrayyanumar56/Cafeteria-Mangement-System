const cart = [];

// Load menu items from backend
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    setupCategoryFilter();
});
// Set up category filter click events
function setupCategoryFilter() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    categoryList.addEventListener('click', function(e) {
        if (e.target && e.target.tagName === 'LI') {
            // Remove active from all
            Array.from(categoryList.children).forEach(li => li.classList.remove('active'));
            e.target.classList.add('active');
            filterProductsByCategory(e.target.getAttribute('data-category'));
        }
    });
}

function filterProductsByCategory(category) {
    const items = document.querySelectorAll('.product-item');
    items.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

async function loadMenuItems() {
    try {
        const res = await fetch('http://localhost:3000/api/menu');
        const menuItems = await res.json();
        populateProductGrid(menuItems);
    } catch (err) {
        console.error('Failed to load menu:', err);
        alert('Error loading menu items from server.');
    }
}

function populateProductGrid(menuItems) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    menuItems.forEach(item => {
        const priceNum = parseFloat(item.price); // convert price to number
        let category = item.category;
        if (category === 'cold-drinks' || category === 'hot-drinks') category = 'drinks';
        if (category === 'fast-food' || category === 'essentials') return; // skip removed categories

        const productDiv = document.createElement('div');
        productDiv.className = 'col-6 col-sm-4 col-lg-3 product-item';
        productDiv.setAttribute('data-category', category);

        productDiv.innerHTML = `
            <div class="card product-card" onclick="addToCart(${item.id},'${item.name}',${priceNum})">
                <img src="${item.image || '/default.png'}" class="card-img-top" alt="product">
                <div class="card-body p-2 text-center">
                    <p class="price mb-1">Rs ${priceNum.toFixed(0)}</p>
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

// Render cart table
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

// Decrease quantity by 1
function decreaseQty(index) {
    if (cart[index].qty > 1) cart[index].qty--;
    else cart.splice(index, 1);
    renderCart();
}

// Checkout and save sales to backend
async function checkout() {
    const total = parseFloat(document.getElementById('totalAmount').innerText) || 0;
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const online = parseFloat(document.getElementById('onlineInput').value) || 0;
    const paid = cash + online;

    if (cart.length === 0) { alert("Cart is empty!"); return; }
    if (paid < total) { alert("Insufficient payment!"); return; }

    const saleData = {
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total_amount: total,
        payment_type: cash >= total ? 'cash' : (cash > 0 && online > 0 ? 'mixed' : 'online')
    };

    try {
        const res = await fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (!res.ok) throw new Error('Failed to save sale.');

        alert(`Checkout successful!\nTotal: PKR ${total.toFixed(2)}\nPaid: PKR ${paid.toFixed(2)}\nBalance: PKR ${(paid-total).toFixed(2)}`);
        cart.length = 0;
        renderCart();
        document.getElementById('cashInput').value = '';
        document.getElementById('onlineInput').value = '';
    } catch (err) {
        console.error(err);
        alert('Error saving sale to server.');
    }
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
