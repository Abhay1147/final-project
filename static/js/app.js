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
                // Handle admin page specially
                if (page === 'admin' && this.currentUser.is_admin) {
                    this.showAdminPanel();
                } else if (page === 'createhabit') {
                    this.showCreateHabit();
                } else {
                    this[`show${page[0].toUpperCase() + page.slice(1)}`]?.();
                }
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
        
        console.log('updateNav called with isAuthenticated:', loggedIn);
        document.getElementById('nav-home').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('nav-create').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('nav-support').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('nav-feed').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('nav-profile').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('nav-login').style.display = loggedIn ? 'none' : 'block';
        
        if (loggedIn) {
            console.log('User authenticated, currentUser:', this.currentUser);
            if (this.currentUser) {
                document.getElementById('username').textContent = this.currentUser.username;
                
                console.log('Checking is_admin:', this.currentUser.is_admin);
                console.log('Type of is_admin:', typeof this.currentUser.is_admin);
                
                if (this.currentUser.is_admin === true) {
                    console.log('✅ USER IS ADMIN! Adding admin button...');
                    let adminItem = document.getElementById('nav-admin');
                    if (!adminItem) {
                        const navEnd = document.querySelector('.navbar-end');
                        console.log('navbar-end element:', navEnd);
                        const adminDiv = document.createElement('div');
                        adminDiv.className = 'navbar-item';
                        adminDiv.id = 'nav-admin';
                        adminDiv.innerHTML = '<a href="#" onclick="app.showAdminPanel(); return false;"><i class="fas fa-shield-alt"></i> Admin</a>';
                        navEnd.appendChild(adminDiv);
                        console.log('✅ Admin button added!');
                    }
                } else {
                    console.log('❌ User is NOT admin');
                }
            }
        }
        
        // Add button click handlers
        const navHome = document.getElementById('nav-home');
        const navCreate = document.getElementById('nav-create');
        const navFeed = document.getElementById('nav-feed');
        const navProfile = document.getElementById('nav-profile');
        const navSupport = document.getElementById('nav-support');
        const navLogout = document.getElementById('nav-logout');
        
        if (navHome) navHome.onclick = () => this.showHome();
        if (navCreate) navCreate.onclick = () => this.showCreateHabit();
        if (navFeed) navFeed.onclick = () => this.showFeed();
        if (navProfile) navProfile.onclick = () => this.showProfile();
        if (navSupport) navSupport.onclick = () => this.showSupport();
        if (navLogout) navLogout.onclick = () => this.logout();
    }

    attachEvents() {
        document.addEventListener('submit', e => {
            const handlers = { 'login-form': this.handleLogin, 'register-form': this.handleRegister, 'create-habit-form': this.handleCreateHabit, 'support-form': this.handleSupport };
            if (handlers[e.target.id]) handlers[e.target.id].call(this, e);
        });
    }

    showAlert(msg, type = 'info') {
        // Silently log instead of showing alert
        console.log(`[${type.toUpperCase()}] ${msg}`);
    }

    showErrorModal(message) {
        const modal = `
            <div class="modal is-active" id="errorModal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head has-background-danger">
                        <p class="modal-card-title has-text-white">⚠️ Error</p>
                        <button class="delete" aria-label="close" onclick="document.getElementById('errorModal').classList.remove('is-active'); document.getElementById('errorModal').remove();"></button>
                    </header>
                    <section class="modal-card-body">
                        <p>${message}</p>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button" onclick="document.getElementById('errorModal').classList.remove('is-active'); document.getElementById('errorModal').remove();">Close</button>
                    </footer>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    }

    showLogin() {
        localStorage.setItem('lastPage', 'login');
        if (this.currentUser) return this.showHome();
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `<div class="columns is-centered"><div class="column is-5"><div class="box"><h2 class="title is-4 has-text-centered"><i class="fas fa-check-circle has-text-primary"></i> Habit Tracker</h2><div id="login-error"></div><form id="login-form"><div class="field"><label class="label">Email</label><div class="control has-icons-left"><input class="input" type="email" id="email" required><span class="icon is-small is-left"><i class="fas fa-envelope"></i></span></div></div><div class="field"><label class="label">Password</label><div class="control has-icons-left"><input class="input" type="password" id="password" required><span class="icon is-small is-left"><i class="fas fa-lock"></i></span></div></div><div class="field"><div class="control"><button type="submit" class="button is-primary is-fullwidth">Login</button></div></div></form><a href="/auth/google" class="button is-danger is-fullwidth mt-3"><i class="fab fa-google"></i>&nbsp;Sign in with Google</a><p class="has-text-centered mt-3">Don't have an account? <a href="#" onclick="app.showRegister(); return false;">Sign up</a></p></div></div></div>`;
        
        // Attach event listener AFTER form is rendered
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                console.log('Login attempt for:', email);
                fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(res => res.json())
                .then(data => {
                    console.log('Login response:', data);
                    if (data.success) {
                        this.currentUser = data.user;
                        console.log('✅ Set currentUser:', this.currentUser);
                        console.log('Is admin:', this.currentUser.is_admin);
                        this.updateNav(true);
                        this.showHome();
                    } else {
                        console.log('❌ Login failed:', data.error);
                        const errorDiv = document.getElementById('login-error');
                        errorDiv.innerHTML = `<div class="notification is-danger"><button class="delete"></button>${data.error}</div>`;
                        errorDiv.querySelector('.delete').onclick = () => errorDiv.innerHTML = '';
                    }
                })
                .catch(err => {
                    console.error('Login error:', err);
                    const errorDiv = document.getElementById('login-error');
                    errorDiv.innerHTML = `<div class="notification is-danger"><button class="delete"></button>Login failed. Please try again.</div>`;
                    errorDiv.querySelector('.delete').onclick = () => errorDiv.innerHTML = '';
                });
            });
        }
    }

    showRegister() {
        localStorage.setItem('lastPage', 'register');
        document.getElementById('app-content').innerHTML = `<div class="columns is-centered"><div class="column is-5"><div class="box"><h2 class="title is-4 has-text-centered">Create Account</h2><form id="register-form"><div class="field"><label class="label">Username</label><div class="control"><input class="input" type="text" id="reg-username" required></div></div><div class="field"><label class="label">Email</label><div class="control"><input class="input" type="email" id="reg-email" required></div></div><div class="field"><label class="label">Password</label><div class="control"><input class="input" type="password" id="reg-password" required></div></div><div class="field"><div class="control"><button class="button is-primary is-fullwidth">Sign Up</button></div></div></form><a href="/auth/google" class="button is-danger is-fullwidth mt-3"><i class="fab fa-google"></i>&nbsp;Sign up with Google</a><p class="has-text-centered mt-3">Already have an account? <a href="#" onclick="app.showLogin(); return false;">Login</a></p></div></div></div>`;
    }

    async showHome() {
        localStorage.setItem('lastPage', 'home');
        if (!this.currentUser) return this.showLogin();
        try {
            const res = await fetch('/api/habits');
            const habitsData = await res.json();
            const logsRes = await fetch('/api/completed-logs');
            const logsData = await logsRes.json();
            
            document.getElementById('app-content').innerHTML = `<div id="habits-container"></div><div id="completed-container"></div>`;
            this.renderHabits(habitsData.habits || []);
            this.renderCompletedLogs(logsData.logs || []);
        } catch (e) {
            console.error('Error loading habits or logs:', e);
        }
    }

    renderHabits(habits) {
        const container = document.getElementById('habits-container');
        if (habits.length === 0) {
            container.innerHTML = '<div class="notification is-info"><strong>No habits yet.</strong> <a href="#" onclick="app.showCreateHabit(); return false;">Create one!</a></div>';
            return;
        }
        container.innerHTML = `<div class="box"><h2 class="title is-5"><i class="fas fa-list-check"></i> Your Habits</h2><div class="columns is-multiline">${habits.map(h => `<div class="column is-half"><div class="habit-card" style="border-left-color: ${h.color};"><div class="mb-3"><h3 class="title is-6"><i class="fas ${h.icon}"></i> ${h.name}</h3><p class="subtitle is-7 has-text-grey">${h.description}</p><div class="mb-2"><span class="tag is-light"><i class="fas fa-coins"></i>&nbsp;+${h.coin_reward}</span><span class="tag is-info"><i class="fas fa-fire"></i>&nbsp;${h.current_streak || 0} day streak</span><span class="tag is-warning"><i class="fas fa-crown"></i>&nbsp;Best: ${h.longest_streak || 0}</span></div></div><div class="mt-3"><button class="button ${h.completed_today ? 'is-success' : 'is-info'} is-small" onclick="app.showCompleteModal(${h.id}); return false;" ${h.completed_today ? 'disabled' : ''}><span class="icon is-small"><i class="fas fa-check"></i></span><span>${h.completed_today ? 'Done Today!' : 'Complete'}</span></button><button class="button is-danger is-small is-outlined" onclick="app.deleteHabit(${h.id}); return false;"><span class="icon is-small"><i class="fas fa-trash"></i></span></button></div></div></div>`).join('')}</div></div>`;
    }

    renderCompletedLogs(logs) {
        const container = document.getElementById('completed-container');
        if (logs.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `<div class="box mt-5"><h2 class="title is-5"><i class="fas fa-history"></i> Recently Completed</h2><div class="table-container"><table class="table is-striped is-hoverable is-fullwidth"><thead><tr><th>Habit</th><th>Completed</th><th>Coins</th></tr></thead><tbody>${logs.map(log => `<tr><td><strong>${log.habit_name}</strong></td><td>${log.completed_date}</td><td><span class="tag is-warning"><i class="fas fa-coins"></i> +${log.coins_earned}</span></td></tr>`).join('')}</tbody></table></div></div>`;
    }

    showCreateHabit() {
        localStorage.setItem('lastPage', 'createhabit');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="columns"><div class="column is-half"><h1 class="title"><i class="fas fa-plus-circle"></i> Create Habit</h1><form id="create-habit-form"><div class="field"><label class="label">Habit Name</label><div class="control"><input class="input" type="text" id="name" required></div></div><div class="field"><label class="label">Description</label><div class="control"><textarea class="textarea" id="description" rows="3"></textarea></div></div><div class="field"><label class="label">Frequency</label><div class="control"><div class="select"><select id="frequency"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div></div></div><div class="field"><label class="label">Color</label><div class="control"><input class="input" type="color" id="color" value="#007bff"></div></div><div class="field"><label class="label">Icon</label><div class="control"><div class="select"><select id="icon"><option value="fa-circle">● Circle</option><option value="fa-star">⭐ Star</option><option value="fa-square">■ Square</option><option value="fa-triangle">▲ Triangle</option><option value="fa-heart">❤ Heart</option></select></div></div></div><div class="notification is-info"><strong>💰 Reward: 10 coins</strong> (fixed)</div><div class="field is-grouped"><div class="control"><button class="button is-primary" type="submit">Create</button></div><div class="control"><button class="button is-light" type="button" onclick="app.showHome(); return false;">Cancel</button></div></div></form></div></div>`;
    }

    async showProfile() {
        localStorage.setItem('lastPage', 'profile');
        if (!this.currentUser) return;
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success) document.getElementById('app-content').innerHTML = `<div class="columns"><div class="column is-8"><h1 class="title"><i class="fas fa-user-circle"></i> Profile</h1><div class="box mb-4"><h2 class="title is-5">User Info</h2><p><strong>Username:</strong> ${this.currentUser.username}</p><p><strong>Email:</strong> ${this.currentUser.email}</p><p><strong>Coins:</strong> <span class="tag is-warning">${this.currentUser.coins}</span></p></div><div class="box"><h2 class="title is-5">Stats</h2><p><strong>Completed:</strong> ${data.total_completed}</p><p><strong>Coins Earned:</strong> ${data.total_coins_earned}</p></div></div></div>`;
        } catch (e) {
            console.error('Error loading profile:', e);
        }
    }

    showSupport() {
        localStorage.setItem('lastPage', 'support');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="columns is-centered"><div class="column is-8"><h1 class="title"><i class="fas fa-headset"></i> Support</h1><div class="box mt-4"><form id="support-form"><div class="field"><label class="label">Email</label><div class="control"><input class="input" type="email" id="email" value="${this.currentUser.email}" required></div></div><div class="field"><label class="label">Subject</label><div class="control"><input class="input" type="text" id="subject" required></div></div><div class="field"><label class="label">Message</label><div class="control"><textarea class="textarea" id="message" rows="5" required></textarea></div></div><div class="field"><div class="control"><button class="button is-primary" type="submit">Send</button></div></div></form></div></div></div>`;
    }

    async showFeed() {
        localStorage.setItem('lastPage', 'feed');
        if (!this.currentUser) return;
        document.getElementById('app-content').innerHTML = `<div class="columns"><div class="column is-8"><h1 class="title"><i class="fas fa-globe"></i> Community Feed</h1><div class="notification is-info"><strong><i class="fas fa-coins"></i> Coins:</strong> ${this.currentUser.coins} | <strong>💬 Comments:</strong> 1 coin | <strong>👍 Likes:</strong> FREE</div><div id="feed-container"></div></div></div>`;
        try {
            const res = await fetch('/api/feed?page=1');
            const data = await res.json();
            if (data.success) {
                const container = document.getElementById('feed-container');
                container.innerHTML = data.feed.map(item => `<div class="box feed-card"><div class="mb-3"><strong>${item.user}</strong> completed <span style="color: ${item.habit_color};"><i class="fas ${item.habit_icon}"></i> ${item.habit_name}</span><br><small class="has-text-grey">${item.created_at}</small></div>${item.image_url ? `<img src="${item.image_url}" alt="Habit completion" class="feed-image">` : ''}<div class="notification is-success mb-3"><i class="fas fa-coins"></i> +${item.coins_earned}</div><div class="mb-3"><button class="button is-small ${item.liked ? 'is-primary' : 'is-outlined'}" onclick="app.toggleLike(${item.id}, ${item.liked}); return false;"><span class="icon is-small"><i class="fas fa-thumbs-up"></i></span><span>${item.likes}</span></button></div><div id="comments-${item.id}" class="mb-3"></div><div class="mt-3 pt-3" style="border-top: 1px solid #eee;"><textarea class="textarea" id="comment-text-${item.id}" placeholder="Comment (1 coin)..." rows="2" maxlength="500"></textarea><button class="button is-primary is-small mt-2" onclick="app.addComment(${item.id}); return false;"><span class="icon is-small"><i class="fas fa-comment"></i></span><span>Post</span></button></div></div>`).join('');
                data.feed.forEach(item => this.loadComments(item.id));
            }
        } catch (e) {
            console.error('Error loading feed:', e);
        }
    }

    async loadComments(logId) {
        try {
            const res = await fetch(`/api/feed/${logId}/comments`);
            const data = await res.json();
            if (data.success) {
                const container = document.getElementById(`comments-${logId}`);
                if (data.comments.length === 0) {
                    container.innerHTML = '<p class="has-text-grey is-size-7">No comments</p>';
                } else {
                    container.innerHTML = `<h6 class="title is-6"><i class="fas fa-comments"></i> Comments (${data.comments.length}):</h6>${data.comments.map(c => `<div class="box comment-box"><div class="mb-2"><strong>${c.author}</strong><small class="has-text-grey is-block">${c.created_at}</small></div><p class="mb-0">${c.content}</p>${c.is_owner ? `<button class="button is-danger is-small is-outlined mt-2" onclick="app.deleteComment(${logId}, ${c.id}); return false;"><span class="icon is-small"><i class="fas fa-trash-alt"></i></span></button>` : ''}</div>`).join('')}`;
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
                this.showHome();
            }
        } catch (e) {
            console.error('Login error:', e);
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
                this.showHome();
            }
        } catch (e) {
            console.error('Register error:', e);
        }
    }

    async handleCreateHabit(e) {
        e.preventDefault();
        const habitData = { name: document.getElementById('name').value.trim(), description: document.getElementById('description').value.trim(), frequency: document.getElementById('frequency').value, color: document.getElementById('color').value, icon: document.getElementById('icon').value };
        try {
            const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(habitData) });
            const data = await res.json();
            if (data.success) {
                this.showHome();
            }
        } catch (e) {
            console.error('Create habit error:', e);
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
                e.target.reset();
            }
        } catch (e) {
            console.error('Support error:', e);
        }
    }

    showCompleteModal(habitId) {
        const self = this;
        const modal = `
            <div class="modal is-active" id="completeModal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Complete Habit</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body">
                        <p>Add a photo of your completion (optional):</p>
                        <div class="file has-name is-boxed mb-3">
                            <label class="file-label">
                                <input class="file-input" type="file" id="habitImage" accept="image/*">
                                <span class="file-cta">
                                    <span class="file-icon"><i class="fas fa-upload"></i></span>
                                    <span class="file-label">Choose a file…</span>
                                </span>
                                <span class="file-name" id="fileName">No file chosen</span>
                            </label>
                        </div>
                        <div id="imagePreview"></div>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button" id="cancelBtn">Cancel</button>
                        <button class="button is-success" id="completeBtn">Complete</button>
                    </footer>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        
        const closeModal = () => {
            const el = document.getElementById('completeModal');
            if (el) el.remove();
        };
        
        // Close handlers
        document.querySelector('#completeModal .modal-background').onclick = closeModal;
        document.querySelector('#completeModal .delete').onclick = closeModal;
        document.getElementById('cancelBtn').onclick = closeModal;
        
        // File input
        document.getElementById('habitImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            document.getElementById('fileName').textContent = file ? file.name : 'No file chosen';
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('imagePreview').innerHTML = `<img src="${event.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 5px;">`;
                    self.selectedImage = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Complete handler
        document.getElementById('completeBtn').onclick = async () => {
            try {
                const res = await fetch(`/api/habits/${habitId}/complete`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ image_url: self.selectedImage || null }) 
                });
                
                const data = await res.json();
                
                if (data.success) {
                    self.currentUser.coins = data.user.coins;
                    self.selectedImage = null;
                    closeModal();
                    await self.showHome();
                } else {
                    self.showErrorModal(data.error || 'Error completing habit');
                }
            } catch (e) {
                console.error('Error:', e);
                self.showErrorModal('Error: ' + e.message);
            }
        };
    }

    // ...existing code...

    // ...existing code...

    async deleteHabit(habitId) {
        if (!confirm('Delete this habit?')) return;
        try {
            const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showHome();
            }
        } catch (e) {
            console.error('Error deleting habit:', e);
        }
    }

    async addComment(logId) {
        const textarea = document.getElementById(`comment-text-${logId}`);
        const content = textarea.value.trim();
        if (!content) return;
        try {
            const res = await fetch(`/api/feed/${logId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
            const data = await res.json();
            if (data.success) {
                this.currentUser.coins = data.user.coins;
                textarea.value = '';
                await this.loadComments(logId);
            } else {
                this.showErrorModal(data.error);
            }
        } catch (e) {
            console.error('Error posting comment:', e);
        }
    }

    async deleteComment(logId, commentId) {
        try {
            const res = await fetch(`/api/feed/${logId}/comment/${commentId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.currentUser.coins = data.user.coins;
                this.currentUser.is_admin = data.user.is_admin;
                await this.loadComments(logId);
            }
        } catch (e) {
            console.error('Error deleting comment:', e);
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.currentUser = null;
            this.updateNav(false);
            this.showLogin();
        } catch (e) {
            console.error('Logout error:', e);
        }
    }

    async toggleLike(logId, isLiked) {
        const endpoint = isLiked ? 'unlike' : 'like';
        try {
            const res = await fetch(`/api/feed/${logId}/${endpoint}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showFeed();
            } else {
                this.showErrorModal(data.error);
            }
        } catch (e) {
            console.error(`Error ${endpoint}ing post:`, e);
        }
    }

    async showAdminPanel() {
        console.log('showAdminPanel called');
        console.log('Current user:', this.currentUser);
        console.log('Is admin:', this.currentUser.is_admin);
        
        localStorage.setItem('lastPage', 'admin');
        if (!this.currentUser || !this.currentUser.is_admin) {
            console.log('User is not admin, redirecting to home');
            return this.showHome();
        }
        
        document.getElementById('app-content').innerHTML = `<div class="columns"><div class="column"><h1 class="title"><i class="fas fa-shield-alt"></i> Admin Panel</h1><div class="tabs"><ul><li id="comments-tab" class="is-active"><a href="#" onclick="app.loadAdminComments(); return false;">Comments</a></li><li id="images-tab"><a href="#" onclick="app.loadAdminImages(); return false;">Images</a></li></ul></div><div id="admin-content"></div></div></div>`;
        await this.loadAdminComments();
    }

    async loadAdminComments() {
        document.getElementById('comments-tab').classList.add('is-active');
        document.getElementById('images-tab').classList.remove('is-active');
        
        try {
            const res = await fetch('/api/admin/comments');
            const data = await res.json();
            if (data.success) {
                const content = document.getElementById('admin-content');
                if (data.comments.length === 0) {
                    content.innerHTML = '<p class="notification is-info">No comments to review.</p>';
                } else {
                    content.innerHTML = `<div>${data.comments.map(c => `<div class="box"><strong>${c.author}</strong><p class="mt-2">${c.content}</p><small class="has-text-grey">${c.created_at}</small><br><button class="button is-danger is-small mt-2" onclick="app.deleteAdminComment(${c.id}); return false;"><i class="fas fa-trash"></i> Delete</button></div>`).join('')}</div>`;
                }
            } else {
                document.getElementById('admin-content').innerHTML = `<p class="notification is-danger">${data.error}</p>`;
            }
        } catch (e) {
            console.error('Error loading comments:', e);
            document.getElementById('admin-content').innerHTML = `<p class="notification is-danger">Error loading comments</p>`;
        }
    }

    async loadAdminImages() {
        document.getElementById('comments-tab').classList.remove('is-active');
        document.getElementById('images-tab').classList.add('is-active');
        
        try {
            const res = await fetch('/api/admin/posts');
            const data = await res.json();
            if (data.success) {
                const content = document.getElementById('admin-content');
                if (data.posts.length === 0) {
                    content.innerHTML = '<p class="notification is-info">No images to review.</p>';
                } else {
                    content.innerHTML = `<div class="columns is-multiline">${data.posts.map(p => `<div class="column is-half"><div class="box"><img src="${p.image_url}" alt="Post image" class="feed-image"><p><strong>${p.user}</strong> - ${p.habit}</p><small class="has-text-grey">${p.created_at}</small><br><button class="button is-danger is-small mt-2" onclick="app.deleteAdminImage(${p.id}); return false;"><i class="fas fa-trash"></i> Delete Image</button></div></div>`).join('')}</div>`;
                }
            } else {
                document.getElementById('admin-content').innerHTML = `<p class="notification is-danger">${data.error}</p>`;
            }
        } catch (e) {
            console.error('Error loading images:', e);
            document.getElementById('admin-content').innerHTML = `<p class="notification is-danger">Error loading images</p>`;
        }
    }

    async deleteAdminComment(commentId) {
        try {
            const res = await fetch(`/api/admin/comments/${commentId}/delete`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                await this.loadAdminComments();
            }
        } catch (e) {
            console.error('Error deleting comment:', e);
        }
    }

    async deleteAdminImage(logId) {
        try {
            const res = await fetch(`/api/admin/posts/${logId}/delete-image`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                await this.loadAdminImages();
            }
        } catch (e) {
            console.error('Error deleting image:', e);
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => app = new HabitTrackerApp());
