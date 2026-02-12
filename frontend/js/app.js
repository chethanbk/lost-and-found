// Global variables
let currentItems = [];
let allItems = [];

// API base URL
const API_BASE = '/api';

// DOM elements
const itemsGrid = document.getElementById('itemsGrid');
const loading = document.getElementById('loading');
const reportForm = document.getElementById('reportForm');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');
const searchFilter = document.getElementById('searchFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const itemModal = document.getElementById('itemModal');
const totalItemsEl = document.getElementById('totalItems');
const foundItemsEl = document.getElementById('foundItems');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    setupEventListeners();
    updateStats();
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    reportForm.addEventListener('submit', handleFormSubmit);
    
    // Filters
    statusFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    searchFilter.addEventListener('input', debounce(applyFilters, 300));
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Modal
    const modal = document.getElementById('itemModal');
    const closeModal = modal.querySelector('.close');
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Load items from API
async function loadItems() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/items`);
        const data = await response.json();
        
        if (response.ok) {
            allItems = data;
            currentItems = [...allItems];
            renderItems(currentItems);
            updateStats();
        } else {
            showError('Failed to load items');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showError('Network error occurred');
    } finally {
        showLoading(false);
    }
}

// Render items in grid
function renderItems(items) {
    if (items.length === 0) {
        itemsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search criteria or be the first to report an item!</p>
            </div>
        `;
        return;
    }

    itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
    
    // Add click listeners to cards
    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.dataset.itemId;
            showItemDetails(itemId);
        });
    });
}

// Create item card HTML
function createItemCard(item) {
    const statusClass = item.status === 'lost' ? 'status-lost' : 'status-found';
    const imageUrl = item.image ? `/uploads/${item.image}` : null;
    
    return `
        <div class="item-card" data-item-id="${item._id}">
            <div class="item-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">` 
                           : `<i class="fas fa-image"></i>`}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-title">${escapeHtml(item.title)}</h3>
                    <span class="item-status ${statusClass}">${item.status}</span>
                </div>
                <div class="item-category">${item.category}</div>
                <p class="item-description">${escapeHtml(item.description)}</p>
                <div class="item-meta">
                    <div class="item-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(item.location)}</span>
                    </div>
                    <div class="item-date">${formatDate(item.dateReported)}</div>
                </div>
            </div>
        </div>
    `;
}

// Show item details in modal
async function showItemDetails(itemId) {
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}`);
        const item = await response.json();
        
        if (response.ok) {
            const imageUrl = item.image ? `/uploads/${item.image}` : null;
            const statusClass = item.status === 'lost' ? 'status-lost' : 'status-found';
            
            document.getElementById('itemDetails').innerHTML = `
                <div class="item-detail">
                    <div class="item-detail-header">
                        <h2>${escapeHtml(item.title)}</h2>
                        <span class="item-status ${statusClass}">${item.status}</span>
                    </div>
                    <div class="item-detail-content">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${item.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                        <div class="detail-section">
                            <h4>Category</h4>
                            <p>${item.category}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Description</h4>
                            <p>${escapeHtml(item.description)}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Location</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location)}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Date Reported</h4>
                            <p>${formatDate(item.dateReported)}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Contact Information</h4>
                            <p><strong>Name:</strong> ${escapeHtml(item.contactInfo.name)}</p>
                            <p><strong>Email:</strong> <a href="mailto:${item.contactInfo.email}">${item.contactInfo.email}</a></p>
                            ${item.contactInfo.phone ? `<p><strong>Phone:</strong> <a href="tel:${item.contactInfo.phone}">${item.contactInfo.phone}</a></p>` : ''}
                        </div>
                    </div>
                    <div class="item-detail-actions">
                        <button class="btn btn-primary" onclick="contactOwner('${item.contactInfo.email}', '${escapeHtml(item.title)}')">
                            <i class="fas fa-envelope"></i> Contact Owner
                        </button>
                    </div>
                </div>
            `;
            
            itemModal.style.display = 'block';
        } else {
            showError('Failed to load item details');
        }
    } catch (error) {
        console.error('Error loading item details:', error);
        showError('Network error occurred');
    }
}

// Contact owner
function contactOwner(email, itemTitle) {
    const subject = encodeURIComponent(`Regarding: ${itemTitle}`);
    const body = encodeURIComponent(`Hi,\n\nI found your listing for "${itemTitle}" on the Lost & Found website. Please let me know how we can arrange the return/pickup.\n\nBest regards`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(reportForm);
    
    // Add nested contact info
    const contactInfo = {
        name: formData.get('contactInfo.name'),
        email: formData.get('contactInfo.email'),
        phone: formData.get('contactInfo.phone') || ''
    };
    
    formData.delete('contactInfo.name');
    formData.delete('contactInfo.email');
    formData.delete('contactInfo.phone');
    
    formData.append('contactInfo', JSON.stringify(contactInfo));
    
    try {
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showSuccess('Item reported successfully!');
            reportForm.reset();
            loadItems(); // Refresh the items list
            scrollToSection('browse');
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to submit report');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showError('Network error occurred');
    } finally {
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Report';
    }
}

// Apply filters
function applyFilters() {
    const status = statusFilter.value;
    const category = categoryFilter.value;
    const search = searchFilter.value.toLowerCase().trim();
    
    currentItems = allItems.filter(item => {
        const matchesStatus = !status || item.status === status;
        const matchesCategory = !category || item.category === category;
        const matchesSearch = !search || 
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.location.toLowerCase().includes(search);
        
        return matchesStatus && matchesCategory && matchesSearch;
    });
    
    renderItems(currentItems);
}

// Clear all filters
function clearFilters() {
    statusFilter.value = '';
    categoryFilter.value = '';
    searchFilter.value = '';
    currentItems = [...allItems];
    renderItems(currentItems);
}

// Update statistics
function updateStats() {
    const total = allItems.length;
    const found = allItems.filter(item => item.status === 'found').length;
    
    animateNumber(totalItemsEl, total);
    animateNumber(foundItemsEl, found);
}

// Animate number counting
function animateNumber(element, target) {
    const start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Utility functions
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

function showSuccess(message) {
    // You can implement a toast notification system here
    alert(message);
}

function showError(message) {
    // You can implement a toast notification system here
    alert('Error: ' + message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global function to make it available to onclick handlers
window.scrollToSection = scrollToSection;
