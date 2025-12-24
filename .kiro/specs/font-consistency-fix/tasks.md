# Implementation Plan: Font Consistency Fix

## Overview

This implementation plan addresses the font consistency issue by configuring Tailwind CSS with a proper font family and ensuring it's applied consistently through the CSS base layer. The tasks are ordered to first configure the font system, then verify the implementation through testing.

## Tasks

- [x] 1. Configure Tailwind font family
  - Update `tailwind.config.ts` to add `fontFamily.sans` in `theme.extend`
  - Use the system font stack: `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `"Helvetica Neue"`, `Arial`, `sans-serif`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Update CSS base layer to use Tailwind font
  - Modify `src/index.css` to apply `font-sans` utility to body element using `@apply`
  - Remove redundant `font-family` declaration from `html` selector
  - Keep `font-size: 16px` and text-size-adjust properties on `html` selector
  - Keep font smoothing properties on `body` selector
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Implement WebView font settings in MainActivity
  - [x] 3.1 Add required imports to MainActivity.java
    - Import `android.webkit.WebSettings`
    - Verify other required imports are present
    - _Requirements: 5.1_
  
  - [x] 3.2 Create fixWebViewFontSettings() method
    - Add private method to MainActivity class
    - Implement try-catch error handling
    - Get WebView settings from Capacitor bridge
    - _Requirements: 5.1, 5.5_
  
  - [x] 3.3 Configure WebView text zoom
    - Set text zoom to 100% using `webSettings.setTextZoom(100)`
    - This prevents device font scale from affecting the app
    - _Requirements: 5.2, 6.1, 6.2_
  
  - [x] 3.4 Configure WebView minimum font sizes
    - Set minimum font size to 1 using `webSettings.setMinimumFontSize(1)`
    - Set minimum logical font size to 1 using `webSettings.setMinimumLogicalFontSize(1)`
    - _Requirements: 5.3_
  
  - [x] 3.5 Disable font boosting
    - Set layout algorithm to NORMAL using `webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL)`
    - Disable load with overview mode using `webSettings.setLoadWithOverviewMode(false)`
    - Disable wide viewport using `webSettings.setUseWideViewPort(false)`
    - _Requirements: 5.4, 6.4_
  
  - [x] 3.6 Call fixWebViewFontSettings in onCreate
    - Add method call after `super.onCreate()` and before `createNotificationChannel()`
    - Ensure proper execution order
    - _Requirements: 5.1_

- [x] 4. Build and sync Android project
  - Run `npx cap sync android` to sync changes
  - Verify build completes successfully
  - Check for any compilation errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Write unit test for Tailwind configuration
  - Create test file to validate `tailwind.config.ts` structure
  - Verify `theme.extend.fontFamily.sans` exists and is a non-empty array
  - Verify font stack contains expected fonts in correct order
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Write property test for font application
  - **Property 4: Body Element Uses Tailwind Font**
  - **Validates: Requirements 2.1, 3.1, 3.2**
  - Create test that renders a component and verifies body element's computed font-family
  - Use jsdom to simulate browser environment
  - _Requirements: 2.1, 3.1, 3.2_

- [ ] 7. Write property test for font inheritance
  - **Property 5: Font Inheritance Consistency**
  - **Validates: Requirements 3.3, 3.4**
  - Create test that renders multiple components
  - Verify all components inherit the same font-family from body
  - _Requirements: 3.3, 3.4_

- [ ] 8. Write property test for font smoothing
  - **Property 6: Font Smoothing Applied**
  - **Validates: Requirements 4.1, 4.2, 4.3**
  - Verify body element has antialiasing properties applied
  - Check for `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale`
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Write property test for text size adjustment
  - **Property 7: Text Size Adjustment Disabled**
  - **Validates: Requirements 2.3, 2.4, 6.3**
  - Verify html element has `text-size-adjust: 100%`
  - Ensure device font scaling is prevented
  - _Requirements: 2.3, 2.4, 6.3_

- [ ] 10. Manual testing checkpoint
  - Build the APK and install on Android device or emulator
  - Test with default system font
  - Test with custom font (Settings → Display → Font Style)
  - Test with large font size (Settings → Display → Font Size → Large/Huge)
  - Verify font consistency across different pages
  - Check Android Studio logcat for WebView configuration logs
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

## Notes

- Tasks 1 and 2 (CSS/Tailwind configuration) are already completed
- Task 3 implements the critical Android WebView layer to prevent device font overrides
- Task 4 syncs the Android project with the new MainActivity changes
- Tasks 5-9 provide automated verification of the fix through property tests
- Task 10 provides manual testing on actual Android devices
- Both layers (WebView + CSS) are required for complete font control
- Each property test should run minimum 100 iterations for thorough coverage
