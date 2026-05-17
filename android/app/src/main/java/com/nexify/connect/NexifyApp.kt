package com.nexify.connect

import android.app.Application
import com.google.firebase.FirebaseApp

class NexifyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}
