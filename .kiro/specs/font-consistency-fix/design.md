# Design Document: Font Consistency Fix

## Overview

This design addresses the font consistency issue where device system fonts override the application's intended typography. The solution involves configuring Tailwind CSS with a proper font family definition and ensuring the font is applied consistently through the CSS cascade. The fix targets both the Tailwind configuration and the base CSS layer to prevent device fonts from taking precedence.

## Architecture

The font system consists of four layers:

1. **Android WebView Configuration Layer**: Configures WebView settings in `MainActivity.java` to prevent device font settings from affecting the app
2. **Tailwind Configuration Layer**: Defines the font family in `tailwind.config.ts` using the `theme.extend.fontFamily` property
3. **CSS Base Layer**: Applies the font through Tailwind's `@layer base` directive to ensure proper cascade
4. **Component Layer**: Components automatically inherit the font through CSS inheritance

The font stack uses system fonts for optimal performance and native feel while maintaining consistency across platforms. The Android WebView layer provides the first line of defense against device font overrides, while the CSS layers ensure consistent application of the intended font family.

## Components and Interfaces

### Android WebView Configuration

**Location**: `android/app/src/main/java/com/example/FamilyVaultapp/MainActivity.java`

**Implementation**:
```java
import android.webkit.WebSettings;
import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Install splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        
        // Fix WebView font settings - MUST be called after super.onCreate()
        fixWebViewFontSettings();
        
        // Create notification channel
        createNotificationChannel();
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
            
        } catch (Exception e) {
            // Log error if WebView settings fail
            android.util.Log.e("MainActivity", "Failed to configure WebView font settings", e);
        }
    }
}
```

**Key Settings**:
- `setTextZoom(100)`: Locks text zoom to 100%, preventing device font scale from affecting the app
- `setMinimumFontSize(1)`: Sets minimum font size to prevent fonts from being too small
- `setLayoutAlgorithm(NORMAL)`: Disables Android's font boosting feature
- `setLoadWithOverviewMode(false)`: Disables overview mode that can affect text sizing
- `setUseWideViewPort(false)`: Disables wide viewport that can trigger text auto-sizing

**Error Handling**: The method is wrapped in a try-catch block to prevent crashes if WebView configuration fails. Errors are logged for debugging purposes.

### Tailwind Configuration

**Location**: `tailwind.config.ts`

**Configuration Structure**:
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
    },
  },
}
```

**Font Stack Rationale**:
- `-apple-system`: Native iOS/macOS font (San Francisco)
- `BlinkMacSystemFont`: Chrome on macOS
- `"Segoe UI"`: Windows native font
- `Roboto`: Android native font (included but controlled by our config)
- `"Helvetica Neue"`: Fallback for older macOS
- `Arial`: Universal fallback
- `sans-serif`: System default fallback

### CSS Base Layer

**Location**: `src/index.css`

**Current Implementation**:
```css
@layer base {
  html {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}
```

**Updated Implementation**:
```css
@layer base {
  html {
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-size: 16px;
  }
  
  body {
    @apply bg-background text-foreground font-sans;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

**Key Changes**:
- Move font-family from `html` to `body` using Tailwind's `font-sans` utility
- This ensures Tailwind's configured font is used instead of the inline CSS declaration
- Maintain font smoothing and text size adjustment properties

## Data Models

No data models are required for this feature.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WebView Text Zoom Locked

*For any* Android device running the app, the WebView text zoom setting should be set to 100%.

**Validates: Requirements 5.2, 6.1, 6.2**

### Property 2: WebView Font Boosting Disabled

*For any* Android device running the app, the WebView layout algorithm should be set to NORMAL to disable font boosting.

**Validates: Requirements 5.4, 6.4**

### Property 3: Tailwind Font Configuration Exists

*For any* Tailwind configuration file, the `theme.extend.fontFamily.sans` property should be defined with a non-empty array of font families.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 4: Body Element Uses Tailwind Font

*For any* rendered page, the computed font-family on the body element should match the font stack defined in Tailwind's configuration.

**Validates: Requirements 2.1, 3.1, 3.2**

### Property 5: Font Inheritance Consistency

*For any* component element without an explicit font-family override, the computed font-family should match the body element's font-family.

**Validates: Requirements 3.3, 3.4**

### Property 6: Font Smoothing Applied

*For any* rendered page, the body element should have `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` applied.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Text Size Adjustment Disabled

*For any* rendered page, the html element should have `text-size-adjust: 100%` to prevent device font scaling.

**Validates: Requirements 2.3, 2.4, 6.3**

## Error Handling

This feature has minimal error scenarios since it involves static configuration:

1. **Missing Font Fallbacks**: If specific fonts in the stack are unavailable, the browser automatically falls back to the next font in the stack
2. **Browser Compatibility**: Older browsers that don't support certain CSS properties will gracefully degrade to default rendering
3. **Configuration Errors**: TypeScript will catch configuration errors in `tailwind.config.ts` at build time

## Testing Strategy

### Unit Tests

Unit tests will verify the configuration structure:

1. **Tailwind Config Validation**: Verify `tailwind.config.ts` exports a valid configuration with `fontFamily.sans` defined
2. **Font Stack Structure**: Verify the font stack contains expected font families in the correct order

### Property Tests

Property tests will verify runtime behavior:

1. **Property 1 Test**: Parse `tailwind.config.ts` and verify `theme.extend.fontFamily.sans` exists and is a non-empty array
2. **Property 2 Test**: Render a test component and verify the body element's computed font-family matches the configured stack
3. **Property 3 Test**: Render multiple components and verify they all inherit the same font-family
4. **Property 4 Test**: Verify font smoothing properties are present in computed styles
5. **Property 5 Test**: Verify text-size-adjust is set to 100% on the html element

### Manual Testing

Manual testing on Android devices:

1. **Default System Font Test**: Test on Android device with default system font
2. **Custom Font Test**: Test on Android device with custom user font configured (Settings → Display → Font Style)
3. **Large Font Size Test**: Test on Android device with large font size accessibility setting (Settings → Display → Font Size → Large/Huge)
4. **Font Consistency Test**: Verify font consistency across all pages and components
5. **Readability Test**: Verify text remains readable and properly rendered
6. **WebView Configuration Test**: Verify WebView settings are applied correctly by checking logs

### Testing Framework

- **Unit Tests**: Vitest for configuration validation
- **Property Tests**: Vitest with jsdom for DOM testing
- **Android Tests**: Manual testing on physical devices or emulators
- **WebView Tests**: Manual verification through Android Studio logcat

### Test Configuration

- Minimum 100 iterations per property test
- Each test tagged with: **Feature: font-consistency-fix, Property {number}: {property_text}**
