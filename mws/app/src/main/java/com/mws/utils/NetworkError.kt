package com.mws.utils

/**
 * NetworkError - Represents different types of network errors
 */
sealed class NetworkError : Exception() {
    data class ConnectionError(override val message: String) : NetworkError()
    data class TimeoutError(override val message: String) : NetworkError()
    data class ServerError(override val message: String, val code: Int) : NetworkError()
    data class AuthenticationError(override val message: String) : NetworkError()
    data class ValidationError(override val message: String, val field: String? = null) : NetworkError()
    data class UnknownError(override val message: String) : NetworkError()
}
