# Requirements Document

## Introduction

This document specifies the requirements for fixing the toast notification positioning issue in the application. Currently, toast messages appear too far down from the top of the screen, creating a poor user experience. The system needs to position toast notifications appropriately for both web browsers and native mobile platforms (Android/iOS), accounting for status bars and safe areas while ensuring visibility and accessibility.

## Glossary

- **Toast_System**: The notification component that displays temporary messages to users (using Sonner and Radix UI Toast libraries)
- **Native_Platform**: Mobile applications running on Android or iOS devices via Capacitor
- **Web_Platform**: Application running in web browsers
- **Status_Bar**: The system UI bar at the top of mobile devices showing time, battery, signal strength
- **Safe_Area**: The portion of the screen that is not obscured by device-specific UI elements (notches, status bars, rounded corners)
- **Offset**: The distance from the top edge of the screen where toast notifications appear

## Requirements

### Requirement 1: Toast Positioning on Native Platforms

**User Story:** As a mobile app user, I want toast notifications to appear near the top of the screen without being obscured by the status bar, so that I can see important messages clearly.

#### Acceptance Criteria

1. WHEN a toast notification is displayed on a native platform, THE Toast_System SHALL position the toast with appropriate offset accounting for the status bar
2. WHEN the device has a status bar, THE Toast_System SHALL ensure the toast appears below the status bar and remains fully visible
3. WHEN a toast notification is displayed, THE Toast_System SHALL use safe area insets to avoid device-specific UI elements
4. WHEN multiple toast notifications are queued, THE Toast_System SHALL stack them vertically without overlapping the status bar

### Requirement 2: Toast Positioning on Web Platforms

**User Story:** As a web user, I want toast notifications to appear consistently near the top of the browser window, so that I can see important messages without them being too far down the page.

#### Acceptance Criteria

1. WHEN a toast notification is displayed on a web platform, THE Toast_System SHALL position the toast with minimal offset from the top
2. WHEN the browser window is resized, THE Toast_System SHALL maintain consistent positioning relative to the viewport top
3. WHEN a toast notification is displayed, THE Toast_System SHALL ensure the toast does not overlap with application header elements

### Requirement 3: Consistent Positioning Across Toast Libraries

**User Story:** As a developer, I want both toast libraries (Sonner and Radix UI Toast) to use consistent positioning logic, so that all toast notifications appear in the same location regardless of which library triggers them.

#### Acceptance Criteria

1. WHEN Sonner toast is triggered, THE Toast_System SHALL use the same offset calculation as Radix UI Toast
2. WHEN Radix UI Toast is triggered, THE Toast_System SHALL use the same offset calculation as Sonner toast
3. WHEN switching between toast libraries, THE Toast_System SHALL maintain visual consistency in positioning

### Requirement 4: Dynamic Offset Calculation

**User Story:** As a user on different devices, I want toast notifications to automatically adjust their position based on my device characteristics, so that messages are always visible and properly positioned.

#### Acceptance Criteria

1. WHEN the application detects a native platform, THE Toast_System SHALL calculate offset based on status bar height and safe area insets
2. WHEN the application detects a web platform, THE Toast_System SHALL calculate offset based on browser viewport characteristics
3. WHEN safe area insets change (device rotation, dynamic island), THE Toast_System SHALL recalculate the offset dynamically
4. WHEN calculating offset, THE Toast_System SHALL use a minimum offset value to prevent toasts from appearing too close to the screen edge

### Requirement 5: Visual Accessibility

**User Story:** As a user, I want toast notifications to be easily visible and readable, so that I don't miss important information.

#### Acceptance Criteria

1. WHEN a toast notification is displayed, THE Toast_System SHALL ensure sufficient contrast between the toast and background content
2. WHEN a toast notification is displayed, THE Toast_System SHALL position it within the visible viewport without requiring scrolling
3. WHEN a toast notification appears, THE Toast_System SHALL ensure it does not obscure critical UI elements like navigation or action buttons
