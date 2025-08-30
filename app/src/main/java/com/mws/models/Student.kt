package com.mws.models

data class Student(
    val studentId: String,
    val grade: String,
    val className: String,
    val number: Int,
    val name: String,
    val surname: String,
    val nickname: String,
    val profilePictureUrl: String? = null,
    val lastLogin: String? = null,
    val loginCount: Int = 0
)
