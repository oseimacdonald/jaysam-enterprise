function loadDashboard() {
    loadDashboardStats();
    loadRecentActivity();
}

function loadDashboardStats() {
    // Load products count
    fetch('/api/products?limit=1', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('totalProducts').textContent = data.totalProducts;
    });

    // Load customers count (placeholder)
    document.getElementById('totalCustomers').textContent = '3';

    // Load active orders count (placeholder)
    document.getElementById('activeOrders').textContent = '5';

    // Load stock value (placeholder - would need calculation)
    document.getElementById('stockValue').textContent = '$45,230';
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    
    // Placeholder activity data
    const activities = [
        'New order #ORD-001 created for Fine Furniture Ltd',
        'Teak Wood Planks stock updated to 25.5 cubic meters',
        'New customer BuildRight Constructions added',
        'Pine Boards price updated to $320/cubic meter',
        'Order #ORD-002 marked as completed'
    ];

    activityList.innerHTML = activities.map(activity => 
        `<div class="activity-item" style="padding: 0.5rem; border-bottom: 1px solid #eee;">
            ${activity}
        </div>`
    ).join('');
}

// Override showSection to load dashboard when needed
const originalShowSection = showSection;
window.showSection = function(sectionName) {
    originalShowSection(sectionName);
    if (sectionName === 'dashboard') {
        loadDashboard();
    } else if (sectionName === 'products') {
        showProductsSection();
    }
};