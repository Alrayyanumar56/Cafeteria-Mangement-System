async function loadInventory() {
    const table = document.getElementById("inventoryTableBody");
    const searchTerm = document.getElementById("search").value.toLowerCase();
    table.innerHTML = "";

    try {
        const res = await fetch('http://localhost:3000/api/inventory');
        let inventory = await res.json();

        inventory
            .filter(item => 
                item.name.toLowerCase().includes(searchTerm) || 
                item.category.toLowerCase().includes(searchTerm) ||
                item.unit.toLowerCase().includes(searchTerm)
            )
            .forEach(item => {
                table.innerHTML += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.price}</td>
                        <td>${item.qty}</td>
                        <td>${item.unit}</td>
                        <td>
                            <button class="btn btn-sm btn-warning me-1" onclick="openUpdateModal(${item.id})">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
    } catch (err) {
        console.error('Failed to load inventory:', err);
        alert('Error loading inventory from server.');
    }
}

// Initialize UI events
document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    const search = document.getElementById('search');
    if (search) search.addEventListener('input', loadInventory);
});

// Add or Update Item
async function addItem() {
    const form = document.getElementById('addItemForm');
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const qty = parseFloat(document.getElementById('itemQty').value) || 0;
    const unit = document.getElementById('itemUnit').value || 'pcs';

    if (!name || !qty) { alert('Please enter valid name and quantity'); return; }

    // use note field to include category/price since backend schema expects name, qty, unit, note
    const note = JSON.stringify({ category, price });
    const payload = { item_name: name, quantity: qty, unit, note };

    const editId = form.dataset.editId;
    try {
        if (editId) {
            const res = await fetch(`http://localhost:3000/api/inventory/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to update item');
            delete form.dataset.editId;
            document.querySelector('#addItemModal .modal-title').textContent = 'Add New Item';
            alert('Item updated successfully');
        } else {
            const res = await fetch('http://localhost:3000/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to add item');
            alert('Item added successfully');
        }
        // Reset form and hide modal
        form.reset();
        const modalEl = document.getElementById('addItemModal');
        try { const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl); modal.hide(); } catch (e) { /* ignore */ }
        loadInventory();
    } catch (err) {
        console.error(err);
        alert(err.message || 'Error adding/updating item');
    }
}

// Load a given item for update in modal
async function openUpdateModal(id) {
    try {
        const res = await fetch('http://localhost:3000/api/inventory');
        const items = await res.json();
        const item = items.find(i => Number(i.id) === Number(id));
        if (!item) throw new Error('Item not found');
        const form = document.getElementById('addItemForm');
        document.getElementById('itemName').value = item.item_name || '';
        const note = item.note ? JSON.parse(item.note) : {};
        document.getElementById('itemCategory').value = note.category || '';
        document.getElementById('itemPrice').value = note.price || '';
        document.getElementById('itemQty').value = item.quantity || '';
        document.getElementById('itemUnit').value = item.unit || 'pcs';
        form.dataset.editId = id;
        document.querySelector('#addItemModal .modal-title').textContent = 'Update Item';
        var myModal = new bootstrap.Modal(document.getElementById('addItemModal'));
        myModal.show();
    } catch (err) {
        console.error(err);
        alert('Failed to load item for update');
    }
}

// Delete an item by id
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/inventory/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete item');
        alert('Item deleted successfully');
        loadInventory();
    } catch (err) {
        console.error(err);
        alert('Error deleting item');
    }
}
