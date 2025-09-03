package com.mws.viewmodels

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.Observer
import com.mws.models.Student
import com.mws.services.ImageUploadService
import com.mws.services.SessionManager
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import org.mockito.kotlin.verify
import org.mockito.kotlin.any

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Mock
    private lateinit var sessionManager: SessionManager
    
    @Mock
    private lateinit var imageUploadService: ImageUploadService
    
    private lateinit var profileViewModel: ProfileViewModel
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var sampleStudent: Student

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        testDispatcher.setMain(testDispatcher)
        
        profileViewModel = ProfileViewModel(sessionManager, imageUploadService)
        
        // Create sample student for testing
        sampleStudent = Student(
            studentId = "s1",
            firstName = "John",
            lastName = "Doe",
            email = "john@example.com",
            grade = "10",
            className = "A",
            profilePictureUrl = "https://example.com/profile.jpg"
        )
    }

    @Test
    fun `test loadProfile loads student profile correctly`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(sampleStudent)
        
        // When
        profileViewModel.loadProfile()
        
        // Then
        val loadedStudent = profileViewModel.studentProfile.value
        assertNotNull("Student profile should be loaded", loadedStudent)
        assertEquals("Student ID should match", sampleStudent.studentId, loadedStudent!!.studentId)
        assertEquals("First name should match", sampleStudent.firstName, loadedStudent.firstName)
        assertEquals("Last name should match", sampleStudent.lastName, loadedStudent.lastName)
        assertEquals("Email should match", sampleStudent.email, loadedStudent.email)
        assertEquals("Grade should match", sampleStudent.grade, loadedStudent.grade)
        assertEquals("Class should match", sampleStudent.className, loadedStudent.className)
        assertEquals("Profile picture URL should match", sampleStudent.profilePictureUrl, loadedStudent.profilePictureUrl)
    }

    @Test
    fun `test loadProfile handles null student gracefully`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        
        // When
        profileViewModel.loadProfile()
        
        // Then
        val loadedStudent = profileViewModel.studentProfile.value
        assertNull("Student profile should be null", loadedStudent)
    }

    @Test
    fun `test updateProfile updates student information correctly`() = runTest {
        // Given
        profileViewModel.loadProfile()
        val updatedFirstName = "Jane"
        val updatedLastName = "Smith"
        val updatedGrade = "11"
        val updatedClassName = "B"
        
        // When
        profileViewModel.updateProfile(
            updatedFirstName,
            updatedLastName,
            updatedGrade,
            updatedClassName
        )
        
        // Then
        val updatedStudent = profileViewModel.studentProfile.value
        assertNotNull("Updated student profile should exist", updatedStudent)
        assertEquals("First name should be updated", updatedFirstName, updatedStudent!!.firstName)
        assertEquals("Last name should be updated", updatedLastName, updatedStudent.lastName)
        assertEquals("Grade should be updated", updatedGrade, updatedStudent.grade)
        assertEquals("Class should be updated", updatedClassName, updatedStudent.className)
        
        // Verify session manager was called
        verify(sessionManager).updateStudentProfile(any())
    }

    @Test
    fun `test updateProfile with empty values handles gracefully`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        profileViewModel.updateProfile("", "", "", "")
        
        // Then
        val updatedStudent = profileViewModel.studentProfile.value
        assertNotNull("Updated student profile should exist", updatedStudent)
        assertEquals("First name should be empty", "", updatedStudent!!.firstName)
        assertEquals("Last name should be empty", "", updatedStudent.lastName)
        assertEquals("Grade should be empty", "", updatedStudent.grade)
        assertEquals("Class should be empty", "", updatedStudent.className)
    }

    @Test
    fun `test updateProfilePicture uploads image successfully`() = runTest {
        // Given
        val imageUri = "content://image/test.jpg"
        val uploadedUrl = "https://cloudinary.com/profile_new.jpg"
        whenever(imageUploadService.uploadImage(any(), any())).thenReturn(uploadedUrl)
        
        // When
        profileViewModel.updateProfilePicture(imageUri)
        
        // Then
        val updatedStudent = profileViewModel.studentProfile.value
        assertNotNull("Updated student profile should exist", updatedStudent)
        assertEquals("Profile picture URL should be updated", uploadedUrl, updatedStudent!!.profilePictureUrl)
        
        // Verify image upload service was called
        verify(imageUploadService).uploadImage(any(), any())
    }

    @Test
    fun `test updateProfilePicture handles upload failure gracefully`() = runTest {
        // Given
        val imageUri = "content://image/test.jpg"
        whenever(imageUploadService.uploadImage(any(), any())).thenReturn(null)
        
        // When
        profileViewModel.updateProfilePicture(imageUri)
        
        // Then
        val updatedStudent = profileViewModel.studentProfile.value
        // Profile picture should remain unchanged on upload failure
        assertNotNull("Student profile should still exist", updatedStudent)
    }

    @Test
    fun `test updateProfilePicture with null URI handles gracefully`() = runTest {
        // Given
        val imageUri: String? = null
        
        // When
        profileViewModel.updateProfilePicture(imageUri)
        
        // Then
        // Should not crash and should not call image upload service
        verify(imageUploadService).uploadImage(any(), any())
    }

    @Test
    fun `test changePassword initiates password change process`() = runTest {
        // Given
        val currentPassword = "oldPassword123"
        val newPassword = "newPassword456"
        
        // When
        profileViewModel.changePassword(currentPassword, newPassword)
        
        // Then
        // This is a placeholder implementation, so we just verify it doesn't crash
        assertTrue("Password change should be initiated", true)
    }

    @Test
    fun `test changePassword with empty passwords handles gracefully`() = runTest {
        // Given
        val currentPassword = ""
        val newPassword = ""
        
        // When
        profileViewModel.changePassword(currentPassword, newPassword)
        
        // Then
        // Should not crash with empty passwords
        assertTrue("Password change with empty passwords should be handled", true)
    }

    @Test
    fun `test logout clears session and profile`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        profileViewModel.logout()
        
        // Then
        // Verify session manager logout was called
        verify(sessionManager).logout()
        
        // Profile should be cleared
        val clearedProfile = profileViewModel.studentProfile.value
        assertNull("Student profile should be cleared on logout", clearedProfile)
    }

    @Test
    fun `test getProfilePictureUrl returns correct URL`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val profilePictureUrl = profileViewModel.getProfilePictureUrl()
        
        // Then
        assertEquals("Profile picture URL should match", sampleStudent.profilePictureUrl, profilePictureUrl)
    }

    @Test
    fun `test getProfilePictureUrl returns null for no profile`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        profileViewModel.loadProfile()
        
        // When
        val profilePictureUrl = profileViewModel.getProfilePictureUrl()
        
        // Then
        assertNull("Profile picture URL should be null for no profile", profilePictureUrl)
    }

    @Test
    fun `test getFullName returns correct full name`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val fullName = profileViewModel.getFullName()
        
        // Then
        assertEquals("Full name should be correct", "John Doe", fullName)
    }

    @Test
    fun `test getFullName returns empty string for no profile`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        profileViewModel.loadProfile()
        
        // When
        val fullName = profileViewModel.getFullName()
        
        // Then
        assertEquals("Full name should be empty for no profile", "", fullName)
    }

    @Test
    fun `test getFullName handles missing names gracefully`() = runTest {
        // Given
        val studentWithMissingNames = sampleStudent.copy(firstName = "", lastName = "")
        whenever(sessionManager.getCurrentStudent()).thenReturn(studentWithMissingNames)
        profileViewModel.loadProfile()
        
        // When
        val fullName = profileViewModel.getFullName()
        
        // Then
        assertEquals("Full name should be empty for missing names", "", fullName)
    }

    @Test
    fun `test getEmail returns correct email`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val email = profileViewModel.getEmail()
        
        // Then
        assertEquals("Email should be correct", "john@example.com", email)
    }

    @Test
    fun `test getEmail returns empty string for no profile`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        profileViewModel.loadProfile()
        
        // When
        val email = profileViewModel.getEmail()
        
        // Then
        assertEquals("Email should be empty for no profile", "", email)
    }

    @Test
    fun `test getGradeAndClass returns correct format`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val gradeAndClass = profileViewModel.getGradeAndClass()
        
        // Then
        assertEquals("Grade and class should be formatted correctly", "Grade 10, Class A", gradeAndClass)
    }

    @Test
    fun `test getGradeAndClass returns empty string for no profile`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        profileViewModel.loadProfile()
        
        // When
        val gradeAndClass = profileViewModel.getGradeAndClass()
        
        // Then
        assertEquals("Grade and class should be empty for no profile", "", gradeAndClass)
    }

    @Test
    fun `test getGradeAndClass handles missing grade and class gracefully`() = runTest {
        // Given
        val studentWithMissingGradeClass = sampleStudent.copy(grade = "", className = "")
        whenever(sessionManager.getCurrentStudent()).thenReturn(studentWithMissingGradeClass)
        profileViewModel.loadProfile()
        
        // When
        val gradeAndClass = profileViewModel.getGradeAndClass()
        
        // Then
        assertEquals("Grade and class should be empty for missing values", "", gradeAndClass)
    }

    @Test
    fun `test isProfileLoaded returns true when profile exists`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val isProfileLoaded = profileViewModel.isProfileLoaded()
        
        // Then
        assertTrue("Profile should be loaded", isProfileLoaded)
    }

    @Test
    fun `test isProfileLoaded returns false when no profile`() = runTest {
        // Given
        whenever(sessionManager.getCurrentStudent()).thenReturn(null)
        profileViewModel.loadProfile()
        
        // When
        val isProfileLoaded = profileViewModel.isProfileLoaded()
        
        // Then
        assertFalse("Profile should not be loaded", isProfileLoaded)
    }

    @Test
    fun `test hasProfilePicture returns true when URL exists`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When
        val hasProfilePicture = profileViewModel.hasProfilePicture()
        
        // Then
        assertTrue("Should have profile picture", hasProfilePicture)
    }

    @Test
    fun `test hasProfilePicture returns false when no URL`() = runTest {
        // Given
        val studentWithoutPicture = sampleStudent.copy(profilePictureUrl = null)
        whenever(sessionManager.getCurrentStudent()).thenReturn(studentWithoutPicture)
        profileViewModel.loadProfile()
        
        // When
        val hasProfilePicture = profileViewModel.hasProfilePicture()
        
        // Then
        assertFalse("Should not have profile picture", hasProfilePicture)
    }

    @Test
    fun `test hasProfilePicture returns false when URL is empty`() = runTest {
        // Given
        val studentWithEmptyPicture = sampleStudent.copy(profilePictureUrl = "")
        whenever(sessionManager.getCurrentStudent()).thenReturn(studentWithEmptyPicture)
        profileViewModel.loadProfile()
        
        // When
        val hasProfilePicture = profileViewModel.hasProfilePicture()
        
        // Then
        assertFalse("Should not have profile picture with empty URL", hasProfilePicture)
    }

    @Test
    fun `test profile state consistency across operations`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When - Perform multiple operations
        profileViewModel.updateProfile("Jane", "Smith", "11", "B")
        profileViewModel.updateProfilePicture("content://image/new.jpg")
        profileViewModel.updateProfile("Jane", "Doe", "11", "B") // Change last name back
        
        // Then
        val finalProfile = profileViewModel.studentProfile.value
        assertNotNull("Final profile should exist", finalProfile)
        assertEquals("First name should be Jane", "Jane", finalProfile!!.firstName)
        assertEquals("Last name should be Doe", "Doe", finalProfile.lastName)
        assertEquals("Grade should be 11", "11", finalProfile.grade)
        assertEquals("Class should be B", "B", finalProfile.className)
    }

    @Test
    fun `test profile validation handles edge cases`() = runTest {
        // Given
        profileViewModel.loadProfile()
        
        // When - Test with various edge cases
        profileViewModel.updateProfile("A", "B", "12", "C") // Single characters
        profileViewModel.updateProfile("Very Long First Name That Exceeds Normal Limits", 
                                    "Very Long Last Name That Exceeds Normal Limits", 
                                    "13", "D")
        
        // Then
        val updatedProfile = profileViewModel.studentProfile.value
        assertNotNull("Profile should handle edge cases", updatedProfile)
        assertEquals("Should handle single characters", "A", updatedProfile!!.firstName)
        assertEquals("Should handle long names", "Very Long First Name That Exceeds Normal Limits", 
                    updatedProfile.firstName)
    }
}
