# Daily Streak Feature Documentation

## Overview
This feature implements a daily streak button that students can click to maintain their study streak. The streak can only be updated once every 24 hours to encourage consistent daily engagement. If a student doesn't click the streak button within 24 hours after their last click, they will receive an email notification reminding them to maintain their streak.

## Components

### Frontend
- **StudentDashboard.js**: Contains the streak button UI and client-side tracking logic
- **StudentDashboardSimple.js**: Alternative dashboard implementation with streak functionality
- **streakService.js**: Unified service for managing streak functionality across all dashboard implementations
- The streak is visually displayed as a button with a fire icon
- The button is automatically disabled if less than 24 hours have passed since the last click
- Local storage is used for client-side tracking as a backup

### Backend
- **email_service.py**: Handles sending email notifications
- **tenth_standard.py**: Contains the streak API endpoints
- **streak_notifications.py**: Background task that checks for streak notifications
- **main.py**: Initializes the background task

## API Endpoints

### GET /api/tenth-standard/streak/{student_id}
Gets the current student streak data without updating it.

**Response:**
```json
{
  "success": true,
  "streak_count": 5,
  "last_click": "2023-10-15T10:30:00Z",
  "can_update": false,
  "next_update_allowed": "2023-10-16T10:30:00Z"
}
```

### POST /api/tenth-standard/streak/{student_id}
Updates the student's streak when they click the daily streak button. The streak can only be updated once every 24 hours.

**Request Body:**
```json
{
  "timestamp": "2023-10-15T10:30:00Z"
}
```

**Successful Response:**
```json
{
  "success": true,
  "streak_count": 5,
  "message": "Streak updated to 5 days",
  "next_update_allowed": "2023-10-16T10:30:00Z"
}
```

**Rejected Response (less than 24 hours since last click):**
```json
{
  "success": false,
  "streak_count": 4,
  "message": "Streak can only be updated once every 24 hours",
  "next_update_allowed": "2023-10-16T08:30:00Z"
}
```

## Email Configuration

To enable email notifications, you need to configure the following environment variables in `backend/.env`:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
```

### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password as `SENDER_PASSWORD`

## How It Works

1. **Streak Tracking**: When a student clicks the streak button, the frontend sends a request to the backend which checks if 24 hours have passed since the last click. If so, it increments the streak count.

2. **24-Hour Limit**: The system enforces a strict 24-hour limit between streak updates. If a student tries to click the button before 24 hours have passed, the request is rejected.

3. **Visual Feedback**: The frontend disables the streak button and shows a countdown timer indicating when the next click will be allowed.

4. **Notification Check**: A background task runs every hour to check if any student hasn't clicked their streak button in the past 24 hours.

5. **Email Sending**: If a student has missed their streak (more than 24 hours since last click), an email is sent to their registered email address.

## Database Collections

### student_streaks
Stores streak information for each student:
- `student_id`: The student's unique identifier
- `streak_count`: Current streak count
- `last_click`: ISO timestamp of the last streak click
- `updated_at`: Last update timestamp
- `last_notification_sent`: Timestamp of the last notification sent (to prevent duplicates)

## Testing

To test the email functionality, run:
```bash
cd backend
python test_streak_notification.py
```

## Customization

You can customize the email content by modifying the `send_streak_reminder_email` method in `email_service.py`.

## Improvements

The streak feature has been enhanced with a unified service (`streakService.js`) that provides consistent behavior across all dashboard implementations:
- Centralized streak management logic
- Improved caching mechanism to reduce API calls
- Better error handling and fallback mechanisms
- Consistent user experience across different dashboard views
- Enhanced time calculation for next update availability