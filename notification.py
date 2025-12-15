# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='habittracker67@gmail.com',
    to_emails='chhaab01@luther.edu',
    subject='Notification from Habit Tracker',
    html_content="""<!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, Helvetica, sans-serif; color:#333333; line-height:1.5;">
                        <p>Hi there,</p>

                        <p>
                        This is a test notification email from <strong>Habit Tracker</strong>.
                        </p>

                        <p>
                        I hope you’re having a great day! This message is just a test while
                        notifications are still being set up, but everything will be running
                        smoothly soon.
                        </p>

                        <p>
                        Thanks for your patience, and stay consistent!
                        </p>

                        <p style="margin-top:20px;">
                        Best regards,<br>
                        <strong>The Habit Tracker Team</strong>
                        </p>

                        <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">

                        <p style="font-size:12px; color:#777777;">
                        You’re receiving this email because you signed up for Habit Tracker.
                        </p>
                    </body>
                    </html>""")
try:
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    print(response.status_code)
    print(response.body)
    print(response.headers)
except Exception as e:
    print(type(e))
    print(e)

print("Notification sent!")