import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from app.config import settings

logger = logging.getLogger("fleet.notifier")

async def send_telegram_alert(title: str, message: str, severity: str, server_name: str):
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        return False

    emoji_map = {
        "info": "ℹ️",
        "warning": "⚠️",
        "critical": "🚨"
    }
    emoji = emoji_map.get(severity.lower(), "🔔")

    text = f"{emoji} *VPS Fleet Monitor Alert*\n\n*Server:* `{server_name}`\n*Severity:* `{severity.upper()}`\n*Title:* {title}\n*Details:* {message}"

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info(f"Telegram notification sent for {server_name}")
                return True
            else:
                logger.warning(f"Telegram notification failed: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {e}")
        return False

def send_email_alert(title: str, message: str, severity: str, server_name: str):
    if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_FROM_EMAIL):
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{severity.upper()}] VPS Fleet Alert: {server_name} - {title}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = settings.SMTP_FROM_EMAIL # Primary admin alert mailbox

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background: #1e293b; color: #fff; padding: 16px; border-radius: 8px;">
                <h2 style="margin: 0; color: #38bdf8;">VPS Fleet Monitor Alert</h2>
            </div>
            <div style="padding: 16px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p><strong>Server:</strong> {server_name}</p>
                <p><strong>Severity:</strong> <span style="text-transform: uppercase; font-weight: bold;">{severity}</span></p>
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Message:</strong></p>
                <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px;">{message}</pre>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [settings.SMTP_FROM_EMAIL], msg.as_string())
            logger.info(f"Email alert sent for {server_name}")
            return True
    except Exception as e:
        logger.error(f"Error sending email alert: {e}")
        return False

async def dispatch_alert_notifications(title: str, message: str, severity: str, server_name: str):
    await send_telegram_alert(title, message, severity, server_name)
    send_email_alert(title, message, severity, server_name)
