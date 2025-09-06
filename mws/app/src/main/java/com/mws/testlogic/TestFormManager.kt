package com.mws.testlogic

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.*

/**
 * TestFormManager - Manages form data, test progress, and user sessions
 * Source: saveToLocalStorage(), saveFormData(), restoreFormData() from script.js
 */
class TestFormManager(context: Context) {

    private val sharedPreferences: SharedPreferences = context.getSharedPreferences(
        "mws_test_data",
        Context.MODE_PRIVATE
    )
    private val gson = Gson()

    companion object {
        private const val KEY_TEST_PROGRESS = "test_progress"
        private const val KEY_USER_SESSION = "user_session"
        private const val KEY_FORM_DATA = "form_data"
        private const val KEY_LAST_ACTIVITY = "last_activity"
        private const val SESSION_TIMEOUT = 24 * 60 * 60 * 1000L // 24 hours
    }

    /**
     * Saves test progress for a specific test
     * Source: saveToLocalStorage() from script.js
     */
    fun saveTestProgress(testType: String, testId: String, questionId: String, answer: String) {
        val progressKey = "$KEY_TEST_PROGRESS:$testType:$testId"
        val progress = getTestProgress(testType, testId).toMutableMap()
        
        progress[questionId] = answer
        
        val progressJson = gson.toJson(progress)
        sharedPreferences.edit()
            .putString(progressKey, progressJson)
            .putLong("$progressKey:timestamp", System.currentTimeMillis())
            .apply()
    }

    /**
     * Gets test progress for a specific test
     * Source: restoreFormData() from script.js
     */
    fun getTestProgress(testType: String, testId: String): Map<String, String> {
        val progressKey = "$KEY_TEST_PROGRESS:$testType:$testId"
        val progressJson = sharedPreferences.getString(progressKey, "{}")
        
        return try {
            val type = object : TypeToken<Map<String, String>>() {}.type
            gson.fromJson(progressJson, type) ?: emptyMap()
        } catch (e: Exception) {
            emptyMap()
        }
    }

    /**
     * Clears test progress for a specific test
     * Source: clearFormData() from script.js
     */
    fun clearTestProgress(testType: String, testId: String) {
        val progressKey = "$KEY_TEST_PROGRESS:$testType:$testId"
        sharedPreferences.edit()
            .remove(progressKey)
            .remove("$progressKey:timestamp")
            .apply()
    }

    /**
     * Saves user session data
     * Source: saveUserSession() from script.js
     */
    fun saveUserSession(sessionData: Map<String, Any>) {
        val sessionJson = gson.toJson(sessionData)
        sharedPreferences.edit()
            .putString(KEY_USER_SESSION, sessionJson)
            .putLong(KEY_LAST_ACTIVITY, System.currentTimeMillis())
            .apply()
    }

    /**
     * Gets user session data
     * Source: restoreUserSession() from script.js
     */
    fun getUserSession(): Map<String, Any>? {
        val sessionJson = sharedPreferences.getString(KEY_USER_SESSION, null)
        val lastActivity = sharedPreferences.getLong(KEY_LAST_ACTIVITY, 0L)
        
        // Check if session has expired
        if (System.currentTimeMillis() - lastActivity > SESSION_TIMEOUT) {
            clearUserSession()
            return null
        }
        
        return try {
            val type = object : TypeToken<Map<String, Any>>() {}.type
            gson.fromJson(sessionJson, type)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Clears user session data
     * Source: clearUserSession() from script.js
     */
    fun clearUserSession() {
        sharedPreferences.edit()
            .remove(KEY_USER_SESSION)
            .remove(KEY_LAST_ACTIVITY)
            .apply()
    }

    /**
     * Saves form data for a specific form
     * Source: saveFormData() from script.js
     */
    fun saveFormData(formId: String, formData: Map<String, String>) {
        val formKey = "$KEY_FORM_DATA:$formId"
        val formJson = gson.toJson(formData)
        
        sharedPreferences.edit()
            .putString(formKey, formJson)
            .putLong("$formKey:timestamp", System.currentTimeMillis())
            .apply()
    }

    /**
     * Gets form data for a specific form
     * Source: restoreFormData() from script.js
     */
    fun getFormData(formId: String): Map<String, String> {
        val formKey = "$KEY_FORM_DATA:$formId"
        val formJson = sharedPreferences.getString(formKey, "{}")
        
        return try {
            val type = object : TypeToken<Map<String, String>>() {}.type
            gson.fromJson(formJson, type) ?: emptyMap()
        } catch (e: Exception) {
            emptyMap()
        }
    }

    /**
     * Clears form data for a specific form
     * Source: clearFormData() from script.js
     */
    fun clearFormData(formId: String) {
        val formKey = "$KEY_FORM_DATA:$formId"
        sharedPreferences.edit()
            .remove(formKey)
            .remove("$formKey:timestamp")
            .apply()
    }

    /**
     * Checks and clears expired storage
     * Source: checkAndClearExpiredStorage() from script.js
     */
    fun checkAndClearExpiredStorage() {
        val currentTime = System.currentTimeMillis()
        val editor = sharedPreferences.edit()
        
        // Get all keys
        val allKeys = sharedPreferences.all.keys
        
        allKeys.forEach { key ->
            if (key.endsWith(":timestamp")) {
                val timestamp = sharedPreferences.getLong(key, 0L)
                if (currentTime - timestamp > SESSION_TIMEOUT) {
                    // Remove expired data
                    val dataKey = key.removeSuffix(":timestamp")
                    editor.remove(dataKey)
                    editor.remove(key)
                }
            }
        }
        
        editor.apply()
    }

    /**
     * Gets all active test sessions
     */
    fun getActiveTestSessions(): List<String> {
        val activeSessions = mutableListOf<String>()
        val allKeys = sharedPreferences.all.keys
        
        allKeys.forEach { key ->
            if (key.startsWith(KEY_TEST_PROGRESS) && !key.endsWith(":timestamp")) {
                val parts = key.split(":")
                if (parts.size >= 3) {
                    val testType = parts[1]
                    val testId = parts[2]
                    activeSessions.add("$testType:$testId")
                }
            }
        }
        
        return activeSessions
    }

    /**
     * Gets test completion status
     */
    fun getTestCompletionStatus(testType: String, testId: String): TestCompletionStatus {
        val progress = getTestProgress(testType, testId)
        val totalQuestions = getTotalQuestionsForTest(testType, testId)
        
        val answeredQuestions = progress.size
        val completionPercentage = if (totalQuestions > 0) {
            (answeredQuestions.toFloat() / totalQuestions.toFloat()) * 100
        } else 0f
        
        return TestCompletionStatus(
            totalQuestions = totalQuestions,
            answeredQuestions = answeredQuestions,
            completionPercentage = completionPercentage,
            isComplete = answeredQuestions >= totalQuestions
        )
    }

    /**
     * Gets total questions for a test (placeholder - should come from API)
     */
    private fun getTotalQuestionsForTest(testType: String, testId: String): Int {
        // TODO: This should come from the actual test data
        return when (testType) {
            "multiple-choice" -> 10
            "true-false" -> 15
            "input" -> 8
            "matching_type" -> 5
            else -> 0
        }
    }

    /**
     * Exports all test data for backup
     */
    fun exportTestData(): String {
        val exportData = mutableMapOf<String, Any>()
        
        // Export test progress
        val activeSessions = getActiveTestSessions()
        val testProgress = mutableMapOf<String, Map<String, String>>()
        
        activeSessions.forEach { session ->
            val parts = session.split(":")
            if (parts.size >= 2) {
                val testType = parts[0]
                val testId = parts[1]
                testProgress[session] = getTestProgress(testType, testId)
            }
        }
        
        exportData["testProgress"] = testProgress
        exportData["userSession"] = getUserSession() ?: emptyMap<String, Any>()
        exportData["exportTimestamp"] = System.currentTimeMillis()
        
        return gson.toJson(exportData)
    }

    /**
     * Imports test data from backup
     */
    fun importTestData(importJson: String): Boolean {
        return try {
            val importData = gson.fromJson(importJson, Map::class.java) ?: return false
            
            // Import test progress
            val testProgress = importData["testProgress"] as? Map<*, *>
            testProgress?.forEach { (session, progress) ->
                val parts = session.toString().split(":")
                if (parts.size >= 2) {
                    val testType = parts[0]
                    val testId = parts[1]
                    val progressMap = progress as? Map<*, *>
                    
                    progressMap?.forEach { (questionId, answer) ->
                        saveTestProgress(testType, testId, questionId.toString(), answer.toString())
                    }
                }
            }
            
            // Import user session
            val userSession = importData["userSession"] as? Map<*, *>
            if (userSession != null) {
                val sessionMap = userSession.mapKeys { it.key.toString() }
                    .mapValues { it.value.toString() }
                saveUserSession(sessionMap)
            }
            
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Gets test progress for a specific question
     * Converted from getTestProgress() in script.js
     */
    fun getTestProgressForQuestion(testType: String, testId: String, questionId: String): String? {
        val progress = getTestProgress(testType, testId)
        return progress[questionId]
    }

    /**
     * Data class for test completion status
     */
    data class TestCompletionStatus(
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val completionPercentage: Float,
        val isComplete: Boolean
    )
}
