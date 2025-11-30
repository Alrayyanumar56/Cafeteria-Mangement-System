// Load and display menu items on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchMenuItems();
});

// Handle form submission
document.getElementById('addMenuForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value.trim();
    const itemCategory = document.getElementById('itemCategory').value;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const itemImage = document.getElementById('itemImage').value.trim() || 'https://via.placeholder.com/150';

    // Validate inputs
    if (!itemName || !itemCategory || !itemPrice || itemPrice <= 0) {
        alert('Please fill all required fields correctly!');
        return;
    }

    const newItem = {
        name: itemName,
        category: itemCategory,
        price: itemPrice,
        unit: 'pcs', // you can also get unit from a form field if needed
        image: itemImage
    };

    try {
        const response = await fetch('http://localhost:3000/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });

        if (!response.ok) throw new Error('Failed to add menu item.');

        alert(`✓ "${itemName}" has been added to the menu!`);
        this.reset();
        fetchMenuItems(); // refresh the list
    } catch (err) {
        console.error(err);
        alert('Error adding menu item. Check console for details.');
    }
});

// Fetch and display menu items from backend
async function fetchMenuItems() {
    try {
        const response = await fetch('http://localhost:3000/api/menu');
        const menuItems = await response.json();

        displayMenuItems(menuItems);
        updateStatistics(menuItems);
    } catch (err) {
        console.error(err);
        alert('Error fetching menu items.');
    }
}

// Display menu items
function displayMenuItems(menuItems) {
    const container = document.getElementById('menuItemsList');
    
    if (menuItems.length === 0) {
        container.innerHTML = `<div class="alert alert-info text-center">
            <i class="bi bi-info-circle"></i> No menu items added yet.
        </div>`;
        return;
    }

    const groupedItems = {};
    menuItems.forEach(item => {
        if (!groupedItems[item.category]) groupedItems[item.category] = [];
        groupedItems[item.category].push(item);
    });

    let html = '';
    for (const [category, items] of Object.entries(groupedItems)) {
        html += `<div class="mb-3">
            <h6 class="text-primary text-capitalize fw-bold">${category.replace('-', ' & ')}</h6>
            <div class="list-group">`;

        items.forEach(item => {
            html += `<div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.name}</strong><br>
                    <small class="text-muted">PKR ${parseFloat(item.price).toFixed(2)}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>`;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html;
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/menu/${itemId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete item.');

        alert('Item deleted successfully!');
        fetchMenuItems(); // refresh
    } catch (err) {
        console.error(err);
        alert('Error deleting menu item.');
    }
}

// Clear all menu items (confirmation required).
async function clearAllMenuItems() {
    if (!confirm('Are you sure you want to delete ALL menu items? This action cannot be undone.')) return;
    try {
        const res = await fetch('http://localhost:3000/api/menu');
        const items = await res.json();
        if (!items.length) { alert('No menu items to delete'); return; }

        // Delete all items sequentially to avoid server overload
        for (const it of items) {
            await fetch(`http://localhost:3000/api/menu/${it.id}`, { method: 'DELETE' });
        }
        alert('All menu items have been deleted.');
        fetchMenuItems();
    } catch (err) {
        console.error(err);
        alert('Error deleting menu items. See console.');
    }
}

// Update statistics
function updateStatistics(menuItems) {
    document.getElementById('totalItems').textContent = menuItems.length;
    const breakfastCount = menuItems.filter(i => i.category === 'breakfast').length;
    const mealsCount = menuItems.filter(i => i.category === 'meals').length;
    const bakeryCount = menuItems.filter(i => i.category === 'bakery').length;
    const snacksCount = menuItems.filter(i => i.category === 'snacks').length;
    // Merge cold-drinks and hot-drinks into drinks
    const drinksCount = menuItems.filter(i => i.category === 'drinks' || i.category === 'cold-drinks' || i.category === 'hot-drinks').length;
    const shakesCount = menuItems.filter(i => i.category === 'shakes').length;
    document.getElementById('breakfastCount').textContent = breakfastCount;
    document.getElementById('mealsCount').textContent = mealsCount;
    document.getElementById('bakeryCount').textContent = bakeryCount;
    document.getElementById('snacksCount').textContent = snacksCount;
    document.getElementById('drinksCount').textContent = drinksCount;
    document.getElementById('shakesCount').textContent = shakesCount;
}
