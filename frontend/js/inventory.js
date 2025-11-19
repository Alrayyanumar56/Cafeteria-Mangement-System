// ================================
//  FAKE DATABASE (Local array)
// ================================
let inventory = [
    { id: 1, name: "Burger Buns", category: "Bakery", price: 250, qty: 20 },
    { id: 2, name: "Chicken Patty", category: "Meat", price: 450, qty: 15 },
    { id: 3, name: "Cheese Slice", category: "Dairy", price: 120, qty: 50 },
];

let editId = null; // For update functionality


// ================================
//  RENDER TABLE
// ================================
function loadInventory() {
    const table = document.getElementById("inventoryTableBody");
    const searchTerm = document.getElementById("search").value.toLowerCase();

    table.innerHTML = "";

    inventory
        .filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        )
        .forEach(item => {
            table.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.price}</td>
                    <td>${item.qty}</td>

                    <td>
                        <button class="btn btn-sm btn-warning me-1"
                            onclick="openUpdateModal(${item.id})">
                            <i class="bi bi-pencil-square"></i>
                        </button>

                        <button class="btn btn-sm btn-danger"
                            onclick="deleteItem(${item.id})">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
}


// ================================
//  ADD ITEM
// ================================
function addItem() {
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value.trim();
    const price = parseFloat(document.getElementById("itemPrice").value);
    const qty = parseInt(document.getElementById("itemQty").value);

    if (!name || !category || !price || !qty) {
        alert("Please fill all fields correctly!");
        return;
    }

    // If editing, update instead of adding
    if (editId !== null) {
        const item = inventory.find(i => i.id === editId);
        item.name = name;
        item.category = category;
        item.price = price;
        item.qty = qty;

        editId = null;
        document.querySelector(".modal-title").innerText = "Add New Item";

    } else {
        // Otherwise add new
        const newItem = {
            id: inventory.length ? inventory[inventory.length - 1].id + 1 : 1,
            name,
            category,
            price,
            qty
        };

        inventory.push(newItem);
    }

    document.getElementById("addItemForm").reset();
    loadInventory();

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById("addItemModal")).hide();
}


// ================================
//  DELETE ITEM
// ================================
function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    inventory = inventory.filter(item => item.id !== id);
    loadInventory();
}


// ================================
//  UPDATE ITEM – Prefill modal
// ================================
function openUpdateModal(id) {
    const item = inventory.find(i => i.id === id);

    document.getElementById("itemName").value = item.name;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemQty").value = item.qty;

    editId = id;

    document.querySelector(".modal-title").innerText = "Update Item";

    // Open modal
    new bootstrap.Modal(document.getElementById("addItemModal")).show();
}


// ================================
//  SEARCH EVENT
// ================================
document.getElementById("search").addEventListener("input", loadInventory);


// ================================
//  INITIAL LOAD
// ================================
loadInventory();
