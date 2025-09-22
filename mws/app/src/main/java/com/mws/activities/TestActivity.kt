package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mws.R
import com.mws.adapters.QuestionAdapter
import com.mws.models.Question
import com.mws.models.TestInfo
import com.mws.models.TestSubmissionData
import com.mws.testlogic.AnswerInputManager
import com.mws.testlogic.TestNavigationManager
import com.mws.testlogic.TestSubmissionManager
import com.mws.testlogic.TestProcessor
import com.mws.services.SecurityService
import com.mws.dialogs.SecurityWarningDialog
import com.mws.repository.TestRepository
import com.mws.services.TestSubmissionService
import com.mws.network.NetworkModule
import com.mws.services.SessionManager
import com.mws.database.AppDatabase
import com.mws.utils.Logger
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
// import com.mws.testlogic.TestFormManager

/**
 * TestActivity - Displays and manages test taking
 * Handles all test types and answer collection
 */
class TestActivity : AppCompatActivity() {

    private lateinit var testInfo: TestInfo
    private lateinit var questions: List<Question>
    private lateinit var questionAdapter: QuestionAdapter
    private lateinit var questionRecyclerView: RecyclerView
    private lateinit var testNameTextView: TextView
    private lateinit var subjectTextView: TextView
    private lateinit var progressTextView: TextView
    private lateinit var timeRemainingTextView: TextView
    private lateinit var submitButton: View

    private lateinit var answerInputManager: AnswerInputManager
    private lateinit var testNavigationManager: TestNavigationManager
    private lateinit var testSubmissionManager: TestSubmissionManager
    private lateinit var testProcessor: TestProcessor
    private lateinit var securityService: SecurityService
    
    // API Integration
    private lateinit var testRepository: TestRepository
    private lateinit var testSubmissionService: TestSubmissionService
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_test)

        // Get test data from intent
        val testId = intent.getStringExtra("test_id") ?: ""
        val testType = intent.getStringExtra("test_type") ?: ""

        // Initialize test components
        initializeTestComponents(testId, testType)

        // Initialize views
        initializeViews()

        // Setup RecyclerView
        setupRecyclerView()

        // Setup test navigation
        setupTestNavigation()

        // Setup test submission
        setupTestSubmission()

        // Start security protection
        startSecurityProtection(testId, testType)

        // Load test data
        loadTestData(testId, testType)
    }

    private fun initializeTestComponents(testId: String, testType: String) {
        // TODO: Fix TestFormManager constructor issue - temporarily commented out
        /*
        testProcessor = TestProcessor()
        answerInputManager = AnswerInputManager(this, testProcessor)
        testNavigationManager = TestNavigationManager(this, answerInputManager)
        
        // Create TestFormManager for TestSubmissionManager
        // TODO: Fix TestFormManager constructor issue
        // val testFormManager = TestFormManager(this)
        // TODO: Fix TestSubmissionManager constructor issue
        // testSubmissionManager = TestSubmissionManager(
        //     context = this,
        //     answerInputManager = answerInputManager,
        //     testProcessor = testProcessor
        // )
        
        securityService = SecurityService(this)
        
        // Initialize API services
        sessionManager = SessionManager(this)
        val networkModule = NetworkModule.create(this)
        testRepository = TestRepository(networkModule.apiService, sessionManager)
        testSubmissionService = TestSubmissionService(this, testRepository, AppDatabase.getDatabase(this))
        */
    }

    private fun initializeViews() {
        questionRecyclerView = findViewById(R.id.questionRecyclerView)
        testNameTextView = findViewById(R.id.testName)
        subjectTextView = findViewById(R.id.testSubject)
        progressTextView = findViewById(R.id.questionCounter)
        timeRemainingTextView = findViewById(R.id.timeRemaining)
        submitButton = findViewById(R.id.submitButton)

        // Setup submit button
        submitButton.setOnClickListener {
            showSubmissionConfirmation()
        }
    }

    private fun setupRecyclerView() {
        questionAdapter = QuestionAdapter { questionId, answer ->
            answerInputManager.recordAnswer(questionId, answer)
            updateProgress()
        }

        questionRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@TestActivity)
            adapter = questionAdapter
        }
    }

    private fun setupTestNavigation() {
        testNavigationManager.setCallbacks(
            questionChanged = { index, question ->
                updateQuestionDisplay(index, question)
            },
            progressUpdated = { progress ->
                updateProgressBar(progress)
            },
            timeUpdated = { timeString ->
                timeRemainingTextView.text = timeString
            },
            testCompleted = {
                showTimeUpDialog()
            }
        )
    }

    private fun setupTestSubmission() {
        // TODO: Fix TestSubmissionManager constructor issue
        // testSubmissionManager.setTestContext(testInfo, questions)
    }

    private fun loadTestData(testId: String, testType: String) {
        // Load real test data from API
        lifecycleScope.launch {
            try {
                val result = testRepository.getTestQuestions(testType, testId)
                
                result.fold(
                    onSuccess = { (apiTestInfo, apiQuestions) ->
                        testInfo = apiTestInfo
                        questions = apiQuestions
                        
                        // Update UI
                        updateTestInfo()
                        updateQuestionDisplay(0, questions.firstOrNull())
                        
                        // Setup navigation
                        testNavigationManager.setupNavigation(questions)
                        
                        // Setup timer from API data
                        testNavigationManager.setupTimer(testInfo.durationMinutes)
                        
                        // Update adapter
                        questionAdapter.submitList(questions)
                        
                        // Log successful data loading
                        Logger.info("Loaded test data: ${testInfo.name} with ${questions.size} questions")
                    },
                    onFailure = { exception ->
                        // Fallback to sample data if API fails
                        Logger.error("Failed to load test data from API", exception)
                        loadSampleDataAsFallback(testId, testType)
                    }
                )
            } catch (e: Exception) {
                Logger.error("Error loading test data", e)
                loadSampleDataAsFallback(testId, testType)
            }
        }
    }
    
    private fun loadSampleDataAsFallback(testId: String, testType: String) {
        // Fallback to sample data for development/testing
        testInfo = getSampleTestInfo(testId, testType)
        questions = getSampleQuestions(testType)
        
        // Update UI
        updateTestInfo()
        updateQuestionDisplay(0, questions.firstOrNull())
        
        // Setup navigation
        testNavigationManager.setupNavigation(questions)
        
        // Setup timer (30 minutes for development)
        testNavigationManager.setupTimer(30)
        
        // Update adapter
        questionAdapter.submitList(questions)
        
        Logger.warning("Using sample data as fallback")
    }

    private fun updateTestInfo() {
        testNameTextView.text = testInfo.name
        subjectTextView.text = testInfo.subject
    }

    private fun updateQuestionDisplay(index: Int, question: Question?) {
        question?.let {
            progressTextView.text = "Question ${index + 1} of ${questions.size}"
        }
    }

    private fun updateProgressBar(progress: Float) {
        // TODO: Update progress bar
    }

    private fun updateProgress() {
        val progress = testNavigationManager.getAnswerProgressPercentage()
        updateProgressBar(progress)
    }

    private fun showSubmissionConfirmation() {
        // TODO: Fix TestSubmissionManager constructor issue
        // val submissionSummary = testSubmissionManager.getSubmissionSummary()
        
        AlertDialog.Builder(this)
            .setTitle("Submit Test")
            .setMessage("Are you sure you want to submit your test? This action cannot be undone.")
            .setPositiveButton("Submit") { _, _ ->
                submitTest()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun submitTest() {
        lifecycleScope.launch {
            try {
                // Get security violations for this test session
                val securityViolations = securityService.getAppStateLogs()
                
                // Prepare submission data with student info
                val student = sessionManager.getStudentInfo()
                if (student == null) {
                    showSubmissionError("Student information not available")
                    return@launch
                }
                
                val answers = answerInputManager.getAllAnswers()
                // Calculate score using TestProcessor
                val correctAnswers = questions.associate { question ->
                    (question.id ?: "") to (question.correctAnswers ?: emptyList())
                }
                val score = TestProcessor.calculateScore(answers, correctAnswers)
                val maxScore = questions.size.toDouble()
                
                val submissionData = com.mws.models.TestSubmissionData(
                    testId = testInfo.id,
                    testName = testInfo.name,
                    testType = testInfo.type,
                    studentId = student.id,
                    grade = student.grade,
                    className = student.className,
                    number = student.number,
                    name = student.name,
                    surname = student.surname,
                    nickname = student.nickname ?: "",
                    score = score,
                    maxScore = maxScore,
                    answers = answers
                )
                
                // Submit to backend with security data
                val result = testSubmissionService.submitTestWithSecurityData(
                    submissionData,
                    securityViolations,
                    false
                )
                
                result.fold(
                    onSuccess = { submissionId ->
                        showSubmissionSuccess(submissionId)
                    },
                    onFailure = { exception ->
                        showSubmissionError("Submission failed: ${exception.message}")
                    }
                )
                
            } catch (e: Exception) {
                Logger.error("Error submitting test", e)
                showSubmissionError("Submission error: ${e.message}")
            }
        }
    }

    private fun showSubmissionSuccess(submissionId: String) {
        AlertDialog.Builder(this)
            .setTitle("Test Submitted Successfully!")
            .setMessage("Your test has been submitted to the backend. Submission ID: $submissionId")
            .setPositiveButton("OK") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }

    private fun showSubmissionError(message: String) {
        AlertDialog.Builder(this)
            .setTitle("Submission Error")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun showTimeUpDialog() {
        AlertDialog.Builder(this)
            .setTitle("Time's Up!")
            .setMessage("The test time has expired. Your test will be submitted automatically.")
            .setPositiveButton("OK") { _, _ ->
                submitTest()
            }
            .setCancelable(false)
            .show()
    }

    private fun getSampleTestInfo(testId: String, testType: String): TestInfo {
        return TestInfo(
            testId = testId,
            testName = "Sample Test - $testType",
            testType = testType,
            subjectName = "Sample Subject",
            grade = "10",
            className = "A",
            numQuestions = 10,
            createdAt = ""
        )
    }

    private fun getSampleQuestions(testType: String): List<Question> {
        return when (testType) {
            "multiple-choice" -> getSampleMultipleChoiceQuestions()
            "true-false" -> getSampleTrueFalseQuestions()
            "input" -> getSampleInputQuestions()
            "matching_type" -> getSampleMatchingQuestions()
            else -> getSampleMultipleChoiceQuestions()
        }
    }

    private fun getSampleMultipleChoiceQuestions(): List<Question> {
        return listOf(
            Question(
                questionId = "1",
                question = "What is the capital of France?",
                questionType = "multiple-choice",
                options = listOf("London", "Berlin", "Paris", "Madrid"),
                correctAnswer = "2"
            ),
            Question(
                questionId = "2",
                question = "Which planet is closest to the Sun?",
                questionType = "multiple-choice",
                options = listOf("Venus", "Mercury", "Earth", "Mars"),
                correctAnswer = "1"
            )
        )
    }

    private fun getSampleTrueFalseQuestions(): List<Question> {
        return listOf(
            Question(
                questionId = "1",
                question = "The Earth is round.",
                questionType = "true-false",
                correctAnswer = "true"
            ),
            Question(
                questionId = "2",
                question = "Water boils at 100 degrees Celsius.",
                questionType = "true-false",
                correctAnswer = "true"
            )
        )
    }

    private fun getSampleInputQuestions(): List<Question> {
        return listOf(
            Question(
                questionId = "1",
                question = "What is 2 + 2?",
                questionType = "input",
                correctAnswers = listOf("4", "four")
            ),
            Question(
                questionId = "2",
                question = "What is the largest ocean on Earth?",
                questionType = "input",
                correctAnswers = listOf("Pacific", "pacific")
            )
        )
    }

    private fun getSampleMatchingQuestions(): List<Question> {
        return listOf(
            Question(
                questionId = "1",
                question = "Match the countries with their capitals",
                questionType = "matching_type",
                coordinates = listOf("France-Paris", "Germany-Berlin", "Spain-Madrid")
            )
        )
    }

    // ===== SECURITY PROTECTION =====

    /**
     * Start security protection for the test
     */
    private fun startSecurityProtection(testId: String, testType: String) {
        try {
            val testSession = securityService.startTestProtection(testId, testType)
            
            // Set up security monitoring callbacks
            securityService.setOnSecurityViolationListener { warningType, warningCount ->
                showSecurityWarning(warningType, warningCount)
            }
            
            // Set up final warning callback
            securityService.setOnFinalWarningListener {
                handleFinalSecurityWarning()
            }
            
        } catch (e: Exception) {
            // Log security service initialization error
            // Continue with test but without security protection
        }
    }

    /**
     * Show security warning dialog
     */
    private fun showSecurityWarning(warningType: String, warningCount: Int) {
        val dialog = SecurityWarningDialog.newInstance(warningType, warningCount)
        
        dialog.setOnWarningAcknowledged {
            // User acknowledged the warning
            // Continue with test
        }
        
        dialog.setOnFinalWarning {
            // Final warning - handle accordingly
            handleFinalSecurityWarning()
        }
        
        dialog.show(supportFragmentManager, "security_warning")
    }

    /**
     * Handle final security warning
     */
    private fun handleFinalSecurityWarning() {
        AlertDialog.Builder(this)
            .setTitle("⚠️ Security Violation")
            .setMessage("You have been caught attempting to cheat. Your test will be submitted automatically with incomplete answers marked as 'cheating'.")
            .setPositiveButton("I Understand") { _, _ ->
                // Auto-submit test with cheating flag
                submitTestWithCheatingFlag()
            }
            .setCancelable(false)
            .show()
    }

    /**
     * Submit test with cheating flag
     */
    private fun submitTestWithCheatingFlag() {
        lifecycleScope.launch {
            try {
                // Mark all incomplete answers as "cheating"
                val currentAnswers = answerInputManager.getAllAnswers()
                val allQuestions = questions.map { it.questionId ?: "" }
                
                val cheatingAnswers = mutableMapOf<String, String>()
                allQuestions.forEach { questionId ->
                    cheatingAnswers[questionId] = currentAnswers[questionId] ?: "cheating"
                }
                
                // Get security violations for this test session
                val securityViolations = securityService.getAppStateLogs()
                
                // Prepare submission data with student info
                val student = sessionManager.getStudentInfo()
                if (student == null) {
                    showSubmissionError("Student information not available")
                    return@launch
                }
                
                val answers = currentAnswers
                // Calculate score using TestProcessor
                val correctAnswers = questions.associate { question ->
                    (question.id ?: "") to (question.correctAnswers ?: emptyList())
                }
                val score = TestProcessor.calculateScore(answers, correctAnswers)
                val maxScore = questions.size.toDouble()
                
                val submissionData = com.mws.models.TestSubmissionData(
                    testId = testInfo.id,
                    testName = testInfo.name,
                    testType = testInfo.type,
                    studentId = student.id,
                    grade = student.grade,
                    className = student.className,
                    number = student.number,
                    name = student.name,
                    surname = student.surname,
                    nickname = student.nickname ?: "",
                    score = score,
                    maxScore = maxScore,
                    answers = answers
                )
                
                // Submit to backend with cheating flag
                val result = testSubmissionService.submitTestWithSecurityData(
                    submissionData,
                    securityViolations,
                    true
                )
                
                result.fold(
                    onSuccess = { submissionId ->
                        showCheatingSubmissionResult()
                    },
                    onFailure = { exception ->
                        showSubmissionError("Failed to submit test with cheating flag: ${exception.message}")
                    }
                )
                
            } catch (e: Exception) {
                Logger.error("Error submitting cheating test", e)
                showSubmissionError("Failed to submit test with cheating flag: ${e.message}")
            }
        }
    }

    /**
     * Show result after cheating submission
     */
    private fun showCheatingSubmissionResult() {
        AlertDialog.Builder(this)
            .setTitle("Test Submitted")
            .setMessage("Your test has been submitted automatically due to security violations. Incomplete answers were marked as 'cheating'.")
            .setPositiveButton("OK") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }

    // ===== LIFECYCLE CALLBACKS =====

    override fun onPause() {
        super.onPause()
        // Record app state change for security monitoring
        securityService.recordAppStateChange("app_paused")
    }

    override fun onResume() {
        super.onResume()
        // Record app state change for security monitoring
        securityService.recordAppStateChange("app_resumed")
    }

    override fun onStop() {
        super.onStop()
        // Record app state change for security monitoring
        securityService.recordAppStateChange("app_stopped")
    }

    override fun onDestroy() {
        super.onDestroy()
        // Stop security protection
        securityService.stopTestProtection()
        testNavigationManager.stopTimer()
    }
}
