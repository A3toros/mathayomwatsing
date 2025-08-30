package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.LoginRequest
import com.mws.network.NetworkModule
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    
    private val apiService = NetworkModule.apiService
    
    // UI State
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _loginResult = MutableLiveData<LoginResult>()
    val loginResult: LiveData<LoginResult> = _loginResult
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    /**
     * Attempt student login
     */
    fun login(studentId: String, password: String) {
        if (studentId.isBlank() || password.isBlank()) {
            _error.value = "Please enter both student ID and password"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val request = LoginRequest(student_id = studentId, password = password)
                val response = apiService.studentLogin(request)
                
                if (response.success && response.student != null) {
                    _loginResult.value = LoginResult.Success(response.student)
                } else {
                    _error.value = response.message ?: "Login failed"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Network error occurred"
            }
            
            _isLoading.value = false
        }
    }
    
    /**
     * Clear error state
     */
    fun clearError() {
        _error.value = null
    }
    
    /**
     * Clear login result
     */
    fun clearLoginResult() {
        _loginResult.value = null
    }
}

sealed class LoginResult {
    data class Success(val student: com.mws.models.Student) : LoginResult()
    data class Failure(val message: String) : LoginResult()
}
