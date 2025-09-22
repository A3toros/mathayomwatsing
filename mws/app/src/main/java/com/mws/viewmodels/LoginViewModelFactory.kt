package com.mws.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.mws.services.SessionManager
import com.mws.repository.TestRepository

/**
 * LoginViewModelFactory - Creates LoginViewModel instances
 * Provides dependency injection for SessionManager
 */
class LoginViewModelFactory(
    private val sessionManager: SessionManager,
    private val testRepository: TestRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LoginViewModel::class.java)) {
            return LoginViewModel(sessionManager, testRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
