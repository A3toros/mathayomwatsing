package com.mws.services

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.mws.models.Student

/**
 * SessionManager - Manages user sessions and authentication state
 * Handles login, logout, and session persistence
 */
class SessionManager(context: Context) {

    private val sharedPreferences: SharedPreferences = context.getSharedPreferences(
        "mws_session",
        Context.MODE_PRIVATE
    )
    private val gson = Gson()

    companion object {
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_STUDENT_ID = "student_id"
        private const val KEY_STUDENT_INFO = "student_info"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_LOGIN_TIMESTAMP = "login_timestamp"
        private const val SESSION_TIMEOUT = 24 * 60 * 60 * 1000L // 24 hours
    }

    /**
     * Checks if user is currently logged in
     */
    fun isLoggedIn(): Boolean {
        val loginTimestamp = sharedPreferences.getLong(KEY_LOGIN_TIMESTAMP, 0L)
        val isLoggedIn = sharedPreferences.getBoolean(KEY_IS_LOGGED_IN, false)
        
        // Check if session has expired
        if (isLoggedIn && System.currentTimeMillis() - loginTimestamp > SESSION_TIMEOUT) {
            clearSession()
            return false
        }
        
        return isLoggedIn
    }

    /**
     * Saves login session
     */
    fun saveLoginSession(
        studentId: String,
        studentInfo: Student,
        accessToken: String,
        refreshToken: String
    ) {
        val editor = sharedPreferences.edit()
        editor.putBoolean(KEY_IS_LOGGED_IN, true)
        editor.putString(KEY_STUDENT_ID, studentId)
        editor.putString(KEY_STUDENT_INFO, gson.toJson(studentInfo))
        editor.putString(KEY_ACCESS_TOKEN, accessToken)
        editor.putString(KEY_REFRESH_TOKEN, refreshToken)
        editor.putLong(KEY_LOGIN_TIMESTAMP, System.currentTimeMillis())
        editor.apply()
    }

    /**
     * Gets current student ID
     */
    fun getStudentId(): String? {
        return sharedPreferences.getString(KEY_STUDENT_ID, null)
    }

    /**
     * Gets current student info
     */
    fun getStudentInfo(): Student? {
        val studentJson = sharedPreferences.getString(KEY_STUDENT_INFO, null)
        return try {
            gson.fromJson(studentJson, Student::class.java)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Gets current student name for display
     */
    fun getStudentName(): String? {
        val student = getStudentInfo()
        return if (student != null) {
            "${student.name ?: ""} ${student.surname ?: ""}".trim().ifEmpty { null }
        } else {
            null
        }
    }

    /**
     * Gets current access token
     */
    fun getAccessToken(): String? {
        return sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }

    /**
     * Gets current refresh token
     */
    fun getRefreshToken(): String? {
        return sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }

    /**
     * Updates access token
     */
    fun updateAccessToken(newToken: String) {
        sharedPreferences.edit()
            .putString(KEY_ACCESS_TOKEN, newToken)
            .apply()
    }

    /**
     * Updates student info
     */
    fun updateStudentInfo(studentInfo: Student) {
        sharedPreferences.edit()
            .putString(KEY_STUDENT_INFO, gson.toJson(studentInfo))
            .apply()
    }

    /**
     * Extends session by updating timestamp
     */
    fun extendSession() {
        sharedPreferences.edit()
            .putLong(KEY_LOGIN_TIMESTAMP, System.currentTimeMillis())
            .apply()
    }

    /**
     * Checks if session is about to expire
     */
    fun isSessionExpiringSoon(): Boolean {
        val loginTimestamp = sharedPreferences.getLong(KEY_LOGIN_TIMESTAMP, 0L)
        val timeUntilExpiry = SESSION_TIMEOUT - (System.currentTimeMillis() - loginTimestamp)
        return timeUntilExpiry < (60 * 60 * 1000L) // 1 hour before expiry
    }

    /**
     * Clears the current session
     */
    fun clearSession() {
        val editor = sharedPreferences.edit()
        editor.clear()
        editor.apply()
    }

    /**
     * Gets session age in milliseconds
     */
    fun getSessionAge(): Long {
        val loginTimestamp = sharedPreferences.getLong(KEY_LOGIN_TIMESTAMP, 0L)
        return System.currentTimeMillis() - loginTimestamp
    }

    /**
     * Gets remaining session time in milliseconds
     */
    fun getRemainingSessionTime(): Long {
        val loginTimestamp = sharedPreferences.getLong(KEY_LOGIN_TIMESTAMP, 0L)
        val elapsed = System.currentTimeMillis() - loginTimestamp
        return if (elapsed < SESSION_TIMEOUT) SESSION_TIMEOUT - elapsed else 0L
    }
}
