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

# --- SUPPORT RECEIVED (new template) ---
def support_received(context):
    return (
        "New Support Request from Habit Tracker",
        f"""
        <h2>New Support Request</h2>
        <p><strong>From:</strong> {context.get('user_email', 'Unknown')}</p>
        <p><strong>Subject:</strong> {context.get('subject', 'No subject')}</p>
        <p><strong>Message:</strong></p>
        <p>{context.get('message', 'No message')}</p>
        """
    )

# Dictionary of templates
TEMPLATES = {
    "USER_REGISTERED": user_registered,
    "COMMENT_ON_POST": comment_on_post,
    "STREAK_MILESTONE": streak_milestone,
    "POST_CREATED": post_created,
    'SUPPORT_RECEIVED': support_received,
}
