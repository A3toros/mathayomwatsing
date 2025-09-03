package com.mws.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModelProvider
import com.bumptech.glide.Glide
import com.mws.R
import com.mws.dialogs.ChangePasswordDialog
import com.mws.dialogs.ProfileEditDialog
import com.mws.models.Student
import com.mws.services.ImageUploadService
import com.mws.services.SessionManager
import com.mws.repository.TestRepository
import com.mws.viewmodels.ProfileViewModel
import com.mws.viewmodels.ProfileViewModelFactory
import java.io.File
import java.io.IOException

/**
 * ProfileActivity - Student profile management
 * Handles profile display, picture upload, and data editing
 */
class ProfileActivity : AppCompatActivity() {

    private lateinit var profileImageView: ImageView
    private lateinit var nameTextView: TextView
    private lateinit var emailTextView: TextView
    private lateinit var gradeTextView: TextView
    private lateinit var classTextView: TextView
    private lateinit var editProfileButton: Button
    private lateinit var changePasswordButton: Button
    private lateinit var logoutButton: Button

    private lateinit var sessionManager: SessionManager
    private lateinit var imageUploadService: ImageUploadService
    private lateinit var profileViewModel: ProfileViewModel
    private var profileImageFile: File? = null

    // Activity result launcher for image selection
    private val getContent = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { handleImageSelection(it) }
    }

    // Activity result launcher for camera capture
    private val takePicture = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success) {
            profileImageFile?.let { file ->
                handleImageSelection(Uri.fromFile(file))
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        // Initialize services
        sessionManager = SessionManager(this)
        imageUploadService = ImageUploadService(this)

        // Initialize ViewModel
        val testRepository = TestRepository()
        val factory = ProfileViewModelFactory(sessionManager, imageUploadService, testRepository)
        profileViewModel = ViewModelProvider(this, factory)[ProfileViewModel::class.java]

        // Initialize views
        initializeViews()

        // Setup observers
        setupObservers()

        // Setup click listeners
        setupClickListeners()
    }

    private fun initializeViews() {
        profileImageView = findViewById(R.id.profileImageView)
        nameTextView = findViewById(R.id.nameTextView)
        emailTextView = findViewById(R.id.emailTextView)
        gradeTextView = findViewById(R.id.gradeTextView)
        classTextView = findViewById(R.id.classTextView)
        editProfileButton = findViewById(R.id.editProfileButton)
        changePasswordButton = findViewById(R.id.changePasswordButton)
        logoutButton = findViewById(R.id.logoutButton)
    }

    private fun setupObservers() {
        // Observe profile state
        profileViewModel.profileState.observe(this) { state ->
            when (state) {
                is ProfileViewModel.ProfileState.Loading -> {
                    // Show loading indicator if needed
                }
                is ProfileViewModel.ProfileState.Success -> {
                    displayStudentInfo(state.student)
                }
                is ProfileViewModel.ProfileState.Error -> {
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                }
                is ProfileViewModel.ProfileState.LoggedOut -> {
                    navigateToLogin()
                }
            }
        }

        // Observe upload state
        profileViewModel.uploadState.observe(this) { state ->
            when (state) {
                is ProfileViewModel.UploadState.Loading -> {
                    // Show loading indicator
                    Toast.makeText(this, "Uploading image...", Toast.LENGTH_SHORT).show()
                }
                is ProfileViewModel.UploadState.Success -> {
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                    // Refresh profile to show updated image
                    profileViewModel.loadStudentProfile()
                }
                is ProfileViewModel.UploadState.Error -> {
                    Toast.makeText(this, "Upload failed: ${state.message}", Toast.LENGTH_LONG).show()
                }
            }
        }

        // Observe student info
        profileViewModel.studentInfo.observe(this) { student ->
            student?.let { displayStudentInfo(it) }
        }
    }

    private fun setupClickListeners() {
        // Profile picture click - show options
        profileImageView.setOnClickListener {
            showImageOptionsDialog()
        }

        // Edit profile button
        editProfileButton.setOnClickListener {
            showEditProfileDialog()
        }

        // Change password button
        changePasswordButton.setOnClickListener {
            showChangePasswordDialog()
        }

        // Logout button
        logoutButton.setOnClickListener {
            showLogoutConfirmation()
        }
    }

    private fun displayStudentInfo(student: Student) {
        // Display student information
        nameTextView.text = "${student.firstName} ${student.lastName}"
        emailTextView.text = student.email
        gradeTextView.text = "Grade ${student.grade}"
        classTextView.text = "Class ${student.className}"

        // Load profile picture
        student.profilePictureUrl?.let { url ->
            loadProfileImage(Uri.parse(url))
        } ?: loadDefaultProfileImage()
    }

    private fun showImageOptionsDialog() {
        val options = arrayOf("Take Photo", "Choose from Gallery", "Remove Photo")
        
        AlertDialog.Builder(this)
            .setTitle("Profile Picture")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takePhoto()
                    1 -> chooseFromGallery()
                    2 -> removeProfilePhoto()
                }
            }
            .show()
    }

    private fun takePhoto() {
        try {
            profileImageFile = createImageFile()
            profileImageFile?.let { file ->
                val photoUri = FileProvider.getUriForFile(
                    this,
                    "${packageName}.fileprovider",
                    file
                )
                takePicture.launch(photoUri)
            }
        } catch (e: IOException) {
            e.printStackTrace()
            Toast.makeText(this, "Error creating image file", Toast.LENGTH_SHORT).show()
        }
    }

    private fun chooseFromGallery() {
        getContent.launch("image/*")
    }

    private fun removeProfilePhoto() {
        AlertDialog.Builder(this)
            .setTitle("Remove Profile Photo")
            .setMessage("Are you sure you want to remove your profile photo?")
            .setPositiveButton("Remove") { _, _ ->
                profileViewModel.removeProfilePicture()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun handleImageSelection(uri: Uri) {
        // Show the selected image immediately
        loadProfileImage(uri)
        
        // Upload to Cloudinary
        profileViewModel.uploadProfilePicture(uri)
    }

    private fun loadProfileImage(uri: Uri) {
        Glide.with(this)
            .load(uri)
            .placeholder(R.drawable.ic_student_default)
            .error(R.drawable.ic_student_default)
            .circleCrop()
            .into(profileImageView)
    }

    private fun loadDefaultProfileImage() {
        profileImageView.setImageResource(R.drawable.ic_student_default)
    }

    private fun createImageFile(): File {
        val timeStamp = java.text.SimpleDateFormat("yyyyMMdd_HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
        val storageDir = getExternalFilesDir(null)
        return File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
    }

    private fun showEditProfileDialog() {
        val currentStudent = profileViewModel.studentInfo.value
        if (currentStudent != null) {
            val dialog = ProfileEditDialog.newInstance(currentStudent) { updatedStudent ->
                profileViewModel.updateProfile(
                    updatedStudent.firstName,
                    updatedStudent.lastName,
                    updatedStudent.grade,
                    updatedStudent.className
                )
            }
            dialog.show(supportFragmentManager, "edit_profile")
        }
    }

    private fun showChangePasswordDialog() {
        val dialog = ChangePasswordDialog.newInstance { currentPassword, newPassword ->
            profileViewModel.changePassword(currentPassword, newPassword)
        }
        dialog.show(supportFragmentManager, "change_password")
    }

    private fun showLogoutConfirmation() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout") { _, _ ->
                profileViewModel.logout()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onResume() {
        super.onResume()
        // Refresh profile data
        profileViewModel.loadStudentProfile()
    }
}
