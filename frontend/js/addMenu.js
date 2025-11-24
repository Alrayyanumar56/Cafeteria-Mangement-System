// Initialize menu items from localStorage or create empty array
let menuItems = JSON.parse(localStorage.getItem('customMenuItems')) || [];

// Load and display menu items on page load
document.addEventListener('DOMContentLoaded', function() {
    displayMenuItems();
    updateStatistics();
});

// Handle form submission
document.getElementById('addMenuForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value.trim();
    const itemCategory = document.getElementById('itemCategory').value;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const itemImage = document.getElementById('itemImage').value.trim() || '/mnt/data/ad0b9d0e-8045-4937-a0a4-acb774f0f11b.png';

    // Validate inputs
    if (!itemName || !itemCategory || !itemPrice || itemPrice <= 0) {
        alert('Please fill all required fields correctly!');
        return;
    }

    // Create new menu item object
    const newItem = {
        id: Date.now(), // Unique ID based on timestamp
        name: itemName,
        category: itemCategory,
        price: itemPrice,
        image: itemImage
    };

    // Add to menuItems array
    menuItems.push(newItem);

    // Save to localStorage
    localStorage.setItem('customMenuItems', JSON.stringify(menuItems));

    // Show success message
    alert(`✓ "${itemName}" has been added to the menu!`);

    // Reset form
    this.reset();

    // Refresh display
    displayMenuItems();
    updateStatistics();
});

// Display all menu items
function displayMenuItems() {
    const container = document.getElementById('menuItemsList');
    
    if (menuItems.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> No menu items added yet. Add your first item using the form.
            </div>
        `;
        return;
    }

    // Group items by category
    const groupedItems = {};
    menuItems.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });

    // Create HTML for grouped items
    let html = '';
    for (const [category, items] of Object.entries(groupedItems)) {
        html += `
            <div class="mb-3">
                <h6 class="text-primary text-capitalize fw-bold">${category.replace('-', ' & ')}</h6>
                <div class="list-group">
        `;
        
        items.forEach(item => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.name}</strong>
                        <br>
                        <small class="text-muted">PKR ${item.price.toFixed(2)}</small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Delete a specific menu item
function deleteMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        menuItems = menuItems.filter(i => i.id !== itemId);
        localStorage.setItem('customMenuItems', JSON.stringify(menuItems));
        displayMenuItems();
        updateStatistics();
        alert('Item deleted successfully!');
    }
}

// Clear all menu items
function clearAllMenuItems() {
    if (menuItems.length === 0) {
        alert('No items to clear!');
        return;
    }

    if (confirm('Are you sure you want to delete ALL menu items? This action cannot be undone!')) {
        menuItems = [];
        localStorage.removeItem('customMenuItems');
        displayMenuItems();
        updateStatistics();
        alert('All menu items have been cleared!');
    }
}

// Update statistics
function updateStatistics() {
    document.getElementById('totalItems').textContent = menuItems.length;
    
    const breakfastCount = menuItems.filter(i => i.category === 'breakfast').length;
    const noodlesCount = menuItems.filter(i => i.category === 'noodles').length;
    const beveragesCount = menuItems.filter(i => i.category === 'beverages').length;
    
    document.getElementById('breakfastCount').textContent = breakfastCount;
    document.getElementById('noodlesCount').textContent = noodlesCount;
    document.getElementById('beveragesCount').textContent = beveragesCount;
}