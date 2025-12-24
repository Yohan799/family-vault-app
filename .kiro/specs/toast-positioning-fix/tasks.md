# Implementation Plan: Toast Positioning Fix

## Overview

This implementation plan addresses the toast notification positioning issue by adjusting offset values in both the Sonner and Radix UI Toast components. The changes are minimal and focused on reducing the top offset from 80px/60px to a consistent 16px while maintaining safe area inset support.

## Tasks

- [x] 1. Update Sonner toast offset calculation
  - Modify `getToastOffset()` function in `src/components/ui/sonner.tsx`
  - Change native platform offset from "80px" to "16px"
  - Change web platform offset from "60px" to "16px"
  - Update inline comments to reflect new offset rationale
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2_

- [ ]* 1.1 Write unit tests for Sonner offset calculation
  - Test `getToastOffset()` returns "16px" for native platforms
  - Test `getToastOffset()` returns "16px" for web platforms
  - Mock `Capacitor.isNativePlatform()` for both test cases
  - _Requirements: 1.1, 2.1, 4.1, 4.2_

- [x] 2. Update Radix UI Toast viewport positioning
  - Modify `ToastViewport` className in `src/components/ui/toast.tsx`
  - Change `pt-[max(env(safe-area-inset-top,0px)+56px,80px)]` to `pt-[max(env(safe-area-inset-top,0px)+16px,16px)]`
  - Verify the change maintains responsive behavior (sm: breakpoint)
  - _Requirements: 1.1, 2.1, 3.2, 4.1, 4.3_

- [ ]* 2.1 Write unit tests for Radix UI viewport className
  - Test that ToastViewport includes correct padding-top class
  - Test that custom className prop is properly merged
  - Verify className string contains `pt-[max(env(safe-area-inset-top,0px)+16px,16px)]`
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 3. Checkpoint - Visual verification
  - Build the application and test on web browser
  - Verify toasts appear near the top with appropriate spacing
  - Check that toasts don't overlap with any header elements
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 4. Write property test for consistent positioning
  - **Property 1: Consistent Offset Across Toast Systems**
  - Generate random toast content (titles, descriptions, variants)
  - Trigger toasts via both Sonner and Radix UI APIs
  - Verify both systems position toasts at the same vertical offset
  - Configure test to run minimum 100 iterations
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 5. Write property test for safe area handling
  - **Property 2: Safe Area Respect on Native Platforms**
  - Generate random safe-area-inset-top values (0px to 50px)
  - Mock CSS environment variable for each iteration
  - Calculate expected offset: safe-area-inset + 16px
  - Verify toast positioning matches expected offset
  - Configure test to run minimum 100 iterations
  - **Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.3**

- [ ] 6. Final checkpoint and manual testing
  - Test on Android device (if available) to verify status bar clearance
  - Test on iOS device (if available) to verify notch/dynamic island clearance
  - Test multiple toasts stacking vertically
  - Test different toast variants (success, error, info, warning)
  - Verify positioning in both portrait and landscape orientations
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation is minimal—only two files need modification
- Changes are backward compatible and don't affect the toast API
