package com.mws.models

/**
 * ActiveTest - Represents an active test available to the student
 */
data class ActiveTest(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val teacherName: String,
    val dueDate: String,
    val status: String
)
