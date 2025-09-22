package com.mws.utils

import android.util.Log

object Logger {
    private const val TAG = "MWS_APP"
    
    fun info(message: String) {
        Log.i(TAG, "ℹ️ INFO: $message")
    }
    
    fun error(message: String, throwable: Throwable? = null) {
        Log.e(TAG, "❌ ERROR: $message", throwable)
    }
    
    fun warning(message: String) {
        Log.w(TAG, "⚠️ WARNING: $message")
    }
    
    fun debug(message: String) {
        Log.d(TAG, "🔍 DEBUG: $message")
    }
}
