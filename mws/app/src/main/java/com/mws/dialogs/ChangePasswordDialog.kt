package com.mws.dialogs

import android.app.Dialog
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.mws.R

/**
 * ChangePasswordDialog - Dialog for changing student password
 * Allows changing password with current password verification
 */
class ChangePasswordDialog : DialogFragment() {

    private var onPasswordChanged: ((String, String) -> Unit)? = null

    private lateinit var currentPasswordEditText: EditText
    private lateinit var newPasswordEditText: EditText
    private lateinit var confirmPasswordEditText: EditText
    private lateinit var changeButton: Button
    private lateinit var cancelButton: Button

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val builder = AlertDialog.Builder(requireContext())
        val inflater = requireActivity().layoutInflater
        val view = inflater.inflate(R.layout.dialog_change_password, null)

        initializeViews(view)
        setupClickListeners()

        builder.setView(view)
            .setTitle("Change Password")
            .setCancelable(false)

        return builder.create()
    }

    private fun initializeViews(view: View) {
        currentPasswordEditText = view.findViewById(R.id.currentPasswordEditText)
        newPasswordEditText = view.findViewById(R.id.newPasswordEditText)
        confirmPasswordEditText = view.findViewById(R.id.confirmPasswordEditText)
        changeButton = view.findViewById(R.id.changeButton)
        cancelButton = view.findViewById(R.id.cancelButton)
    }

    private fun setupClickListeners() {
        changeButton.setOnClickListener {
            if (validateInputs()) {
                changePassword()
            }
        }

        cancelButton.setOnClickListener {
            dismiss()
        }
    }

    private fun validateInputs(): Boolean {
        val currentPassword = currentPasswordEditText.text.toString()
        val newPassword = newPasswordEditText.text.toString()
        val confirmPassword = confirmPasswordEditText.text.toString()

        if (currentPassword.isEmpty()) {
            currentPasswordEditText.error = "Current password is required"
            return false
        }

        if (newPassword.isEmpty()) {
            newPasswordEditText.error = "New password is required"
            return false
        }

        if (newPassword.length < 6) {
            newPasswordEditText.error = "Password must be at least 6 characters"
            return false
        }

        if (newPassword != confirmPassword) {
            confirmPasswordEditText.error = "Passwords do not match"
            return false
        }

        if (newPassword == currentPassword) {
            newPasswordEditText.error = "New password must be different from current password"
            return false
        }

        return true
    }

    private fun changePassword() {
        val currentPassword = currentPasswordEditText.text.toString()
        val newPassword = newPasswordEditText.text.toString()

        onPasswordChanged?.invoke(currentPassword, newPassword)
        dismiss()
    }

    /**
     * Sets the callback for when password is changed
     */
    fun setOnPasswordChanged(callback: (String, String) -> Unit) {
        onPasswordChanged = callback
    }

    companion object {
        fun newInstance(onPasswordChanged: (String, String) -> Unit): ChangePasswordDialog {
            return ChangePasswordDialog().apply {
                setOnPasswordChanged(onPasswordChanged)
            }
        }
    }
}
