# Email Configuration Guide

## Overview
This guide explains how to properly configure the email service for the daily streak feature.

## Configuration

To enable email notifications for the daily streak feature, you need to configure the following environment variables in your `backend/.env` file:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
```

## Gmail Configuration

If you're using Gmail (which is the default configuration), follow these steps:

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - In your Google Account, go to Security → 2-Step Verification → App passwords
   - Select "Mail" as the app and your device
   - Generate the app password
   - Use this app password as your `SENDER_PASSWORD`

3. **Configure Environment Variables**:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=your-gmail-address@gmail.com
   SENDER_PASSWORD=the-app-password-you-generated
   ```

## Other Email Providers

If you're using a different email provider, update the SMTP settings accordingly:

### Outlook/Hotmail
```
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
```
SMTP_SERVER=your-smtp-server.com
SMTP_PORT=your-smtp-port
```

## Testing Email Configuration

To test if your email configuration is working:

1. Update the `backend/.env` file with your actual email credentials
2. Run the backend server
3. The streak notification system will automatically test the email functionality

## Troubleshooting

### Common Issues

1. **Authentication Failed**: 
   - Make sure you're using an App Password, not your regular password
   - Verify that 2-Factor Authentication is enabled
   - Check that the email and password are correct

2. **Connection Timeout**:
   - Verify that the SMTP server and port are correct
   - Check your internet connection
   - Ensure your firewall isn't blocking the connection

3. **Less Secure Apps**:
   - Gmail no longer supports "Less Secure Apps" access
   - You must use App Passwords instead

### Debugging

To enable more detailed logging, you can temporarily modify the email service to print more information about the connection process.

## Security Notes

- Never commit your actual email credentials to version control
- Use environment variables to store sensitive information
- Use App Passwords instead of your regular password
- Regularly rotate your App Passwords for security