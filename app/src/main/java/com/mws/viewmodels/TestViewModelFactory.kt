package com.mws.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.mws.repository.TestRepository
import com.mws.services.SecurityService

class TestViewModelFactory(
    private val repository: TestRepository,
    private val securityService: SecurityService
) : ViewModelProvider.Factory {
    
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TestViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return TestViewModel(repository, securityService) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
