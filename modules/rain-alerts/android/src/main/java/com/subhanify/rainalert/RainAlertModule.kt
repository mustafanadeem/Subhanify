package com.subhanify.rainalert

import android.content.Context
import android.content.SharedPreferences
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.*
import com.google.firebase.messaging.RemoteMessage
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class RainAlertModule : Module() {
  private lateinit var preferences: SharedPreferences
  
  override fun definition() = ModuleDefinition {
    Name("RainAlert")
    
    onCreate {
      preferences = appContext.reactContext?.getSharedPreferences(
        "rain_alert_prefs",
        Context.MODE_PRIVATE
      ) ?: throw IllegalStateException("Context not available")
    }
    
    Function("initialize") { leadMinutes: Int, intensityThreshold: String ->
      schedulePeriodicWork()
      true
    }
    
    Function("handlePushPayload") { payload: Map<String, Any> ->
      processPushPayload(payload)
    }
    
    Function("canShowAlert") {
      checkCooldown()
    }
    
    Function("recordAlert") {
      recordAlertTimestamp()
    }
    
    Function("getRemainingCooldown") {
      getRemainingCooldownSeconds()
    }
    
    Function("requestPermissions") {
      true
    }
    
    Function("schedulePeriodicWork") {
      schedulePeriodicWork()
    }
    
    Function("cancelPeriodicWork") {
      cancelPeriodicWork()
    }
  }
  
  private fun schedulePeriodicWork() {
    val context = appContext.reactContext ?: return
    
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()
    
    val workRequest = PeriodicWorkRequestBuilder<RainAlertWorker>(
      15, TimeUnit.MINUTES,
      5, TimeUnit.MINUTES
    )
      .setConstraints(constraints)
      .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS
      )
      .build()
    
    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      "rain_alert_check",
      ExistingPeriodicWorkPolicy.KEEP,
      workRequest
    )
  }
  
  private fun cancelPeriodicWork() {
    val context = appContext.reactContext ?: return
    WorkManager.getInstance(context).cancelUniqueWork("rain_alert_check")
  }
  
  private fun processPushPayload(payload: Map<String, Any>): Boolean {
    if (payload["type"] != "RAIN_START") {
      return false
    }
    
    if (!checkCooldown()) {
      android.util.Log.d("RainAlert", "Alert suppressed due to cooldown")
      return false
    }
    
    val leadMinutes = payload["leadMinutes"] as? Int ?: 0
    val intensity = payload["intensity"] as? String ?: "light"
    val phrase = payload["phrase"] as? String ?: "Rain has started nearby"
    val dua = payload["dua"] as? String ?: "اللَّهُمَّ صَيِّبًا نَافِعًا"
    
    showNotification(
      title = phrase,
      body = "$dua — O Allah, a beneficial downpour.",
      payload = payload
    )
    
    recordAlertTimestamp()
    return true
  }
  
  private fun checkCooldown(): Boolean {
    val lastAlert = preferences.getLong("last_alert_timestamp", 0)
    if (lastAlert == 0L) {
      return true
    }
    
    val elapsed = (System.currentTimeMillis() - lastAlert) / 1000
    return elapsed >= 3600
  }
  
  private fun getRemainingCooldownSeconds(): Int {
    val lastAlert = preferences.getLong("last_alert_timestamp", 0)
    if (lastAlert == 0L) {
      return 0
    }
    
    val elapsed = (System.currentTimeMillis() - lastAlert) / 1000
    val remaining = maxOf(0, 3600 - elapsed)
    return remaining.toInt()
  }
  
  private fun recordAlertTimestamp() {
    preferences.edit()
      .putLong("last_alert_timestamp", System.currentTimeMillis())
      .apply()
  }
  
  private fun showNotification(title: String, body: String, payload: Map<String, Any>) {
    val context = appContext.reactContext ?: return
    
    val notification = NotificationCompat.Builder(context, "RAIN_ALERT")
      .setContentTitle(title)
      .setContentText(body)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setAutoCancel(true)
      .addAction(
        android.R.drawable.ic_menu_view,
        "Read Dua",
        null
      )
      .addAction(
        android.R.drawable.ic_lock_silent_mode_off,
        "Play Audio",
        null
      )
      .build()
    
    try {
      NotificationManagerCompat.from(context).notify(
        System.currentTimeMillis().toInt(),
        notification
      )
      android.util.Log.d("RainAlert", "Notification shown")
    } catch (e: SecurityException) {
      android.util.Log.e("RainAlert", "Failed to show notification", e)
    }
  }
}

