package com.nexify.connect.services

import android.util.Log

object NexifyLog {
    private const val TAG = "NexifyConnect"

    fun d(source: String, message: String) {
        Log.d(TAG, "[$source] $message")
    }

    fun i(source: String, message: String) {
        Log.i(TAG, "[$source] $message")
    }

    fun w(source: String, message: String, throwable: Throwable? = null) {
        Log.w(TAG, "[$source] $message", throwable)
    }

    fun e(source: String, message: String, throwable: Throwable? = null) {
        Log.e(TAG, "[$source] $message", throwable)
    }
}
