package com.mws.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.mws.services.ImageUploadService
import com.mws.services.SessionManager
import com.mws.repository.TestRepository

/**
 * ProfileViewModelFactory - Creates ProfileViewModel instances
 * Provides dependency injection for SessionManager and ImageUploadService
 */
class ProfileViewModelFactory(
    private val sessionManager: SessionManager,
    private val imageUploadService: ImageUploadService,
    private val testRepository: TestRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProfileViewModel::class.java)) {
            return ProfileViewModel(sessionManager, imageUploadService, testRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
