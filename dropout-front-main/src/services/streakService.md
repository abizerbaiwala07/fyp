# Streak Service Documentation

## Overview
The streak service is a unified service for managing daily study streaks across all dashboard implementations. It ensures consistent behavior and provides a single point of truth for streak functionality.

## Features
- Centralized streak management
- Caching mechanism to reduce API calls
- Fallback to localStorage when API is unavailable
- Consistent time calculation for next update availability
- Error handling and user feedback

## Usage

### Importing the Service
```javascript
import streakService from '../services/streakService';
```

### Getting Streak Data
```javascript
const streakData = await streakService.getStreak(studentId);
```

### Updating Streak
```javascript
const timestamp = new Date();
const response = await streakService.updateStreak(studentId, timestamp);
```

### Checking if Streak Can Be Updated
```javascript
const canUpdate = await streakService.canUpdateStreak(studentId);
```

### Getting Time Until Next Update
```javascript
const nextUpdateMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
```

## API

### `getStreak(studentId)`
Fetches the current streak data for a student.

**Parameters:**
- `studentId` (string): The student's unique identifier

**Returns:**
- Promise<Object>: Streak data including count, last click time, and update availability

### `updateStreak(studentId, timestamp)`
Updates the student's streak if 24 hours have passed since the last update.

**Parameters:**
- `studentId` (string): The student's unique identifier
- `timestamp` (Date): The current timestamp

**Returns:**
- Promise<Object>: Updated streak data or error information

### `canUpdateStreak(studentId)`
Checks if the student's streak can be updated.

**Parameters:**
- `studentId` (string): The student's unique identifier

**Returns:**
- Promise<boolean>: Whether the streak can be updated

### `getFormattedTimeUntilNextUpdate(studentId)`
Gets a formatted message indicating when the next streak update will be available.

**Parameters:**
- `studentId` (string): The student's unique identifier

**Returns:**
- Promise<string>: Formatted time message (e.g., "Available in 5h 30m")

## Error Handling
The service includes comprehensive error handling:
- API failures fallback to localStorage
- Network errors are gracefully handled
- User-friendly error messages
- Automatic retry logic for temporary failures

## Caching
The service implements a caching mechanism:
- Streak data is cached for 5 minutes to reduce API calls
- Cache is automatically invalidated after the timeout period
- Manual cache refresh can be triggered when needed

## LocalStorage Fallback
When the API is unavailable, the service uses localStorage as a backup:
- Streak data is stored in `streak_${studentId}` key
- Time calculations are performed client-side
- Data persistence across sessions