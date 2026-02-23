// App State
const state = {
    services: [],
    currentView: 'home',
    sidebarLocked: false,
    sidebarExpanded: false,
    sidebarCollapsed: false,
    iframes: new Map() // Cache iframes to preserve state
};

// DOM Elements
const elements = {
    sidebar: null,
    lockBtn: null,
    toggleBtn: null,
    toggleIcon: null,
    homeBtn: null,
    servicesList: null,
    mainContent: null,
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
    elements.mainContent = document.getElementById('mainContent');
    elements.homeView = document.getElementById('homeView');
    elements.servicesContainer = document.getElementById('servicesContainer');
    elements.overlay = document.getElementById('overlay');
    elements.greeting = document.getElementById('greeting');

    // Load config
    await loadConfig();

    // Setup event listeners
    setupEventListeners();

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
    
    state.services.forEach(service => {
        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.dataset.service = service.name;
        button.innerHTML = `
            <img src="${service.icon}" alt="${service.name}" onerror="this.src='static/home.svg'">
            <span class="nav-label">${service.name}</span>
        `;
        button.addEventListener('click', () => switchToService(service));
        elements.servicesList.appendChild(button);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Lock button
    elements.lockBtn.addEventListener('click', handleLock);

    // Toggle button
    elements.toggleBtn.addEventListener('click', handleToggle);

    // Home button
    elements.homeBtn.addEventListener('click', () => switchToHome());

    // Overlay click
    elements.overlay.addEventListener('click', handleOverlayClick);
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
}

// Handle toggle button click
function handleToggle() {
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
}

// Handle overlay click
function handleOverlayClick() {
    if (state.sidebarExpanded && !state.sidebarLocked) {
        state.sidebarExpanded = false;
        elements.sidebar.classList.remove('expanded');
        elements.overlay.classList.remove('active');
    }
}

// Switch to home view
function switchToHome() {
    state.currentView = 'home';
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    elements.homeBtn.classList.add('active');

    // Show home view
    elements.homeView.classList.add('active');

    // Hide all service views
    const serviceViews = elements.servicesContainer.querySelectorAll('.service-view');
    serviceViews.forEach(view => view.classList.remove('active'));
}

// Switch to service view
function switchToService(service) {
    // If new_tab is true, open in new tab instead of iframe
    if (service.new_tab) {
        window.open(service.link, '_blank');
        return;
    }

    state.currentView = service.name;

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
