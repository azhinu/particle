// App State
const state = {
    services: [],
    sidebarLocked: false,
    sidebarExpanded: false,
    sidebarCollapsed: false,
    iframes: new Map(), // Cache iframes to preserve state
    isMobile: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    sidebarVisible: false // For mobile: is sidebar visible?
};

// DOM Elements
const elements = {
    sidebar: null,
    lockBtn: null,
    toggleBtn: null,
    toggleIcon: null,
    homeBtn: null,
    servicesList: null,
    homeView: null,
    servicesContainer: null,
    overlay: null,
    greeting: null
};

// Initialize app
async function init() {
    // Get DOM elements
    elements.sidebar = document.getElementById('sidebar');
    elements.lockBtn = document.getElementById('lockBtn');
    elements.toggleBtn = document.getElementById('toggleBtn');
    elements.toggleIcon = document.getElementById('toggleIcon');
    elements.homeBtn = document.getElementById('homeBtn');
    elements.servicesList = document.getElementById('servicesList');
    elements.homeView = document.getElementById('homeView');
    elements.servicesContainer = document.getElementById('servicesContainer');
    elements.overlay = document.getElementById('overlay');
    elements.greeting = document.getElementById('greeting');

    // Load config
    await loadConfig();

    // Setup event listeners
    setupEventListeners();

    // Initialize sidebar visibility for mobile (visible but minimized by default)
    if (state.isMobile) {
        state.sidebarVisible = false;
        elements.sidebar.classList.remove('mobile-visible');
    }

    // Set greeting
    updateGreeting();
}

// Load services config
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const data = await response.json();
        state.services = data.services;
        renderServices();
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Render service buttons
function renderServices() {
    elements.servicesList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    state.services.forEach(service => {
        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.dataset.service = service.name;

        const img = document.createElement('img');
        img.src = service.icon;
        img.alt = service.name;
        img.addEventListener('error', () => {
            img.src = 'static/home.svg';
        });

        const label = document.createElement('span');
        label.className = 'nav-label';
        label.textContent = service.name;

        button.appendChild(img);
        button.appendChild(label);
        fragment.appendChild(button);
    });

    elements.servicesList.appendChild(fragment);
}

// Setup event listeners
function setupEventListeners() {
    const isTouchDevice = () => {
        return window.matchMedia('(hover: none) and (pointer: coarse)').matches
            || navigator.maxTouchPoints > 0;
    };

    // Detect if mobile
    const checkMobile = () => {
        const wasMobile = state.isMobile;
        state.isMobile = window.innerWidth <= 768 || isTouchDevice();
        
        // If transitioning to mobile, show sidebar minimized
        if (state.isMobile && !wasMobile) {
            state.sidebarExpanded = false;
            elements.sidebar.classList.remove('expanded');
            setSidebarVisible(false);
        }
        // If transitioning from mobile to desktop, reset to default
        if (!state.isMobile && wasMobile) {
            setSidebarVisible(false);
        }

        updateToggleIcon();
    };

    // Initial check
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Lock button
    elements.lockBtn.addEventListener('click', handleLock);

    // Toggle button
    elements.toggleBtn.addEventListener('pointerup', (event) => {
        event.preventDefault();
        handleToggle();
    });
    elements.toggleBtn.addEventListener('keydown', (event) => {
        handleActionKey(event, handleToggle);
    });

    // Home button
    elements.homeBtn.addEventListener('pointerup', (event) => {
        event.preventDefault();
        switchToHome();
    });
    elements.homeBtn.addEventListener('keydown', (event) => {
        handleActionKey(event, switchToHome);
    });

    // Overlay click
    elements.overlay.addEventListener('click', handleOverlayClick);

    // Service buttons (delegated)
    elements.servicesList.addEventListener('pointerup', (event) => {
        event.preventDefault();
        handleServiceActivate(event);
    });
    elements.servicesList.addEventListener('keydown', (event) => {
        handleActionKey(event, () => handleServiceActivate(event));
    });

    // Setup touch events for swipe detection
    setupTouchEvents();
}

function handleServiceActivate(event) {
    const button = event.target.closest('.nav-btn');
    if (!button) return;

    const serviceName = button.dataset.service;
    const service = state.services.find(item => item.name === serviceName);
    if (!service) return;

    switchToService(service);
}

function handleActionKey(event, action) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    action();
}

function setSidebarVisible(isVisible) {
    state.sidebarVisible = isVisible;
    elements.sidebar.classList.toggle('mobile-visible', isVisible);
    elements.overlay.classList.toggle('active', isVisible);
    updateToggleIcon();
}

function updateToggleIcon() {
    if (!elements.toggleIcon) return;

    if (state.isMobile) {
        elements.toggleIcon.src = state.sidebarVisible ? 'static/left.svg' : 'static/right.svg';
        return;
    }

    if (state.sidebarLocked) {
        elements.toggleIcon.src = state.sidebarCollapsed ? 'static/right.svg' : 'static/left.svg';
        return;
    }

    elements.toggleIcon.src = 'static/right.svg';
}

// Setup touch events for mobile swipe
function setupTouchEvents() {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Handle touch start
function handleTouchStart(e) {
    state.touchStartX = e.changedTouches[0].screenX;
    state.touchStartY = e.changedTouches[0].screenY;
}

// Handle touch end (swipe detection)
function handleTouchEnd(e) {
    state.touchEndX = e.changedTouches[0].screenX;
    state.touchEndY = e.changedTouches[0].screenY;
    
    // Calculate swipe distance
    const diffX = state.touchStartX - state.touchEndX;
    const diffY = Math.abs(state.touchStartY - state.touchEndY);
    const minSwipeDistance = 50;
    const maxVerticalDrift = 100;

    // Only process horizontal swipes
    if (Math.abs(diffX) < minSwipeDistance || diffY > maxVerticalDrift) {
        return;
    }

    // Left swipe (diffX > 0 means movement to left)
    if (diffX > minSwipeDistance) {
        handleSwipeLeft();
    }
    // Right swipe (diffX < 0 means movement to right)
    else if (diffX < -minSwipeDistance) {
        handleSwipeRight();
    }
}

// Handle left swipe - hide/show sidebar
function handleSwipeLeft() {
    if (!state.isMobile) return;
    
    if (state.sidebarVisible) {
        setSidebarVisible(false);
    }
}

// Handle right swipe - show/hide sidebar
function handleSwipeRight() {
    if (!state.isMobile) return;
    
    if (!state.sidebarVisible) {
        setSidebarVisible(true);
    }
}

// Update greeting based on time of day
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning, kitty';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon, kitty';
    } else if (hour >= 18 && hour < 22) {
        greeting = 'Good evening, kitty';
    } else {
        greeting = 'Good night, kitty';
    }

    elements.greeting.textContent = greeting;
}

// Handle lock button click
function handleLock() {
    if (state.isMobile) {
        // On mobile, lock button not really needed
        return;
    }

    state.sidebarLocked = !state.sidebarLocked;
    elements.lockBtn.classList.toggle('active', state.sidebarLocked);

    if (state.sidebarLocked) {
        // When locking, maintain current state (open or closed)
        if (state.sidebarCollapsed) {
            elements.sidebar.classList.add('locked', 'collapsed');
        } else {
            elements.sidebar.classList.add('locked');
            elements.sidebar.classList.remove('collapsed');
        }
        state.sidebarExpanded = false;
        elements.overlay.classList.remove('active');
    } else {
        // When unlocking, revert to default state (collapsed with hover)
        elements.sidebar.classList.remove('locked', 'collapsed');
        state.sidebarCollapsed = false;
        state.sidebarExpanded = false;
        elements.overlay.classList.remove('active');
    }

    updateToggleIcon();
}

// Handle toggle button click
function handleToggle() {
    if (state.isMobile) {
        // On mobile, toggle expand/collapse
        setSidebarVisible(!state.sidebarVisible);
        return;
    }
    
    if (state.sidebarLocked) {
        // If locked, toggle collapsed state
        state.sidebarCollapsed = !state.sidebarCollapsed;
        elements.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
    } else {
        // If not locked, toggle expanded state
        state.sidebarExpanded = !state.sidebarExpanded;
        elements.sidebar.classList.toggle('expanded', state.sidebarExpanded);
        elements.overlay.classList.toggle('active', state.sidebarExpanded);
    }

    updateToggleIcon();
}

// Handle overlay click
function handleOverlayClick() {
    if (state.isMobile) {
        // On mobile, close sidebar when overlay is clicked
        setSidebarVisible(false);
    } else if (state.sidebarExpanded && !state.sidebarLocked) {
        state.sidebarExpanded = false;
        elements.sidebar.classList.remove('expanded');
        elements.overlay.classList.remove('active');
        updateToggleIcon();
    }
}

// Switch to home view
function switchToHome() {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    elements.homeBtn.classList.add('active');

    // Show home view
    elements.homeView.classList.add('active');

    // Hide all service views
    const serviceViews = elements.servicesContainer.querySelectorAll('.service-view');
    serviceViews.forEach(view => view.classList.remove('active'));

    if (state.isMobile) {
        setSidebarVisible(false);
    }
}

// Switch to service view
function switchToService(service) {
    // If new_tab is true, open in new tab instead of iframe
    if (service.new_tab) {
        window.open(service.link, '_blank');
        // Close sidebar on mobile even when opening in new tab
        if (state.isMobile) {
            setSidebarVisible(false);
        }
        return;
    }

    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const serviceBtn = document.querySelector(`[data-service="${service.name}"]`);
    if (serviceBtn) {
        serviceBtn.classList.add('active');
    }

    // Hide home view
    elements.homeView.classList.remove('active');

    // Get or create iframe for this service
    let serviceView = state.iframes.get(service.name);
    
    if (!serviceView) {
        // Create new service view with iframe
        serviceView = createServiceView(service);
        state.iframes.set(service.name, serviceView);
        elements.servicesContainer.appendChild(serviceView);
    }

    // Hide all other service views
    const serviceViews = elements.servicesContainer.querySelectorAll('.service-view');
    serviceViews.forEach(view => {
        if (view !== serviceView) {
            view.classList.remove('active');
        }
    });

    // Show current service view
    serviceView.classList.add('active');

    // Close sidebar on mobile
    if (state.isMobile) {
        setSidebarVisible(false);
    }
}

// Create service view with iframe
function createServiceView(service) {
    const serviceView = document.createElement('div');
    serviceView.className = 'service-view loading';
    serviceView.dataset.service = service.name;

    const iframe = document.createElement('iframe');
    iframe.src = service.link;
    iframe.title = service.name;
    iframe.allow = 'fullscreen';
    
    // Remove loading state when iframe loads
    iframe.addEventListener('load', () => {
        serviceView.classList.remove('loading');
    });

    serviceView.appendChild(iframe);
    return serviceView;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
