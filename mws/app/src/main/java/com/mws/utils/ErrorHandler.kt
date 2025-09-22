package com.mws.utils

import com.mws.utils.NetworkError
import com.mws.utils.Logger
import retrofit2.HttpException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * ErrorHandler - Centralized error handling utility
 * Provides consistent error handling across the application
 */
object ErrorHandler {

    /**
     * Handle API errors and convert to user-friendly messages
     */
    fun handleApiError(throwable: Throwable): String {
        return when (throwable) {
            is HttpException -> handleHttpError(throwable)
            is SocketTimeoutException -> "Request timed out. Please check your connection and try again."
            is ConnectException -> "Unable to connect to server. Please check your internet connection."
            is UnknownHostException -> "Server not reachable. Please check your internet connection."
            else -> {
                Logger.error("Unhandled error", throwable)
                "An unexpected error occurred. Please try again."
            }
        }
    }

    /**
     * Handle HTTP errors with specific status codes
     */
    private fun handleHttpError(httpException: HttpException): String {
        return when (httpException.code()) {
            401 -> "Authentication failed. Please login again."
            403 -> "Access denied. You don't have permission to perform this action."
            404 -> "Resource not found. The requested data is not available."
            408 -> "Request timeout. Please try again."
            429 -> "Too many requests. Please wait a moment before trying again."
            500 -> "Server error. Please try again later."
            502 -> "Bad gateway. Server is temporarily unavailable."
            503 -> "Service unavailable. Server is under maintenance."
            504 -> "Gateway timeout. Server is taking too long to respond."
            else -> "Server error (${httpException.code()}). Please try again."
        }
    }

    /**
     * Convert throwable to NetworkError
     */
    fun toNetworkError(throwable: Throwable): NetworkError {
        return when (throwable) {
            is HttpException -> {
                val isAuthError = throwable.code() in 401..403
                val isServerError = throwable.code() in 500..599
                
                NetworkError.ServerError(
                    message = handleHttpError(throwable),
                    code = throwable.code()
                )
            }
            is SocketTimeoutException, is ConnectException, is UnknownHostException -> {
                NetworkError.ConnectionError(
                    message = "Network connection error"
                )
            }
            else -> {
                NetworkError.UnknownError(
                    message = throwable.message ?: "Unknown error"
                )
            }
        }
    }

    /**
     * Check if error is retryable
     */
    fun isRetryableError(throwable: Throwable): Boolean {
        return when (throwable) {
            is HttpException -> {
                // Retry on server errors (5xx) and some client errors
                throwable.code() in 500..599 || throwable.code() in 408..429
            }
            is SocketTimeoutException, is ConnectException, is UnknownHostException -> true
            else -> false
        }
    }

    /**
     * Get retry delay for error
     */
    fun getRetryDelay(throwable: Throwable, attempt: Int): Long {
        return when (throwable) {
            is HttpException -> {
                when (throwable.code()) {
                    in 500..599 -> 1000L * attempt // Server errors: 1s, 2s, 3s
                    in 408..429 -> 2000L * attempt // Client errors: 2s, 4s, 6s
                    else -> 1000L // Default: 1s
                }
            }
            is SocketTimeoutException, is ConnectException, is UnknownHostException -> {
                1000L * attempt // Network errors: 1s, 2s, 3s
            }
            else -> 1000L // Default: 1s
        }
    }

    /**
     * Log error with context
     */
    fun logError(context: String, throwable: Throwable, additionalInfo: Map<String, Any>? = null) {
        val errorInfo = buildString {
            append("Context: $context")
            additionalInfo?.forEach { (key, value) ->
                append(", $key: $value")
            }
        }
        
        Logger.error(errorInfo, throwable)
    }

    /**
     * Get user-friendly error message
     */
    fun getUserFriendlyMessage(throwable: Throwable): String {
        return when (throwable) {
            is HttpException -> {
                when (throwable.code()) {
                    401 -> "Please login again to continue."
                    403 -> "You don't have permission to access this feature."
                    404 -> "The requested information is not available."
                    408 -> "The request took too long. Please try again."
                    429 -> "Too many requests. Please wait a moment."
                    500 -> "Server is experiencing issues. Please try again later."
                    502 -> "Server is temporarily unavailable."
                    503 -> "Server is under maintenance. Please try again later."
                    504 -> "Server is taking too long to respond."
                    else -> "Something went wrong. Please try again."
                }
            }
            is SocketTimeoutException -> "The request took too long. Please check your connection."
            is ConnectException -> "Unable to connect to server. Please check your internet."
            is UnknownHostException -> "Server not reachable. Please check your connection."
            else -> "An unexpected error occurred. Please try again."
        }
    }
}
