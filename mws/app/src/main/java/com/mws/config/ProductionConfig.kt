package com.mws.config

object ProductionConfig {
    
    // API Configuration - temporarily hardcoded for build fix
    val API_BASE_URL: String = "https://mathayomwatsing.netlify.app/.netlify/functions/"
    
    // Cloudinary Configuration - using environment variables for security
    val CLOUDINARY_CLOUD_NAME: String = System.getenv("CLOUDINARY_CLOUD_NAME") ?: "dnovxoaqi"
    val CLOUDINARY_API_KEY: String = System.getenv("CLOUDINARY_API_KEY") ?: ""
    val CLOUDINARY_API_SECRET: String = System.getenv("CLOUDINARY_API_SECRET") ?: ""
    
    // Feature Flags - temporarily hardcoded for build fix
    val ENABLE_LOGGING: Boolean = true
    val ENABLE_DEBUG_FEATURES: Boolean = true
    val ENABLE_CRASH_REPORTING: Boolean = false
    val ENABLE_ANALYTICS: Boolean = false
    
    // Performance Configuration
    const val CACHE_SIZE_MB = 50L
    const val MAX_CONCURRENT_OPERATIONS = 10
    const val DATABASE_TIMEOUT_MS = 30000L
    const val IMAGE_COMPRESSION_QUALITY = 85
    const val MAX_IMAGE_SIZE_MB = 5L
    
    // Security Configuration
    const val PASSWORD_MIN_LENGTH = 8
    const val SESSION_TIMEOUT_MINUTES = 60L
    const val MAX_LOGIN_ATTEMPTS = 5
    const val LOGIN_LOCKOUT_MINUTES = 15L
    
    // Analytics Configuration
    const val ANALYTICS_SAMPLE_RATE = 1.0f
    const val CRASH_REPORTING_ENABLED = true
    const val PERFORMANCE_MONITORING_ENABLED = true
    
    // Validation Configuration
    const val MAX_QUESTION_TEXT_LENGTH = 1000
    const val MAX_OPTION_TEXT_LENGTH = 200
    const val MAX_TOPIC_NAME_LENGTH = 50
    const val MAX_DIFFICULTY_NAME_LENGTH = 20
    
    // Network Configuration
    const val NETWORK_TIMEOUT_SECONDS = 30L
    const val RETRY_ATTEMPTS = 3
    const val RETRY_DELAY_MS = 1000L
    
    // Database Configuration
    const val DATABASE_VERSION = 1
    const val DATABASE_NAME = "mws_database"
    const val DATABASE_BACKUP_ENABLED = true
    const val DATABASE_BACKUP_INTERVAL_HOURS = 24L
    
    // Cache Configuration
    const val MEMORY_CACHE_SIZE = 50
    const val DISK_CACHE_SIZE_MB = 100L
    const val CACHE_EXPIRY_HOURS = 24L
    
    // Notification Configuration
    const val NOTIFICATION_CHANNEL_ID = "mws_notifications"
    const val NOTIFICATION_CHANNEL_NAME = "MWS Notifications"
    const val NOTIFICATION_CHANNEL_DESCRIPTION = "Important notifications from MWS app"
    
    // File Upload Configuration
    const val MAX_FILE_SIZE_MB = 10L
    // Note: Lists cannot be const val, using companion object instead
    val ALLOWED_IMAGE_FORMATS = listOf("jpg", "jpeg", "png", "webp")
    val ALLOWED_DOCUMENT_FORMATS = listOf("pdf", "doc", "docx")
    
    // Test Configuration
    const val DEFAULT_TEST_DURATION_MINUTES = 30
    const val MAX_QUESTIONS_PER_TEST = 100
    const val MIN_QUESTIONS_PER_TEST = 5
    
    // User Interface Configuration
    const val ANIMATION_DURATION_MS = 300L
    const val SPLASH_SCREEN_DURATION_MS = 2000L
    const val AUTO_SAVE_INTERVAL_MS = 5000L
    
    // Error Handling Configuration
    const val MAX_ERROR_LOG_SIZE = 1000
    const val ERROR_REPORTING_ENABLED = true
    const val USER_FRIENDLY_ERROR_MESSAGES = true
    
    // Performance Monitoring Configuration
    const val PERFORMANCE_SAMPLE_INTERVAL_MS = 5000L
    const val MEMORY_WARNING_THRESHOLD_MB = 100L
    const val CPU_WARNING_THRESHOLD_PERCENT = 80f
    const val BATTERY_WARNING_THRESHOLD_PERCENT = 20f
    
    // Backup and Sync Configuration
    const val AUTO_BACKUP_ENABLED = true
    const val BACKUP_WIFI_ONLY = true
    const val SYNC_INTERVAL_MINUTES = 60L
    const val MAX_BACKUP_SIZE_MB = 500L
    
    // Accessibility Configuration
    const val ENABLE_SCREEN_READER_SUPPORT = true
    const val ENABLE_HIGH_CONTRAST_MODE = true
    const val ENABLE_LARGE_TEXT_MODE = true
    const val ENABLE_VIBRATION_FEEDBACK = true
    
    // Localization Configuration
    const val DEFAULT_LOCALE = "en"
    // Note: Lists cannot be const val, using companion object instead
    val SUPPORTED_LOCALES = listOf("en", "th", "zh", "ja")
    const val AUTO_LOCALE_DETECTION = true
    
    // Privacy Configuration
    const val DATA_COLLECTION_ENABLED = true
    const val USER_ANALYTICS_ENABLED = true
    const val CRASH_REPORTING_ENABLED_PRIVACY = true
    const val DATA_RETENTION_DAYS = 365L
    
    // Compliance Configuration
    const val GDPR_COMPLIANCE_ENABLED = true
    const val COPPA_COMPLIANCE_ENABLED = true
    const val ACCESSIBILITY_COMPLIANCE_ENABLED = true
    const val SECURITY_COMPLIANCE_ENABLED = true
}
