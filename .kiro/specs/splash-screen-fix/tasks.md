# Implementation Plan: Splash Screen Fix for Tall Aspect Ratio Devices

## Overview

This implementation plan fixes the splash screen display issue on Android devices with tall aspect ratios (20:9+). The solution installs the Capacitor splash screen plugin, updates drawable configurations, and ensures proper scaling across all device types.

## Tasks

- [x] 1. Install and configure Capacitor Splash Screen plugin
  - [x] 1.1 Install @capacitor/splash-screen package
    - Run `npm install @capacitor/splash-screen`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 1.2 Update capacitor.config.ts with splash screen configuration
    - Configure launchShowDuration, launchAutoHide, backgroundColor
    - Set androidScaleType to CENTER_CROP for proper scaling on tall devices
    - Enable splashFullScreen and splashImmersive for edge-to-edge display
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2_

- [x] 2. Update Android drawable resources for proper scaling
  - [x] 2.1 Update splash_scaled.xml to use center_crop gravity
    - Change bitmap gravity from "center" to "fill" for full coverage
    - Ensure background color fills any remaining gaps
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 Update splash_background.xml layer-list
    - Ensure solid background color layer is first
    - Configure bitmap layer for proper scaling
    - _Requirements: 1.2, 1.4_

- [x] 3. Sync Capacitor configuration to Android project
  - [x] 3.1 Run capacitor sync to update Android assets
    - Execute `npx cap sync android`
    - Verify capacitor.config.json is updated in Android assets
    - _Requirements: 1.1, 2.1, 4.1_

- [x] 4. Checkpoint - Verify splash screen configuration
  - Build and test on emulator or device
  - Verify splash displays correctly on standard and tall aspect ratio devices
  - Ensure all tests pass, ask the user if questions arise

## Notes

- The key fix is using CENTER_CROP scale type which fills the entire screen
- Background color (#FFFFFF) will fill any gaps on extreme aspect ratios
- No code changes needed in React/TypeScript - this is purely native Android configuration
- Testing should be done on actual devices with 20:9+ aspect ratios (e.g., Infinix Hot 30)
