package com.mws.viewmodels

import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.Student
import com.mws.services.ImageUploadService
import com.mws.services.SessionManager
import com.mws.repository.TestRepository
import com.mws.utils.Logger
import kotlinx.coroutines.launch

/**
 * ProfileViewModel - Manages profile data and image uploads
 * Handles profile updates, image uploads, and session management
 */
class ProfileViewModel(
    private val sessionManager: SessionManager,
    private val imageUploadService: ImageUploadService,
    private val testRepository: TestRepository
) : ViewModel() {

    private val _profileState = MutableLiveData<ProfileState>()
    val profileState: LiveData<ProfileState> = _profileState

    private val _uploadState = MutableLiveData<UploadState>()
    val uploadState: LiveData<UploadState> = _uploadState

    private val _studentInfo = MutableLiveData<Student?>()
    val studentInfo: LiveData<Student?> = _studentInfo

    init {
        loadStudentProfile()
    }

    /**
     * Loads the current student profile
     */
    fun loadStudentProfile() {
        _profileState.value = ProfileState.Loading
        
        viewModelScope.launch {
            try {
                val studentId = sessionManager.getStudentId()
                if (studentId != null) {
                    // Try to load from backend first
                    val result = testRepository.getStudentProfile(studentId)
                    
                    result.fold(
                        onSuccess = { backendStudent ->
                            // Update session with backend data
                            sessionManager.updateStudentInfo(backendStudent)
                            _studentInfo.value = backendStudent
                            _profileState.value = ProfileState.Success(backendStudent)
                            Logger.info("Profile loaded from backend")
                        },
                        onFailure = { exception ->
                            // Fallback to session data
                            Logger.warning("Backend profile load failed, using session data")
                            val sessionStudent = sessionManager.getStudentInfo()
                            if (sessionStudent != null) {
                                _studentInfo.value = sessionStudent
                                _profileState.value = ProfileState.Success(sessionStudent)
                            } else {
                                _profileState.value = ProfileState.Error("Failed to load student profile")
                            }
                        }
                    )
                } else {
                    _profileState.value = ProfileState.Error("Student ID not available")
                }
            } catch (e: Exception) {
                Logger.error("Error loading profile", e)
                _profileState.value = ProfileState.Error("Error loading profile: ${e.message}")
            }
        }
    }

    /**
     * Updates student profile information
     */
    fun updateProfile(
        firstName: String,
        lastName: String,
        grade: String,
        className: String
    ) {
        _profileState.value = ProfileState.Loading
        
        viewModelScope.launch {
            try {
                val currentStudent = _studentInfo.value
                if (currentStudent != null) {
                    val updatedStudent = currentStudent.copy(
                        firstName = firstName,
                        lastName = lastName,
                        grade = grade,
                        className = className
                    )
                    
                    // Update in session manager
                    sessionManager.updateStudentInfo(updatedStudent)
                    
                    // Update local state
                    _studentInfo.value = updatedStudent
                    _profileState.value = ProfileState.Success(updatedStudent)
                } else {
                    _profileState.value = ProfileState.Error("No student profile found")
                }
            } catch (e: Exception) {
                _profileState.value = ProfileState.Error("Error updating profile: ${e.message}")
            }
        }
    }

    /**
     * Uploads profile picture
     */
    fun uploadProfilePicture(imageUri: Uri) {
        _uploadState.value = UploadState.Loading
        
        viewModelScope.launch {
            try {
                val currentStudent = _studentInfo.value
                if (currentStudent != null) {
                    // Generate public ID for the image
                    val publicId = "student_${currentStudent.id}_profile"
                    
                    // Upload image
                    val uploadResult = imageUploadService.uploadImage(imageUri, publicId)
                    
                    when (uploadResult) {
                        is ImageUploadService.UploadResult.Success -> {
                            // Update student profile with new image URL
                            val updatedStudent = currentStudent.copy(
                                profilePictureUrl = uploadResult.imageUrl
                            )
                            
                            // Update in session manager
                            sessionManager.updateStudentInfo(updatedStudent)
                            
                            // Update local state
                            _studentInfo.value = updatedStudent
                            _uploadState.value = UploadState.Success(uploadResult.imageUrl)
                        }
                        is ImageUploadService.UploadResult.Error -> {
                            _uploadState.value = UploadState.Error(uploadResult.message)
                        }
                    }
                } else {
                    _uploadState.value = UploadState.Error("No student profile found")
                }
            } catch (e: Exception) {
                _uploadState.value = UploadState.Error("Error uploading image: ${e.message}")
            }
        }
    }

    /**
     * Removes profile picture
     */
    fun removeProfilePicture() {
        _uploadState.value = UploadState.Loading
        
        viewModelScope.launch {
            try {
                val currentStudent = _studentInfo.value
                if (currentStudent != null && currentStudent.profilePictureUrl != null) {
                    // Extract public ID from URL
                    val publicId = extractPublicIdFromUrl(currentStudent.profilePictureUrl)
                    
                    if (publicId != null) {
                        // Delete from Cloudinary
                        val deleteResult = imageUploadService.deleteImage(publicId)
                        
                        when (deleteResult) {
                            is ImageUploadService.DeleteResult.Success -> {
                                // Update student profile without image URL
                                val updatedStudent = currentStudent.copy(
                                    profilePictureUrl = null
                                )
                                
                                // Update in session manager
                                sessionManager.updateStudentInfo(updatedStudent)
                                
                                // Update local state
                                _studentInfo.value = updatedStudent
                                _uploadState.value = UploadState.Success("Profile picture removed")
                            }
                            is ImageUploadService.DeleteResult.Error -> {
                                _uploadState.value = UploadState.Error(deleteResult.message)
                            }
                        }
                    } else {
                        _uploadState.value = UploadState.Error("Could not extract image ID")
                    }
                } else {
                    _uploadState.value = UploadState.Error("No profile picture to remove")
                }
            } catch (e: Exception) {
                _uploadState.value = UploadState.Error("Error removing image: ${e.message}")
            }
        }
    }

    /**
     * Changes student password
     */
    fun changePassword(currentPassword: String, newPassword: String) {
        _profileState.value = ProfileState.Loading
        
        viewModelScope.launch {
            try {
                // TODO: Implement actual password change logic
                // For now, simulate success
                _profileState.value = ProfileState.Success(_studentInfo.value!!)
            } catch (e: Exception) {
                _profileState.value = ProfileState.Error("Error changing password: ${e.message}")
            }
        }
    }

    /**
     * Logs out the current user
     */
    fun logout() {
        try {
            sessionManager.clearSession()
            _profileState.value = ProfileState.LoggedOut
        } catch (e: Exception) {
            _profileState.value = ProfileState.Error("Error logging out: ${e.message}")
        }
    }

    /**
     * Extracts public ID from Cloudinary URL
     */
    private fun extractPublicIdFromUrl(url: String): String? {
        return try {
            val parts = url.split("/")
            if (parts.size >= 2) {
                val lastPart = parts.last()
                lastPart.split(".").firstOrNull()
            } else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Sealed class for profile states
     */
    sealed class ProfileState {
        object Loading : ProfileState()
        data class Success(val student: Student) : ProfileState()
        data class Error(val message: String) : ProfileState()
        object LoggedOut : ProfileState()
    }

    /**
     * Sealed class for upload states
     */
    sealed class UploadState {
        object Loading : UploadState()
        data class Success(val message: String) : UploadState()
        data class Error(val message: String) : UploadState()
    }
}
