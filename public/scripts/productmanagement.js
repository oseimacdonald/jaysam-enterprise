(function() {
    'use strict';
    
    console.log('✅ productmanagement.js loaded (IIFE protected)');
    
    // Initialize the image carousel with featured products
    async function initializeCarousel() {
        try {
            console.log('🔄 Loading featured products for carousel...');
            
            const response = await fetch('/products/api/featured-products');
            const data = await response.json();
            
            console.log('📊 Featured products response:', data);
            
            if (data.success && data.featuredProducts && data.featuredProducts.length > 0) {
                console.log(`✅ Found ${data.featuredProducts.length} featured products`);
                updateCarousel(data.featuredProducts);
                initializeBootstrapCarousel();
            } else {
                console.warn('No featured products found, using default content');
                initializeBootstrapCarousel();
            }
        } catch (error) {
            console.error('❌ Error loading featured products:', error);
            initializeBootstrapCarousel();
        }
    }

    // Initialize Bootstrap carousel
    function initializeBootstrapCarousel() {
        const carouselElement = document.getElementById('productCarousel');
        if (!carouselElement) {
            console.error('❌ Carousel element not found');
            return;
        }
        
        try {
            const carousel = new bootstrap.Carousel(carouselElement, {
                interval: 5000,
                wrap: true,
                pause: 'hover',
                touch: true
            });
            
            console.log('✅ Bootstrap carousel initialized successfully');
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    carousel.prev();
                } else if (e.key === 'ArrowRight') {
                    carousel.next();
                }
            });
            
            return carousel;
        } catch (error) {
            console.error('❌ Error initializing Bootstrap carousel:', error);
        }
    }

    // Update carousel with featured products
    function updateCarousel(featuredProducts) {
        const carouselInner = document.querySelector('.carousel-inner');
        const carouselIndicators = document.querySelector('.carousel-indicators');
        
        if (!carouselInner || featuredProducts.length === 0) {
            console.warn('No carousel content to display');
            return;
        }
        
        carouselInner.innerHTML = '';
        if (carouselIndicators) carouselIndicators.innerHTML = '';
        
        featuredProducts.forEach((product, index) => {
            if (carouselIndicators) {
                const indicator = document.createElement('button');
                indicator.type = 'button';
                indicator.setAttribute('data-bs-target', '#productCarousel');
                indicator.setAttribute('data-bs-slide-to', index);
                indicator.setAttribute('aria-label', `Slide ${index + 1}`);
                if (index === 0) {
                    indicator.classList.add('active');
                    indicator.setAttribute('aria-current', 'true');
                }
                carouselIndicators.appendChild(indicator);
            }
            
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            const imageUrl = product.product_image || '/images/placeholder-timber.jpg';
            const dimensions = product.dimensions || 'Various sizes';
            
            carouselItem.innerHTML = `
                <img src="${imageUrl}" 
                     class="d-block w-100 carousel-image" 
                     alt="${product.product_name}"
                     style="height: 500px; object-fit: cover;"
                     onerror="this.src='/images/placeholder-timber.jpg'">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${product.timber_type} - ${product.product_name}</h5>
                    <p>${dimensions} | ₵${product.price_per_unit}</p>
                    <p class="small">${product.product_description || 'Premium quality timber'}</p>
                </div>
            `;
            
            carouselInner.appendChild(carouselItem);
        });
        
        console.log('✅ Carousel updated successfully');
    }

    // Initialize the page
    async function initializePage() {
        console.log('🔍 Initializing page...');
        
        // Show loading state
        showLoadingState();
        
        try {
            // Initialize carousel first
            await initializeCarousel();
            
            // Load size data for all timber types
            await loadAllSizeVariants();
            
            // Hide loading state and show content
            hideLoadingState();
            
        } catch (error) {
            console.error('Initialization error:', error);
            showToast('Error initializing page', 'error');
            hideLoadingState();
        }
    }

    // Load size variants for all timber types on the page
    async function loadAllSizeVariants() {
        const timberTypeCards = document.querySelectorAll('.timber-type-card, .product-card[data-timber-type]');
        
        for (const card of timberTypeCards) {
            const timberType = card.getAttribute('data-timber-type');
            await loadSizeVariantsForTimberType(timberType);
        }
    }

    // Load size variants for a specific timber type
    async function loadSizeVariantsForTimberType(timberType) {
        try {
            const response = await fetch(`/products/api/size-variants/${encodeURIComponent(timberType)}`);
            const data = await response.json();
            
            if (data.success) {
                updateSizeSelector(timberType, data.variants);
            } else {
                console.error(`Error loading variants for ${timberType}:`, data.error);
            }
        } catch (error) {
            console.error(`Error loading size variants for ${timberType}:`, error);
        }
    }

    // Update size selector with available variants
    function updateSizeSelector(timberType, variants) {
        const sizeSelector = document.querySelector(`.size-selector[data-timber-type="${timberType}"]`);
        if (!sizeSelector) return;
        
        sizeSelector.innerHTML = '<option value="">Choose a size...</option>';
        
        variants.forEach(variant => {
            const option = document.createElement('option');
            option.value = variant.product_id;
            option.textContent = `${variant.dimensions} - ₵${variant.price_per_unit}`;
            option.setAttribute('data-variant', JSON.stringify(variant));
            sizeSelector.appendChild(option);
        });
    }

    // Handle size selection
    function handleSizeSelection(timberType, selectedProductId) {
        const sizeSelector = document.querySelector(`.size-selector[data-timber-type="${timberType}"]`);
        const selectedOption = sizeSelector.querySelector(`option[value="${selectedProductId}"]`);
        const card = sizeSelector.closest('.product-card, .timber-type-card');
        
        if (selectedProductId && selectedOption) {
            const variant = JSON.parse(selectedOption.getAttribute('data-variant'));
            showProductDetails(timberType, variant);
            enableAddToCart(timberType, true);
        } else {
            hideProductDetails(timberType);
            enableAddToCart(timberType, false);
        }
    }

    // Show product details when size is selected
    function showProductDetails(timberType, variant) {
        const card = document.querySelector(`[data-timber-type="${timberType}"]`);
        
        const quantitySection = card.querySelector('.quantity-selection');
        const pricingSection = card.querySelector('.pricing-section');
        const descriptionText = card.querySelector('.description-text');
        
        if (quantitySection) quantitySection.style.display = 'block';
        if (pricingSection) pricingSection.style.display = 'block';
        if (descriptionText) descriptionText.textContent = variant.product_description || 'No description available';
        
        calculateAndDisplayPrice(timberType, variant, 1);
    }

    // Hide product details when no size is selected
    function hideProductDetails(timberType) {
        const card = document.querySelector(`[data-timber-type="${timberType}"]`);
        
        const quantitySection = card.querySelector('.quantity-selection');
        const pricingSection = card.querySelector('.pricing-section');
        
        if (quantitySection) quantitySection.style.display = 'none';
        if (pricingSection) pricingSection.style.display = 'none';
    }

    // Handle quantity changes
    function handleQuantityChange(timberType, change) {
        const quantityInput = document.querySelector(`.quantity-input[data-timber-type="${timberType}"]`);
        if (!quantityInput) return;
        
        const currentValue = parseInt(quantityInput.value) || 1;
        const newValue = Math.max(1, currentValue + change);
        
        quantityInput.value = newValue;
        updatePriceForTimberType(timberType, newValue);
    }

    function handleQuantityInput(timberType, value) {
        const quantity = Math.max(1, parseInt(value) || 1);
        updatePriceForTimberType(timberType, quantity);
    }

    // Update price for timber type
    async function updatePriceForTimberType(timberType, quantity) {
        const sizeSelector = document.querySelector(`.size-selector[data-timber-type="${timberType}"]`);
        if (!sizeSelector) return;
        
        const selectedProductId = sizeSelector.value;
        if (!selectedProductId) return;
        
        try {
            const response = await fetch('/products/api/calculate-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: selectedProductId,
                    quantity: quantity
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                updatePriceDisplay(timberType, data);
            } else {
                console.error('Price calculation error:', data.error);
            }
        } catch (error) {
            console.error('Error calculating price:', error);
        }
    }

    // Calculate and display price (initial calculation)
    function calculateAndDisplayPrice(timberType, variant, quantity) {
        const unitPrice = variant.price_per_unit;
        const totalPrice = unitPrice * quantity;
        const availableStock = variant.quantity_in_stock;
        
        const card = document.querySelector(`[data-timber-type="${timberType}"]`);
        if (!card) return;
        
        const unitPriceElement = card.querySelector('.unit-price-value');
        const totalPriceElement = card.querySelector('.total-price-value');
        const stockElement = card.querySelector('.stock-amount');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        if (unitPriceElement) unitPriceElement.textContent = `₵${unitPrice.toFixed(2)}`;
        if (totalPriceElement) totalPriceElement.textContent = `₵${totalPrice.toFixed(2)}`;
        if (stockElement) stockElement.textContent = availableStock;
        if (addToCartBtn) addToCartBtn.disabled = availableStock < quantity;
    }

    // Update price display with API response
    function updatePriceDisplay(timberType, priceData) {
        const card = document.querySelector(`[data-timber-type="${timberType}"]`);
        if (!card) return;
        
        const unitPriceElement = card.querySelector('.unit-price-value');
        const totalPriceElement = card.querySelector('.total-price-value');
        const stockElement = card.querySelector('.stock-amount');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantityInput = card.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput?.value) || 1;
        
        if (unitPriceElement) unitPriceElement.textContent = `₵${priceData.unitPrice.toFixed(2)}`;
        if (totalPriceElement) totalPriceElement.textContent = `₵${priceData.totalPrice.toFixed(2)}`;
        if (stockElement) stockElement.textContent = priceData.availableStock;
        if (addToCartBtn) addToCartBtn.disabled = !priceData.canOrder;
    }

    // Enable/disable add to cart button
    function enableAddToCart(timberType, enabled) {
        const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-timber-type="${timberType}"]`);
        if (addToCartBtn) {
            addToCartBtn.disabled = !enabled;
        }
    }

    // Add to cart with selected size and quantity
    async function addToCartWithSize(timberType) {
        const card = document.querySelector(`[data-timber-type="${timberType}"]`);
        if (!card) return;
        
        const sizeSelector = card.querySelector('.size-selector');
        const quantityInput = card.querySelector('.quantity-input');
        
        const productId = sizeSelector?.value;
        const quantity = parseInt(quantityInput?.value) || 1;
        
        if (!productId) {
            showToast('Please select a size first', 'error');
            return;
        }
        
        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showToast('Product added to cart successfully!', 'success');
                updateCartCount();
            } else {
                showToast('Error adding product to cart: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error adding product to cart', 'error');
        }
    }

    // Update cart count in navigation
    function updateCartCount() {
        if (typeof notifyCartUpdate === 'function') {
            notifyCartUpdate();
        } else {
            console.log('notifyCartUpdate not found, using fallback');
            loadCartCountFallback();
        }
    }

    // Fallback cart count loader
    async function loadCartCountFallback() {
        try {
            const response = await fetch('/cart/count');
            const data = await response.json();
            
            const desktopBadge = document.getElementById('desktopCartCount');
            const mobileBadge = document.getElementById('mobileCartCount');
            
            if (desktopBadge) {
                desktopBadge.style.display = data.count > 0 ? 'block' : 'none';
                if (data.count > 0) desktopBadge.textContent = data.count;
            }
            
            if (mobileBadge) {
                mobileBadge.style.display = data.count > 0 ? 'block' : 'none';
                if (data.count > 0) mobileBadge.textContent = data.count;
            }
            
            console.log('Cart count updated via fallback:', data.count);
        } catch (error) {
            console.error('Error loading cart count (fallback):', error);
        }
    }

    // Utility functions
    function showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const productsContent = document.getElementById('productsContent');
        
        if (loadingState) loadingState.style.display = 'block';
        if (productsContent) productsContent.style.display = 'none';
    }

    function hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const productsContent = document.getElementById('productsContent');
        
        if (loadingState) loadingState.style.display = 'none';
        if (productsContent) productsContent.style.display = 'block';
    }

    function refreshProducts() {
        window.location.reload();
    }

    function clearFilters() {
        window.location.href = '/products';
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        
        let bgClass = 'info';
        if (type === 'success') bgClass = 'success';
        if (type === 'error') bgClass = 'danger';
        
        toast.className = `toast align-items-center text-white bg-${bgClass} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // Event listeners for product management only
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOMContentLoaded - Initializing product management');
        
        // Initialize the page
        initializePage();
        
        // Event listeners for product management
        document.getElementById('refreshProducts')?.addEventListener('click', refreshProducts);
        document.getElementById('clearFilters')?.addEventListener('click', clearFilters);
        
        // Size selection change events
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('size-selector')) {
                const timberType = e.target.getAttribute('data-timber-type');
                const selectedValue = e.target.value;
                handleSizeSelection(timberType, selectedValue);
            }
        });
        
        // Quantity change events
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('quantity-minus') || e.target.classList.contains('quantity-plus')) {
                const button = e.target.closest('button');
                const timberType = button.closest('.quantity-selection').querySelector('.quantity-input').getAttribute('data-timber-type');
                handleQuantityChange(timberType, button.classList.contains('quantity-minus') ? -1 : 1);
            }
        });
        
        // Quantity input change events
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('quantity-input')) {
                const timberType = e.target.getAttribute('data-timber-type');
                handleQuantityInput(timberType, e.target.value);
            }
        });
        
        // Add to cart functionality
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('add-to-cart-btn') && !e.target.disabled) {
                const timberType = e.target.getAttribute('data-timber-type');
                addToCartWithSize(timberType);
            }
        });
    });

})();