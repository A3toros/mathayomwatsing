package com.mws.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.cloudinary.Cloudinary
import com.cloudinary.utils.ObjectUtils
import com.mws.config.CloudinaryConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.IOException

/**
 * ImageUploadService - Handles image upload to Cloudinary
 * Manages image compression, upload, and URL retrieval
 */
class ImageUploadService(private val context: Context) {

    private val cloudinary: Cloudinary by lazy {
        Cloudinary(ObjectUtils.asMap(
            "cloud_name", CloudinaryConfig.CLOUD_NAME,
            "api_key", CloudinaryConfig.API_KEY,
            "api_secret", CloudinaryConfig.API_SECRET
        ))
    }

    /**
     * Uploads an image from URI to Cloudinary
     * @param imageUri URI of the image to upload
     * @param publicId Optional public ID for the image
     * @return Result containing success status and image URL
     */
    suspend fun uploadImage(imageUri: Uri, publicId: String? = null): UploadResult {
        return withContext(Dispatchers.IO) {
            try {
                // Check if configuration is valid
                if (!CloudinaryConfig.isValidConfig()) {
                    return@withContext UploadResult.Error("Cloudinary configuration is not set. Please update CloudinaryConfig.kt with your credentials.")
                }

                // Convert URI to file
                val imageFile = getFileFromUri(imageUri)
                if (imageFile == null) {
                    return@withContext UploadResult.Error("Failed to get image file from URI")
                }

                // Compress image
                val compressedBitmap = compressImage(imageFile)
                if (compressedBitmap == null) {
                    return@withContext UploadResult.Error("Failed to compress image")
                }

                // Convert bitmap to byte array
                val byteArray = bitmapToByteArray(compressedBitmap)

                // Prepare upload options
                val uploadOptions = mutableMapOf<String, Any>()
                if (publicId != null) {
                    uploadOptions["public_id"] = publicId
                }
                uploadOptions["folder"] = CloudinaryConfig.UPLOAD_FOLDER
                uploadOptions["transformation"] = CloudinaryConfig.IMAGE_TRANSFORMATION

                // Upload to Cloudinary
                val result = cloudinary.uploader().upload(byteArray, uploadOptions)

                // Extract URL from result
                val imageUrl = result["secure_url"] as? String
                if (imageUrl != null) {
                    Log.d(TAG, "Image uploaded successfully: $imageUrl")
                    UploadResult.Success(imageUrl)
                } else {
                    UploadResult.Error("Failed to get image URL from upload result")
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error uploading image", e)
                UploadResult.Error("Upload failed: ${e.message}")
            }
        }
    }

    /**
     * Uploads an image from file path to Cloudinary
     * @param filePath Path to the image file
     * @param publicId Optional public ID for the image
     * @return Result containing success status and image URL
     */
    suspend fun uploadImageFromPath(filePath: String, publicId: String? = null): UploadResult {
        return withContext(Dispatchers.IO) {
            try {
                // Check if configuration is valid
                if (!CloudinaryConfig.isValidConfig()) {
                    return@withContext UploadResult.Error("Cloudinary configuration is not set. Please update CloudinaryConfig.kt with your credentials.")
                }

                val imageFile = File(filePath)
                if (!imageFile.exists()) {
                    return@withContext UploadResult.Error("Image file does not exist")
                }

                // Compress image
                val compressedBitmap = compressImage(imageFile)
                if (compressedBitmap == null) {
                    return@withContext UploadResult.Error("Failed to compress image")
                }

                // Convert bitmap to byte array
                val byteArray = bitmapToByteArray(compressedBitmap)

                // Prepare upload options
                val uploadOptions = mutableMapOf<String, Any>()
                if (publicId != null) {
                    uploadOptions["public_id"] = publicId
                }
                uploadOptions["folder"] = CloudinaryConfig.UPLOAD_FOLDER
                uploadOptions["transformation"] = CloudinaryConfig.IMAGE_TRANSFORMATION

                // Upload to Cloudinary
                val result = cloudinary.uploader().upload(byteArray, uploadOptions)

                // Extract URL from result
                val imageUrl = result["secure_url"] as? String
                if (imageUrl != null) {
                    Log.d(TAG, "Image uploaded successfully: $imageUrl")
                    UploadResult.Success(imageUrl)
                } else {
                    UploadResult.Error("Failed to get image URL from upload result")
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error uploading image", e)
                UploadResult.Error("Upload failed: ${e.message}")
            }
        }
    }

    /**
     * Deletes an image from Cloudinary
     * @param publicId Public ID of the image to delete
     * @return Result containing success status
     */
    suspend fun deleteImage(publicId: String): DeleteResult {
        return withContext(Dispatchers.IO) {
            try {
                // Check if configuration is valid
                if (!CloudinaryConfig.isValidConfig()) {
                    return@withContext DeleteResult.Error("Cloudinary configuration is not set. Please update CloudinaryConfig.kt with your credentials.")
                }

                val result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap())
                val success = result["result"] as? String == "ok"
                
                if (success) {
                    Log.d(TAG, "Image deleted successfully: $publicId")
                    DeleteResult.Success
                } else {
                    DeleteResult.Error("Failed to delete image")
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error deleting image", e)
                DeleteResult.Error("Delete failed: ${e.message}")
            }
        }
    }

    /**
     * Gets file from URI
     */
    private fun getFileFromUri(uri: Uri): File? = try {
        when (uri.scheme) {
            "file" -> File(uri.path ?: "")
            "content" -> {
                val inputStream = context.contentResolver.openInputStream(uri)
                val tempFile = File.createTempFile("temp_image", ".jpg", context.cacheDir)
                inputStream?.use { input ->
                    tempFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                tempFile
            }
            else -> null
        }
    } catch (e: Exception) {
        Log.e(TAG, "Error getting file from URI", e)
        null
    }

    /**
     * Compresses image to reduce file size
     */
    private fun compressImage(imageFile: File): Bitmap? = try {
        val options = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(imageFile.absolutePath, options)

        // Calculate sample size for compression
        val maxSize = CloudinaryConfig.MAX_IMAGE_SIZE
        var sampleSize = 1
        while (options.outWidth / sampleSize > maxSize || options.outHeight / sampleSize > maxSize) {
            sampleSize *= 2
        }

        // Decode with compression
        options.inJustDecodeBounds = false
        options.inSampleSize = sampleSize
        BitmapFactory.decodeFile(imageFile.absolutePath, options)

    } catch (e: Exception) {
        Log.e(TAG, "Error compressing image", e)
        null
    }

    /**
     * Converts bitmap to byte array
     */
    private fun bitmapToByteArray(bitmap: Bitmap): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, CloudinaryConfig.JPEG_QUALITY, stream)
        return stream.toByteArray()
    }

    /**
     * Sealed class for upload results
     */
    sealed class UploadResult {
        data class Success(val imageUrl: String) : UploadResult()
        data class Error(val message: String) : UploadResult()
    }

    /**
     * Sealed class for delete results
     */
    sealed class DeleteResult {
        object Success : DeleteResult()
        data class Error(val message: String) : DeleteResult()
    }

    companion object {
        private const val TAG = "ImageUploadService"
    }
}
