let currentProductPage = 1;
const productsPerPage = 10;

function loadProducts(page = 1) {
    currentProductPage = page;
    
    const search = document.getElementById('productSearch').value;
    const timberType = document.getElementById('timberTypeFilter').value;
    const grade = document.getElementById('gradeFilter').value;

    let url = `/api/products?page=${page}&limit=${productsPerPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (timberType) url += `&timber_type=${encodeURIComponent(timberType)}`;
    if (grade) url += `&grade=${encodeURIComponent(grade)}`;

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    })
    .then(data => {
        displayProducts(data.products);
        setupPagination(data.totalPages, data.currentPage);
        loadFilters();
    })
    .catch(error => {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    });
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.timber_type}</td>
            <td>${product.grade}</td>
            <td>${product.dimensions}</td>
            <td>$${product.price_per_unit}/${product.unit}</td>
            <td>${product.quantity_in_stock}</td>
            <td>
                <button class="btn btn-secondary" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupPagination(totalPages, currentPage) {
    const pagination = document.getElementById('productsPagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => loadProducts(i);
        pagination.appendChild(button);
    }
}

function loadFilters() {
    // Load timber types
    fetch('/api/products/timber-types', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('timberTypeFilter');
        // Keep existing selected value
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Timber Types</option>';
        data.timberTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            option.selected = type === currentValue;
            select.appendChild(option);
        });
    });

    // Load grades
    fetch('/api/products/grades', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('gradeFilter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Grades</option>';
        data.grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            option.selected = grade === currentValue;
            select.appendChild(option);
        });
    });
}

function showProductForm(productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');

    if (productId) {
        title.textContent = 'Edit Timber Product';
        loadProductData(productId);
    } else {
        title.textContent = 'Add New Timber Product';
        form.reset();
        document.getElementById('productId').value = '';
    }

    modal.style.display = 'block';
}

function closeProductForm() {
    document.getElementById('productModal').style.display = 'none';
}

function loadProductData(productId) {
    fetch(`/api/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const product = data.product;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('timberType').value = product.timber_type;
        document.getElementById('grade').value = product.grade;
        document.getElementById('dimensions').value = product.dimensions;
        document.getElementById('length').value = product.length;
        document.getElementById('width').value = product.width;
        document.getElementById('thickness').value = product.thickness;
        document.getElementById('pricePerUnit').value = product.price_per_unit;
        document.getElementById('unit').value = product.unit;
        document.getElementById('quantityInStock').value = product.quantity_in_stock;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('imageUrl').value = product.image_url || '';
    })
    .catch(error => {
        console.error('Error loading product:', error);
        alert('Failed to load product data');
    });
}

document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const formData = {
        name: document.getElementById('productName').value,
        timber_type: document.getElementById('timberType').value,
        grade: document.getElementById('grade').value,
        dimensions: document.getElementById('dimensions').value,
        length: parseFloat(document.getElementById('length').value),
        width: parseFloat(document.getElementById('width').value),
        thickness: parseFloat(document.getElementById('thickness').value),
        price_per_unit: parseFloat(document.getElementById('pricePerUnit').value),
        unit: document.getElementById('unit').value,
        quantity_in_stock: parseFloat(document.getElementById('quantityInStock').value),
        description: document.getElementById('productDescription').value,
        image_url: document.getElementById('imageUrl').value
    };

    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            closeProductForm();
            loadProducts(currentProductPage);
            alert(`Product ${productId ? 'updated' : 'created'} successfully!`);
        }
    })
    .catch(error => {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    });
});

function editProduct(productId) {
    showProductForm(productId);
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                loadProducts(currentProductPage);
                alert('Product deleted successfully!');
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        });
    }
}

// Load products when products section is shown
function showProductsSection() {
    showSection('products');
    loadProducts();
    loadFilters();
}