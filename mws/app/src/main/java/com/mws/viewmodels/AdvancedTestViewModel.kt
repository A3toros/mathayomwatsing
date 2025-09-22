package com.mws.viewmodels

import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.Question
import com.mws.models.TestInfo
import com.mws.services.QuestionRandomizerService
import com.mws.services.TestTimerService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * AdvancedTestViewModel - Manages advanced test features
 * Handles question randomization, timing, and adaptive testing
 */
class AdvancedTestViewModel : ViewModel() {

    private val questionRandomizer = QuestionRandomizerService()
    
    private val _testState = MutableLiveData<TestState>()
    val testState: LiveData<TestState> = _testState

    private val _questions = MutableLiveData<List<Question>>()
    val questions: LiveData<List<Question>> = _questions

    private val _currentQuestionIndex = MutableLiveData<Int>()
    val currentQuestionIndex: LiveData<Int> = _currentQuestionIndex

    private val _userAnswers = MutableLiveData<Map<String, String>>()
    val userAnswers: LiveData<Map<String, String>> = _userAnswers

    private val _timerState = MutableStateFlow(TestTimerService.TimeState())
    val timerState: StateFlow<TestTimerService.TimeState> = _timerState.asStateFlow()

    private var testInfo: TestInfo? = null
    private var originalQuestions: List<Question> = emptyList()
    private var randomizedQuestions: List<Question> = emptyList()

    init {
        _currentQuestionIndex.value = 0
        _userAnswers.value = mutableMapOf()
    }

    /**
     * Initializes the test with questions and configuration
     * @param questions List of questions for the test
     * @param testInfo Test configuration information
     * @param randomizationType Type of randomization to apply
     */
    fun initializeTest(
        questions: List<Question>,
        testInfo: TestInfo,
        randomizationType: RandomizationType = RandomizationType.STANDARD
    ) {
        this.testInfo = testInfo
        this.originalQuestions = questions
        
        // Apply randomization based on type
        randomizedQuestions = when (randomizationType) {
            RandomizationType.STANDARD -> questionRandomizer.randomizeQuestions(questions)
            RandomizationType.WITH_OPTIONS -> questionRandomizer.randomizeQuestionsWithOptions(questions)
            RandomizationType.BY_DIFFICULTY -> questionRandomizer.selectQuestionsByDifficulty(
                questions, 
                testInfo.numQuestions
            )
            RandomizationType.ADAPTIVE -> questionRandomizer.createAdaptiveQuestionSet(
                questions, 
                testInfo.numQuestions
            )
            RandomizationType.BALANCED -> {
                val topics = questions.mapNotNull { it.topic }.distinct()
                questionRandomizer.createBalancedQuestionSets(
                    questions, 
                    topics, 
                    testInfo.numQuestions / topics.size
                ).flatten()
            }
        }
        
        _questions.value = randomizedQuestions
        _testState.value = TestState.Ready
    }

    /**
     * Moves to the next question
     */
    fun nextQuestion() {
        val currentIndex = _currentQuestionIndex.value ?: 0
        if (currentIndex < (randomizedQuestions.size - 1)) {
            _currentQuestionIndex.value = currentIndex + 1
        }
    }

    /**
     * Moves to the previous question
     */
    fun previousQuestion() {
        val currentIndex = _currentQuestionIndex.value ?: 0
        if (currentIndex > 0) {
            _currentQuestionIndex.value = currentIndex - 1
        }
    }

    /**
     * Jumps to a specific question
     * @param questionIndex Index of the question to jump to
     */
    fun jumpToQuestion(questionIndex: Int) {
        if (questionIndex in 0 until randomizedQuestions.size) {
            _currentQuestionIndex.value = questionIndex
        }
    }

    /**
     * Records user answer for a question
     * @param questionId ID of the question
     * @param answer User's answer
     */
    fun recordAnswer(questionId: String, answer: String) {
        val currentAnswers = _userAnswers.value?.toMutableMap() ?: mutableMapOf()
        currentAnswers[questionId] = answer
        _userAnswers.value = currentAnswers
    }

    /**
     * Gets the current question
     */
    fun getCurrentQuestion(): Question? {
        val currentIndex = _currentQuestionIndex.value ?: 0
        return if (currentIndex < randomizedQuestions.size) {
            randomizedQuestions[currentIndex]
        } else null
    }

    /**
     * Gets question progress information
     */
    fun getProgressInfo(): ProgressInfo {
        val currentIndex = _currentQuestionIndex.value ?: 0
        val totalQuestions = randomizedQuestions.size
        val answeredQuestions = _userAnswers.value?.size ?: 0
        
        return ProgressInfo(
            currentQuestion = currentIndex + 1,
            totalQuestions = totalQuestions,
            answeredQuestions = answeredQuestions,
            progressPercentage = (answeredQuestions.toFloat() / totalQuestions) * 100f
        )
    }

    /**
     * Gets navigation information for all questions
     */
    fun getQuestionNavigationInfo(): List<QuestionNavigationInfo> {
        return randomizedQuestions.mapIndexed { index, question ->
            val questionId = question.questionId ?: question.id ?: ""
            val isAnswered = _userAnswers.value?.containsKey(questionId) == true
            val isCurrent = index == _currentQuestionIndex.value
            
            QuestionNavigationInfo(
                questionIndex = index,
                questionId = questionId,
                isAnswered = isAnswered,
                isCurrent = isCurrent,
                questionType = question.questionType
            )
        }
    }

    /**
     * Validates the current question set
     */
    fun validateQuestionSet(): QuestionRandomizerService.QuestionSetValidation? {
        return if (randomizedQuestions.isNotEmpty()) {
            questionRandomizer.validateQuestionSet(randomizedQuestions)
        } else null
    }

    /**
     * Generates practice questions based on performance
     * @param targetCount Target number of practice questions
     */
    fun generatePracticeQuestions(targetCount: Int): List<Question> {
        val performanceMap = _userAnswers.value?.mapValues { (_, answer) ->
            // This is a simplified performance calculation
            // In a real app, you'd compare with correct answers
            answer.isNotEmpty()
        } ?: emptyMap()
        
        return questionRandomizer.generatePracticeQuestions(
            originalQuestions,
            performanceMap,
            targetCount
        )
    }

    /**
     * Updates timer state from the service
     * @param timeState Current timer state
     */
    fun updateTimerState(timeState: TestTimerService.TimeState) {
        _timerState.value = timeState
        
        // Check if time is up
        if (timeState.remainingMinutes == 0 && timeState.remainingSeconds == 0) {
            _testState.value = TestState.TimeUp
        }
    }

    /**
     * Submits the test
     */
    fun submitTest() {
        _testState.value = TestState.Submitted
    }

    /**
     * Gets test summary information
     */
    fun getTestSummary(): TestSummary {
        val totalQuestions = randomizedQuestions.size
        val answeredQuestions = _userAnswers.value?.size ?: 0
        val unansweredQuestions = totalQuestions - answeredQuestions
        
        return TestSummary(
            totalQuestions = totalQuestions,
            answeredQuestions = answeredQuestions,
            unansweredQuestions = unansweredQuestions,
            completionPercentage = (answeredQuestions.toFloat() / totalQuestions) * 100f
        )
    }

    /**
     * Enum for randomization types
     */
    enum class RandomizationType {
        STANDARD,           // Basic question shuffling
        WITH_OPTIONS,       // Question and option shuffling
        BY_DIFFICULTY,      // Difficulty-based selection
        ADAPTIVE,           // Progressive difficulty
        BALANCED            // Topic-balanced selection
    }

    /**
     * Sealed class for test states
     */
    sealed class TestState {
        object Ready : TestState()
        object InProgress : TestState()
        object Paused : TestState()
        object TimeUp : TestState()
        object Submitted : TestState()
        data class Error(val message: String) : TestState()
    }

    /**
     * Data class for progress information
     */
    data class ProgressInfo(
        val currentQuestion: Int,
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val progressPercentage: Float
    )

    /**
     * Data class for question navigation information
     */
    data class QuestionNavigationInfo(
        val questionIndex: Int,
        val questionId: String,
        val isAnswered: Boolean,
        val isCurrent: Boolean,
        val questionType: String
    )

    /**
     * Data class for test summary
     */
    data class TestSummary(
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val unansweredQuestions: Int,
        val completionPercentage: Float
    )
}
