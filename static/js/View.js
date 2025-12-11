// Habit Tracker - View (UI Layer)
class HabitTrackerView {
    constructor() {
        this.appContent = document.getElementById('app-content');
        this.alertsContainer = document.getElementById('alerts-container');
    }

    // Alert Methods
    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        this.alertsContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        setTimeout(() => {
            const alert = this.alertsContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 4000);
    }

    // Navigation Methods
    updateNavigation(user) {
        const authNav = ['nav-home', 'nav-create', 'nav-store', 'nav-support', 'nav-profile'];
        const loginNav = 'nav-login';
        
        if (user) {
            authNav.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'list-item';
            });
            const loginEl = document.getElementById(loginNav);
            if (loginEl) loginEl.style.display = 'none';
            const usernameEl = document.getElementById('username');
            if (usernameEl) usernameEl.textContent = user.username;
        } else {
            authNav.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            const loginEl = document.getElementById(loginNav);
            if (loginEl) loginEl.style.display = 'list-item';
        }
    }

    // Page Renderers
    renderLoginPage() {
        this.appContent.innerHTML = `
            <div class="login-container" style="max-width: 400px; margin: 100px auto;">
                <div class="card">
                    <div class="card-body">
                        <h2 class="card-title text-center mb-4">
                            <i class="fas fa-check-circle text-primary"></i> Habit Tracker
                        </h2>
                        
                        <form id="login-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 mb-3">Login</button>
                        </form>
                        
                        <p class="text-center">
                            Don't have an account? <a href="#" onclick="controller.showRegister()">Sign up</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderRegisterPage() {
        this.appContent.innerHTML = `
            <div class="register-container" style="max-width: 400px; margin: 50px auto;">
                <div class="card">
                    <div class="card-body">
                        <h2 class="card-title text-center mb-4">Create Account</h2>
                        
                        <form id="register-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Sign Up</button>
                        </form>
                        
                        <p class="text-center mt-3">
                            Already have an account? <a href="#" onclick="controller.showLogin()">Login</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderHomePage(user) {
        this.appContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-8">
                    <h1>Welcome, ${user.username}! 👋</h1>
                    <p class="text-muted">Build consistent habits and earn rewards</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="stats-card">
                        <i class="fas fa-coins fa-2x"></i>
                        <h3>${user.coins}</h3>
                        <p>Coins Available</p>
                    </div>
                </div>
            </div>
            <div id="habits-container"></div>
        `;
    }

    renderHabits(habits) {
        const container = document.getElementById('habits-container');
        
        if (habits.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No habits yet. 
                    <a href="#" onclick="controller.showCreateHabit()" class="alert-link">Create your first habit!</a>
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
                                                    onclick="controller.completeHabit(${habit.id})" 
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

    renderCreateHabitPage() {
        this.appContent.innerHTML = `
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
                                <button type="button" class="btn btn-secondary" onclick="controller.showHome()">Cancel</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStorePage(user, items) {
        this.appContent.innerHTML = `
            <div>
                <h1><i class="fas fa-store"></i> Habit Store</h1>
                <p class="text-muted">Spend your coins on awesome items!</p>
                <div class="alert alert-info">
                    <i class="fas fa-coins"></i> Your Balance: <strong>${user.coins} coins</strong>
                </div>
                <div id="store-items" class="row"></div>
            </div>
        `;
        
        const container = document.getElementById('store-items');
        if (items.length === 0) {
            container.innerHTML = '<div class="col-12"><div class="alert alert-info">No items available yet.</div></div>';
        } else {
            container.innerHTML = items.map(item => `
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
                                <button class="btn btn-sm ${user.coins >= item.price ? 'btn-success' : 'btn-secondary'}" 
                                        ${user.coins < item.price ? 'disabled' : ''}>
                                    Buy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderSupportPage(user) {
        this.appContent.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <h1><i class="fas fa-headset"></i> Support & Feedback</h1>
                    <p class="text-muted">We'd love to hear from you!</p>
                    
                    <div class="card mt-4">
                        <div class="card-body">
                            <form id="support-form">
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" value="${user.email}" required>
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
    }

    renderProfilePage(user, stats) {
        this.appContent.innerHTML = `
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
                                    <p><strong>Username:</strong> ${user.username}</p>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Coins Balance:</strong> <span class="badge bg-warning text-dark">${user.coins}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Statistics</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Habits Completed:</strong> ${stats.total_completed}</p>
                            <p><strong>Total Coins Earned:</strong> ${stats.total_coins_earned}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
