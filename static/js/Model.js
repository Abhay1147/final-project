// Habit Tracker - Model (Data Layer)
class HabitTrackerModel {
    constructor() {
        this.currentUser = null;
    }

    // Auth Methods
    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    }

    async register(username, email, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return await response.json();
    }

    async getCurrentUser() {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
            return await response.json();
        }
        return null;
    }

    async logout() {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        return await response.json();
    }

    // Habit Methods
    async getHabits() {
        const response = await fetch('/api/habits');
        return await response.json();
    }

    async createHabit(habitData) {
        const response = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitData)
        });
        return await response.json();
    }

    async completeHabit(habitId) {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'POST'
        });
        return await response.json();
    }

    // Store Methods
    async getStoreItems() {
        const response = await fetch('/api/store');
        return await response.json();
    }

    // Support Methods
    async submitFeedback(feedbackData) {
        const response = await fetch('/api/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        return await response.json();
    }

    // Profile Methods
    async getProfile() {
        const response = await fetch('/api/profile');
        return await response.json();
    }

    // Comment Methods
    async getComments(habitId) {
        const response = await fetch(`/api/comments/habit/${habitId}`);
        return await response.json();
    }

    async createComment(habitId, content) {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id: habitId, content })
        });
        return await response.json();
    }

    async deleteComment(commentId) {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    async updateComment(commentId, content) {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        return await response.json();
    }
}
