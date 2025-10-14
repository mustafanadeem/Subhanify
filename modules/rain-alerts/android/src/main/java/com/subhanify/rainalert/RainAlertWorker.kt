package com.subhanify.rainalert

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

class RainAlertWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {
  
  private val preferences = context.getSharedPreferences(
    "rain_alert_prefs",
    Context.MODE_PRIVATE
  )
  
  override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
    try {
      val fallbackEnabled = preferences.getBoolean("fallback_enabled", false)
      
      if (!fallbackEnabled) {
        android.util.Log.d("RainAlertWorker", "Fallback mode disabled, skipping")
        return@withContext Result.success()
      }
      
      val tileId = preferences.getString("last_tile_id", null)
      if (tileId == null) {
        android.util.Log.w("RainAlertWorker", "No tile ID available")
        return@withContext Result.retry()
      }
      
      checkWeatherForTile(tileId)
      
      Result.success()
    } catch (e: Exception) {
      android.util.Log.e("RainAlertWorker", "Worker failed", e)
      Result.retry()
    }
  }
  
  private suspend fun checkWeatherForTile(tileId: String) {
    val apiKey = preferences.getString("openweather_api_key", null)
    if (apiKey.isNullOrEmpty()) {
      android.util.Log.w("RainAlertWorker", "No API key configured for fallback")
      return
    }
    
    val coords = decodeGeohash(tileId)
    
    android.util.Log.d(
      "RainAlertWorker",
      "Checking weather for tile $tileId at (${coords.first}, ${coords.second})"
    )
    
    android.util.Log.d("RainAlertWorker", "Weather check completed (mock mode)")
  }
  
  private fun decodeGeohash(geohash: String): Pair<Double, Double> {
    return Pair(0.0, 0.0)
  }
}

