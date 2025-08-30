package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mws.R
import com.mws.database.AppDatabase
import com.mws.models.Question
import com.mws.repository.TestRepository
import com.mws.services.SecurityService
import com.mws.viewmodels.TestViewModel
import com.mws.viewmodels.TestViewModelFactory

class TestActivity : AppCompatActivity(), SecurityService.SecurityCallback {

    private lateinit var securityService: SecurityService
    private lateinit var viewModel: TestViewModel
    
    // UI Elements
    private lateinit var testTitleText: TextView
    private lateinit var questionContainer: LinearLayout
    private lateinit var progressText: TextView
    private lateinit var submitButton: Button
    private lateinit var loadingView: View
    
    // Test State
    private var currentQuestionIndex = 0
    private var questions: List<Question> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_test)

        // Initialize UI elements
        initializeViews()
        
        // Initialize security service
        securityService = SecurityService(this, this)

        // Get test details from intent
        val testId = intent.getStringExtra("test_id") ?: ""
        val testType = intent.getStringExtra("test_type") ?: ""

        if (testId.isNotEmpty() && testType.isNotEmpty()) {
            // Initialize ViewModel
            val database = AppDatabase.getInstance(this)
            val repository = TestRepository(database)
            val factory = TestViewModelFactory(repository, securityService)
            viewModel = ViewModelProvider(this, factory)[TestViewModel::class.java]
            
            // Start test protection
            securityService.startTestProtection(testId, testType)
            
            // Load test
            viewModel.loadTest(testId, testType)
            
            // Observe ViewModel data
            observeViewModel()
        } else {
            showError("Invalid test information")
        }
    }

    private fun initializeViews() {
        testTitleText = findViewById(R.id.tv_test_title)
        questionContainer = findViewById(R.id.question_container)
        progressText = findViewById(R.id.tv_progress)
        submitButton = findViewById(R.id.btn_submit_test)
        loadingView = findViewById(R.id.loading_view)
        
        submitButton.setOnClickListener {
            showSubmitConfirmation()
        }
    }

    private fun observeViewModel() {
        // Observe test questions
        viewModel.testQuestions.observe(this) { questions ->
            this.questions = questions
            displayQuestions()
        }
        
        // Observe test info
        viewModel.testInfo.observe(this) { testInfo ->
            testTitleText.text = testInfo.name
        }
        
        // Observe loading state
        viewModel.isLoading.observe(this) { isLoading ->
            loadingView.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
        
        // Observe errors
        viewModel.error.observe(this) { error ->
            error?.let { showError(it) }
        }
        
        // Observe test completion
        viewModel.testCompleted.observe(this) { completed ->
            if (completed) {
                showTestCompletedDialog()
            }
        }
    }

    private fun displayQuestions() {
        questionContainer.removeAllViews()
        currentQuestionIndex = 0
        
        questions.forEachIndexed { index, question ->
            val questionView = createQuestionView(question, index)
            questionContainer.addView(questionView)
        }
        
        updateProgress()
        submitButton.isEnabled = true
    }

    private fun createQuestionView(question: Question, index: Int): View {
        val questionLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 16, 0, 32)
            }
        }

        // Question text
        val questionText = TextView(this).apply {
            text = "Question ${index + 1}: ${question.question_text}"
            textSize = 16f
            setPadding(16, 16, 16, 16)
        }
        questionLayout.addView(questionText)

        // Answer input based on question type
        when (question.question_type) {
            "multiple_choice" -> addMultipleChoiceInput(questionLayout, question, index)
            "true_false" -> addTrueFalseInput(questionLayout, question, index)
            "input" -> addTextInput(questionLayout, question, index)
            "matching" -> addMatchingInput(questionLayout, question, index)
        }

        return questionLayout
    }

    private fun addMultipleChoiceInput(parent: LinearLayout, question: Question, index: Int) {
        question.options?.forEach { option ->
            val radioButton = RadioButton(this).apply {
                text = option
                id = View.generateViewId()
                setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) {
                        viewModel.recordAnswer(question.id, option)
                    }
                }
            }
            parent.addView(radioButton)
        }
    }

    private fun addTrueFalseInput(parent: LinearLayout, question: Question, index: Int) {
        val trueButton = RadioButton(this).apply {
            text = "True"
            id = View.generateViewId()
            setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    viewModel.recordAnswer(question.id, true)
                }
            }
        }
        
        val falseButton = RadioButton(this).apply {
            text = "False"
            id = View.generateViewId()
            setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    viewModel.recordAnswer(question.id, false)
                }
            }
        }
        
        parent.addView(trueButton)
        parent.addView(falseButton)
    }

    private fun addTextInput(parent: LinearLayout, question: Question, index: Int) {
        val editText = EditText(this).apply {
            hint = "Enter your answer"
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(16, 8, 16, 8)
            }
            setOnFocusChangeListener { _, hasFocus ->
                if (!hasFocus) {
                    viewModel.recordAnswer(question.id, text.toString())
                }
            }
        }
        parent.addView(editText)
    }

    private fun addMatchingInput(parent: LinearLayout, question: Question, index: Int) {
        // For matching tests, create a simple text input
        // This can be enhanced based on your specific matching test structure
        val editText = EditText(this).apply {
            hint = "Enter matching answer"
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(16, 8, 16, 8)
            }
            setOnFocusChangeListener { _, hasFocus ->
                if (!hasFocus) {
                    viewModel.recordAnswer(question.id, text.toString())
                }
            }
        }
        parent.addView(editText)
    }

    private fun updateProgress() {
        progressText.text = "Question ${currentQuestionIndex + 1} of ${questions.size}"
    }

    private fun showSubmitConfirmation() {
        AlertDialog.Builder(this)
            .setTitle("Submit Test")
            .setMessage("Are you sure you want to submit this test? You cannot change your answers after submission.")
            .setPositiveButton("Submit") { _, _ ->
                submitTest()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun submitTest() {
        submitButton.isEnabled = false
        viewModel.submitTest()
    }

    private fun showTestCompletedDialog() {
        AlertDialog.Builder(this)
            .setTitle("Test Completed")
            .setMessage("Your test has been submitted successfully!")
            .setPositiveButton("OK") { _, _ ->
                // Navigate back to main activity
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                startActivity(intent)
                finish()
            }
            .setCancelable(false)
            .show()
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    override fun onPause() {
        super.onPause()
        securityService.onActivityPaused()
    }

    override fun onResume() {
        super.onResume()
        securityService.onActivityResumed()
    }

    // SecurityService callbacks
    override fun onAutoSubmitRequired() {
        // Auto-submit test due to security violations
        AlertDialog.Builder(this)
            .setTitle("Security Violation")
            .setMessage("Your test is being automatically submitted due to multiple security violations.")
            .setPositiveButton("OK") { _, _ ->
                submitTest()
            }
            .setCancelable(false)
            .show()
    }

    override fun onWarningShown(warningNumber: Int) {
        // Show cheating warning to user
        AlertDialog.Builder(this)
            .setTitle("Warning")
            .setMessage("You have been away from the test for too long. This is warning $warningNumber of 3. Please stay focused on the test.")
            .setPositiveButton("OK", null)
            .show()
    }
}
