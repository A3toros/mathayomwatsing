package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.database.AppDatabase
import com.mws.models.*
import com.mws.network.NetworkModule
import kotlinx.coroutines.launch

class MainViewModel(
    private val database: AppDatabase
) : ViewModel() {
    
    private val apiService = NetworkModule.apiService
    
    // Dashboard Data
    private val _dashboardStats = MutableLiveData<DashboardStats>()
    val dashboardStats: LiveData<DashboardStats> = _dashboardStats
    
    private val _activeTests = MutableLiveData<List<Test>>()
    val activeTests: LiveData<List<Test>> = _activeTests
    
    private val _recentResults = MutableLiveData<List<RecentTest>>()
    val recentResults: LiveData<List<RecentTest>> = _recentResults
    
    // UI State
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    /**
     * Load dashboard data for student
     */
    fun loadDashboardData(studentId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                // Load dashboard statistics
                loadDashboardStats(studentId)
                
                // Load active tests
                loadActiveTests(studentId)
                
                // Load recent results
                loadRecentResults(studentId)
                
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load dashboard data"
            }
            
            _isLoading.value = false
        }
    }
    
    /**
     * Load dashboard statistics
     */
    private suspend fun loadDashboardStats(studentId: String) {
        try {
            val response = apiService.getDashboardStats(studentId)
            if (response.success && response.stats != null) {
                _dashboardStats.value = response.stats
            } else {
                _error.value = response.message ?: "Failed to load dashboard stats"
            }
        } catch (e: Exception) {
            _error.value = e.message ?: "Failed to load dashboard stats"
        }
    }
    
    /**
     * Load active tests for student
     */
    private suspend fun loadActiveTests(studentId: String) {
        try {
            val response = apiService.getActiveTests(studentId)
            if (response.success && response.tests != null) {
                _activeTests.value = response.tests
            } else {
                _error.value = response.message ?: "Failed to load active tests"
            }
        } catch (e: Exception) {
            _error.value = e.message ?: "Failed to load active tests"
        }
    }
    
    /**
     * Load recent test results
     */
    private suspend fun loadRecentResults(studentId: String) {
        try {
            val response = apiService.getDashboardStats(studentId)
            if (response.success && response.stats != null) {
                _recentResults.value = response.stats.recent_tests
            }
        } catch (e: Exception) {
            // Don't fail dashboard load for recent results
        }
    }
    
    /**
     * Refresh dashboard data
     */
    fun refreshDashboard(studentId: String) {
        loadDashboardData(studentId)
    }
    
    /**
     * Get student profile
     */
    fun loadStudentProfile(studentId: String, onSuccess: (StudentProfile) -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val response = apiService.getStudentProfile(studentId)
                if (response.success && response.profile != null) {
                    onSuccess(response.profile)
                } else {
                    onError(response.message ?: "Failed to load profile")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Failed to load profile")
            }
        }
    }
    
    /**
     * Log suspicious activity for admin monitoring
     */
    fun logSuspiciousActivity(
        studentId: String,
        testId: String,
        testType: String,
        activityType: String,
        warningsReceived: Int,
        timeInBackground: Long? = null
    ) {
        viewModelScope.launch {
            try {
                val request = SuspiciousActivityRequest(
                    student_id = studentId,
                    test_id = testId,
                    test_type = testType,
                    activity_type = activityType,
                    warnings_received = warningsReceived,
                    time_in_background = timeInBackground,
                    device_info = getDeviceInfo(),
                    severity = if (warningsReceived >= 3) "high" else "medium"
                )
                
                apiService.logSuspiciousActivity(request)
                // Don't show error to user for logging failures
            } catch (e: Exception) {
                // Log error silently
            }
        }
    }
    
    /**
     * Get device information for suspicious activity logging
     */
    private fun getDeviceInfo(): Map<String, Any> {
        return mapOf(
            "platform" to "Android",
            "app_version" to "1.0.0",
            "timestamp" to System.currentTimeMillis()
        )
    }
    
    /**
     * Clear error state
     */
    fun clearError() {
        _error.value = null
    }
}
