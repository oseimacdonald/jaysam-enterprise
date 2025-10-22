// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const navOverlay = document.getElementById('navOverlay');
    
    console.log('🍔 Hamburger elements:', { 
        hamburgerMenu: !!hamburgerMenu, 
        mobileNav: !!mobileNav, 
        navOverlay: !!navOverlay 
    });
    
    if (hamburgerMenu && mobileNav && navOverlay) {
        hamburgerMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🟰 Hamburger clicked');
            hamburgerMenu.classList.toggle('active');
            mobileNav.classList.toggle('active');
            navOverlay.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });
        
        navOverlay.addEventListener('click', function() {
            console.log('🎯 Overlay clicked');
            hamburgerMenu.classList.remove('active');
            mobileNav.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking on mobile nav links
        const mobileNavLinks = mobileNav.querySelectorAll('a');
        console.log(`🔗 Found ${mobileNavLinks.length} mobile nav links`);
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                console.log('📱 Nav link clicked');
                hamburgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                console.log('⌨️ Escape key pressed');
                hamburgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    } else {
        console.error('❌ Missing hamburger menu elements');
    }

    // Load cart count on page load
    loadCartCount();
});

// Cart Count Functionality
async function loadCartCount() {
    try {
        const response = await fetch('/cart/count');
        const data = await response.json();
        
        // Update desktop cart badge
        const desktopBadge = document.getElementById('desktopCartCount');
        if (desktopBadge) {
            if (data.count > 0) {
                desktopBadge.textContent = data.count;
                desktopBadge.style.display = 'block';
            } else {
                desktopBadge.style.display = 'none';
            }
        }
        
        // Update mobile cart badge
        const mobileBadge = document.getElementById('mobileCartCount');
        if (mobileBadge) {
            if (data.count > 0) {
                mobileBadge.textContent = data.count;
                mobileBadge.style.display = 'block';
            } else {
                mobileBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading cart count:', error);
    }
}

// Function to notify cart updates
function notifyCartUpdate() {
    console.log('🔔 Cart update notified');
    const event = new Event('cartUpdated');
    document.dispatchEvent(event);
}

// Listen for custom cart update events
document.addEventListener('cartUpdated', function() {
    console.log('🔄 Cart update event received, reloading count...');
    loadCartCount();
});

// Auto-refresh cart count
setInterval(() => {
    loadCartCount();
}, 30000);