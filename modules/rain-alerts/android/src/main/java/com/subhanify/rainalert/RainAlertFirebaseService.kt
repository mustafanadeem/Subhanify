package com.subhanify.rainalert

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.util.Log

class RainAlertFirebaseService : FirebaseMessagingService() {
  
  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)
    
    val data = message.data
    if (data["type"] != "RAIN_START") {
      return
    }
    
    Log.d("RainAlertFCM", "Received rain alert push: $data")
    
    val preferences = getSharedPreferences("rain_alert_prefs", MODE_PRIVATE)
    val onePerHourEnabled = preferences.getBoolean("one_per_hour_enabled", true)
    
    if (onePerHourEnabled) {
      val lastAlert = preferences.getLong("last_alert_timestamp", 0)
      val elapsed = (System.currentTimeMillis() - lastAlert) / 1000
      
      if (elapsed < 3600) {
        Log.d("RainAlertFCM", "Alert suppressed due to cooldown (${3600 - elapsed}s remaining)")
        return
      }
    }
    
    preferences.edit()
      .putLong("last_alert_timestamp", System.currentTimeMillis())
      .apply()
    
    Log.d("RainAlertFCM", "Processing rain alert notification")
  }
  
  override fun onNewToken(token: String) {
    super.onNewToken(token)
    
    Log.d("RainAlertFCM", "New FCM token: $token")
    
    val preferences = getSharedPreferences("rain_alert_prefs", MODE_PRIVATE)
    preferences.edit()
      .putString("fcm_token", token)
      .apply()
  }
}

