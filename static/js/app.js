// Habit Tracker - Frontend SPA
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    showLogin();
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation();
            showHome();
        } else {
            currentUser = null;
            updateNavigation();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        currentUser = null;
    }
}

// Update navigation based on auth status
function updateNavigation() {
    const authNav = ['nav-home', 'nav-create', 'nav-store', 'nav-support', 'nav-profile'];
    const loginNav = 'nav-login';
    
    if (currentUser) {
        authNav.forEach(id => document.getElementById(id).style.display = 'list-item');
        document.getElementById(loginNav).style.display = 'none';
        document.getElementById('username').textContent = currentUser.username;
    } else {
        authNav.forEach(id => document.getElementById(id).style.display = 'none');
        document.getElementById(loginNav).style.display = 'list-item';
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.getElementById('alerts-container').insertAdjacentHTML('beforeend', alertHtml);
    
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }
    }, 4000);
}

// Login page
function showLogin() {
    if (currentUser) {
        showHome();
        return;
    }
    
    document.getElementById('app-content').innerHTML = `
        <div class="login-container" style="max-width: 400px; margin: 100px auto;">
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title text-center mb-4">
                        <i class="fas fa-check-circle text-primary"></i> Habit Tracker
                    </h2>
                    
                    <form id="login-form">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email" name="email" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 mb-3">Login</button>
                    </form>
                    
                    <p class="text-center">
                        Don't have an account? <a href="#" onclick="showRegister()">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                updateNavigation();
                showAlert('Login successful!', 'success');
                showHome();
            } else {
                showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Error during login', 'error');
        }
    });
}

// Register page
function showRegister() {
    document.getElementById('app-content').innerHTML = `
        <div class="register-container" style="max-width: 400px; margin: 50px auto;">
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title text-center mb-4">Create Account</h2>
                    
                    <form id="register-form">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username" name="username" required>
                        </div>
                        <div class="mb-3">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email" name="email" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Sign Up</button>
                    </form>
                    
                    <p class="text-center mt-3">
                        Already have an account? <a href="#" onclick="showLogin()">Login</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                updateNavigation();
                showAlert('Registration successful!', 'success');
                showHome();
            } else {
                showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            showAlert('Error during registration', 'error');
        }
    });
}

// Home page
async function showHome() {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    document.getElementById('app-content').innerHTML = `
        <div class="row mb-4">
            <div class="col-md-8">
                <h1>Welcome, ${currentUser.username}! 👋</h1>
                <p class="text-muted">Build consistent habits and earn rewards</p>
            </div>
            <div class="col-md-4 text-end">
                <div class="stats-card">
                    <i class="fas fa-coins fa-2x"></i>
                    <h3>${currentUser.coins}</h3>
                    <p>Coins Available</p>
                </div>
            </div>
        </div>
        <div id="habits-container"></div>
    `;
    
    // Load habits
    try {
        const response = await fetch('/api/habits');
        const data = await response.json();
        
        if (data.success) {
            renderHabits(data.habits);
        }
    } catch (error) {
        console.error('Error loading habits:', error);
        showAlert('Error loading habits', 'error');
    }
}

// Render habits
function renderHabits(habits) {
    const container = document.getElementById('habits-container');
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No habits yet. 
                <a href="#" onclick="showCreateHabit()" class="alert-link">Create your first habit!</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-list-check"></i> Your Habits</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    ${habits.map(habit => `
                        <div class="col-md-6 mb-3">
                            <div class="card" style="border-left: 4px solid ${habit.color};">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 class="card-title">
                                                <i class="fas ${habit.icon}"></i> ${habit.name}
                                            </h5>
                                            <p class="card-text text-muted small">${habit.description}</p>
                                            <span class="badge bg-info">
                                                <i class="fas fa-coins"></i> +${habit.coin_reward} coins
                                            </span>
                                        </div>
                                        <button class="btn btn-sm ${habit.completed_today ? 'btn-success' : 'btn-outline-success'}" 
                                                onclick="completeHabit(${habit.id})" 
                                                ${habit.completed_today ? 'disabled' : ''}>
                                            <i class="fas fa-check"></i> ${habit.completed_today ? 'Done!' : 'Complete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Complete habit
async function completeHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser.coins = data.user.coins;
            showAlert(`Great! You earned ${data.coins_earned} coins!`, 'success');
            showHome();
        } else {
            showAlert(data.error || 'Error completing habit', 'error');
        }
    } catch (error) {
        console.error('Error completing habit:', error);
        showAlert('Error completing habit', 'error');
    }
}

// Create habit
function showCreateHabit() {
    if (!currentUser) return;
    
    document.getElementById('app-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="fas fa-plus-circle"></i> Create New Habit</h4>
                    </div>
                    <div class="card-body">
                        <form id="create-habit-form">
                            <div class="mb-3">
                                <label for="name" class="form-label">Habit Name *</label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="description" class="form-label">Description</label>
                                <textarea class="form-control" id="description" rows="3"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="frequency" class="form-label">Frequency</label>
                                    <select class="form-select" id="frequency">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="coin_reward" class="form-label">Coins per Completion</label>
                                    <input type="number" class="form-control" id="coin_reward" value="5" min="1">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="color" class="form-label">Color</label>
                                    <input type="color" class="form-control form-control-color" id="color" value="#007bff">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="icon" class="form-label">Icon</label>
                                    <input type="text" class="form-control" id="icon" value="fa-circle">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">Create Habit</button>
                            <button type="button" class="btn btn-secondary" onclick="showHome()">Cancel</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('create-habit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const habitData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            frequency: document.getElementById('frequency').value,
            coin_reward: document.getElementById('coin_reward').value,
            color: document.getElementById('color').value,
            icon: document.getElementById('icon').value
        };
        
        try {
            const response = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(habitData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(data.message, 'success');
                showHome();
            } else {
                showAlert(data.error || 'Error creating habit', 'error');
            }
        } catch (error) {
            console.error('Error creating habit:', error);
            showAlert('Error creating habit', 'error');
        }
    });
}

// Store page
async function showStore() {
    if (!currentUser) return;
    
    document.getElementById('app-content').innerHTML = `
        <div>
            <h1><i class="fas fa-store"></i> Habit Store</h1>
            <p class="text-muted">Spend your coins on awesome items!</p>
            <div class="alert alert-info">
                <i class="fas fa-coins"></i> Your Balance: <strong>${currentUser.coins} coins</strong>
            </div>
            <div id="store-items" class="row"></div>
        </div>
    `;
    
    try {
        const response = await fetch('/api/store');
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('store-items');
            if (data.items.length === 0) {
                container.innerHTML = '<div class="col-12"><div class="alert alert-info">No items available yet.</div></div>';
            } else {
                container.innerHTML = data.items.map(item => `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                                <i class="fas fa-image fa-3x text-muted"></i>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${item.name}</h5>
                                <p class="card-text">${item.description}</p>
                            </div>
                            <div class="card-footer bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-warning text-dark">
                                        <i class="fas fa-coins"></i> ${item.price}
                                    </span>
                                    <button class="btn btn-sm ${currentUser.coins >= item.price ? 'btn-success' : 'btn-secondary'}" 
                                            ${currentUser.coins < item.price ? 'disabled' : ''}>
                                        Buy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading store:', error);
        showAlert('Error loading store', 'error');
    }
}

// Support page
function showSupport() {
    if (!currentUser) return;
    
    document.getElementById('app-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <h1><i class="fas fa-headset"></i> Support & Feedback</h1>
                <p class="text-muted">We'd love to hear from you!</p>
                
                <div class="card mt-4">
                    <div class="card-body">
                        <form id="support-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" value="${currentUser.email}" required>
                            </div>
                            <div class="mb-3">
                                <label for="subject" class="form-label">Subject</label>
                                <input type="text" class="form-control" id="subject" required>
                            </div>
                            <div class="mb-3">
                                <label for="message" class="form-label">Message</label>
                                <textarea class="form-control" id="message" rows="5" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Send Feedback</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('support-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const feedbackData = {
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Thank you for your feedback!', 'success');
                showHome();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showAlert('Error submitting feedback', 'error');
        }
    });
}

// Profile page
async function showProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('app-content').innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h1><i class="fas fa-user-circle"></i> Profile</h1>
                        
                        <div class="card mb-4">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">User Information</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Username:</strong> ${currentUser.username}</p>
                                        <p><strong>Email:</strong> ${currentUser.email}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Coins Balance:</strong> <span class="badge bg-warning text-dark">${currentUser.coins}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Statistics</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>Habits Completed:</strong> ${data.total_completed}</p>
                                <p><strong>Total Coins Earned:</strong> ${data.total_coins_earned}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile', 'error');
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        updateNavigation();
        showAlert('Logged out successfully!', 'success');
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Error logging out', 'error');
    }
}
