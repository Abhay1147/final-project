from .templates import TEMPLATES
from .channels import send_email

def send_notification(user, event, context=None):
    """
    user: User model
    event: string key (e.g. 'USER_REGISTERED')
    context: dict for message formatting
    """
    context = context or {}

    template = TEMPLATES.get(event)
    if not template:
        print(f"No template for event: {event}")
        return

    subject, body = template(context)

    # Email (can add more channels later)
    send_email(
        to_email=user.email,
        subject=subject,
        html_content=body
    )
