package com.mws.models

import java.util.Date

/**
 * Test model class
 */
data class Test(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val grade: String,
    val className: String,
    val teacherId: String,
    val teacherName: String,
    val questionCount: Int,
    val timeLimit: Int? = null,
    val startDate: Date? = null,
    val endDate: Date? = null,
    val isActive: Boolean = true,
    val isAssigned: Boolean = false,
    val assignedDate: Date? = null
)
