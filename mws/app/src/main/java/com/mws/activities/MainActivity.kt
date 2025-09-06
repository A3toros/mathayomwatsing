package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.navigation.NavigationView
import com.mws.R
import com.mws.adapters.ActiveTestAdapter
import com.mws.adapters.ScoreTableAdapter
import com.mws.models.ActiveTest
import com.mws.models.ScoreRecord
import com.mws.services.SessionManager
import com.mws.viewmodels.MainViewModel
import com.mws.viewmodels.MainViewModelFactory
import com.mws.repository.TestRepository

/**
 * MainActivity - Main dashboard screen
 * Full implementation with RecyclerViews and ViewModel integration
 */
class MainActivity : AppCompatActivity() {

    // Basic UI elements
    private lateinit var drawerLayout: DrawerLayout
    private lateinit var navigationView: NavigationView
    private lateinit var hamburgerButton: ImageButton
    private lateinit var welcomeText: TextView
    private lateinit var logoutButton: Button
    
    // RecyclerView elements
    private lateinit var activeTestsRecyclerView: RecyclerView
    private lateinit var scoreTableRecyclerView: RecyclerView
    private lateinit var activeTestsAdapter: ActiveTestAdapter
    private lateinit var scoreTableAdapter: ScoreTableAdapter
    
    // View All buttons
    private lateinit var expandTestsButton: TextView
    private lateinit var expandScoresButton: TextView
    
    // State for expanded views
    private var isTestsExpanded = false
    private var isScoresExpanded = false
    
    // Services
    private lateinit var sessionManager: SessionManager
    private lateinit var testRepository: TestRepository
    
    // ViewModel
    private lateinit var mainViewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize services
        sessionManager = SessionManager(this)
        testRepository = TestRepository()
        
        // Initialize ViewModel
        val factory = MainViewModelFactory(testRepository, sessionManager)
        mainViewModel = ViewModelProvider(this, factory)[MainViewModel::class.java]
        
        // Initialize views
        initializeViews()
        
        // Setup RecyclerViews
        setupRecyclerViews()
        
        // Setup navigation
        setupNavigation()
        
        // Setup observers
        setupObservers()
        
        // Load data
        loadData()
    }

    private fun initializeViews() {
        drawerLayout = findViewById(R.id.drawerLayout)
        navigationView = findViewById(R.id.navigationDrawer)
        hamburgerButton = findViewById(R.id.hamburgerButton)
        welcomeText = findViewById(R.id.welcomeText)
        activeTestsRecyclerView = findViewById(R.id.activeTestsRecyclerView)
        scoreTableRecyclerView = findViewById(R.id.scoreTableRecyclerView)
        expandTestsButton = findViewById(R.id.expandTestsButton)
        expandScoresButton = findViewById(R.id.expandScoresButton)
        
        // Add a simple logout button
        logoutButton = Button(this)
        logoutButton.text = "Logout"
        logoutButton.setOnClickListener {
            logout()
        }
    }

    private fun setupRecyclerViews() {
        // Setup Active Tests RecyclerView
        activeTestsAdapter = ActiveTestAdapter { activeTest ->
            navigateToTest(activeTest)
        }
        activeTestsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = activeTestsAdapter
        }
        
        // Setup Score Table RecyclerView
        scoreTableAdapter = ScoreTableAdapter()
        scoreTableRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = scoreTableAdapter
        }
    }

    private fun setupNavigation() {
        // Hamburger button functionality
        hamburgerButton.setOnClickListener {
            if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
                drawerLayout.closeDrawer(GravityCompat.START)
            } else {
                drawerLayout.openDrawer(GravityCompat.START)
            }
        }

        // View All buttons
        expandTestsButton.setOnClickListener {
            navigateToAllTests()
        }
        
        expandScoresButton.setOnClickListener {
            navigateToAllScores()
        }

        // Navigation menu
        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_profile -> {
                    // TODO: Navigate to profile
                    true
                }
                R.id.nav_tasks -> {
                    // TODO: Navigate to tasks
                    true
                }
                R.id.nav_learning_center -> {
                    // TODO: Navigate to learning center
                    true
                }
                R.id.nav_settings -> {
                    // TODO: Navigate to settings
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

    private fun setupObservers() {
        // Observe active tests
        mainViewModel.activeTests.observe(this) { tests ->
            activeTestsAdapter.submitList(tests)
        }
        
        // Observe recent scores
        mainViewModel.recentScores.observe(this) { scores ->
            scoreTableAdapter.submitList(scores)
        }
        
        // Observe student info
        mainViewModel.studentInfo.observe(this) { student ->
            student?.let {
                welcomeText.text = "Welcome, ${it.name}!"
            }
        }
        
        // Observe error messages
        mainViewModel.errorMessage.observe(this) { error ->
            error?.let {
                // TODO: Show error toast or dialog
                println("Error: $it")
            }
        }
    }

    private fun loadData() {
        // Load all dashboard data
        mainViewModel.refreshDashboard()
    }

    private fun navigateToTest(activeTest: ActiveTest) {
        val intent = Intent(this, TestActivity::class.java).apply {
            putExtra("test_id", activeTest.testId)
            putExtra("test_type", activeTest.testType)
            putExtra("test_name", activeTest.testName)
        }
        startActivity(intent)
    }

    private fun navigateToAllTests() {
        isTestsExpanded = !isTestsExpanded
        
        if (isTestsExpanded) {
            expandTestsButton.text = "Show Less"
            // Expand RecyclerView to show all items
            activeTestsRecyclerView.layoutParams.height = android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            activeTestsRecyclerView.requestLayout()
        } else {
            expandTestsButton.text = "View All"
            // Collapse RecyclerView to show limited items (e.g., 3 items)
            val layoutManager = activeTestsRecyclerView.layoutManager as LinearLayoutManager
            val firstVisiblePosition = layoutManager.findFirstVisibleItemPosition()
            val lastVisiblePosition = layoutManager.findLastVisibleItemPosition()
            
            // Limit to 3 items when collapsed
            if (lastVisiblePosition - firstVisiblePosition > 2) {
                activeTestsRecyclerView.layoutParams.height = resources.getDimensionPixelSize(R.dimen.recycler_view_collapsed_height)
                activeTestsRecyclerView.requestLayout()
            }
        }
    }

    private fun navigateToAllScores() {
        isScoresExpanded = !isScoresExpanded
        
        if (isScoresExpanded) {
            expandScoresButton.text = "Show Less"
            // Expand RecyclerView to show all items
            scoreTableRecyclerView.layoutParams.height = android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            scoreTableRecyclerView.requestLayout()
        } else {
            expandScoresButton.text = "View All"
            // Collapse RecyclerView to show limited items (e.g., 3 items)
            val layoutManager = scoreTableRecyclerView.layoutManager as LinearLayoutManager
            val firstVisiblePosition = layoutManager.findFirstVisibleItemPosition()
            val lastVisiblePosition = layoutManager.findLastVisibleItemPosition()
            
            // Limit to 3 items when collapsed
            if (lastVisiblePosition - firstVisiblePosition > 2) {
                scoreTableRecyclerView.layoutParams.height = resources.getDimensionPixelSize(R.dimen.recycler_view_collapsed_height)
                scoreTableRecyclerView.requestLayout()
            }
        }
    }

    private fun logout() {
        sessionManager.clearSession()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

}
