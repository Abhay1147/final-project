import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

def send_email(to_email, subject, html_content):
    load_dotenv(os.path.join(os.path.dirname(__file__), '../../sendgrid.env'))
    try:
        message = Mail(
            from_email='habittracker67@gmail.com',
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        sg.send(message)
    except Exception as e:
        print(f"Email failed: {e}")
