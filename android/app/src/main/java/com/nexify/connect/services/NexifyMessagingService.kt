package com.nexify.connect.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.nexify.connect.MainActivity

class NexifyMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        NexifyLog.i("FCM", "New signaling token registered: $token")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        NexifyLog.i("FCM", "Message received from sender: ${remoteMessage.from}")

        val sharedPrefs = getSharedPreferences("nexify_connect_prefs", Context.MODE_PRIVATE)
        val notificationsEnabled = sharedPrefs.getBoolean("notifications_enabled", true)
        if (!notificationsEnabled) {
            NexifyLog.i("FCM", "Push notifications suppressed by user preference.")
            return
        }

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Nexify Connect Alert"
        val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "New social activity in workspace."
        val screen = remoteMessage.data["screen"] ?: ""

        sendLocalNotification(title, body, screen)
    }

    private fun sendLocalNotification(title: String, body: String, screen: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "nexify_connect_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Nexify Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Workspace activity signals, chats, and XP updates"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("target_screen", screen)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}
