package com.mws.viewmodels

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.Observer
import com.mws.models.Question
import com.mws.models.TestResult
import com.mws.services.QuestionRandomizerService
import com.mws.services.TestTimerService
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
class AdvancedTestViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Mock
    private lateinit var questionRandomizer: QuestionRandomizerService
    
    @Mock
    private lateinit var testTimer: TestTimerService
    
    private lateinit var advancedTestViewModel: AdvancedTestViewModel
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var sampleQuestions: List<Question>

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        testDispatcher.setMain(testDispatcher)
        
        advancedTestViewModel = AdvancedTestViewModel(questionRandomizer, testTimer)
        
        // Create sample questions for testing
        sampleQuestions = listOf(
            Question(
                questionId = "q1",
                questionText = "What is 2 + 2?",
                questionType = "multiple-choice",
                options = listOf("3", "4", "5", "6"),
                correctAnswer = "1",
                topic = "math",
                difficulty = "easy"
            ),
            Question(
                questionId = "q2",
                questionText = "What is the capital of France?",
                questionType = "multiple-choice",
                options = listOf("London", "Berlin", "Paris", "Madrid"),
                correctAnswer = "2",
                topic = "geography",
                difficulty = "easy"
            ),
            Question(
                questionId = "q3",
                questionText = "What is the chemical symbol for gold?",
                questionType = "multiple-choice",
                options = listOf("Au", "Ag", "Fe", "Cu"),
                correctAnswer = "0",
                topic = "chemistry",
                difficulty = "medium"
            )
        )
    }

    @Test
    fun `test initializeTest sets up test correctly`() = runTest {
        // Given
        val testDuration = 30
        val randomizationType = "shuffle"
        whenever(questionRandomizer.randomizeQuestions(sampleQuestions)).thenReturn(sampleQuestions)
        
        // When
        advancedTestViewModel.initializeTest(sampleQuestions, testDuration, randomizationType)
        
        // Then
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertNotNull("Current question should be set", currentQuestion)
        assertEquals("First question should be current", sampleQuestions[0], currentQuestion)
        
        val totalQuestions = advancedTestViewModel.totalQuestions.value
        assertEquals("Total questions should be set", sampleQuestions.size, totalQuestions)
        
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should start at 0", 0, currentQuestionIndex)
    }

    @Test
    fun `test nextQuestion advances to next question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        advancedTestViewModel.nextQuestion()
        
        // Then
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should advance", 1, currentQuestionIndex)
        
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertEquals("Current question should be second question", sampleQuestions[1], currentQuestion)
    }

    @Test
    fun `test previousQuestion goes back to previous question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.nextQuestion() // Go to question 1
        
        // When
        advancedTestViewModel.previousQuestion()
        
        // Then
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should go back", 0, currentQuestionIndex)
        
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertEquals("Current question should be first question", sampleQuestions[0], currentQuestion)
    }

    @Test
    fun `test nextQuestion at last question does nothing`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.nextQuestion() // Go to question 1
        advancedTestViewModel.nextQuestion() // Go to question 2 (last)
        
        // When
        advancedTestViewModel.nextQuestion() // Try to go beyond last question
        
        // Then
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should stay at last question", 2, currentQuestionIndex)
        
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertEquals("Current question should remain last question", sampleQuestions[2], currentQuestion)
    }

    @Test
    fun `test previousQuestion at first question does nothing`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        advancedTestViewModel.previousQuestion() // Try to go before first question
        
        // Then
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should stay at 0", 0, currentQuestionIndex)
        
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertEquals("Current question should remain first question", sampleQuestions[0], currentQuestion)
    }

    @Test
    fun `test recordAnswer stores user answer correctly`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        val userAnswer = "2"
        
        // When
        advancedTestViewModel.recordAnswer(userAnswer)
        
        // Then
        val userAnswers = advancedTestViewModel.userAnswers.value
        assertNotNull("User answers should be initialized", userAnswers)
        assertEquals("Answer should be recorded", userAnswer, userAnswers["q1"])
    }

    @Test
    fun `test recordAnswer updates progress`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        advancedTestViewModel.recordAnswer("2")
        
        // Then
        val progress = advancedTestViewModel.progress.value
        assertNotNull("Progress should be calculated", progress)
        assertTrue("Progress should be greater than 0", progress!! > 0f)
    }

    @Test
    fun `test getProgressPercentage calculates correctly`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("2") // Answer first question
        
        // When
        val progressPercentage = advancedTestViewModel.getProgressPercentage()
        
        // Then
        assertEquals("Progress should be 33.33% for 1 out of 3 questions", 
            33.33f, progressPercentage, 0.01f)
    }

    @Test
    fun `test getProgressPercentage returns 0 for no answers`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val progressPercentage = advancedTestViewModel.getProgressPercentage()
        
        // Then
        assertEquals("Progress should be 0% for no answers", 0f, progressPercentage, 0.01f)
    }

    @Test
    fun `test getProgressPercentage returns 100 for all answers`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("2") // Answer first question
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("2") // Answer second question
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("0") // Answer third question
        
        // When
        val progressPercentage = advancedTestViewModel.getProgressPercentage()
        
        // Then
        assertEquals("Progress should be 100% for all questions answered", 
            100f, progressPercentage, 0.01f)
    }

    @Test
    fun `test canGoNext returns true when not at last question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val canGoNext = advancedTestViewModel.canGoNext()
        
        // Then
        assertTrue("Should be able to go to next question", canGoNext)
    }

    @Test
    fun `test canGoNext returns false when at last question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.nextQuestion() // Go to question 1
        advancedTestViewModel.nextQuestion() // Go to question 2 (last)
        
        // When
        val canGoNext = advancedTestViewModel.canGoNext()
        
        // Then
        assertFalse("Should not be able to go to next question at last question", canGoNext)
    }

    @Test
    fun `test canGoPrevious returns true when not at first question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.nextQuestion() // Go to question 1
        
        // When
        val canGoPrevious = advancedTestViewModel.canGoPrevious()
        
        // Then
        assertTrue("Should be able to go to previous question", canGoPrevious)
    }

    @Test
    fun `test canGoPrevious returns false when at first question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val canGoPrevious = advancedTestViewModel.canGoPrevious()
        
        // Then
        assertFalse("Should not be able to go to previous question at first question", canGoPrevious)
    }

    @Test
    fun `test submitTest calculates results correctly`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("1") // Correct answer for q1
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("2") // Correct answer for q2
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("0") // Correct answer for q3
        
        // When
        val testResult = advancedTestViewModel.submitTest()
        
        // Then
        assertNotNull("Test result should be generated", testResult)
        assertEquals("Score should be 100%", 100f, testResult.score, 0.01f)
        assertEquals("Total questions should be 3", 3, testResult.totalQuestions)
        assertEquals("Correct answers should be 3", 3, testResult.correctAnswers)
    }

    @Test
    fun `test submitTest with partial answers calculates correctly`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("1") // Correct answer for q1
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("1") // Wrong answer for q2
        // q3 not answered
        
        // When
        val testResult = advancedTestViewModel.submitTest()
        
        // Then
        assertNotNull("Test result should be generated", testResult)
        assertEquals("Score should be 33.33%", 33.33f, testResult.score, 0.01f)
        assertEquals("Total questions should be 3", 3, testResult.totalQuestions)
        assertEquals("Correct answers should be 1", 1, testResult.correctAnswers)
    }

    @Test
    fun `test submitTest with no answers returns zero score`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val testResult = advancedTestViewModel.submitTest()
        
        // Then
        assertNotNull("Test result should be generated", testResult)
        assertEquals("Score should be 0%", 0f, testResult.score, 0.01f)
        assertEquals("Total questions should be 3", 3, testResult.totalQuestions)
        assertEquals("Correct answers should be 0", 0, testResult.correctAnswers)
    }

    @Test
    fun `test getTestSummary provides accurate summary`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("1") // Correct answer for q1
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("1") // Wrong answer for q2
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("0") // Correct answer for q3
        
        // When
        val summary = advancedTestViewModel.getTestSummary()
        
        // Then
        assertNotNull("Test summary should be generated", summary)
        assertEquals("Total questions should be 3", 3, summary.totalQuestions)
        assertEquals("Answered questions should be 3", 3, summary.answeredQuestions)
        assertEquals("Unanswered questions should be 0", 0, summary.unansweredQuestions)
        assertEquals("Correct answers should be 2", 2, summary.correctAnswers)
        assertEquals("Incorrect answers should be 1", 1, summary.incorrectAnswers)
        assertEquals("Score should be 66.67%", 66.67f, summary.score, 0.01f)
    }

    @Test
    fun `test getTestSummary with no answers`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val summary = advancedTestViewModel.getTestSummary()
        
        // Then
        assertNotNull("Test summary should be generated", summary)
        assertEquals("Total questions should be 3", 3, summary.totalQuestions)
        assertEquals("Answered questions should be 0", 0, summary.answeredQuestions)
        assertEquals("Unanswered questions should be 3", 3, summary.unansweredQuestions)
        assertEquals("Correct answers should be 0", 0, summary.correctAnswers)
        assertEquals("Incorrect answers should be 0", 0, summary.incorrectAnswers)
        assertEquals("Score should be 0%", 0f, summary.score, 0.01f)
    }

    @Test
    fun `test resetTest clears all test data`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("1")
        advancedTestViewModel.nextQuestion()
        
        // When
        advancedTestViewModel.resetTest()
        
        // Then
        val currentQuestion = advancedTestViewModel.currentQuestion.value
        assertNull("Current question should be null", currentQuestion)
        
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should be reset to 0", 0, currentQuestionIndex)
        
        val totalQuestions = advancedTestViewModel.totalQuestions.value
        assertEquals("Total questions should be reset to 0", 0, totalQuestions)
        
        val userAnswers = advancedTestViewModel.userAnswers.value
        assertTrue("User answers should be empty", userAnswers.isEmpty())
        
        val progress = advancedTestViewModel.progress.value
        assertEquals("Progress should be reset to 0", 0f, progress, 0.01f)
    }

    @Test
    fun `test getQuestionByIndex returns correct question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val questionAtIndex1 = advancedTestViewModel.getQuestionByIndex(1)
        val questionAtIndex2 = advancedTestViewModel.getQuestionByIndex(2)
        
        // Then
        assertEquals("Question at index 1 should be second question", sampleQuestions[1], questionAtIndex1)
        assertEquals("Question at index 2 should be third question", sampleQuestions[2], questionAtIndex2)
    }

    @Test
    fun `test getQuestionByIndex returns null for invalid index`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val questionAtInvalidIndex = advancedTestViewModel.getQuestionByIndex(10)
        val questionAtNegativeIndex = advancedTestViewModel.getQuestionByIndex(-1)
        
        // Then
        assertNull("Question at invalid index should be null", questionAtInvalidIndex)
        assertNull("Question at negative index should be null", questionAtNegativeIndex)
    }

    @Test
    fun `test isQuestionAnswered returns correct status`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        advancedTestViewModel.recordAnswer("1") // Answer first question
        
        // When
        val firstQuestionAnswered = advancedTestViewModel.isQuestionAnswered(0)
        val secondQuestionAnswered = advancedTestViewModel.isQuestionAnswered(1)
        
        // Then
        assertTrue("First question should be answered", firstQuestionAnswered)
        assertFalse("Second question should not be answered", secondQuestionAnswered)
    }

    @Test
    fun `test getQuestionAnswer returns correct answer`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        val userAnswer = "2"
        advancedTestViewModel.recordAnswer(userAnswer)
        
        // When
        val recordedAnswer = advancedTestViewModel.getQuestionAnswer(0)
        
        // Then
        assertEquals("Recorded answer should match user answer", userAnswer, recordedAnswer)
    }

    @Test
    fun `test getQuestionAnswer returns null for unanswered question`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When
        val recordedAnswer = advancedTestViewModel.getQuestionAnswer(1)
        
        // Then
        assertNull("Unanswered question should return null", recordedAnswer)
    }

    @Test
    fun `test test state consistency across operations`() = runTest {
        // Given
        advancedTestViewModel.initializeTest(sampleQuestions, 30, "shuffle")
        
        // When - Perform multiple operations
        advancedTestViewModel.recordAnswer("1")
        advancedTestViewModel.nextQuestion()
        advancedTestViewModel.recordAnswer("2")
        advancedTestViewModel.previousQuestion()
        advancedTestViewModel.recordAnswer("1") // Update answer
        
        // Then
        val currentQuestionIndex = advancedTestViewModel.currentQuestionIndex.value
        assertEquals("Question index should be 0", 0, currentQuestionIndex)
        
        val userAnswers = advancedTestViewModel.userAnswers.value
        assertEquals("Should have 2 answers", 2, userAnswers.size)
        assertEquals("First question answer should be updated", "1", userAnswers["q1"])
        assertEquals("Second question answer should be recorded", "2", userAnswers["q2"])
        
        val progress = advancedTestViewModel.progress.value
        assertTrue("Progress should be calculated", progress!! > 0f)
    }
}
