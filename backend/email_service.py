import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# Email configuration (use environment variables)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

def send_password_reset_email(email: str, reset_token: str, base_url: str = "http://localhost:8000") -> bool:
    """
    Send password reset email to user
    
    Args:
        email: User's email address
        reset_token: Password reset token
        base_url: Base URL of the application (for reset link)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    # If SMTP is not configured, just log and return True (for development)
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"[EMAIL] Password reset requested for {email}")
        print(f"[EMAIL] Reset token: {reset_token}")
        print(f"[EMAIL] Reset link: {base_url}/reset-password?token={reset_token}")
        print("[EMAIL] SMTP not configured - email not actually sent")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Password Reset Request"
        
        # Create reset link
        reset_link = f"{base_url}/reset-password?token={reset_token}"
        
        # Email body
        body = f"""
Hello,

You requested to reset your password for the Expense App.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Expense App Team
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, email, text)
        server.quit()
        
        print(f"[EMAIL] Password reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] Error sending email: {e}")
        return False

