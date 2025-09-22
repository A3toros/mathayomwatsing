package com.mws.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mws.R
import com.mws.adapters.QuestionResultAdapter
import com.mws.models.Question
import com.mws.models.TestInfo
import com.mws.testlogic.TestProcessor
import com.mws.testlogic.AnswerValidator

/**
 * ResultsActivity - Displays test results and scores
 * Shows detailed breakdown of answers and performance
 */
class ResultsActivity : AppCompatActivity() {

    private lateinit var testNameTextView: TextView
    private lateinit var subjectTextView: TextView
    private lateinit var scoreTextView: TextView
    private lateinit var totalQuestionsTextView: TextView
    private lateinit var correctAnswersTextView: TextView
    private lateinit var incorrectAnswersTextView: TextView
    private lateinit var timeTakenTextView: TextView
    private lateinit var questionsRecyclerView: RecyclerView
    private lateinit var backToDashboardButton: Button
    private lateinit var retakeTestButton: Button

    private lateinit var testInfo: TestInfo
    private lateinit var questions: List<Question>
    private lateinit var userAnswers: Map<String, String>
    private lateinit var testProcessor: TestProcessor
    private lateinit var questionResultAdapter: QuestionResultAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_results)

        // Get data from intent
        getDataFromIntent()

        // Initialize TestProcessor
        testProcessor = TestProcessor()

        // Initialize views
        initializeViews()

        // Setup RecyclerView
        setupRecyclerView()

        // Calculate and display results
        calculateAndDisplayResults()

        // Setup click listeners
        setupClickListeners()
    }

    private fun getDataFromIntent() {
        intent.extras?.let { bundle ->
            // TODO: Get actual test data from intent
            // For now, use sample data
            testInfo = TestInfo(
                testId = bundle.getString("test_id", "sample_test") ?: "sample_test",
                testName = bundle.getString("test_name", "Sample Test") ?: "Sample Test",
                testType = bundle.getString("test_type", "multiple-choice") ?: "multiple-choice",
                subjectName = bundle.getString("test_subject", "Sample Subject") ?: "Sample Subject",
                grade = bundle.getString("test_grade", "Grade 10") ?: "Grade 10",
                className = bundle.getString("test_class", "Class A") ?: "Class A",
                numQuestions = bundle.getInt("num_questions", 10),
                createdAt = bundle.getString("created_at", "") ?: ""
            )
            
            // Sample questions and answers for development
            questions = getSampleQuestions()
            userAnswers = getSampleUserAnswers()
        }
    }

    private fun initializeViews() {
        testNameTextView = findViewById(R.id.testNameTextView)
        subjectTextView = findViewById(R.id.subjectTextView)
        scoreTextView = findViewById(R.id.scoreTextView)
        totalQuestionsTextView = findViewById(R.id.totalQuestionsTextView)
        correctAnswersTextView = findViewById(R.id.correctAnswersTextView)
        incorrectAnswersTextView = findViewById(R.id.incorrectAnswersTextView)
        timeTakenTextView = findViewById(R.id.timeTakenTextView)
        questionsRecyclerView = findViewById(R.id.questionsRecyclerView)
        backToDashboardButton = findViewById(R.id.backToDashboardButton)
        retakeTestButton = findViewById(R.id.retakeTestButton)
    }

    private fun setupRecyclerView() {
        questionResultAdapter = QuestionResultAdapter(questions, userAnswers)
        questionsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@ResultsActivity)
            adapter = questionResultAdapter
        }
    }

    private fun calculateAndDisplayResults() {
        // Calculate score
        val correctAnswersMap = questions.associate { question ->
            (question.id ?: "") to (question.correctAnswers ?: emptyList())
        }
        val percentage = TestProcessor.calculateScore(userAnswers, correctAnswersMap)
        val totalQuestions = questions.size
        val correctAnswers = userAnswers.count { (questionId, userAnswer) ->
            AnswerValidator.isAnswerCorrect(questionId, userAnswer, correctAnswersMap)
        }
        val incorrectAnswers = totalQuestions - correctAnswers

        // Display test info
        testNameTextView.text = testInfo.name
        subjectTextView.text = testInfo.subject

        // Display score information
        scoreTextView.text = "${String.format("%.1f", percentage)}%"
        totalQuestionsTextView.text = totalQuestions.toString()
        correctAnswersTextView.text = correctAnswers.toString()
        incorrectAnswersTextView.text = incorrectAnswers.toString()

        // Display time taken (sample data for now)
        timeTakenTextView.text = "25 minutes"

        // Set score color based on performance
        setScoreColor(percentage)
    }

    private fun setScoreColor(percentage: Double) {
        val colorRes = when {
            percentage >= 90 -> R.color.success
            percentage >= 80 -> R.color.warning
            percentage >= 70 -> R.color.info
            else -> R.color.error
        }
        scoreTextView.setTextColor(getColor(colorRes))
    }

    private fun setupClickListeners() {
        backToDashboardButton.setOnClickListener {
            // Navigate back to dashboard
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            startActivity(intent)
            finish()
        }

        retakeTestButton.setOnClickListener {
            // TODO: Implement retake functionality
            // This would involve resetting the test and navigating back to TestActivity
        }
    }

    private fun getSampleQuestions(): List<Question> {
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
            ),
            Question(
                questionId = "3",
                question = "The Earth is round.",
                questionType = "true-false",
                correctAnswer = "true"
            ),
            Question(
                questionId = "4",
                question = "What is 2 + 2?",
                questionType = "input",
                correctAnswers = listOf("4", "four")
            )
        )
    }

    private fun getSampleUserAnswers(): Map<String, String> {
        return mapOf(
            "1" to "2", // Correct
            "2" to "0", // Incorrect
            "3" to "true", // Correct
            "4" to "4" // Correct
        )
    }

    override fun onBackPressed() {
        // Navigate back to dashboard instead of previous activity
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
        startActivity(intent)
        finish()
    }
}
