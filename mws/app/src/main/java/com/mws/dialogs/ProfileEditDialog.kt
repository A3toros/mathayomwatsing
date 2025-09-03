package com.mws.dialogs

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.mws.R
import com.mws.models.Student

/**
 * ProfileEditDialog - Dialog for editing student profile information
 * Allows editing of name, grade, and class
 */
class ProfileEditDialog : DialogFragment() {

    private var onProfileUpdated: ((Student) -> Unit)? = null
    private var currentStudent: Student? = null

    private lateinit var firstNameEditText: EditText
    private lateinit var lastNameEditText: EditText
    private lateinit var gradeEditText: EditText
    private lateinit var classNameEditText: EditText
    private lateinit var saveButton: Button
    private lateinit var cancelButton: Button

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val builder = AlertDialog.Builder(requireContext())
        val inflater = requireActivity().layoutInflater
        val view = inflater.inflate(R.layout.dialog_edit_profile, null)

        initializeViews(view)
        setupCurrentData()
        setupClickListeners()

        builder.setView(view)
            .setTitle("Edit Profile")
            .setCancelable(false)

        return builder.create()
    }

    private fun initializeViews(view: View) {
        firstNameEditText = view.findViewById(R.id.firstNameEditText)
        lastNameEditText = view.findViewById(R.id.lastNameEditText)
        gradeEditText = view.findViewById(R.id.gradeEditText)
        classNameEditText = view.findViewById(R.id.classNameEditText)
        saveButton = view.findViewById(R.id.saveButton)
        cancelButton = view.findViewById(R.id.cancelButton)
    }

    private fun setupCurrentData() {
        currentStudent?.let { student ->
            firstNameEditText.setText(student.firstName)
            lastNameEditText.setText(student.lastName)
            gradeEditText.setText(student.grade)
            classNameEditText.setText(student.className)
        }
    }

    private fun setupClickListeners() {
        saveButton.setOnClickListener {
            if (validateInputs()) {
                saveProfile()
            }
        }

        cancelButton.setOnClickListener {
            dismiss()
        }
    }

    private fun validateInputs(): Boolean {
        val firstName = firstNameEditText.text.toString().trim()
        val lastName = lastNameEditText.text.toString().trim()
        val grade = gradeEditText.text.toString().trim()
        val className = classNameEditText.text.toString().trim()

        if (firstName.isEmpty()) {
            firstNameEditText.error = "First name is required"
            return false
        }

        if (lastName.isEmpty()) {
            lastNameEditText.error = "Last name is required"
            return false
        }

        if (grade.isEmpty()) {
            gradeEditText.error = "Grade is required"
            return false
        }

        if (className.isEmpty()) {
            classNameEditText.error = "Class is required"
            return false
        }

        return true
    }

    private fun saveProfile() {
        val firstName = firstNameEditText.text.toString().trim()
        val lastName = lastNameEditText.text.toString().trim()
        val grade = gradeEditText.text.toString().trim()
        val className = classNameEditText.text.toString().trim()

        currentStudent?.let { student ->
            val updatedStudent = student.copy(
                firstName = firstName,
                lastName = lastName,
                grade = grade,
                className = className
            )

            onProfileUpdated?.invoke(updatedStudent)
            dismiss()
        }
    }

    /**
     * Sets the current student data
     */
    fun setStudent(student: Student) {
        currentStudent = student
    }

    /**
     * Sets the callback for when profile is updated
     */
    fun setOnProfileUpdated(callback: (Student) -> Unit) {
        onProfileUpdated = callback
    }

    companion object {
        fun newInstance(student: Student, onProfileUpdated: (Student) -> Unit): ProfileEditDialog {
            return ProfileEditDialog().apply {
                setStudent(student)
                setOnProfileUpdated(onProfileUpdated)
            }
        }
    }
}
