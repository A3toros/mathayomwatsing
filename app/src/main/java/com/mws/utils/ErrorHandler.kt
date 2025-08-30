package com.mws.utils

import android.content.Context
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.mws.R
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object ErrorHandler {
    
    /**
     * Handle network errors and show appropriate user messages
     */
    fun handleNetworkError(context: Context, error: Throwable, onRetry: (() -> Unit)? = null) {
        val message = when (error) {
            is UnknownHostException -> "No internet connection. Please check your network settings."
            is SocketTimeoutException -> "Request timed out. Please try again."
            else -> "Network error occurred. Please check your connection and try again."
        }
        
        if (onRetry != null) {
            showRetryDialog(context, message, onRetry)
        } else {
            showToast(context, message)
        }
    }
    
    /**
     * Handle API errors from backend
     */
    fun handleApiError(context: Context, errorMessage: String?, onRetry: (() -> Unit)? = null) {
        val message = errorMessage ?: "An error occurred. Please try again."
        
        if (onRetry != null) {
            showRetryDialog(context, message, onRetry)
        } else {
            showToast(context, message)
        }
    }
    
    /**
     * Handle database errors
     */
    fun handleDatabaseError(context: Context, error: Throwable) {
        val message = "Database error occurred. Please restart the app."
        showToast(context, message)
    }
    
    /**
     * Handle security violations
     */
    fun handleSecurityViolation(context: Context, violationType: String, warningCount: Int) {
        val message = when (violationType) {
            "app_minimized" -> "App minimization detected. Warning $warningCount of 3."
            "screenshot_attempt" -> "Screenshot attempt detected. This is not allowed during tests."
            "orientation_change" -> "Screen orientation change detected. Please keep your device in portrait mode."
            else -> "Security violation detected. Please follow test guidelines."
        }
        
        showToast(context, message)
    }
    
    /**
     * Show retry dialog with custom message
     */
    private fun showRetryDialog(context: Context, message: String, onRetry: () -> Unit) {
        AlertDialog.Builder(context)
            .setTitle("Error")
            .setMessage(message)
            .setPositiveButton("Retry") { _, _ ->
                onRetry()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    /**
     * Show toast message
     */
    private fun showToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }
    
    /**
     * Get user-friendly error message for common errors
     */
    fun getUserFriendlyMessage(error: Throwable): String {
        return when (error) {
            is UnknownHostException -> "No internet connection"
            is SocketTimeoutException -> "Request timed out"
            is IllegalArgumentException -> "Invalid input provided"
            is SecurityException -> "Permission denied"
            else -> "An unexpected error occurred"
        }
    }
    
    /**
     * Check if error is retryable
     */
    fun isRetryableError(error: Throwable): Boolean {
        return when (error) {
            is UnknownHostException -> true
            is SocketTimeoutException -> true
            is IllegalArgumentException -> false
            is SecurityException -> false
            else -> true
        }
    }
}
