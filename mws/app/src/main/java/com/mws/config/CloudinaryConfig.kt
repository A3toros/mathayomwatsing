package com.mws.config

/**
 * CloudinaryConfig - Configuration constants for Cloudinary integration
 * Replace these values with your actual Cloudinary credentials
 */
object CloudinaryConfig {
    
    // TODO: Replace with your actual Cloudinary credentials
    const val CLOUD_NAME = "your_cloud_name"
    const val API_KEY = "your_api_key"
    const val API_SECRET = "your_api_secret"
    
    // Upload settings
    const val UPLOAD_FOLDER = "student_profiles"
    const val IMAGE_TRANSFORMATION = "w_300,h_300,c_fill,g_face"
    const val MAX_IMAGE_SIZE = 1024
    const val JPEG_QUALITY = 80
    
    // Validation
    fun isValidConfig(): Boolean {
        return CLOUD_NAME != "your_cloud_name" &&
               API_KEY != "your_api_key" &&
               API_SECRET != "your_api_secret"
    }
}
