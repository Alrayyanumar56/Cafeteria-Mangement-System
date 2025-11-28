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
