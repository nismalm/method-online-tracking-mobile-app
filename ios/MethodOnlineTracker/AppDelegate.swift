import UIKit
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseAuth
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    print("=== AppDelegate: Starting initialization")

    // CRITICAL: Set module name BEFORE anything else
    self.moduleName = "MethodOnlineTracker"
    print("=== Module name set: \(self.moduleName)")

    // Set dependency provider for React Native 0.78+ New Architecture
    self.dependencyProvider = RCTAppDependencyProvider()
    print("=== Dependency provider set")

    // Configure Firebase
    FirebaseApp.configure()
    print("=== Firebase configured")

    // Configure push notifications
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { granted, error in
        if let error = error {
          print("=== Error requesting notification authorization: \(error.localizedDescription)")
        }
        if granted {
          print("=== Notification authorization granted")
        }
      }
    )
    application.registerForRemoteNotifications()
    print("=== Registered for remote notifications")

    // Call super to initialize React Native
    print("=== Calling super.application")
    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    print("=== React Native initialized: \(result)")

    return result
  }

  override func bundleURL() -> URL? {
    print("=== bundleURL() called")
#if DEBUG
    print("=== DEBUG mode")
    let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    print("=== Bundle URL: \(String(describing: url))")
    return url
#else
    print("=== RELEASE mode - looking for main.jsbundle")
    guard let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
      print("=== FATAL ERROR: main.jsbundle not found!")
      fatalError("Could not find main.jsbundle in release build")
    }

    if let size = try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Int64 {
      print("=== Bundle found, size: \(size / 1024)KB")
    }
    print("=== Bundle URL: \(url.path)")
    return url
#endif
  }

  // MARK: - UNUserNotificationCenterDelegate Methods

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    print("=== Notification received in foreground")
    completionHandler([.banner, .sound, .badge])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    print("=== User tapped notification")
    completionHandler()
  }

  // MARK: - Remote Notifications

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    print("=== APNS token registered")
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("=== Failed to register for remote notifications: \(error.localizedDescription)")
  }
}