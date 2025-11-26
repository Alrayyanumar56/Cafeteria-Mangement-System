// Fake database
let inventory = [
    { id: 1, name: "Burger Buns", category: "Bakery", price: 250, qty: 20, unit: "pcs" },
    { id: 2, name: "Chicken Patty", category: "Meat", price: 450, qty: 15, unit: "pcs" },
    { id: 3, name: "Cheese Slice", category: "Dairy", price: 120, qty: 50, unit: "pcs" },
];

let editId = null;

// Render table
function loadInventory() {
    const table = document.getElementById("inventoryTableBody");
    const searchTerm = document.getElementById("search").value.toLowerCase();
    table.innerHTML = "";

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
}

// Add / Update item
function addItem() {
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value.trim();
    const price = parseFloat(document.getElementById("itemPrice").value);
    const qty = parseInt(document.getElementById("itemQty").value);
    const unit = document.getElementById("itemUnit").value;

    if (!name || !category || !price || !qty || !unit) {
        alert("Please fill all fields correctly!");
        return;
    }

    if (editId !== null) {
        const item = inventory.find(i => i.id === editId);
        item.name = name;
        item.category = category;
        item.price = price;
        item.qty = qty;
        item.unit = unit;
        editId = null;
        document.querySelector(".modal-title").innerText = "Add New Item";
    } else {
        const newItem = { 
            id: inventory.length ? inventory[inventory.length-1].id + 1 : 1, 
            name, category, price, qty, unit 
        };
        inventory.push(newItem);
    }

    document.getElementById("addItemForm").reset();
    loadInventory();
    bootstrap.Modal.getInstance(document.getElementById("addItemModal")).hide();
}

// Delete
function deleteItem(id) {
    if (!confirm("Are you sure?")) return;
    inventory = inventory.filter(i => i.id !== id);
    loadInventory();
}

// Prefill for update
function openUpdateModal(id) {
    const item = inventory.find(i => i.id === id);
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemQty").value = item.qty;
    document.getElementById("itemUnit").value = item.unit;

    editId = id;
    document.querySelector(".modal-title").innerText = "Update Item";
    new bootstrap.Modal(document.getElementById("addItemModal")).show();
}

// Search
document.getElementById("search").addEventListener("input", loadInventory);

// Initial load
loadInventory();
