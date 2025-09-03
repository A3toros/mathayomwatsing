package com.mws.services

import com.mws.models.Question
import kotlin.random.Random

/**
 * QuestionRandomizerService - Manages question randomization and distribution
 * Provides various randomization strategies and question selection algorithms
 */
class QuestionRandomizerService {

    /**
     * Randomizes questions using Fisher-Yates shuffle algorithm
     * @param questions List of questions to randomize
     * @return Randomized list of questions
     */
    fun randomizeQuestions(questions: List<Question>): List<Question> {
        val shuffledQuestions = questions.toMutableList()
        
        for (i in shuffledQuestions.size - 1 downTo 1) {
            val j = Random.nextInt(i + 1)
            shuffledQuestions[i] = shuffledQuestions[j].also { 
                shuffledQuestions[j] = shuffledQuestions[i] 
            }
        }
        
        return shuffledQuestions
    }

    /**
     * Randomizes questions with option shuffling for multiple choice questions
     * @param questions List of questions to randomize
     * @return Randomized list of questions with shuffled options
     */
    fun randomizeQuestionsWithOptions(questions: List<Question>): List<Question> {
        return questions.map { question ->
            when (question.questionType) {
                "multiple-choice" -> randomizeMultipleChoiceQuestion(question)
                else -> question
            }
        }.let { randomizeQuestions(it) }
    }

    /**
     * Randomizes multiple choice question options
     * @param question Question to randomize options for
     * @return Question with randomized options
     */
    private fun randomizeMultipleChoiceQuestion(question: Question): Question {
        val options = question.options ?: return question
        val correctAnswer = question.correctAnswer
        
        // Create pairs of options with their indices
        val optionPairs = options.mapIndexed { index, option ->
            index to option
        }
        
        // Shuffle the options
        val shuffledOptions = optionPairs.shuffled()
        
        // Find the new index of the correct answer
        val newCorrectAnswerIndex = shuffledOptions.indexOfFirst { it.first == (correctAnswer?.toIntOrNull() ?: -1) }
        
        // Create new question with shuffled options
        return question.copy(
            options = shuffledOptions.map { it.second },
            correctAnswer = newCorrectAnswerIndex.toString()
        )
    }

    /**
     * Selects a subset of questions based on difficulty distribution
     * @param questions List of all questions
     * @param targetCount Target number of questions to select
     * @param easyPercentage Percentage of easy questions (0.0 to 1.0)
     * @param mediumPercentage Percentage of medium questions (0.0 to 1.0)
     * @param hardPercentage Percentage of hard questions (0.0 to 1.0)
     * @return Selected subset of questions
     */
    fun selectQuestionsByDifficulty(
        questions: List<Question>,
        targetCount: Int,
        easyPercentage: Double = 0.3,
        mediumPercentage: Double = 0.5,
        hardPercentage: Double = 0.2
    ): List<Question> {
        // Group questions by difficulty (assuming difficulty is stored in question metadata)
        val easyQuestions = questions.filter { it.difficulty == "easy" }
        val mediumQuestions = questions.filter { it.difficulty == "medium" }
        val hardQuestions = questions.filter { it.difficulty == "hard" }
        
        // Calculate counts for each difficulty level
        val easyCount = (targetCount * easyPercentage).toInt()
        val mediumCount = (targetCount * mediumPercentage).toInt()
        val hardCount = targetCount - easyCount - mediumCount
        
        // Select questions from each difficulty level
        val selectedQuestions = mutableListOf<Question>()
        
        selectedQuestions.addAll(easyQuestions.shuffled().take(easyCount))
        selectedQuestions.addAll(mediumQuestions.shuffled().take(mediumCount))
        selectedQuestions.addAll(hardQuestions.shuffled().take(hardCount))
        
        // If we don't have enough questions in some categories, fill with others
        if (selectedQuestions.size < targetCount) {
            val remainingQuestions = questions.filter { it !in selectedQuestions }
            selectedQuestions.addAll(remainingQuestions.shuffled().take(targetCount - selectedQuestions.size))
        }
        
        return selectedQuestions.shuffled()
    }

    /**
     * Creates question sets with balanced topic distribution
     * @param questions List of all questions
     * @param topics List of topics to balance
     * @param questionsPerTopic Number of questions per topic
     * @return Balanced question sets
     */
    fun createBalancedQuestionSets(
        questions: List<Question>,
        topics: List<String>,
        questionsPerTopic: Int
    ): List<List<Question>> {
        val questionSets = mutableListOf<List<Question>>()
        
        for (topic in topics) {
            val topicQuestions = questions.filter { it.topic == topic }
            val selectedQuestions = topicQuestions.shuffled().take(questionsPerTopic)
            questionSets.add(selectedQuestions)
        }
        
        return questionSets
    }

    /**
     * Generates practice questions based on previous performance
     * @param allQuestions List of all available questions
     * @param previousAnswers Map of question ID to correctness
     * @param targetCount Target number of questions to generate
     * @return Practice question set
     */
    fun generatePracticeQuestions(
        allQuestions: List<Question>,
        previousAnswers: Map<String, Boolean>,
        targetCount: Int
    ): List<Question> {
        // Separate questions by performance
        val incorrectQuestions = allQuestions.filter { question ->
            previousAnswers[question.questionId] == false
        }
        
        val correctQuestions = allQuestions.filter { question ->
            previousAnswers[question.questionId] == true
        }
        
        val unattemptedQuestions = allQuestions.filter { question ->
            !previousAnswers.containsKey(question.questionId)
        }
        
        val selectedQuestions = mutableListOf<Question>()
        
        // Prioritize incorrect questions (60%)
        val incorrectCount = (targetCount * 0.6).toInt()
        selectedQuestions.addAll(incorrectQuestions.shuffled().take(incorrectCount))
        
        // Add some unattempted questions (30%)
        val unattemptedCount = (targetCount * 0.3).toInt()
        selectedQuestions.addAll(unattemptedQuestions.shuffled().take(unattemptedCount))
        
        // Fill remaining with correct questions (10%)
        val remainingCount = targetCount - selectedQuestions.size
        if (remainingCount > 0) {
            selectedQuestions.addAll(correctQuestions.shuffled().take(remainingCount))
        }
        
        return selectedQuestions.shuffled()
    }

    /**
     * Creates adaptive question sets based on difficulty progression
     * @param questions List of all questions
     * @param targetCount Target number of questions
     * @return Adaptive question set
     */
    fun createAdaptiveQuestionSet(
        questions: List<Question>,
        targetCount: Int
    ): List<Question> {
        // Sort questions by difficulty level
        val sortedQuestions = questions.sortedBy { 
            when (it.difficulty) {
                "easy" -> 1
                "medium" -> 2
                "hard" -> 3
                else -> 2
            }
        }
        
        // Create progressive difficulty distribution
        val easyCount = (targetCount * 0.4).toInt()
        val mediumCount = (targetCount * 0.4).toInt()
        val hardCount = targetCount - easyCount - mediumCount
        
        val selectedQuestions = mutableListOf<Question>()
        
        // Start with easy questions
        selectedQuestions.addAll(sortedQuestions.filter { it.difficulty == "easy" }.take(easyCount))
        
        // Progress to medium questions
        selectedQuestions.addAll(sortedQuestions.filter { it.difficulty == "medium" }.take(mediumCount))
        
        // End with hard questions
        selectedQuestions.addAll(sortedQuestions.filter { it.difficulty == "hard" }.take(hardCount))
        
        return selectedQuestions
    }

    /**
     * Validates question set for balanced distribution
     * @param questions List of questions to validate
     * @return Validation result with recommendations
     */
    fun validateQuestionSet(questions: List<Question>): QuestionSetValidation {
        val totalQuestions = questions.size
        val questionTypes = questions.groupBy { it.questionType }
        val topics = questions.groupBy { it.topic }
        val difficulties = questions.groupBy { it.difficulty }
        
        val validation = QuestionSetValidation(
            totalQuestions = totalQuestions,
            typeDistribution = questionTypes.mapValues { it.value.size },
            topicDistribution = topics.mapValues { it.value.size },
            difficultyDistribution = difficulties.mapValues { it.value.size },
            recommendations = mutableListOf()
        )
        
        // Check for balanced question types
        questionTypes.forEach { (type, typeQuestions) ->
            val percentage = (typeQuestions.size.toFloat() / totalQuestions) * 100
            if (percentage < 10) {
                validation.recommendations.add("Consider adding more $type questions (currently ${percentage.toInt()}%)")
            }
        }
        
        // Check for balanced difficulty
        difficulties.forEach { (difficulty, difficultyQuestions) ->
            val percentage = (difficultyQuestions.size.toFloat() / totalQuestions) * 100
            if (percentage < 15) {
                validation.recommendations.add("Consider adding more $difficulty questions (currently ${percentage.toInt()}%)")
            }
        }
        
        return validation
    }

    /**
     * Data class for question set validation results
     */
    data class QuestionSetValidation(
        val totalQuestions: Int,
        val typeDistribution: Map<String, Int>,
        val topicDistribution: Map<String, Int>,
        val difficultyDistribution: Map<String, Int>,
        val recommendations: MutableList<String>
    )
}
