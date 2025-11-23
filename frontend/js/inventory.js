// ================================
//  IndexedDB-backed inventory
// ================================
const DB_NAME = 'CafePOS';
const DB_STORE = 'inventory';
const DB_VERSION = 1;

let editId = null; // For update functionality

let _db = null;
function openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };

        req.onsuccess = (e) => {
            _db = e.target.result;
            resolve(_db);
        };

        req.onerror = (e) => reject(e.target.error);
    });
}

function getAllItemsFromDB() {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    }));
}

function getItemById(id) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
}

function addItemToDB(item) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
}

function putItemToDB(item) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
}

function deleteItemFromDB(id) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }));
}

// seed data to help first-run testing
const SAMPLE_DATA = [
    { id: 1, name: "Burger Buns", category: "Bakery", price: 250, qty: 20 },
    { id: 2, name: "Chicken Patty", category: "Meat", price: 450, qty: 15 },
    { id: 3, name: "Cheese Slice", category: "Dairy", price: 120, qty: 50 },
];

async function ensureSeedData() {
    const items = await getAllItemsFromDB();
    if (!items || items.length === 0) {
        // put sample items (preserving ids)
        for (const it of SAMPLE_DATA) {
            try { await putItemToDB(it); } catch (e) { /* ignore duplicates */ }
        }
    }
}

// ================================
//  RENDER TABLE
// ================================
async function loadInventory() {
    const table = document.getElementById("inventoryTableBody");
    const searchTerm = document.getElementById("search").value.toLowerCase();

    table.innerHTML = "";

    const items = await getAllItemsFromDB();

    (items || [])
        .filter(item => {
            if (!item) return false;
            const name = (item.name || '').toString().toLowerCase();
            const category = (item.category || '').toString().toLowerCase();
            return name.includes(searchTerm) || category.includes(searchTerm);
        })
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
//  ADD / UPDATE ITEM
// ================================
async function addItem() {
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
        const item = { id: editId, name, category, price, qty };
        await putItemToDB(item);
        editId = null;
        document.querySelector(".modal-title").innerText = "Add New Item";

    } else {
        // add new (id will be auto-assigned)
        const newItem = { name, category, price, qty };
        await addItemToDB(newItem);
    }

    document.getElementById("addItemForm").reset();
    await loadInventory();

    // Close modal
    const modalEl = document.getElementById("addItemModal");
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();
}


// ================================
//  DELETE ITEM
// ================================
async function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    await deleteItemFromDB(id);
    await loadInventory();
}


// ================================
//  UPDATE ITEM – Prefill modal
// ================================
async function openUpdateModal(id) {
    const item = await getItemById(id);
    if (!item) return;

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
(async function init() {
    try {
        await openDB();
        await ensureSeedData();
        await loadInventory();
    } catch (e) {
        console.error('Inventory DB init error:', e);
    }
})();
