package com.mws.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.mws.R

class ProfileActivity : AppCompatActivity() {
    
    private val pickImage = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { handleImageSelection(it) }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        
        // TODO: Implement profile functionality
        // - Load student profile data
        // - Display profile picture
        // - Handle profile picture upload
        // - Show student statistics
    }
    
    private fun handleImageSelection(uri: Uri) {
        // TODO: Implement image handling
        // - Upload to Cloudinary
        // - Store locally for instant display
        // - Update profile picture
        // - Delete old picture from Cloudinary
    }
    
    private fun openImagePicker() {
        pickImage.launch("image/*")
    }
    
    private fun openCamera() {
        // TODO: Implement camera functionality
        // - Take photo with camera
        // - Process and upload image
    }
}
