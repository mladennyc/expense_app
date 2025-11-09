# Email Configuration for Password Reset

The password reset feature uses SMTP to send emails. You can configure it using environment variables.

## Option 1: Gmail (Recommended for Testing)

1. Create a `.env` file in the `backend` directory:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
BASE_URL=http://192.168.1.76:8000
```

2. For Gmail, you need to use an **App Password** (not your regular password):
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate an app password for "Mail"
   - Use that password in `SMTP_PASSWORD`

## Option 2: Other SMTP Providers

Update the `.env` file with your SMTP provider's settings:

```env
SMTP_SERVER=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yourdomain.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@yourdomain.com
BASE_URL=http://192.168.1.76:8000
```

## Option 3: Development Mode (No Email)

If you don't configure SMTP, the system will:
- Still generate reset tokens
- Print the reset link to the console/terminal
- Not actually send emails

This is useful for development and testing.

## Testing

1. Request a password reset from the frontend
2. Check the backend terminal for the reset link (if SMTP not configured)
3. Or check your email inbox (if SMTP is configured)
4. Click the reset link and enter a new password

## Note

The reset token expires after 1 hour for security.

