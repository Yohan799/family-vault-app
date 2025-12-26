package com.example.FamilyVaultapp;

import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.Plugin;
import android.content.Intent;
import android.util.Log;
import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.splashscreen.SplashScreen;
import android.webkit.WebSettings;
import android.os.Handler;
import android.os.Looper;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Install splash screen with error handling for OEM compatibility
    try {
      SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
      
      // Control splash dismissal properly
      final boolean[] isAppReady = {false};
      
      splashScreen.setKeepOnScreenCondition(() -> !isAppReady[0]);
      
      // Single splash screen - show for 2.5 seconds
      new Handler(Looper.getMainLooper()).postDelayed(() -> {
        isAppReady[0] = true;
      }, 2500);
      
      Log.d("MainActivity", "Native splash initialized - transitioning to web splash");
      
    } catch (Exception e) {
      // If splash screen fails on problematic OEM devices, continue anyway
      Log.e("MainActivity", "Splash screen initialization failed, continuing without it", e);
    }
    
    super.onCreate(savedInstanceState);
    
    // Fix WebView font settings - MUST be called after super.onCreate()
    fixWebViewFontSettings();
    
    // Create notification channel for Android 8.0+ (API 26+)
    // This is REQUIRED for push notifications to display
    createNotificationChannel();
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      CharSequence name = "Default Notifications";
      String description = "Family Vault push notifications";
      int importance = NotificationManager.IMPORTANCE_HIGH;
      NotificationChannel channel = new NotificationChannel("default", name, importance);
      channel.setDescription(description);
      channel.enableLights(true);
      channel.enableVibration(true);
      
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      if (notificationManager != null) {
        notificationManager.createNotificationChannel(channel);
        Log.d("MainActivity", "Notification channel 'default' created");
      }
    }
  }

  /**
   * Prevents WebView from adopting device font settings
   * Forces WebView to use only CSS-defined fonts
   */
  private void fixWebViewFontSettings() {
    try {
      // Get WebView settings from Capacitor bridge
      WebSettings webSettings = this.bridge.getWebView().getSettings();
      
      // Lock text zoom to 100% - prevents device font scale from affecting app
      webSettings.setTextZoom(100);
      
      // Set minimum font sizes (prevents fonts from being too small)
      webSettings.setMinimumFontSize(1);
      webSettings.setMinimumLogicalFontSize(1);
      
      // Use normal layout algorithm (disables font boosting)
      webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
      
      // Optional: Disable text auto-sizing
      webSettings.setLoadWithOverviewMode(false);
      webSettings.setUseWideViewPort(false);
      
      Log.d("MainActivity", "WebView font settings configured successfully");
    } catch (Exception e) {
      // Log error if WebView settings fail
      Log.e("MainActivity", "Failed to configure WebView font settings", e);
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    
    if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
      PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
      if (pluginHandle == null) {
        Log.i("Google Activity Result", "SocialLogin login handle is null");
        return;
      }
      Plugin plugin = pluginHandle.getInstance();
      if (!(plugin instanceof SocialLoginPlugin)) {
        Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
        return;
      }
      ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
    }
  }

  // This method marker tells the plugin that you've properly configured MainActivity
  public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
