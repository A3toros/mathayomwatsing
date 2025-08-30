# MWS Mobile App

A native Android application for the Mathayomwatsing School system, built with Kotlin and modern Android development practices.

## Features

- **Student Authentication**: Secure login system for students
- **Test Management**: View and take assigned tests
- **Anti-Cheating Protection**: Advanced security measures including:
  - App minimization monitoring (7-second timer)
  - 3-strike warning system
  - Screenshot prevention
  - Screen orientation locking
  - Local security logging
- **Offline Support**: Local SQLite database for data persistence
- **Modern UI**: Material Design 3 components with teen-friendly aesthetics

## Architecture

- **Language**: Kotlin
- **Architecture Pattern**: MVVM with Repository pattern
- **Database**: Room (SQLite wrapper)
- **Networking**: Retrofit for API calls
- **Asynchronous Programming**: Coroutines and Flow
- **UI Components**: Material Design components
- **Image Loading**: Glide for profile pictures
- **Cloud Storage**: Cloudinary for image management

## Project Structure

```
app/src/main/java/com/mws/
├── activities/          # Activity classes
├── fragments/           # Fragment classes
├── adapters/            # RecyclerView adapters
├── services/            # Background services
├── utils/               # Utility classes
├── models/              # Data models
├── viewmodels/          # ViewModel classes
├── database/            # Room database classes
│   ├── entity/          # Database entities
│   ├── dao/             # Data Access Objects
│   └── converter/       # Type converters
└── testlogic/           # Test processing logic
```

## Security Features

### Anti-Cheating Measures
1. **App State Monitoring**: Tracks when app goes to background
2. **Background Timer**: 7-second limit before warning
3. **Warning System**: 3-strike system before auto-submission
4. **Screen Security**: Disables screenshots and screen recording
5. **Orientation Lock**: Prevents device rotation during tests
6. **Local Logging**: Stores security events locally

### Test Security
- Unique local tokens for each test session
- Local question shuffling (Multiple Choice, True/False, Input)
- Local word bank shuffling (Matching tests)
- Failed submission tracking with retry logic

## Database Schema

### Tables
- **test_sessions**: Active test sessions with security tokens
- **app_state_logs**: Security event logging
- **failed_submissions**: Failed test submissions for retry

## Getting Started

### Prerequisites
- Android Studio Arctic Fox or later
- Android SDK 24+ (API level 24)
- Gradle 8.0+

### Setup
1. Clone the repository
2. Open in Android Studio
3. Sync Gradle files
4. Build and run on device/emulator

### Configuration
- Update API endpoints in `ApiService`
- Configure Cloudinary credentials for image uploads
- Set up backend server endpoints

## Development Notes

- All test processing happens locally on device
- Backend APIs remain unchanged (existing functionality preserved)
- Security logging is device-specific and not sent to backend
- Profile pictures use hybrid storage (Cloudinary + local)

## Contributing

1. Follow Kotlin coding conventions
2. Use meaningful commit messages
3. Test thoroughly before submitting
4. Follow Material Design guidelines for UI

## License

This project is proprietary software for Mathayomwatsing School.
