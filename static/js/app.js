// static/js/app.js
class HabitTrackerApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.attachEvents();
    }

    async checkAuth() {
        try {
            const res = await fetch('/api/auth/current-user');
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                this.updateNav(true);
                const page = localStorage.getItem('lastPage') || 'home';
                this[`show${page[0].toUpperCase() + page.slice(1)}`]?.();
            } else {
                this.showLogin();
            }
        } catch (e) {
            this.showLogin();
        }
    }

    updateNav(loggedIn) {
        const authNav = ['nav-home', 'nav-create', 'nav-support', 'nav-feed', 'nav-profile'];
        if (loggedIn) {
            authNav.forEach(id => document.getElementById(id).style.display = 'list-item');
            document.getElementById('nav-login').style.display = 'none';
            document.getElementById('username').textContent = this.currentUser.username;
        } else {
            authNav.forEach(id => document.getElementById(id).style.display = 'none');
            document.getElementById('nav-login').style.display = 'list-item';
        }
    }

    attachEvents() {
        document.addEventListener('submit', e => {
            const handlers = { 'login-form': this.handleLogin, 'register-form': this.handleRegister, 'create-habit-form': this.handleCreateHabit, 'support-form': this.handleSupport };
            if (handlers[e.target.id]) handlers[e.target.id].call(this, e);
        });
    }

    showAlert(msg, type = 'info') {
        const html = `<div class="alert alert-${type} alert-dismissible fade show">${msg}<button class="btn-close" data-bs-dismiss="alert"></button></div>`;
        document.getElementById('alerts-container').insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.querySelector('.alert')?.remove(), 4000);
    }

    showLogin() {
        localStorage.setItem('lastPage', 'login');
        if (this.currentUser) return this.showHome();
        document.getElementById('app-content').innerHTML = `<div style="max-width: 400px; margin: 100px auto;"><div class="card"><div class="card-body"><h2 class="text-center mb-4"><i class="fas fa-check-circle text-primary"></i> Habit Tracker</h2><form id="login-form"><div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="email" required></div><div class="mb-3"><label class="form-label">Password</label><input type="password" class="form-control" id="password" required></div><button type="submit" class="btn btn-primary w-100 mb-3">Login</button></form><a href="/auth/google" class="btn btn-danger w-100 mb-3"><i class="fab fa-google"></i> Sign in with Google</a><p class="text-center">Don't have an account? <a href="#" onclick="app.showRegister(); return false;">Sign up</a></p></div></div></div>`;
    }

    showRegister() {
        localStorage.setItem('lastPage', 'register');
        document.getElementById('app-content').innerHTML = `<div style="max-width: 400px; margin: 50px auto;"><div class="card"><div class="card-body"><h2 class="text-center mb-4">Create Account</h2><form id="register-form"><div class="mb-3"><label class="form-label">Username</label><input type="text" class="form-control" id="reg-username" required></div><div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="reg-email" required></div><div class="mb-3"><label class="form-label">Password</label><input type="password" class="form-control" id="reg-password" required></div><button type="submit" class="btn btn-primary w-100">Sign Up</button></form><a href="/auth/google" class="btn btn-danger w-100 mt-3 mb-3"><i class="fab fa-google"></i> Sign up with Google</a><p class="text-center mt-3">Already have an account? <a href="#" onclick="app.showLogin(); return false;">Login</a></p></div></div></div>`;
    }

    async showHome() {
        localStorage.setItem('lastPage', 'home');
        if (!this.currentUser) return this.showLogin();
        document.getElementById('app-content').innerHTML = `<div class="row mb-4"><div class="col-md-8"><h1>Welcome, ${this.currentUser.username}! 👋</h1></div><div class="col-md-4 text-end"><i class="fas fa-coins fa-2x"></i><h3>${this.currentUser.coins}</h3><p>Coins</p></div></div><div id="habits-container"></div>`;
        try {
            const res = await fetch('/api/habits');
            const data = await res.json();
            if (data.success) this.renderHabits(data.habits);
        } catch (e) {
            this.showAlert('Error loading habits', 'error');
        }
    }

    renderHabits(habits) {
        const container = document.getElementById('habits-container');
        if (habits.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No habits yet. <a href="#" onclick="app.showCreateHabit(); return false;">Create one!</a></div>';
            return;
        }
        container.innerHTML = `<div class="card mb-4"><div class="card-header bg-primary text-white"><h5><i class="fas fa-list-check"></i> Your Habits</h5></div><div class="card-body"><div class="row">${habits.map(h => `<div class="col-md-6 mb-3"><div class="card" style="border-left: 4px solid ${h.color};"><div class="card-body"><div class="d-flex justify-content-between align-items-start mb-2"><h5><i class="fas ${h.icon}"></i> ${h.name}</h5><button class="btn btn-sm btn-outline-danger" onclick="app.deleteHabit(${h.id}); return false;"><i class="fas fa-trash"></i></button></div><p class="text-muted small">${h.description}</p><span class="badge bg-info"><i class="fas fa-coins"></i> +${h.coin_reward}</span><div class="mt-2"><button class="btn btn-sm ${h.completed_today ? 'btn-success' : 'btn-outline-success'}" onclick="app.completeHabit(${h.id}); return false;" ${h.completed_today ? 'disabled' : ''}><i class="fas fa-check"></i> ${h.completed_today ? 'Done!' : 'Complete'}</button></div></div></div></div>`).join('')}</div></div></div>`;
    }

    showCreateHabit() {
        localStorage.setItem('lastPage', 'createhabit');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="row"><div class="col-md-6"><h1><i class="fas fa-plus-circle"></i> Create Habit</h1><form id="create-habit-form"><div class="mb-3"><label class="form-label">Habit Name</label><input type="text" class="form-control" id="name" required></div><div class="mb-3"><label class="form-label">Description</label><textarea class="form-control" id="description" rows="3"></textarea></div><div class="mb-3"><label class="form-label">Frequency</label><select class="form-control" id="frequency"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div><div class="mb-3"><label class="form-label">Color</label><input type="color" class="form-control" id="color" value="#007bff"></div><div class="mb-3"><label class="form-label">Icon (Font Awesome)</label><input type="text" class="form-control" id="icon" value="fa-circle"></div><div class="alert alert-info"><strong>💰 Reward: 10 coins</strong> (fixed)</div><button type="submit" class="btn btn-primary">Create</button><button type="button" class="btn btn-secondary" onclick="app.showHome(); return false;">Cancel</button></form></div></div>`;
    }

    async showProfile() {
        localStorage.setItem('lastPage', 'profile');
        if (!this.currentUser) return;
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success) document.getElementById('app-content').innerHTML = `<div class="row"><div class="col-md-8"><h1><i class="fas fa-user-circle"></i> Profile</h1><div class="card mb-4"><div class="card-header bg-primary text-white"><h5>User Info</h5></div><div class="card-body"><p><strong>Username:</strong> ${this.currentUser.username}</p><p><strong>Email:</strong> ${this.currentUser.email}</p><p><strong>Coins:</strong> <span class="badge bg-warning text-dark">${this.currentUser.coins}</span></p></div></div><div class="card"><div class="card-header bg-primary text-white"><h5>Stats</h5></div><div class="card-body"><p><strong>Completed:</strong> ${data.total_completed}</p><p><strong>Coins Earned:</strong> ${data.total_coins_earned}</p></div></div></div></div>`;
        } catch (e) {
            this.showAlert('Error loading profile', 'error');
        }
    }

    showSupport() {
        localStorage.setItem('lastPage', 'support');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="row justify-content-center"><div class="col-md-8"><h1><i class="fas fa-headset"></i> Support</h1><div class="card mt-4"><div class="card-body"><form id="support-form"><div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="email" value="${this.currentUser.email}" required></div><div class="mb-3"><label class="form-label">Subject</label><input type="text" class="form-control" id="subject" required></div><div class="mb-3"><label class="form-label">Message</label><textarea class="form-control" id="message" rows="5" required></textarea></div><button type="submit" class="btn btn-primary">Send</button></form></div></div></div></div>`;
    }

    async showFeed() {
        localStorage.setItem('lastPage', 'feed');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="row"><div class="col-md-8"><h1><i class="fas fa-globe"></i> Community Feed</h1><div class="alert alert-info"><i class="fas fa-coins"></i> Coins: <strong>${this.currentUser.coins}</strong> | 💬 Comments: <strong>1 coin</strong></div><div id="feed-container"></div></div></div>`;
        try {
            const res = await fetch('/api/feed?page=1');
            const data = await res.json();
            if (data.success) {
                const container = document.getElementById('feed-container');
                container.innerHTML = data.feed.map(item => `<div class="card mb-4"><div class="card-header"><strong>${item.user}</strong> completed <span style="color: ${item.habit_color};"><i class="fas ${item.habit_icon}"></i> ${item.habit_name}</span><small class="text-muted float-end">${item.created_at}</small></div><div class="card-body"><div class="alert alert-success mb-3"><i class="fas fa-coins"></i> +${item.coins_earned}</div><div id="comments-${item.id}" class="mb-3"></div><div class="mt-3 pt-3 border-top"><textarea class="form-control mb-2" id="comment-text-${item.id}" placeholder="Comment (1 coin)..." rows="2" maxlength="500"></textarea><button class="btn btn-sm btn-primary" onclick="app.addComment(${item.id}); return false;"><i class="fas fa-comment"></i> Post</button></div></div></div>`).join('');
                data.feed.forEach(item => this.loadComments(item.id));
            }
        } catch (e) {
            this.showAlert('Error loading feed', 'error');
        }
    }

    async loadComments(logId) {
        try {
            const res = await fetch(`/api/feed/${logId}/comments`);
            const data = await res.json();
            if (data.success) {
                const container = document.getElementById(`comments-${logId}`);
                if (data.comments.length === 0) {
                    container.innerHTML = '<p class="text-muted small">No comments</p>';
                } else {
                    container.innerHTML = `<h6><i class="fas fa-comments"></i> Comments (${data.comments.length}):</h6>${data.comments.map(c => `<div class="card mb-2 bg-light"><div class="card-body p-3"><div class="d-flex justify-content-between align-items-start mb-2"><div><strong>${c.author}</strong><small class="text-muted d-block">${c.created_at}</small></div>${c.is_owner ? `<button class="btn btn-sm btn-outline-danger" onclick="app.deleteComment(${logId}, ${c.id}); return false;"><i class="fas fa-trash-alt"></i></button>` : ''}</div><p class="mb-0">${c.content}</p></div></div>`).join('')}`;
                }
            }
        } catch (e) {}
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        try {
            const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                this.updateNav(true);
                this.showAlert('Login successful!', 'success');
                this.showHome();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error logging in', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                this.updateNav(true);
                this.showAlert('Registration successful!', 'success');
                this.showHome();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error registering', 'error');
        }
    }

    async handleCreateHabit(e) {
        e.preventDefault();
        const habitData = { name: document.getElementById('name').value.trim(), description: document.getElementById('description').value.trim(), frequency: document.getElementById('frequency').value, color: document.getElementById('color').value, icon: document.getElementById('icon').value };
        try {
            const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(habitData) });
            const data = await res.json();
            if (data.success) {
                this.showAlert(data.message, 'success');
                this.showHome();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error creating habit', 'error');
        }
    }

    async handleSupport(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();
        try {
            const res = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, subject, message }) });
            const data = await res.json();
            if (data.success) {
                this.showAlert('Feedback sent!', 'success');
                e.target.reset();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error sending feedback', 'error');
        }
    }

    async completeHabit(habitId) {
        try {
            const res = await fetch(`/api/habits/${habitId}/complete`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.currentUser.coins = data.user.coins;
                this.showAlert(data.message, 'success');
                this.showHome();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error completing habit', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Delete this habit?')) return;
        try {
            const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showAlert('Habit deleted!', 'success');
                this.showHome();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error deleting habit', 'error');
        }
    }

    async addComment(logId) {
        const textarea = document.getElementById(`comment-text-${logId}`);
        const content = textarea.value.trim();
        if (!content) {
            this.showAlert('Comment cannot be empty', 'error');
            return;
        }
        try {
            const res = await fetch(`/api/feed/${logId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
            const data = await res.json();
            if (data.success) {
                this.currentUser.coins = data.user.coins;
                this.showAlert(data.message, 'success');
                textarea.value = '';
                await this.loadComments(logId);
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error posting comment', 'error');
        }
    }

    async deleteComment(logId, commentId) {
        try {
            const res = await fetch(`/api/feed/${logId}/comment/${commentId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.currentUser.coins = data.user.coins;
                this.showAlert(data.message, 'success');
                await this.loadComments(logId);
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (e) {
            this.showAlert('Error deleting comment', 'error');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.currentUser = null;
            this.updateNav(false);
            this.showAlert('Logged out!', 'success');
            this.showLogin();
        } catch (e) {
            this.showAlert('Error logging out', 'error');
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => app = new HabitTrackerApp());
