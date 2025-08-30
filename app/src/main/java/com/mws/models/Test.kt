package com.mws.models

data class Test(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val grade: String,
    val className: String,
    val numQuestions: Int,
    val timeLimit: Int? = null,
    val isActive: Boolean = true
)
