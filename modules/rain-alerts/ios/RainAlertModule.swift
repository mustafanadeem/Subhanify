import Foundation
import ExpoModulesCore
import BackgroundTasks
import UserNotifications
import CoreLocation

public class RainAlertModule: Module {
  private let locationManager = CLLocationManager()
  private let userDefaults = UserDefaults.standard
  private let cooldownKey = "rainAlertLastAlertTimestamp"
  private let tileIdKey = "rainAlertLastTileId"
  
  public func definition() -> ModuleDefinition {
    Name("RainAlert")
    
    Function("initialize") { (leadMinutes: Int, intensityThreshold: String) in
      self.scheduleBackgroundRefresh()
      return true
    }
    
    Function("handlePushPayload") { (payload: [String: Any]) -> Bool in
      return self.processPushPayload(payload)
    }
    
    Function("canShowAlert") { () -> Bool in
      return self.checkCooldown()
    }
    
    Function("recordAlert") { () in
      self.recordAlertTimestamp()
    }
    
    Function("getRemainingCooldown") { () -> Int in
      return self.getRemainingCooldownSeconds()
    }
    
    Function("requestPermissions") { () async -> Bool in
      return await self.requestNotificationAndLocationPermissions()
    }
    
    Function("scheduleBackgroundTasks") { () in
      self.scheduleBackgroundRefresh()
    }
  }
  
  private func scheduleBackgroundRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.subhanify.rainAlertRefresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 3600)
    
    do {
      try BGTaskScheduler.shared.submit(request)
      print("Rain alert background refresh scheduled")
    } catch {
      print("Failed to schedule background refresh: \(error)")
    }
  }
  
  private func processPushPayload(_ payload: [String: Any]) -> Bool {
    guard payload["type"] as? String == "RAIN_START" else {
      return false
    }
    
    if !checkCooldown() {
      print("Rain alert suppressed due to cooldown")
      return false
    }
    
    let leadMinutes = payload["leadMinutes"] as? Int ?? 0
    let intensity = payload["intensity"] as? String ?? "light"
    let phrase = payload["phrase"] as? String ?? "Rain has started nearby"
    let dua = payload["dua"] as? String ?? "اللَّهُمَّ صَيِّبًا نَافِعًا"
    
    showNotification(
      title: phrase,
      body: "\(dua) — O Allah, a beneficial downpour.",
      userInfo: payload
    )
    
    recordAlertTimestamp()
    return true
  }
  
  private func checkCooldown() -> Bool {
    guard let lastAlert = userDefaults.object(forKey: cooldownKey) as? Date else {
      return true
    }
    
    let elapsed = Date().timeIntervalSince(lastAlert)
    return elapsed >= 3600
  }
  
  private func getRemainingCooldownSeconds() -> Int {
    guard let lastAlert = userDefaults.object(forKey: cooldownKey) as? Date else {
      return 0
    }
    
    let elapsed = Date().timeIntervalSince(lastAlert)
    let remaining = max(0, 3600 - elapsed)
    return Int(ceil(remaining))
  }
  
  private func recordAlertTimestamp() {
    userDefaults.set(Date(), forKey: cooldownKey)
    userDefaults.synchronize()
  }
  
  private func showNotification(title: String, body: String, userInfo: [String: Any]) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    content.categoryIdentifier = "RAIN_ALERT"
    content.userInfo = userInfo
    
    let request = UNNotificationRequest(
      identifier: UUID().uuidString,
      content: content,
      trigger: nil
    )
    
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("Failed to show rain alert notification: \(error)")
      } else {
        print("Rain alert notification shown")
      }
    }
  }
  
  private func requestNotificationAndLocationPermissions() async -> Bool {
    let notificationCenter = UNUserNotificationCenter.current()
    
    do {
      let granted = try await notificationCenter.requestAuthorization(options: [.alert, .sound, .badge])
      
      if !granted {
        print("Notification permission denied")
        return false
      }
      
      let locationGranted = await requestLocationPermission()
      return locationGranted
      
    } catch {
      print("Failed to request permissions: \(error)")
      return false
    }
  }
  
  private func requestLocationPermission() async -> Bool {
    return await withCheckedContinuation { continuation in
      locationManager.requestWhenInUseAuthorization()
      
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        let status = self.locationManager.authorizationStatus
        continuation.resume(returning: status == .authorizedWhenInUse || status == .authorizedAlways)
      }
    }
  }
}

