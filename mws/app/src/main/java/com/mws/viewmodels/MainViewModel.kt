package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.ActiveTest
import com.mws.models.ScoreRecord
import com.mws.models.Student
import com.mws.services.SessionManager
import com.mws.repository.TestRepository
import kotlinx.coroutines.launch

/**
 * MainViewModel - Manages dashboard data and state
 * Handles active tests, scores, and student information
 * Now integrates with TestRepository for real API data
 */
class MainViewModel(
    private val sessionManager: SessionManager,
    private val testRepository: TestRepository
) : ViewModel() {

    // LiveData for UI observation
    private val _activeTests = MutableLiveData<List<ActiveTest>>()
    val activeTests: LiveData<List<ActiveTest>> = _activeTests

    private val _averageScore = MutableLiveData<Double>()
    val averageScore: LiveData<Double> = _averageScore

    private val _isScoreLoading = MutableLiveData<Boolean>()
    val isScoreLoading: LiveData<Boolean> = _isScoreLoading

    private val _recentScores = MutableLiveData<List<ScoreRecord>>()
    val recentScores: LiveData<List<ScoreRecord>> = _recentScores

    private val _studentInfo = MutableLiveData<Student>()
    val studentInfo: LiveData<Student> = _studentInfo

    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage

    init {
        // Initialize with default values
        _isScoreLoading.value = false
        _averageScore.value = 0.0
        _activeTests.value = emptyList()
        _recentScores.value = emptyList()
    }

    /**
     * Loads active tests for the current student
     */
    fun loadActiveTests() {
        viewModelScope.launch {
            try {
                val result = testRepository.getAllTests()
                
                result.fold(
                    onSuccess = { tests ->
                        _activeTests.value = tests
                    },
                    onFailure = { exception ->
                        _errorMessage.value = "Failed to load active tests: ${exception.message}"
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Failed to load active tests: ${e.message}"
            }
        }
    }

    /**
     * Loads average score for the current student
     */
    fun loadAverageScore() {
        viewModelScope.launch {
            try {
                _isScoreLoading.value = true
                
                val studentId = testRepository.getCurrentStudentId()
                if (studentId != null) {
                    val result = testRepository.getStudentTestResults(studentId)
                    
                    result.fold(
                        onSuccess = { results ->
                            if (results.isNotEmpty()) {
                                val average = results.map { it.score }.average()
                                _averageScore.value = average
                            } else {
                                _averageScore.value = 0.0
                            }
                        },
                        onFailure = { exception ->
                            _errorMessage.value = "Failed to load average score: ${exception.message}"
                            _averageScore.value = 0.0
                        }
                    )
                } else {
                    _averageScore.value = 0.0
                }
                
                _isScoreLoading.value = false
            } catch (e: Exception) {
                _errorMessage.value = "Failed to load average score: ${e.message}"
                _isScoreLoading.value = false
            }
        }
    }

    /**
     * Loads recent scores for the current student
     */
    fun loadRecentScores() {
        viewModelScope.launch {
            try {
                val studentId = testRepository.getCurrentStudentId()
                if (studentId != null) {
                    val result = testRepository.getStudentTestResults(studentId)
                    
                    result.fold(
                        onSuccess = { results ->
                            // Convert API TestResult to ScoreRecord
                            val scoreRecords = results.map { result ->
                                ScoreRecord(
                                    testId = result.testId,
                                    testName = result.testName,
                                    subject = result.subject,
                                    score = result.score,
                                    maxScore = result.maxScore,
                                    date = result.submittedAt,
                                    teacherName = result.teacherName
                                )
                            }
                            _recentScores.value = scoreRecords
                        },
                        onFailure = { exception ->
                            _errorMessage.value = "Failed to load recent scores: ${exception.message}"
                            _recentScores.value = emptyList()
                        }
                    )
                } else {
                    _recentScores.value = emptyList()
                }
            } catch (e: Exception) {
                _errorMessage.value = "Failed to load recent scores: ${e.message}"
                _recentScores.value = emptyList()
            }
        }
    }

    /**
     * Loads student information
     */
    fun loadStudentInfo() {
        viewModelScope.launch {
            try {
                val studentId = testRepository.getCurrentStudentId()
                if (studentId != null) {
                    val result = testRepository.getStudentProfile(studentId)
                    
                    result.fold(
                        onSuccess = { student ->
                            _studentInfo.value = student
                        },
                        onFailure = { exception ->
                            _errorMessage.value = "Failed to load student info: ${exception.message}"
                            // Fallback to session data
                            sessionManager.getStudentInfo()?.let { sessionStudent ->
                                _studentInfo.value = sessionStudent
                            }
                        }
                    )
                } else {
                    // Fallback to session data
                    sessionManager.getStudentInfo()?.let { sessionStudent ->
                        _studentInfo.value = sessionStudent
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = "Failed to load student info: ${e.message}"
                // Fallback to session data
                sessionManager.getStudentInfo()?.let { sessionStudent ->
                    _studentInfo.value = sessionStudent
                }
            }
        }
    }

    /**
     * Refreshes all dashboard data
     */
    fun refreshDashboard() {
        loadActiveTests()
        loadAverageScore()
        loadRecentScores()
        loadStudentInfo()
    }

    /**
     * Gets sample active tests for development
     */
    private fun getSampleActiveTests(): List<ActiveTest> {
        return listOf(
            ActiveTest(
                id = "1",
                name = "Mathematics Quiz - Chapter 5",
                type = "multiple-choice",
                subject = "Mathematics",
                teacherName = "Mr. Smith",
                dueDate = "2024-12-15",
                status = "active",
                testId = "1",
                testName = "Mathematics Quiz - Chapter 5",
                testType = "multiple-choice",
                numQuestions = 10,
                grade = "10",
                className = "A",
                assignedAt = "2024-12-10"
            ),
            ActiveTest(
                id = "2",
                name = "Science Test - Biology",
                type = "true-false",
                subject = "Science",
                teacherName = "Ms. Johnson",
                dueDate = "2024-12-20",
                status = "active",
                testId = "2",
                testName = "Science Test - Biology",
                testType = "true-false",
                numQuestions = 15,
                grade = "10",
                className = "A",
                assignedAt = "2024-12-15"
            ),
            ActiveTest(
                id = "3",
                name = "English Essay - Shakespeare",
                type = "input",
                subject = "English",
                teacherName = "Mrs. Davis",
                dueDate = "2024-12-25",
                status = "active",
                testId = "3",
                testName = "English Essay - Shakespeare",
                testType = "input",
                numQuestions = 5,
                grade = "10",
                className = "A",
                assignedAt = "2024-12-20"
            )
        )
    }

    /**
     * Gets sample average score for development
     */
    private fun getSampleAverageScore(): Double {
        return 85.2
    }

    /**
     * Gets sample recent scores for development
     */
    private fun getSampleRecentScores(): List<ScoreRecord> {
        return listOf(
            ScoreRecord(
                testId = "1",
                testName = "Mathematics Quiz - Chapter 4",
                subject = "Mathematics",
                score = 92.0,
                maxScore = 100.0,
                date = "2024-12-10",
                teacherName = "Mr. Smith"
            ),
            ScoreRecord(
                testId = "2",
                testName = "Science Test - Chemistry",
                subject = "Science",
                score = 88.0,
                maxScore = 100.0,
                date = "2024-12-08",
                teacherName = "Ms. Johnson"
            ),
            ScoreRecord(
                testId = "3",
                testName = "English Grammar Test",
                subject = "English",
                score = 95.0,
                maxScore = 100.0,
                date = "2024-12-05",
                teacherName = "Mrs. Davis"
            ),
            ScoreRecord(
                testId = "4",
                testName = "History Quiz - World War II",
                subject = "History",
                score = 78.0,
                maxScore = 100.0,
                date = "2024-12-03",
                teacherName = "Mr. Wilson"
            )
        )
    }

    /**
     * Gets sample student info for development
     */
    private fun getSampleStudentInfo(): Student {
        return Student(
            id = "student_001",
            name = "John",
            surname = "Doe",
            grade = "10",
            className = "A",
            profilePictureUrl = null
        )
    }

    /**
     * Clears error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
}
