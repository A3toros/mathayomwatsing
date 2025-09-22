package com.mws.network

import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.mws.services.StudentLoginData

import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Direct HTTP client for debugging network requests
 * Bypasses Retrofit to show exactly what's being sent
 */
object DirectHttpClient {
    
    private const val TAG = "DirectHttpClient"
    private const val BASE_URL = "https://mathayomwatsing.netlify.app/.netlify/functions/"
    
    /**
     * Test login with direct HTTP request
     */
    fun testLogin(studentId: String, password: String) {
        val url = URL("${BASE_URL}student-login")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            // Configure connection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.setRequestProperty("Accept", "application/json")
            connection.doOutput = true
            connection.doInput = true
            
            // Log request headers
            Log.e(TAG, "🔥 === DIRECT HTTP REQUEST HEADERS ===")
            connection.requestProperties.forEach { (key, value) ->
                Log.e(TAG, "🔥 $key: $value")
            }
            
            // Create request body
            val loginData = com.mws.services.StudentLoginData(studentId, password)
            val gson = GsonBuilder()
                .setFieldNamingPolicy(com.google.gson.FieldNamingPolicy.IDENTITY)
                .disableHtmlEscaping()
                .create()
            
            val requestBody = gson.toJson(loginData)
            Log.e(TAG, "🔥 === DIRECT HTTP REQUEST BODY ===")
            Log.e(TAG, "🔥 $requestBody")
            
            // Send request
            val writer = OutputStreamWriter(connection.outputStream)
            writer.write(requestBody)
            writer.flush()
            writer.close()
            
            // Get response
            val responseCode = connection.responseCode
            Log.e(TAG, "🔥 === DIRECT HTTP RESPONSE ===")
            Log.e(TAG, "🔥 Response Code: $responseCode")
            Log.e(TAG, "🔥 Response Message: ${connection.responseMessage}")
            
            // Log response headers
            Log.e(TAG, "🔥 === DIRECT HTTP RESPONSE HEADERS ===")
            connection.headerFields.forEach { entry ->
                val key = entry.key
                val values = entry.value
                values?.forEach { value ->
                    Log.e(TAG, "🔥 $key: $value")
                }
            }
            
            // Get response body
            val inputStream = if (responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }
            
            val response = inputStream.bufferedReader().use { it.readText() }
            Log.e(TAG, "🔥 === DIRECT HTTP RESPONSE BODY ===")
            Log.e(TAG, "🔥 $response")
            
        } catch (e: Exception) {
            Log.e(TAG, "🔥 === DIRECT HTTP ERROR ===", e)
        } finally {
            connection.disconnect()
        }
    }
    
    /**
     * Test our custom Gson serialization
     */
    fun testGsonSerialization(studentId: String, password: String) {
        Log.e(TAG, "🔥 === GSON SERIALIZATION TEST ===")
        
        val loginData = StudentLoginData(studentId, password)
        Log.e(TAG, "🔥 Original object: $loginData")
        Log.e(TAG, "🔥 Object class: ${loginData.javaClass.name}")
        Log.e(TAG, "🔥 Field names: ${loginData.javaClass.declaredFields.map { it.name }}")
        
        // Test with default Gson
        val defaultGson = Gson()
        val defaultJson = defaultGson.toJson(loginData)
        Log.e(TAG, "🔥 Default Gson: $defaultJson")
        
        // Test with our custom Gson
        val customGson = GsonBuilder()
            .setFieldNamingPolicy(com.google.gson.FieldNamingPolicy.IDENTITY)
            .disableHtmlEscaping()
            .create()
        val customJson = customGson.toJson(loginData)
        Log.e(TAG, "🔥 Custom Gson: $customJson")
        
        // Test with @SerializedName annotations
        Log.e(TAG, "🔥 SerializedName annotations:")
        loginData.javaClass.declaredFields.forEach { field ->
            val annotation = field.getAnnotation(com.google.gson.annotations.SerializedName::class.java)
            if (annotation != null) {
                Log.e(TAG, "🔥   ${field.name} -> ${annotation.value}")
            } else {
                Log.e(TAG, "🔥   ${field.name} -> NO ANNOTATION")
            }
        }
    }
}
