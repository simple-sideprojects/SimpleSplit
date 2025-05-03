from email.message import EmailMessage
from app.config import get_settings
import smtplib


class EmailService:

    @staticmethod
    def send_mail(msg: EmailMessage):
        settings = get_settings()

        # Set the sender
        if 'From' not in msg:
            msg['From'] = settings.SENDER_EMAIL

        # Send the message via SMTP server with authentication
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()

            # Login if credentials are provided
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                raise ValueError("SMTP credentials are not provided")

            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    @staticmethod
    def send_confirm_email(email, frontend_url, token):
        settings = get_settings()

        confirmation_link = f"{frontend_url}/confirm/{token}"

        # Create the email message
        msg = EmailMessage()
        msg['From'] = settings.SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = 'SimpleSplit - Account Confirmation'

        # Set the content
        msg.set_content("""
        Thank you for registering!
        
        Please confirm your account by clicking the link below:
        {confirmation_link}
        
        Your SimpleSplit Team
        """.format(confirmation_link=confirmation_link))

        # Send the email
        EmailService.send_mail(msg)
