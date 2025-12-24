# Design Document: Toast Positioning Fix

## Overview

This design addresses the toast notification positioning issue where messages appear too far down from the top of the screen. The solution involves adjusting the offset calculations in both the Sonner toast component and the Radix UI Toast viewport to ensure consistent, appropriate positioning across web and native platforms.

The current implementation uses an 80px offset for native platforms and 60px for web, which pushes toasts too far down. The fix will reduce these values while still accounting for status bars and safe areas, ensuring toasts appear prominently near the top without being obscured.

## Architecture

The toast system consists of two independent libraries:

1. **Sonner Toast** (`src/components/ui/sonner.tsx`) - Primary toast library with programmatic API
2. **Radix UI Toast** (`src/components/ui/toast.tsx`) - Alternative toast system with viewport positioning

Both systems need synchronized positioning logic to ensure visual consistency. The architecture maintains separation between the two libraries while applying the same offset calculation strategy.

### Component Hierarchy

```
App.tsx
├── Toaster (Radix UI)
│   └── ToastViewport (positioning via className)
└── Sonner (Sonner library)
    └── offset prop (positioning via inline style)
```

## Components and Interfaces

### Sonner Toast Component

**File:** `src/components/ui/sonner.tsx`

**Current Implementation:**
```typescript
const getToastOffset = (): string => {
  if (Capacitor.isNativePlatform()) {
    return "80px"; // Status bar (~30px) + header space (~50px)
  }
  return "60px"; // Web browsers
};
```

**Updated Implementation:**
```typescript
const getToastOffset = (): string => {
  if (Capacitor.isNativePlatform()) {
    return "16px"; // Minimal offset, safe-area-inset handles status bar
  }
  return "16px"; // Consistent minimal offset for web
};
```

**Rationale:** 
- CSS `env(safe-area-inset-top)` automatically handles status bar spacing on native platforms
- 16px provides minimal visual breathing room without pushing toasts too far down
- Consistent offset across platforms simplifies maintenance

### Radix UI Toast Viewport

**File:** `src/components/ui/toast.tsx`

**Current Implementation:**
```typescript
className={cn(
  "fixed top-0 z-[200] flex max-h-screen w-full flex-col-reverse p-4 pt-[max(env(safe-area-inset-top,0px)+56px,80px)] sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:pt-4 md:max-w-[420px]",
  className,
)}
```

**Updated Implementation:**
```typescript
className={cn(
  "fixed top-0 z-[200] flex max-h-screen w-full flex-col-reverse p-4 pt-[max(env(safe-area-inset-top,0px)+16px,16px)] sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:pt-4 md:max-w-[420px]",
  className,
)}
```

**Rationale:**
- Reduces the minimum padding from 80px to 16px
- Maintains `env(safe-area-inset-top)` for automatic status bar handling
- Uses `max()` function to ensure at least 16px padding even when safe-area-inset is 0

## Data Models

No new data models are required. The changes involve only presentation layer adjustments to existing components.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Consistent Offset Across Toast Systems

*For any* toast notification triggered (whether via Sonner or Radix UI), the vertical offset from the top of the viewport should be consistent and equal to 16px plus any safe area inset.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Safe Area Respect on Native Platforms

*For any* native platform with a status bar, the toast notification should appear below the status bar by at least the height of `env(safe-area-inset-top)` plus 16px.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Minimal Offset on Web Platforms

*For any* web browser viewport, the toast notification should appear with exactly 16px offset from the top edge of the viewport.

**Validates: Requirements 2.1, 2.2**

### Property 4: Viewport Visibility

*For any* toast notification displayed, the entire toast component should be within the visible viewport bounds without requiring scrolling.

**Validates: Requirements 5.2**

## Error Handling

### Missing Safe Area Inset Support

**Scenario:** Browser or platform doesn't support `env(safe-area-inset-top)`

**Handling:** The `max()` CSS function provides a fallback value of 16px, ensuring toasts still appear with appropriate spacing.

### Platform Detection Failure

**Scenario:** `Capacitor.isNativePlatform()` returns incorrect value

**Handling:** Both native and web platforms now use the same 16px base offset, so incorrect detection has minimal impact. Safe area insets will still be respected via CSS.

### Rapid Toast Triggering

**Scenario:** Multiple toasts triggered in quick succession

**Handling:** Both Sonner and Radix UI have built-in queuing mechanisms. The positioning fix doesn't affect queuing behavior—toasts will stack vertically as designed.

## Testing Strategy

### Unit Tests

Unit tests will verify specific positioning values and edge cases:

1. **Sonner Offset Calculation Test**
   - Test `getToastOffset()` returns "16px" for native platforms
   - Test `getToastOffset()` returns "16px" for web platforms
   - Mock `Capacitor.isNativePlatform()` to test both branches

2. **Radix UI Viewport Class Test**
   - Verify ToastViewport className includes `pt-[max(env(safe-area-inset-top,0px)+16px,16px)]`
   - Test that className is properly merged with custom className prop

3. **Visual Regression Test**
   - Capture screenshot of toast at top of screen
   - Compare against baseline to ensure positioning hasn't regressed

### Property Tests

Property-based tests will verify universal behaviors across many inputs:

1. **Property Test: Consistent Positioning**
   - Generate random toast content (titles, descriptions, variants)
   - Trigger toasts via both Sonner and Radix UI
   - Verify both appear at the same vertical position
   - Run 100+ iterations with varied content

2. **Property Test: Safe Area Handling**
   - Generate random safe-area-inset values (0px to 50px)
   - Mock CSS environment variable
   - Verify toast offset = safe-area-inset + 16px
   - Run 100+ iterations with varied inset values

### Manual Testing Checklist

- [ ] Test on Android device with status bar
- [ ] Test on iOS device with notch/dynamic island
- [ ] Test on web browser (Chrome, Firefox, Safari)
- [ ] Test with multiple toasts stacking
- [ ] Test with different toast variants (success, error, info)
- [ ] Test in portrait and landscape orientations
- [ ] Verify no overlap with app header/navigation

### Testing Configuration

- **Framework:** Vitest for unit and property tests
- **Property Testing Library:** @fast-check/vitest
- **Minimum Iterations:** 100 per property test
- **Test Tags:** Each property test must include a comment:
  - `// Feature: toast-positioning-fix, Property 1: Consistent Offset Across Toast Systems`
  - `// Feature: toast-positioning-fix, Property 2: Safe Area Respect on Native Platforms`

## Implementation Notes

### CSS Safe Area Insets

The `env(safe-area-inset-top)` CSS function automatically provides the correct spacing for:
- iOS notches and dynamic island
- Android status bars
- Foldable device hinges
- Browser UI elements

This eliminates the need for manual platform-specific calculations.

### Backward Compatibility

The changes are purely visual and don't affect the toast API. All existing toast calls will continue to work without modification.

### Performance Considerations

The offset calculation happens once per toast render. Using CSS `max()` and `env()` functions is more performant than JavaScript calculations because the browser handles them natively during layout.
