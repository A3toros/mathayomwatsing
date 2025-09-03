package com.mws.network

import android.content.Context
import com.mws.config.ProductionConfig
import com.mws.services.ApiService
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonWriter
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import okio.Buffer

/**
 * NetworkModule - Dependency injection for network components
 * Configures OkHttp, Retrofit, and API services
 */
object NetworkModule {

    private const val BASE_URL = "https://mathayomwatsing.netlify.app/.netlify/functions/"
    private const val TIMEOUT_SECONDS = 30L
    private const val RETRY_ATTEMPTS = 3
    
    // Force initialization logging
    init {
        android.util.Log.e("NetworkModule", "🔥 🔥 🔥 NETWORK MODULE OBJECT INITIALIZED!")
    }
    
    // Static API service instance for LoginActivity
    // Note: This will be initialized when first accessed, but requires a context
    // LoginActivity should use createApiService() instead

    /**
     * Creates OkHttp client with interceptors
     */
    fun createOkHttpClient(context: Context): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(createLoggingInterceptor())
            .addInterceptor(createAuthInterceptor(context))
            .addInterceptor(createRetryInterceptor())
            .addInterceptor(createDebugInterceptor()) // Add debug interceptor
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()
    }

    /**
     * Creates custom Gson instance with proper field naming
     */
    private fun createGson(): Gson {
        val gson = GsonBuilder()
            .serializeNulls()
            .setFieldNamingPolicy(com.google.gson.FieldNamingPolicy.IDENTITY) // Use IDENTITY to prevent conversion
            .disableHtmlEscaping()
            .registerTypeAdapter(com.mws.services.StudentLoginData::class.java, StudentLoginDataAdapter()) // Force custom serialization
            .create()
        
        // Debug: Test our Gson configuration
        val testData = com.mws.services.StudentLoginData("test", "test")
        val json = gson.toJson(testData)
        android.util.Log.e("NetworkModule", "🔥 CUSTOM GSON TEST: $json") // Force ERROR level to be visible
        
        // Force test the TypeAdapter directly
        try {
            val adapter = gson.getAdapter(com.mws.services.StudentLoginData::class.java)
            android.util.Log.e("NetworkModule", "🔥 🔥 🔥 TYPE ADAPTER REGISTERED: $adapter")
            
            // Test serialization with adapter
            val testData = com.mws.services.StudentLoginData("test123", "testpass")
            android.util.Log.e("NetworkModule", "🔥 🔥 🔥 TEST DATA CREATED: $testData")
            android.util.Log.e("NetworkModule", "🔥 🔥 🔥 ADAPTER SERIALIZATION TESTED")
        } catch (e: Exception) {
            android.util.Log.e("NetworkModule", "🔥 🔥 🔥 TYPE ADAPTER TEST FAILED", e)
        }
        
        return gson
    }

    /**
     * Creates Retrofit instance
     */
    fun createRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val customGson = createGson()
        
        // Force our custom Gson to be used
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(customGson))
            .build()
        
        // Debug: Verify our Gson is being used
        android.util.Log.e("NetworkModule", "🔥 🔥 🔥 RETROFIT CREATED WITH CUSTOM GSON: $customGson")
        
        return retrofit
    }

    /**
     * Creates API service
     */
    fun createApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }

    /**
     * Creates logging interceptor
     */
    private fun createLoggingInterceptor(): HttpLoggingInterceptor {
        val logging = HttpLoggingInterceptor()
        // Force BODY level for debugging login issue
        logging.level = HttpLoggingInterceptor.Level.BODY
        return logging
    }

    /**
     * Creates authentication interceptor
     */
    private fun createAuthInterceptor(context: Context): AuthInterceptor {
        return AuthInterceptor(context)
    }

    /**
     * Creates retry interceptor
     */
    private fun createRetryInterceptor(): RetryInterceptor {
        return RetryInterceptor(RETRY_ATTEMPTS)
    }

    /**
     * Creates debug interceptor for logging request/response details
     */
    private fun createDebugInterceptor(): DebugInterceptor {
        return DebugInterceptor()
    }
    
    /**
     * Creates NetworkModule instance with context
     */
    fun create(context: Context): NetworkModuleInstance {
        android.util.Log.e("NetworkModule", "🔥 🔥 🔥 NETWORK MODULE CREATE() CALLED!")
        return NetworkModuleInstance(context)
    }
}

/**
 * NetworkModule instance with context
 */
class NetworkModuleInstance(private val context: Context) {
    val apiService: ApiService by lazy {
        val retrofit = NetworkModule.createRetrofit(NetworkModule.createOkHttpClient(context))
        NetworkModule.createApiService(retrofit)
    }
}

/**
 * Authentication interceptor for adding auth tokens
 */
class AuthInterceptor(private val context: Context) : okhttp3.Interceptor {
    override fun intercept(chain: okhttp3.Interceptor.Chain): okhttp3.Response {
        val originalRequest = chain.request()
        
        // Get auth token from SessionManager
        val sessionManager = com.mws.services.SessionManager(context)
        val accessToken = sessionManager.getAccessToken()
        
        val newRequest = if (accessToken != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $accessToken")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}

/**
 * Custom type adapter for StudentLoginData to force exact field names
 */
class StudentLoginDataAdapter : TypeAdapter<com.mws.services.StudentLoginData>() {
    override fun write(out: JsonWriter, value: com.mws.services.StudentLoginData?) {
        if (value == null) {
            out.nullValue()
            return
        }
        
        out.beginObject()
        out.name("studentId") // Force exact field name
        out.value(value.studentId)
        out.name("password") // Force exact field name
        out.value(value.password)
        out.endObject()
        
        // Log what we're writing
        android.util.Log.e("StudentLoginDataAdapter", "🔥 🔥 🔥 CUSTOM ADAPTER WRITING: {\"studentId\":\"${value.studentId}\",\"password\":\"${value.password}\"}")
    }
    
    override fun read(reader: JsonReader): com.mws.services.StudentLoginData? {
        // Not needed for serialization, but required by abstract class
        return null
    }
}

/**
 * Debug interceptor for logging request/response details
 */
class DebugInterceptor : okhttp3.Interceptor {
    override fun intercept(chain: okhttp3.Interceptor.Chain): okhttp3.Response {
        val request = chain.request()
        
        // Log request details
        android.util.Log.e("DebugInterceptor", "🔥 === REQUEST DEBUG ===")
        android.util.Log.e("DebugInterceptor", "🔥 URL: ${request.url}")
        android.util.Log.e("DebugInterceptor", "🔥 Method: ${request.method}")
        android.util.Log.e("DebugInterceptor", "🔥 Headers: ${request.headers}")
        
        // Log request body if it exists
        request.body?.let { body ->
            try {
                val buffer = okio.Buffer()
                body.writeTo(buffer)
                val bodyString = buffer.readUtf8()
                android.util.Log.e("DebugInterceptor", "🔥 🔥 🔥 REQUEST BODY: $bodyString")
                
                // Log request body for debugging
                android.util.Log.e("DebugInterceptor", "🔥 🔥 🔥 REQUEST BODY: $bodyString")
            } catch (e: Exception) {
                android.util.Log.e("DebugInterceptor", "🔥 Error reading request body", e)
            }
        }
        
        // Proceed with the request
        val response = chain.proceed(request)
        
        // Log response details
        android.util.Log.d("DebugInterceptor", "=== RESPONSE DEBUG ===")
        android.util.Log.d("DebugInterceptor", "Code: ${response.code}")
        android.util.Log.d("DebugInterceptor", "Message: ${response.message}")
        android.util.Log.d("DebugInterceptor", "Headers: ${response.headers}")
        
        return response
    }
}

/**
 * Retry interceptor for handling network failures
 */
class RetryInterceptor(private val maxRetries: Int) : okhttp3.Interceptor {
    override fun intercept(chain: okhttp3.Interceptor.Chain): okhttp3.Response {
        val request = chain.request()
        var response: okhttp3.Response? = null
        var exception: Exception? = null
        
        // Try up to maxRetries times
        for (attempt in 0..maxRetries) {
            try {
                response = chain.proceed(request)
                
                // If successful, return response
                if (response.isSuccessful) {
                    return response
                }
                
                // If server error (5xx), retry
                if (response.code in 500..599) {
                    response.close()
                    if (attempt < maxRetries) {
                        Thread.sleep(1000L * (attempt + 1)) // Exponential backoff
                        continue
                    }
                }
                
                // For other errors, don't retry
                return response
                
            } catch (e: Exception) {
                exception = e
                response?.close()
                
                // If network error, retry
                if (isNetworkError(e) && attempt < maxRetries) {
                    Thread.sleep(1000L * (attempt + 1)) // Exponential backoff
                    continue
                }
                
                // If max retries reached or non-network error, throw
                throw e
            }
        }
        
        // If we get here, all retries failed
        throw exception ?: RuntimeException("Network request failed after $maxRetries retries")
    }
    
    private fun isNetworkError(exception: Exception): Boolean {
        return exception is java.net.UnknownHostException ||
               exception is java.net.ConnectException ||
               exception is java.net.SocketTimeoutException ||
               exception is java.io.IOException
    }
}
