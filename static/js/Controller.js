// Habit Tracker - Controller (Logic Layer)
class HabitTrackerController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
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
            console.error('Auth error:', error);
            this.showLogin();
        }
    }

    // Page Navigation
    showLogin() {
        if (this.model.currentUser) return this.showHome();
        this.view.renderLoginPage();
        setTimeout(() => this.attachFormListener('login-form', (e) => this.handleLogin(e)), 0);
    }

    showRegister() {
        this.view.renderRegisterPage();
        setTimeout(() => this.attachFormListener('register-form', (e) => this.handleRegister(e)), 0);
    }

    async showHome() {
        if (!this.model.currentUser) return this.showLogin();
        
        this.view.renderHomePage(this.model.currentUser);
        try {
            const data = await this.model.getHabits();
            if (data.success) this.view.renderHabits(data.habits);
        } catch (error) {
            this.view.showAlert('Error loading habits', 'error');
        }
    }

    showCreateHabit() {
        if (!this.model.currentUser) return;
        this.view.renderCreateHabitPage();
        setTimeout(() => this.attachFormListener('create-habit-form', (e) => this.handleCreateHabit(e)), 0);
    }

    async showStore() {
        if (!this.model.currentUser) return;
        try {
            const data = await this.model.getStoreItems();
            this.view.renderStorePage(this.model.currentUser, data.items || []);
        } catch (error) {
            this.view.showAlert('Error loading store', 'error');
        }
    }

    showSupport() {
        if (!this.model.currentUser) return;
        this.view.renderSupportPage(this.model.currentUser);
        setTimeout(() => this.attachFormListener('support-form', (e) => this.handleSupport(e)), 0);
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
            this.view.showAlert('Error loading profile', 'error');
        }
    }

    // Form Handlers
    attachFormListener(formId, handler) {
        const form = document.getElementById(formId);
        if (form) form.addEventListener('submit', handler);
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
            this.view.showAlert('Error creating habit', 'error');
        }
    }

    async completeHabit(habitId) {
        try {
            const data = await this.model.completeHabit(habitId);
            if (data.success) {
                this.model.currentUser.coins = data.user.coins;
                this.view.showAlert(`Earned ${data.coins_earned} coins!`, 'success');
                this.showHome();
            } else {
                this.view.showAlert(data.error || 'Error', 'error');
            }
        } catch (error) {
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
            }
        } catch (error) {
            this.view.showAlert('Error submitting feedback', 'error');
        }
    }

    async logout() {
        try {
            await this.model.logout();
            this.model.currentUser = null;
            this.view.updateNavigation(null);
            this.view.showAlert('Logged out!', 'success');
            this.showLogin();
        } catch (error) {
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
