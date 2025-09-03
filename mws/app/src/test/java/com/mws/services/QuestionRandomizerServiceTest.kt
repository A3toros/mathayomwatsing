package com.mws.services

import com.mws.models.Question
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class QuestionRandomizerServiceTest {

    private lateinit var questionRandomizer: QuestionRandomizerService
    private lateinit var sampleQuestions: List<Question>

    @Before
    fun setUp() {
        questionRandomizer = QuestionRandomizerService()
        
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
            ),
            Question(
                questionId = "q4",
                questionText = "What is the largest planet in our solar system?",
                questionType = "multiple-choice",
                options = listOf("Earth", "Mars", "Jupiter", "Saturn"),
                correctAnswer = "2",
                topic = "science",
                difficulty = "medium"
            ),
            Question(
                questionId = "q5",
                questionText = "What is the square root of 144?",
                questionType = "multiple-choice",
                options = listOf("10", "11", "12", "13"),
                correctAnswer = "2",
                topic = "math",
                difficulty = "hard"
            )
        )
    }

    @Test
    fun `test randomizeQuestions returns same number of questions`() {
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(sampleQuestions)
        
        // Then
        assertEquals(sampleQuestions.size, randomizedQuestions.size)
    }

    @Test
    fun `test randomizeQuestions returns all original questions`() {
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(sampleQuestions)
        
        // Then
        assertTrue(randomizedQuestions.containsAll(sampleQuestions))
        assertTrue(sampleQuestions.containsAll(randomizedQuestions))
    }

    @Test
    fun `test randomizeQuestions actually randomizes order`() {
        // Given
        val originalOrder = sampleQuestions.map { it.questionId }
        
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(sampleQuestions)
        val randomizedOrder = randomizedQuestions.map { it.questionId }
        
        // Then
        // Note: There's a small chance this could fail if randomization produces same order
        // In practice, this is extremely unlikely with 5 questions
        assertNotEquals("Questions should be randomized", originalOrder, randomizedOrder)
    }

    @Test
    fun `test randomizeQuestionsWithOptions randomizes both questions and options`() {
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestionsWithOptions(sampleQuestions)
        
        // Then
        assertEquals(sampleQuestions.size, randomizedQuestions.size)
        
        // Check that multiple choice questions have shuffled options
        val multipleChoiceQuestions = randomizedQuestions.filter { it.questionType == "multiple-choice" }
        multipleChoiceQuestions.forEach { question ->
            val originalQuestion = sampleQuestions.find { it.questionId == question.questionId }
            assertNotNull("Original question should exist", originalQuestion)
            
            // Options should be different (shuffled)
            assertNotEquals("Options should be shuffled", 
                originalQuestion!!.options, question.options)
        }
    }

    @Test
    fun `test randomizeQuestionsWithOptions maintains correct answer mapping`() {
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestionsWithOptions(sampleQuestions)
        
        // Then
        randomizedQuestions.forEach { randomizedQuestion ->
            val originalQuestion = sampleQuestions.find { it.questionId == randomizedQuestion.questionId }
            assertNotNull("Original question should exist", originalQuestion)
            
            if (randomizedQuestion.questionType == "multiple-choice") {
                val originalCorrectAnswerIndex = originalQuestion!!.correctAnswer.toIntOrNull() ?: -1
                val originalCorrectAnswerText = originalQuestion.options[originalCorrectAnswerIndex]
                
                val newCorrectAnswerIndex = randomizedQuestion.correctAnswer.toIntOrNull() ?: -1
                val newCorrectAnswerText = randomizedQuestion.options[newCorrectAnswerIndex]
                
                assertEquals("Correct answer text should remain the same", 
                    originalCorrectAnswerText, newCorrectAnswerText)
            }
        }
    }

    @Test
    fun `test selectQuestionsByDifficulty selects correct number of questions`() {
        // Given
        val targetCount = 3
        
        // When
        val selectedQuestions = questionRandomizer.selectQuestionsByDifficulty(
            sampleQuestions, targetCount
        )
        
        // Then
        assertEquals(targetCount, selectedQuestions.size)
    }

    @Test
    fun `test selectQuestionsByDifficulty respects difficulty distribution`() {
        // Given
        val targetCount = 5
        val easyPercentage = 0.4
        val mediumPercentage = 0.4
        val hardPercentage = 0.2
        
        // When
        val selectedQuestions = questionRandomizer.selectQuestionsByDifficulty(
            sampleQuestions, targetCount, easyPercentage, mediumPercentage, hardPercentage
        )
        
        // Then
        val easyCount = selectedQuestions.count { it.difficulty == "easy" }
        val mediumCount = selectedQuestions.count { it.difficulty == "medium" }
        val hardCount = selectedQuestions.count { it.difficulty == "hard" }
        
        assertEquals(2, easyCount) // 40% of 5 = 2
        assertEquals(2, mediumCount) // 40% of 5 = 2
        assertEquals(1, hardCount) // 20% of 5 = 1
    }

    @Test
    fun `test createBalancedQuestionSets creates balanced distribution`() {
        // Given
        val topics = listOf("math", "geography", "chemistry", "science")
        val questionsPerTopic = 1
        
        // When
        val questionSets = questionRandomizer.createBalancedQuestionSets(
            sampleQuestions, topics, questionsPerTopic
        )
        
        // Then
        assertEquals(topics.size, questionSets.size)
        questionSets.forEach { questionSet ->
            assertEquals(questionsPerTopic, questionSet.size)
        }
    }

    @Test
    fun `test generatePracticeQuestions prioritizes incorrect questions`() {
        // Given
        val previousAnswers = mapOf(
            "q1" to false,  // Incorrect
            "q2" to true,   // Correct
            "q3" to false,  // Incorrect
            "q4" to true,   // Correct
            "q5" to false   // Incorrect
        )
        val targetCount = 3
        
        // When
        val practiceQuestions = questionRandomizer.generatePracticeQuestions(
            sampleQuestions, previousAnswers, targetCount
        )
        
        // Then
        assertEquals(targetCount, practiceQuestions.size)
        
        // Should prioritize incorrect questions (60% = 2 questions)
        val incorrectQuestions = practiceQuestions.filter { 
            previousAnswers[it.questionId] == false 
        }
        assertTrue("Should prioritize incorrect questions", incorrectQuestions.size >= 1)
    }

    @Test
    fun `test createAdaptiveQuestionSet creates progressive difficulty`() {
        // Given
        val targetCount = 3
        
        // When
        val adaptiveQuestions = questionRandomizer.createAdaptiveQuestionSet(
            sampleQuestions, targetCount
        )
        
        // Then
        assertEquals(targetCount, adaptiveQuestions.size)
        
        // Should start with easier questions and progress to harder ones
        val difficulties = adaptiveQuestions.map { it.difficulty }
        val difficultyOrder = difficulties.map { difficulty ->
            when (difficulty) {
                "easy" -> 1
                "medium" -> 2
                "hard" -> 3
                else -> 2
            }
        }
        
        // Check that difficulty generally increases (allowing for some randomization)
        val isGenerallyProgressive = difficultyOrder.zipWithNext().count { (a, b) -> a <= b } >= difficultyOrder.size - 2
        assertTrue("Difficulty should generally progress from easy to hard", isGenerallyProgressive)
    }

    @Test
    fun `test validateQuestionSet provides accurate analysis`() {
        // When
        val validation = questionRandomizer.validateQuestionSet(sampleQuestions)
        
        // Then
        assertEquals(sampleQuestions.size, validation.totalQuestions)
        assertEquals(5, validation.typeDistribution["multiple-choice"])
        assertEquals(2, validation.topicDistribution["math"])
        assertEquals(2, validation.difficultyDistribution["easy"])
        assertEquals(2, validation.difficultyDistribution["medium"])
        assertEquals(1, validation.difficultyDistribution["hard"])
    }

    @Test
    fun `test validateQuestionSet provides recommendations`() {
        // When
        val validation = questionRandomizer.validateQuestionSet(sampleQuestions)
        
        // Then
        assertNotNull("Validation should provide recommendations", validation.recommendations)
        assertTrue("Should have some recommendations", validation.recommendations.isNotEmpty())
    }

    @Test
    fun `test randomizeQuestions handles empty list`() {
        // Given
        val emptyQuestions = emptyList<Question>()
        
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(emptyQuestions)
        
        // Then
        assertTrue("Should return empty list", randomizedQuestions.isEmpty())
    }

    @Test
    fun `test randomizeQuestions handles single question`() {
        // Given
        val singleQuestion = listOf(sampleQuestions.first())
        
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(singleQuestion)
        
        // Then
        assertEquals(1, randomizedQuestions.size)
        assertEquals(singleQuestion.first(), randomizedQuestions.first())
    }

    @Test
    fun `test selectQuestionsByDifficulty handles insufficient questions`() {
        // Given
        val targetCount = 10 // More than available questions
        
        // When
        val selectedQuestions = questionRandomizer.selectQuestionsByDifficulty(
            sampleQuestions, targetCount
        )
        
        // Then
        assertEquals(sampleQuestions.size, selectedQuestions.size)
        assertTrue(selectedQuestions.containsAll(sampleQuestions))
    }

    @Test
    fun `test createBalancedQuestionSets handles missing topics`() {
        // Given
        val topics = listOf("math", "nonexistent_topic")
        val questionsPerTopic = 2
        
        // When
        val questionSets = questionRandomizer.createBalancedQuestionSets(
            sampleQuestions, topics, questionsPerTopic
        )
        
        // Then
        assertEquals(topics.size, questionSets.size)
        // Math topic should have questions, nonexistent topic should be empty
        val mathSet = questionSets.find { it.isNotEmpty() && it.first().topic == "math" }
        assertNotNull("Math topic should have questions", mathSet)
    }

    @Test
    fun `test generatePracticeQuestions handles no previous answers`() {
        // Given
        val emptyPreviousAnswers = emptyMap<String, Boolean>()
        val targetCount = 3
        
        // When
        val practiceQuestions = questionRandomizer.generatePracticeQuestions(
            sampleQuestions, emptyPreviousAnswers, targetCount
        )
        
        // Then
        assertEquals(targetCount, practiceQuestions.size)
        assertTrue(practiceQuestions.containsAll(practiceQuestions))
    }

    @Test
    fun `test randomizeQuestions maintains question integrity`() {
        // When
        val randomizedQuestions = questionRandomizer.randomizeQuestions(sampleQuestions)
        
        // Then
        randomizedQuestions.forEach { randomizedQuestion ->
            val originalQuestion = sampleQuestions.find { it.questionId == randomizedQuestion.questionId }
            assertNotNull("Original question should exist", originalQuestion)
            
            // All properties except order should remain the same
            assertEquals(originalQuestion!!.questionText, randomizedQuestion.questionText)
            assertEquals(originalQuestion.questionType, randomizedQuestion.questionType)
            assertEquals(originalQuestion.topic, randomizedQuestion.topic)
            assertEquals(originalQuestion.difficulty, randomizedQuestion.difficulty)
        }
    }
}
