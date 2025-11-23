        // Sales Chart
        new Chart(document.getElementById("salesChart"), {
            type: "line",
            data: {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [{
                    label: "Sales",
                    data: [12, 19, 7, 11, 15, 9, 20],
                    borderWidth: 2
                }]
            }
        });

        // Category Chart
        new Chart(document.getElementById("categoryChart"), {
            type: "doughnut",
            data: {
                labels: ["Coffee", "Snacks", "Drinks", "Others"],
                datasets: [{
                    label: "Category",
                    data: [35, 20, 25, 10]
                }]
            }
        });