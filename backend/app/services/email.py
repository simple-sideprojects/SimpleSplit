from email.message import EmailMessage
import logging
import smtplib

from app.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:

    @staticmethod
    def send_mail(msg: EmailMessage):
        settings = get_settings()

        if 'From' not in msg:
            msg['From'] = settings.SENDER_EMAIL

        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()

                if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                    raise ValueError("SMTP credentials are not provided")

                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        except (OSError, smtplib.SMTPException, ValueError):
            # Background tasks can't surface failures back to the client, so
            # log and swallow — the alternative is a crashed worker thread.
            logger.exception("failed to send email to %s", msg.get("To"))

    @staticmethod
    def send_confirm_email(email, frontend_url, token):
        settings = get_settings()

        confirmation_link = f"{frontend_url}/confirm/{token}"

        msg = EmailMessage()
        msg['From'] = settings.SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = 'SimpleSplit - Account Confirmation'

        msg.set_content(
            "Thank you for registering!\n\n"
            "Please confirm your account by clicking the link below:\n"
            f"{confirmation_link}\n\n"
            "Your SimpleSplit Team\n"
        )

        EmailService.send_mail(msg)

    @staticmethod
    def send_group_invite(email: str, group_name: str, token: str):
        """Email the invite link. Called as a BackgroundTask from the invite
        router so a slow SMTP doesn't stall the API response."""
        settings = get_settings()

        invite_link = f"{settings.FRONTEND_URL}/groups/invite?token={token}"

        msg = EmailMessage()
        msg['From'] = settings.SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = f"SimpleSplit - You've been invited to join {group_name}"

        msg.set_content(
            f"You've been invited to join the \"{group_name}\" group on SimpleSplit.\n\n"
            "Click the link below to accept:\n"
            f"{invite_link}\n\n"
            "If you don't want to join, you can ignore this email.\n\n"
            "Your SimpleSplit Team\n"
        )

        EmailService.send_mail(msg)
