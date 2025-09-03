package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.Student
import com.mws.models.LoginResponse
import com.mws.services.SessionManager
import com.mws.repository.TestRepository
import com.mws.utils.Logger
import kotlinx.coroutines.launch

/**
 * LoginViewModel - Manages login state and authentication
 * Handles login flow and session creation
 */
class LoginViewModel(
    private val sessionManager: SessionManager,
    private val testRepository: TestRepository
) : ViewModel() {

    private val _loginState = MutableLiveData<LoginState>()
    val loginState: LiveData<LoginState> = _loginState

    /**
     * Performs student login
     */
    fun login(studentId: String, password: String) {
        viewModelScope.launch {
            try {
                // Debug logging
                        Logger.info("=== LOGIN VIEWMODEL DEBUG ===")
        Logger.info("Received parameters: studentId='$studentId', password='$password'")
        Logger.info("Calling testRepository.studentLogin...")
                
                _loginState.value = LoginState.Loading

                // Use real API call
                val result = testRepository.studentLogin(studentId, password)
                
                result.fold(
                    onSuccess = { loginResponse ->
                        if (loginResponse.success) {
                            _loginState.value = LoginState.Success
                        } else {
                            _loginState.value = LoginState.Error(loginResponse.error ?: "Login failed")
                        }
                    },
                    onFailure = { exception ->
                        Logger.error("Login failed", exception)
                        _loginState.value = LoginState.Error(exception.message ?: "Login failed")
                    }
                )

            } catch (e: Exception) {
                Logger.error("Login exception", e)
                _loginState.value = LoginState.Error("Login failed: ${e.message}")
            }
        }
    }



    /**
     * Sealed class for login states
     */
    sealed class LoginState {
        object Loading : LoginState()
        object Success : LoginState()
        data class Error(val message: String) : LoginState()
    }
}
