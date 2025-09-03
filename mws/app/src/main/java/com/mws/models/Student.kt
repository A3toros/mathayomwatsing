package com.mws.models

/**
 * Student model class
 */
data class Student(
    val id: String,
    val name: String,
    val surname: String,
    val grade: String,
    val className: String,
    val profilePictureUrl: String? = null,
    val email: String? = null,
    val phone: String? = null,
    // Additional properties for compatibility
    val firstName: String = name,
    val lastName: String = surname,
    val number: String = id,
    val nickname: String? = null
)
