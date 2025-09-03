package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.navigation.NavigationView
import com.mws.R
import com.mws.services.SessionManager
import com.mws.viewmodels.MainViewModel
import com.mws.viewmodels.MainViewModelFactory
import com.mws.repository.TestRepository

/**
 * MainActivity - Main dashboard screen
 * Simplified version for basic functionality
 */
class MainActivity : AppCompatActivity() {

    // Basic UI elements
    private lateinit var drawerLayout: DrawerLayout
    private lateinit var navigationView: NavigationView
    private lateinit var hamburgerButton: Button
    private lateinit var welcomeText: TextView
    private lateinit var logoutButton: Button
    
    // Services
    private lateinit var sessionManager: SessionManager
    private lateinit var testRepository: TestRepository
    
    // ViewModel - commented out for now
    // private lateinit var mainViewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize basic services
        sessionManager = SessionManager(this)
        testRepository = TestRepository() // Simplified instantiation
        
        // Initialize basic views
        initializeBasicViews()
        
        // Setup basic navigation
        setupBasicNavigation()
        
        // Load basic data
        loadBasicData()
    }

    private fun initializeBasicViews() {
        drawerLayout = findViewById(R.id.drawerLayout)
        navigationView = findViewById(R.id.navigationDrawer)
        hamburgerButton = findViewById(R.id.hamburgerButton)
        welcomeText = findViewById(R.id.welcomeText)
        
        // Add a simple logout button
        logoutButton = Button(this)
        logoutButton.text = "Logout"
        logoutButton.setOnClickListener {
            logout()
        }
    }

    private fun setupBasicNavigation() {
        // Simple hamburger button functionality
        hamburgerButton.setOnClickListener {
            if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
                drawerLayout.closeDrawer(GravityCompat.START)
            } else {
                drawerLayout.openDrawer(GravityCompat.START)
            }
        }

        // Basic navigation
        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_profile -> {
                    // navigateToProfile() - commented out for now
                    true
                }
                R.id.nav_tasks -> {
                    // navigateToTasks() - commented out for now
                    true
                }
                R.id.nav_learning_center -> {
                    // navigateToLearningCenter() - commented out for now
                    true
                }
                R.id.nav_settings -> {
                    // navigateToSettings() - commented out for now
                    true
                }
                R.id.nav_logout -> {
                    logout()
                    true
                }
                else -> false
            }
        }
    }

    private fun loadBasicData() {
        // Simplified data loading
        val studentName = sessionManager.getStudentName() ?: "Student"
        welcomeText.text = "Welcome, $studentName!"
    }

    private fun logout() {
        sessionManager.clearSession()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    // Commented out complex methods for now
    /*
    private fun setupRecyclerViews() {
        // TODO: Implement when basic functionality works
    }

    private fun setupObservers() {
        // TODO: Implement when basic functionality works
    }

    private fun updateNavigationHeader() {
        // TODO: Implement when basic functionality works
    }

    private fun navigateToProfile() {
        // TODO: Implement when basic functionality works
    }

    private fun navigateToTasks() {
        // TODO: Implement when basic functionality works
    }

    private fun navigateToLearningCenter() {
        // TODO: Implement when basic functionality works
    }

    private fun navigateToSettings() {
        // TODO: Implement when basic functionality works
    }

    private fun showLogoutConfirmation() {
        // TODO: Implement when basic functionality works
    }
    */
}
