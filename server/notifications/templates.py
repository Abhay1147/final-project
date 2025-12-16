# server/notifications/templates.py

# --- USER REGISTERED ---
def user_registered(ctx):
    return (
        "Welcome to Habit Tracker 🎉",
        f"""
        <h2>Welcome, {ctx['username']}!</h2>
        <p>Thanks for joining Habit Tracker.</p>
        <p>Start building habits and earning coins today 💪</p>
        """
    )

# --- COMMENT ON POST ---
def comment_on_post(ctx):
    return (
        "New Comment on Your Post 🗨️",
        f"""
        <h2>New Comment on Your Post</h2>
        <p>Someone commented on your post for the habit <strong>{ctx['habit_name']}</strong>:</p>
        <blockquote>{ctx['comment']}</blockquote>
        """
    )

# --- STREAK MILESTONE (optional, example) ---
def streak_milestone(ctx):
    return (
        "Streak Milestone Achieved! 🔥",
        f"""
        <h2>Congrats, {ctx['username']}!</h2>
        <p>You just reached a {ctx['streak']} day streak for your habit <strong>{ctx['habit_name']}</strong>!</p>
        <p>Keep going and build your streak even higher!</p>
        """
    )

# --- POST CREATED (optional, example) ---
def post_created(ctx):
    return (
        "New Habit Post Created 📝",
        f"""
        <h2>{ctx['username']} created a new habit post</h2>
        <p>Habit: <strong>{ctx['habit_name']}</strong></p>
        <p><a href="{ctx.get('post_url', '#')}">View Post</a></p>
        """
    )

# Dictionary of templates
TEMPLATES = {
    "USER_REGISTERED": user_registered,
    "COMMENT_ON_POST": comment_on_post,
    "STREAK_MILESTONE": streak_milestone,
    "POST_CREATED": post_created,
}
