package com.nexify.connect

import android.app.Application
import android.content.Intent
import com.google.firebase.FirebaseApp
import com.nexify.connect.services.NexifyLog

class NexifyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)

        // Register Global Uncaught Crash Interceptor
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            NexifyLog.e("UncaughtCrash", "App crashed in thread: ${thread.name}", throwable)

            try {
                val intent = Intent(this, MainActivity::class.java).apply {
                    putExtra("crash_error", throwable.localizedMessage ?: throwable.toString())
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                NexifyLog.e("UncaughtCrash", "Failed to start MainActivity for error boundary.", e)
            }

            android.os.Process.killProcess(android.os.Process.myPid())
            System.exit(10)
        }
    }
}

