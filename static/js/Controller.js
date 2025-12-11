// Habit Tracker - Controller (Logic Layer)
class HabitTrackerController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.attachEventListeners();
    }

    async checkAuthStatus() {
        try {
            const data = await this.model.getCurrentUser();
            if (data && data.success) {
                this.model.currentUser = data.user;
                this.view.updateNavigation(this.model.currentUser);
                this.showHome();
            } else {
                this.model.currentUser = null;
                this.view.updateNavigation(null);
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLogin();
        }
    }

    attachEventListeners() {
        // Will attach form listeners when pages are rendered
        document.addEventListener('click', (e) => {
            if (e.target.id === 'login-form') this.handleLogin(e);
            if (e.target.id === 'register-form') this.handleRegister(e);
            if (e.target.id === 'create-habit-form') this.handleCreateHabit(e);
            if (e.target.id === 'support-form') this.handleSupport(e);
        }, true);
    }

    // Page Navigation
    showLogin() {
        if (this.model.currentUser) {
            this.showHome();
            return;
        }
        this.view.renderLoginPage();
        this.attachFormListeners('login');
    }

    showRegister() {
        this.view.renderRegisterPage();
        this.attachFormListeners('register');
    }

    async showHome() {
        if (!this.model.currentUser) {
            this.showLogin();
            return;
        }
        
        this.view.renderHomePage(this.model.currentUser);
        
        try {
            const data = await this.model.getHabits();
            if (data.success) {
                this.view.renderHabits(data.habits);
            }
        } catch (error) {
            console.error('Error loading habits:', error);
            this.view.showAlert('Error loading habits', 'error');
        }
    }

    showCreateHabit() {
        if (!this.model.currentUser) return;
        this.view.renderCreateHabitPage();
        this.attachFormListeners('create-habit');
    }

    async showStore() {
        if (!this.model.currentUser) return;
        
        try {
            const data = await this.model.getStoreItems();
            this.view.renderStorePage(this.model.currentUser, data.items || []);
        } catch (error) {
            console.error('Error loading store:', error);
            this.view.showAlert('Error loading store', 'error');
        }
    }

    showSupport() {
        if (!this.model.currentUser) return;
        this.view.renderSupportPage(this.model.currentUser);
        this.attachFormListeners('support');
    }

    async showProfile() {
        if (!this.model.currentUser) return;
        
        try {
            const data = await this.model.getProfile();
            if (data.success) {
                this.view.renderProfilePage(this.model.currentUser, {
                    total_completed: data.total_completed,
                    total_coins_earned: data.total_coins_earned
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.view.showAlert('Error loading profile', 'error');
        }
    }

    // Form Handlers
    attachFormListeners(formType) {
        setTimeout(() => {
            if (formType === 'login') {
                const form = document.getElementById('login-form');
                if (form) form.addEventListener('submit', (e) => this.handleLogin(e));
            } else if (formType === 'register') {
                const form = document.getElementById('register-form');
                if (form) form.addEventListener('submit', (e) => this.handleRegister(e));
            } else if (formType === 'create-habit') {
                const form = document.getElementById('create-habit-form');
                if (form) form.addEventListener('submit', (e) => this.handleCreateHabit(e));
            } else if (formType === 'support') {
                const form = document.getElementById('support-form');
                if (form) form.addEventListener('submit', (e) => this.handleSupport(e));
            }
        }, 0);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const data = await this.model.login(email, password);
            
            if (data.success) {
                this.model.currentUser = data.user;
                this.view.updateNavigation(this.model.currentUser);
                this.view.showAlert('Login successful!', 'success');
                this.showHome();
            } else {
                this.view.showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.view.showAlert('Error during login', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const data = await this.model.register(username, email, password);
            
            if (data.success) {
                this.model.currentUser = data.user;
                this.view.updateNavigation(this.model.currentUser);
                this.view.showAlert('Registration successful!', 'success');
                this.showHome();
            } else {
                this.view.showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.view.showAlert('Error during registration', 'error');
        }
    }

    async handleCreateHabit(e) {
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
            const data = await this.model.createHabit(habitData);
            
            if (data.success) {
                this.view.showAlert(data.message, 'success');
                this.showHome();
            } else {
                this.view.showAlert(data.error || 'Error creating habit', 'error');
            }
        } catch (error) {
            console.error('Create habit error:', error);
            this.view.showAlert('Error creating habit', 'error');
        }
    }

    async completeHabit(habitId) {
        try {
            const data = await this.model.completeHabit(habitId);
            
            if (data.success) {
                this.model.currentUser.coins = data.user.coins;
                this.view.showAlert(`Great! You earned ${data.coins_earned} coins!`, 'success');
                this.showHome();
            } else {
                this.view.showAlert(data.error || 'Error completing habit', 'error');
            }
        } catch (error) {
            console.error('Complete habit error:', error);
            this.view.showAlert('Error completing habit', 'error');
        }
    }

    async handleSupport(e) {
        e.preventDefault();
        
        const feedbackData = {
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        try {
            const data = await this.model.submitFeedback(feedbackData);
            
            if (data.success) {
                this.view.showAlert('Thank you for your feedback!', 'success');
                this.showHome();
            } else {
                this.view.showAlert('Error submitting feedback', 'error');
            }
        } catch (error) {
            console.error('Support error:', error);
            this.view.showAlert('Error submitting feedback', 'error');
        }
    }

    async logout() {
        try {
            await this.model.logout();
            this.model.currentUser = null;
            this.view.updateNavigation(null);
            this.view.showAlert('Logged out successfully!', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Logout error:', error);
            this.view.showAlert('Error logging out', 'error');
        }
    }
}

// Global controller instance
let controller;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const model = new HabitTrackerModel();
    const view = new HabitTrackerView();
    controller = new HabitTrackerController(model, view);
});
