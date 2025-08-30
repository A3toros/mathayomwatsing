package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mws.R
import com.mws.services.SessionManager
import com.mws.viewmodels.LoginViewModel
import com.mws.viewmodels.LoginResult

class LoginActivity : AppCompatActivity() {

    private lateinit var viewModel: LoginViewModel
    private lateinit var sessionManager: SessionManager
    
    // UI Elements
    private lateinit var studentIdInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var loadingView: View
    private lateinit var errorText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize session manager
        sessionManager = SessionManager(this)
        
        // Check if user is already logged in
        if (sessionManager.isLoggedIn()) {
            startMainActivity()
            return
        }

        // Initialize UI elements
        initializeViews()
        
        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[LoginViewModel::class.java]
        
        // Observe ViewModel data
        observeViewModel()
        
        // Set up click listeners
        setupClickListeners()
    }

    private fun initializeViews() {
        studentIdInput = findViewById(R.id.et_student_id)
        passwordInput = findViewById(R.id.et_password)
        loginButton = findViewById(R.id.btn_login)
        loadingView = findViewById(R.id.loading_view)
        errorText = findViewById(R.id.tv_error)
    }

    private fun observeViewModel() {
        // Observe loading state
        viewModel.isLoading.observe(this) { isLoading ->
            loadingView.visibility = if (isLoading) View.VISIBLE else View.GONE
            loginButton.isEnabled = !isLoading
        }
        
        // Observe login result
        viewModel.loginResult.observe(this) { result ->
            when (result) {
                is LoginResult.Success -> {
                    // Save session and navigate to main activity
                    sessionManager.saveSession(result.student, "session_token_${System.currentTimeMillis()}")
                    startMainActivity()
                }
                is LoginResult.Failure -> {
                    showError(result.message)
                }
            }
        }
        
        // Observe errors
        viewModel.error.observe(this) { error ->
            error?.let { showError(it) }
        }
    }

    private fun setupClickListeners() {
        loginButton.setOnClickListener {
            attemptLogin()
        }
        
        // Clear error when user starts typing
        studentIdInput.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                clearError()
            }
        }
        
        passwordInput.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                clearError()
            }
        }
    }

    private fun attemptLogin() {
        val studentId = studentIdInput.text.toString().trim()
        val password = passwordInput.text.toString()
        
        if (studentId.isEmpty()) {
            studentIdInput.error = "Please enter your student ID"
            return
        }
        
        if (password.isEmpty()) {
            passwordInput.error = "Please enter your password"
            return
        }
        
        // Clear previous errors
        clearError()
        
        // Attempt login
        viewModel.login(studentId, password)
    }

    private fun showError(message: String) {
        errorText.text = message
        errorText.visibility = View.VISIBLE
    }

    private fun clearError() {
        errorText.visibility = View.GONE
        errorText.text = ""
    }

    private fun startMainActivity() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    override fun onResume() {
        super.onResume()
        // Clear any previous error messages
        clearError()
    }
}
