# Requirements Document

## Introduction

This feature replaces the native Android splash screen with a custom React component-based splash screen. The custom splash screen will be fully responsive and adapt to all Android device resolutions and aspect ratios, providing a consistent branded experience across all devices. The native Capacitor splash screen will be disabled in favor of the React-based implementation.

## Glossary

- **Custom_Splash_Screen**: A React component that displays the app branding during initialization, replacing the native Android splash screen
- **Viewport_Units**: CSS units (vw, vh, vmin, vmax) that are relative to the viewport dimensions
- **Safe_Area**: The portion of the screen that is not obscured by device notches, status bars, or navigation bars
- **Aspect_Ratio**: The proportional relationship between screen width and height (e.g., 16:9, 20:9, 21:9)
- **Native_Splash_Screen**: The Android platform splash screen managed by Capacitor's SplashScreen plugin
- **Responsive_Design**: Design approach that ensures UI adapts to different screen sizes and orientations

## Requirements

### Requirement 1: Disable Native Splash Screen

**User Story:** As a developer, I want to disable the native Android splash screen, so that the custom React splash screen is the only splash experience users see.

#### Acceptance Criteria

1. THE Native_Splash_Screen SHALL be disabled by setting launchShowDuration to 0 in Capacitor configuration
2. THE Native_Splash_Screen SHALL be hidden immediately when the app launches
3. WHEN the app starts, THE Custom_Splash_Screen SHALL be displayed instead of the native splash

### Requirement 2: Custom Splash Screen Display

**User Story:** As a user launching the app, I want to see a branded splash screen with the app logo and welcome text, so that I have a polished app launch experience.

#### Acceptance Criteria

1. WHEN the app launches, THE Custom_Splash_Screen SHALL display the Family Vault logo centered on the screen
2. WHEN the app launches, THE Custom_Splash_Screen SHALL display the text "Welcome to Family Vault" below the logo
3. THE Custom_Splash_Screen SHALL use the brand color (#7c3aed) as the background
4. THE Custom_Splash_Screen SHALL display for a minimum of 2000 milliseconds before transitioning

### Requirement 3: Responsive Layout for All Resolutions

**User Story:** As a user with any Android device, I want the splash screen to display correctly regardless of my device's screen size or aspect ratio, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Custom_Splash_Screen SHALL fill the entire viewport (100vw x 100vh) on all devices
2. THE Custom_Splash_Screen SHALL center the logo and text vertically and horizontally on all screen sizes
3. WHEN displayed on devices with aspect ratios from 16:9 to 21:9, THE Custom_Splash_Screen SHALL maintain proper proportions
4. THE Custom_Splash_Screen SHALL use viewport-relative units (vw, vh, vmin) for sizing to ensure scalability
5. THE Custom_Splash_Screen logo SHALL scale proportionally based on screen size using vmin units

### Requirement 4: Safe Area Handling

**User Story:** As a user with a device that has notches or system bars, I want the splash screen to extend edge-to-edge while keeping content in safe areas, so that the branding is fully visible.

#### Acceptance Criteria

1. THE Custom_Splash_Screen background SHALL extend edge-to-edge behind status bar and navigation bar
2. THE Custom_Splash_Screen content (logo and text) SHALL be positioned within the safe area
3. WHEN the device has a display cutout (notch), THE Custom_Splash_Screen background SHALL render into the cutout area
4. THE Custom_Splash_Screen SHALL use CSS env() safe-area-inset values for proper content positioning

### Requirement 5: Smooth Transition Animation

**User Story:** As a user, I want the splash screen to fade out smoothly when transitioning to the app content, so that the launch experience feels polished.

#### Acceptance Criteria

1. WHEN the splash duration completes, THE Custom_Splash_Screen SHALL fade out with a 300ms animation
2. THE Custom_Splash_Screen SHALL not cause any visual glitches during the transition
3. WHEN the fade animation completes, THE Custom_Splash_Screen component SHALL be removed from the DOM

### Requirement 6: Logo Animation

**User Story:** As a user, I want to see a subtle animation on the splash screen logo, so that the app feels alive and engaging during launch.

#### Acceptance Criteria

1. THE Custom_Splash_Screen logo SHALL have a subtle pulse or glow animation
2. THE animation SHALL be smooth and not cause performance issues
3. THE animation SHALL loop continuously while the splash screen is visible

### Requirement 7: Integration with App Initialization

**User Story:** As a developer, I want the splash screen to integrate properly with the app's initialization flow, so that it displays at the right time and hides when the app is ready.

#### Acceptance Criteria

1. THE Custom_Splash_Screen SHALL be rendered as the first visible component when the app mounts
2. WHEN the splash duration completes, THE Custom_Splash_Screen SHALL trigger a callback to signal completion
3. THE Custom_Splash_Screen SHALL be managed by a state in the root App component or a dedicated provider
4. IF the app content loads before the minimum duration, THEN THE Custom_Splash_Screen SHALL still display for the full minimum duration

