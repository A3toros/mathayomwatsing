package com.mws.testlogic

import android.content.Context
import android.os.CountDownTimer
import android.widget.TextView
import com.mws.models.Question
import java.util.concurrent.TimeUnit

/**
 * TestNavigationManager - Manages question navigation, progress, and timing
 * Provides smooth navigation between questions with progress tracking
 */
class TestNavigationManager(
    private val context: Context,
    private val answerInputManager: AnswerInputManager
) {

    private var currentQuestionIndex = 0
    private var totalQuestions = 0
    private var questions: List<Question> = emptyList()
    private var countDownTimer: CountDownTimer? = null
    private var timeRemainingMillis: Long = 0
    private var isTimerActive = false

    // Navigation callbacks
    private var onQuestionChanged: ((Int, Question) -> Unit)? = null
    private var onProgressUpdated: ((Float) -> Unit)? = null
    private var onTimeUpdated: ((String) -> Unit)? = null
    private var onTestCompleted: (() -> Unit)? = null

    /**
     * Sets up the navigation manager with questions
     */
    fun setupNavigation(questionList: List<Question>) {
        questions = questionList
        totalQuestions = questions.size
        currentQuestionIndex = 0
        resetTimer()
    }

    /**
     * Sets navigation callbacks
     */
    fun setCallbacks(
        questionChanged: ((Int, Question) -> Unit)? = null,
        progressUpdated: ((Float) -> Unit)? = null,
        timeUpdated: ((String) -> Unit)? = null,
        testCompleted: (() -> Unit)? = null
    ) {
        onQuestionChanged = questionChanged
        onProgressUpdated = progressUpdated
        onTimeUpdated = timeUpdated
        onTestCompleted = testCompleted
    }

    /**
     * Navigate to next question
     */
    fun nextQuestion(): Boolean {
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++
            notifyQuestionChanged()
            updateProgress()
            return true
        }
        return false
    }

    /**
     * Navigate to previous question
     */
    fun previousQuestion(): Boolean {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--
            notifyQuestionChanged()
            updateProgress()
            return true
        }
        return false
    }

    /**
     * Jump to specific question
     */
    fun jumpToQuestion(questionIndex: Int): Boolean {
        if (questionIndex in 0 until totalQuestions) {
            currentQuestionIndex = questionIndex
            notifyQuestionChanged()
            updateProgress()
            return true
        }
        return false
    }

    /**
     * Gets current question
     */
    fun getCurrentQuestion(): Question? {
        return if (questions.isNotEmpty() && currentQuestionIndex < questions.size) {
            questions[currentQuestionIndex]
        } else null
    }

    /**
     * Gets current question index
     */
    fun getCurrentQuestionIndex(): Int = currentQuestionIndex

    /**
     * Gets total questions count
     */
    fun getTotalQuestions(): Int = totalQuestions

    /**
     * Checks if can go to next question
     */
    fun canGoNext(): Boolean = currentQuestionIndex < totalQuestions - 1

    /**
     * Checks if can go to previous question
     */
    fun canGoPrevious(): Boolean = currentQuestionIndex > 0

    /**
     * Checks if current question is the last one
     */
    fun isLastQuestion(): Boolean = currentQuestionIndex == totalQuestions - 1

    /**
     * Checks if current question is the first one
     */
    fun isFirstQuestion(): Boolean = currentQuestionIndex == 0

    /**
     * Gets question navigation info
     */
    fun getNavigationInfo(): NavigationInfo {
        val currentQuestion = getCurrentQuestion()
        val progress = getProgressPercentage()
        
        return NavigationInfo(
            currentIndex = currentQuestionIndex,
            totalQuestions = totalQuestions,
            progress = progress,
            canGoNext = canGoNext(),
            canGoPrevious = canGoPrevious(),
            isFirstQuestion = isFirstQuestion(),
            isLastQuestion = isLastQuestion(),
            currentQuestion = currentQuestion
        )
    }

    /**
     * Gets progress percentage
     */
    fun getProgressPercentage(): Float {
        return if (totalQuestions > 0) {
            ((currentQuestionIndex + 1).toFloat() / totalQuestions.toFloat()) * 100
        } else 0f
    }

    /**
     * Gets answer progress percentage
     */
    fun getAnswerProgressPercentage(): Float {
        return answerInputManager.getCompletionPercentage(totalQuestions)
    }

    /**
     * Sets up timer for test
     */
    fun setupTimer(durationMinutes: Int) {
        timeRemainingMillis = TimeUnit.MINUTES.toMillis(durationMinutes.toLong())
        startTimer()
    }

    /**
     * Starts the countdown timer
     */
    private fun startTimer() {
        if (isTimerActive) return
        
        countDownTimer = object : CountDownTimer(timeRemainingMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                timeRemainingMillis = millisUntilFinished
                updateTimeDisplay()
            }

            override fun onFinish() {
                timeRemainingMillis = 0
                isTimerActive = false
                onTestCompleted?.invoke()
            }
        }.start()
        
        isTimerActive = true
    }

    /**
     * Stops the timer
     */
    fun stopTimer() {
        countDownTimer?.cancel()
        isTimerActive = false
    }

    /**
     * Pauses the timer
     */
    fun pauseTimer() {
        countDownTimer?.cancel()
        isTimerActive = false
    }

    /**
     * Resumes the timer
     */
    fun resumeTimer() {
        if (!isTimerActive && timeRemainingMillis > 0) {
            startTimer()
        }
    }

    /**
     * Resets the timer
     */
    private fun resetTimer() {
        stopTimer()
        timeRemainingMillis = 0
    }

    /**
     * Gets formatted time remaining
     */
    fun getFormattedTimeRemaining(): String {
        val minutes = TimeUnit.MILLISECONDS.toMinutes(timeRemainingMillis)
        val seconds = TimeUnit.MILLISECONDS.toSeconds(timeRemainingMillis) % 60
        
        return String.format("%02d:%02d", minutes, seconds)
    }

    /**
     * Gets time remaining in milliseconds
     */
    fun getTimeRemainingMillis(): Long = timeRemainingMillis

    /**
     * Checks if timer is active
     */
    fun isTimerActive(): Boolean = isTimerActive

    /**
     * Gets unanswered questions for navigation
     */
    fun getUnansweredQuestions(): List<Question> {
        return answerInputManager.getUnansweredQuestions(questions)
    }

    /**
     * Gets answered questions for navigation
     */
    fun getAnsweredQuestions(): List<Question> {
        return questions.filter { question ->
            val questionId = question.questionId ?: ""
            answerInputManager.getCurrentAnswer(questionId) != null
        }
    }

    /**
     * Gets question summary for navigation
     */
    fun getQuestionSummary(): List<QuestionSummary> {
        return questions.mapIndexed { index, question ->
            val questionId = question.questionId ?: ""
            val answer = answerInputManager.getCurrentAnswer(questionId)
            
            QuestionSummary(
                index = index,
                questionId = questionId,
                questionText = question.question ?: "",
                isAnswered = answer != null,
                isCurrentQuestion = index == currentQuestionIndex
            )
        }
    }

    /**
     * Notifies question change
     */
    private fun notifyQuestionChanged() {
        val currentQuestion = getCurrentQuestion()
        currentQuestion?.let { question ->
            onQuestionChanged?.invoke(currentQuestionIndex, question)
        }
    }

    /**
     * Updates progress
     */
    private fun updateProgress() {
        val progress = getProgressPercentage()
        onProgressUpdated?.invoke(progress)
    }

    /**
     * Updates time display
     */
    private fun updateTimeDisplay() {
        val timeString = getFormattedTimeRemaining()
        onTimeUpdated?.invoke(timeString)
    }

    /**
     * Data class for navigation information
     */
    data class NavigationInfo(
        val currentIndex: Int,
        val totalQuestions: Int,
        val progress: Float,
        val canGoNext: Boolean,
        val canGoPrevious: Boolean,
        val isFirstQuestion: Boolean,
        val isLastQuestion: Boolean,
        val currentQuestion: Question?
    )

    /**
     * Data class for question summary
     */
    data class QuestionSummary(
        val index: Int,
        val questionId: String,
        val questionText: String,
        val isAnswered: Boolean,
        val isCurrentQuestion: Boolean
    )
}
