package com.mws.services

import com.google.gson.annotations.SerializedName

/**
 * Student login data
 */
data class StudentLoginData(
    @SerializedName("studentId")
    val studentId: String,
    @SerializedName("password")
    val password: String
) {
    // Override toString for debugging
    override fun toString(): String {
        return "StudentLoginData(studentId='$studentId', password='$password')"
    }
}
