package com.mws.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.mws.repository.TestRepository
import com.mws.services.SessionManager

/**
 * TestViewModelFactory - Factory for creating TestViewModel with dependencies
 */
class TestViewModelFactory(
    private val testRepository: TestRepository,
    private val sessionManager: SessionManager
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(TestViewModel::class.java) -> {
                TestViewModel(testRepository, sessionManager) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
