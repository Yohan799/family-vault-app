# Requirements Document

## Introduction

This feature addresses the splash screen display issue on Android devices with tall aspect ratios (20:9 or taller, such as Infinix Hot 30). Currently, the splash screen appears blank or doesn't display properly on these devices before the onboarding screen loads. The fix ensures consistent splash screen visibility across all Android device aspect ratios.

## Glossary

- **Splash_Screen**: The initial branded screen displayed when the app launches, showing the app logo/branding while the app initializes
- **Aspect_Ratio**: The proportional relationship between screen width and height (e.g., 16:9, 20:9, 21:9)
- **Tall_Device**: Android devices with aspect ratios of 20:9 or greater (e.g., Infinix Hot 30, Samsung Galaxy A series)
- **Layer_List**: Android drawable resource that combines multiple drawable layers
- **Nine_Patch**: Android drawable format that defines stretchable regions for proper scaling
- **Capacitor_Splash_Plugin**: The @capacitor/splash-screen plugin that provides programmatic splash screen control

## Requirements

### Requirement 1: Splash Screen Visibility on Tall Devices

**User Story:** As a user with a tall aspect ratio device (20:9+), I want to see the splash screen properly when launching the app, so that I have a consistent branded experience like users on standard devices.

#### Acceptance Criteria

1. WHEN the app launches on a device with 20:9 or taller aspect ratio, THE Splash_Screen SHALL display the branded splash image without blank areas
2. WHEN the app launches on any Android device, THE Splash_Screen SHALL fill the entire screen with appropriate background color where the image doesn't cover
3. THE Splash_Screen SHALL maintain the logo/branding aspect ratio without distortion on all devices
4. WHEN the splash image doesn't cover the full screen height, THE Splash_Screen SHALL display a matching background color to fill gaps

### Requirement 2: Splash Screen Duration and Transition

**User Story:** As a user, I want the splash screen to display for an appropriate duration and transition smoothly to the app content, so that I have a polished app launch experience.

#### Acceptance Criteria

1. THE Splash_Screen SHALL display for a minimum of 2000 milliseconds to ensure branding visibility
2. WHEN the web content is ready, THE Splash_Screen SHALL hide automatically
3. THE Splash_Screen SHALL hide gracefully without visual glitches or blank frames between splash and app content
4. IF the web content takes longer than expected to load, THEN THE Splash_Screen SHALL remain visible until content is ready

### Requirement 3: Edge-to-Edge Display Support

**User Story:** As a user with a modern Android device, I want the splash screen to extend behind system bars (status bar, navigation bar), so that I have an immersive launch experience.

#### Acceptance Criteria

1. THE Splash_Screen SHALL extend edge-to-edge behind the status bar on all supported Android versions
2. THE Splash_Screen SHALL extend behind the navigation bar where supported
3. WHEN the device has a display cutout (notch), THE Splash_Screen SHALL render into the cutout area
4. THE Splash_Screen SHALL use transparent system bars during display

### Requirement 4: Android 12+ Splash Screen API Compatibility

**User Story:** As a user with Android 12 or newer, I want the splash screen to work correctly with the new splash screen API, so that I don't see conflicting splash screens or visual artifacts.

#### Acceptance Criteria

1. WHEN running on Android 12+ (API 31+), THE Splash_Screen SHALL integrate with the native splash screen API
2. THE Splash_Screen SHALL hide the default Android 12+ animated icon to prevent visual conflicts
3. WHEN the native splash screen exits, THE Splash_Screen SHALL transition smoothly to the Capacitor splash or app content
4. THE Splash_Screen configuration SHALL work consistently across Android 10, 11, 12, 13, and 14
