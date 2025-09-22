package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mws.R
import com.mws.services.SessionManager
import com.mws.viewmodels.LoginViewModel
import com.mws.viewmodels.LoginViewModelFactory
import com.mws.repository.TestRepository
import com.mws.network.NetworkModule
import com.mws.network.DirectHttpClient

/**
 * LoginActivity - Student authentication and login
 * Handles login flow and session creation
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var studentIdEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var loginButton: Button
    private lateinit var loadingView: View


    private lateinit var loginViewModel: LoginViewModel
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Check if user is already logged in
        sessionManager = SessionManager(this)
        if (sessionManager.isLoggedIn()) {
            navigateToMain()
            return
        }

        // Initialize ViewModel
        val networkModule = NetworkModule.create(this)
        val testRepository = TestRepository(networkModule.apiService, sessionManager)
        loginViewModel = ViewModelProvider(
            this,
            LoginViewModelFactory(sessionManager, testRepository)
        )[LoginViewModel::class.java]

        // Initialize views
        initializeViews()

        // Setup observers
        setupObservers()

        // Setup click listeners
        setupClickListeners()
    }

    private fun initializeViews() {
        studentIdEditText = findViewById(R.id.et_student_id)
        passwordEditText = findViewById(R.id.et_password)
        loginButton = findViewById(R.id.btn_login)
        loadingView = findViewById(R.id.loading_view)
    }

    private fun setupObservers() {
        // Observe login state
        loginViewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginViewModel.LoginState.Loading -> {
                    showLoading(true)
                }
                is LoginViewModel.LoginState.Success -> {
                    showLoading(false)
                    navigateToMain()
                }
                is LoginViewModel.LoginState.Error -> {
                    showLoading(false)
                    showError(state.message)
                }
            }
        }
    }

    private fun setupClickListeners() {
        loginButton.setOnClickListener {
            performLogin()
        }
        

    }

    private fun performLogin() {
        val studentId = studentIdEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()

        // Basic validation
        if (studentId.isEmpty()) {
            studentIdEditText.error = "Student ID is required"
            return
        }

        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            return
        }

        // Perform normal login
        loginViewModel.login(studentId, password)
    }
    


    private fun showLoading(show: Boolean) {
        loadingView.visibility = if (show) View.VISIBLE else View.GONE
        loginButton.isEnabled = !show
        studentIdEditText.isEnabled = !show
        passwordEditText.isEnabled = !show
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }

    override fun onResume() {
        super.onResume()
        // Check again if user is logged in (in case of back navigation)
        if (sessionManager.isLoggedIn()) {
            navigateToMain()
        }
    }
}
