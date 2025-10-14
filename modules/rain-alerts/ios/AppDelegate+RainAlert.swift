import Foundation
import BackgroundTasks
import UserNotifications

extension AppDelegate {
  func registerRainAlertBackgroundTasks() {
    BGTaskScheduler.shared.register(
      forTaskWithIdentifier: "com.subhanify.rainAlertRefresh",
      using: nil
    ) { task in
      self.handleRainAlertBackgroundRefresh(task: task as! BGAppRefreshTask)
    }
    
    setupNotificationCategories()
  }
  
  private func handleRainAlertBackgroundRefresh(task: BGAppRefreshTask) {
    let queue = OperationQueue()
    queue.maxConcurrentOperationCount = 1
    
    let operation = RainAlertRefreshOperation()
    
    task.expirationHandler = {
      queue.cancelAllOperations()
    }
    
    operation.completionBlock = {
      task.setTaskCompleted(success: !operation.isCancelled)
    }
    
    queue.addOperation(operation)
  }
  
  private func setupNotificationCategories() {
    let readDuaAction = UNNotificationAction(
      identifier: "READ_DUA",
      title: "Read Dua",
      options: [.foreground]
    )
    
    let playAudioAction = UNNotificationAction(
      identifier: "PLAY_AUDIO",
      title: "Play Audio",
      options: []
    )
    
    let category = UNNotificationCategory(
      identifier: "RAIN_ALERT",
      actions: [readDuaAction, playAudioAction],
      intentIdentifiers: [],
      options: []
    )
    
    UNUserNotificationCenter.current().setNotificationCategories([category])
  }
}

class RainAlertRefreshOperation: Operation {
  override func main() {
    if isCancelled { return }
    
    print("Running rain alert background refresh")
    
    sleep(2)
    
    print("Rain alert background refresh completed")
  }
}

