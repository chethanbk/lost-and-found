// Authentication functionality
let currentUser = null;

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Initialize auth
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupAuthEventListeners();
});

// Setup authentication event listeners
function setupAuthEventListeners() {
    // Modal controls
    loginBtn.addEventListener('click', () => showModal('login'));
    signupBtn.addEventListener('click', () => showModal('signup'));
    logoutBtn.addEventListener('click', logout);
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Close modals
    document.querySelectorAll('.modal .close').forEach(close => {
        close.addEventListener('click', closeModals);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            updateAuthUI(true);
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateAuthUI(true);
            closeModals();
            showSuccess('Login successful!');
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error occurred');
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateAuthUI(true);
            closeModals();
            showSuccess('Account created successfully!');
        } else {
            showError(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Network error occurred');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI(false);
    showSuccess('Logged out successfully!');
}

// Update authentication UI
function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;
    } else {
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        userMenu.style.display = 'none';
    }
}

// Show modal
function showModal(type) {
    closeModals();
    if (type === 'login') {
        loginModal.style.display = 'block';
    } else if (type === 'signup') {
        signupModal.style.display = 'block';
    }
}

// Close all modals
function closeModals() {
    loginModal.style.display = 'none';
    signupModal.style.display = 'none';
    
    // Reset forms
    loginForm.reset();
    signupForm.reset();
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
