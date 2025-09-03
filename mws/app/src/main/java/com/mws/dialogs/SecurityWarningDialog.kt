package com.mws.dialogs

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import com.mws.R

/**
 * SecurityWarningDialog - Shows anti-cheating warnings to students
 * Displays warnings for app minimization, backgrounding, and screen off events
 */
class SecurityWarningDialog : DialogFragment() {

    companion object {
        private const val ARG_WARNING_TYPE = "warning_type"
        private const val ARG_WARNING_COUNT = "warning_count"
        private const val ARG_MAX_WARNINGS = "max_warnings"

        /**
         * Create new instance of SecurityWarningDialog
         */
        fun newInstance(
            warningType: String,
            warningCount: Int,
            maxWarnings: Int = 3
        ): SecurityWarningDialog {
            return SecurityWarningDialog().apply {
                arguments = Bundle().apply {
                    putString(ARG_WARNING_TYPE, warningType)
                    putInt(ARG_WARNING_COUNT, warningCount)
                    putInt(ARG_MAX_WARNINGS, maxWarnings)
                }
            }
        }
    }

    private var onWarningAcknowledged: (() -> Unit)? = null
    private var onFinalWarning: (() -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        return Dialog(requireContext(), android.R.style.Theme_DeviceDefault_Dialog)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.dialog_security_warning, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val warningType = arguments?.getString(ARG_WARNING_TYPE) ?: "unknown"
        val warningCount = arguments?.getInt(ARG_WARNING_COUNT, 1) ?: 1
        val maxWarnings = arguments?.getInt(ARG_MAX_WARNINGS, 3) ?: 3

        setupWarningContent(view, warningType, warningCount, maxWarnings)
        setupButtons(view, warningCount, maxWarnings)
    }

    /**
     * Setup warning content based on warning type and count
     */
    private fun setupWarningContent(
        view: View,
        warningType: String,
        warningCount: Int,
        maxWarnings: Int
    ) {
        val titleText = view.findViewById<TextView>(R.id.tvWarningTitle)
        val messageText = view.findViewById<TextView>(R.id.tvWarningMessage)
        val countText = view.findViewById<TextView>(R.id.tvWarningCount)

        // Set title based on warning type
        titleText.text = when (warningType) {
            "app_minimized" -> "⚠️ App Minimized"
            "app_backgrounded" -> "⚠️ App Backgrounded"
            "screen_off" -> "⚠️ Screen Turned Off"
            else -> "⚠️ Security Warning"
        }

        // Set message based on warning type
        messageText.text = when (warningType) {
            "app_minimized" -> "You minimized the app during the test. This is considered suspicious behavior."
            "app_backgrounded" -> "The app was backgrounded for an extended period. This may indicate cheating."
            "screen_off" -> "The screen was turned off during the test. This is not allowed."
            else -> "Suspicious activity detected during the test."
        }

        // Set warning count
        countText.text = "Warning $warningCount of $maxWarnings"

        // Change colors based on warning count
        when {
            warningCount == 1 -> {
                titleText.setTextColor(resources.getColor(R.color.warning_yellow, null))
                countText.setTextColor(resources.getColor(R.color.warning_yellow, null))
            }
            warningCount == 2 -> {
                titleText.setTextColor(resources.getColor(R.color.warning_orange, null))
                countText.setTextColor(resources.getColor(R.color.warning_orange, null))
            }
            warningCount >= 3 -> {
                titleText.setTextColor(resources.getColor(R.color.warning_red, null))
                countText.setTextColor(resources.getColor(R.color.warning_red, null))
            }
        }
    }

    /**
     * Setup dialog buttons based on warning count
     */
    private fun setupButtons(view: View, warningCount: Int, maxWarnings: Int) {
        val acknowledgeButton = view.findViewById<Button>(R.id.btnAcknowledge)
        val continueButton = view.findViewById<Button>(R.id.btnContinue)

        if (warningCount >= maxWarnings) {
            // Final warning - show only acknowledge button
            acknowledgeButton.visibility = View.VISIBLE
            continueButton.visibility = View.GONE
            
            acknowledgeButton.text = "I Understand"
            acknowledgeButton.setOnClickListener {
                onFinalWarning?.invoke()
                dismiss()
            }
        } else {
            // Regular warning - show both buttons
            acknowledgeButton.visibility = View.VISIBLE
            continueButton.visibility = View.VISIBLE
            
            acknowledgeButton.text = "I Understand"
            continueButton.text = "Continue Test"
            
            acknowledgeButton.setOnClickListener {
                onWarningAcknowledged?.invoke()
                dismiss()
            }
            
            continueButton.setOnClickListener {
                onWarningAcknowledged?.invoke()
                dismiss()
            }
        }
    }

    /**
     * Set callback for when warning is acknowledged
     */
    fun setOnWarningAcknowledged(callback: () -> Unit) {
        onWarningAcknowledged = callback
    }

    /**
     * Set callback for final warning
     */
    fun setOnFinalWarning(callback: () -> Unit) {
        onFinalWarning = callback
    }

    override fun onDestroyView() {
        super.onDestroyView()
        onWarningAcknowledged = null
        onFinalWarning = null
    }
}
