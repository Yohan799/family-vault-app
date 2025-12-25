# Implementation Plan: Category Long-Press Delete

## Overview

This plan implements long-press delete functionality for custom categories in the Vault, allowing users to press and hold on a category for 500ms to trigger an action sheet with delete options.

## Tasks

- [x] 1. Add long-press state management to VaultHome
  - Add state for `longPressTimer` (NodeJS.Timeout | null)
  - Add state for `showActionSheet` (boolean)
  - Add state for `actionSheetCategory` (any | null)
  - Add state for `isLongPressing` (boolean)
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement long-press event handlers
  - Create `handlePressStart` function that starts 500ms timer for custom categories only
  - Create `handlePressEnd` function that clears timer and resets state
  - Create `handlePressMove` function that cancels long-press if finger moves away
  - Add cleanup effect to clear timer on component unmount
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2_

- [x] 3. Integrate event handlers with category buttons
  - Add `onTouchStart`, `onTouchEnd`, `onTouchMove` handlers for mobile
  - Add `onMouseDown`, `onMouseUp`, `onMouseLeave` handlers for desktop
  - Add `onContextMenu` handler to prevent default context menu
  - Modify `onClick` to check `isLongPressing` before navigation
  - Add scale animation class based on `isLongPressing` state
  - _Requirements: 1.3, 4.1, 5.1, 5.2, 5.3, 5.4_

- [x] 4. Create action sheet component
  - Create modal overlay with semi-transparent backdrop
  - Add action sheet container with rounded top corners
  - Display category name and document count
  - Add "Delete Category" button with destructive styling
  - Add "Cancel" button to dismiss action sheet
  - Add slide-up animation when appearing
  - Add slide-down animation when dismissing
  - Handle backdrop click to dismiss
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.4, 4.5_

- [x] 5. Connect action sheet to delete flow
  - Wire "Delete Category" button to call existing `handleDeleteClick` function
  - Ensure action sheet dismisses before showing confirmation dialog
  - Verify existing delete confirmation dialog works correctly
  - Ensure success/error toasts display properly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Manual testing checkpoint
  - Test long-press on custom category (500ms hold)
  - Test short press on custom category (< 500ms, should navigate)
  - Test long-press on default category (should not show action sheet)
  - Test action sheet "Delete Category" button
  - Test action sheet "Cancel" button
  - Test backdrop click to dismiss
  - Test visual feedback (scale animation during press)
  - Test on mobile device (touch events)
  - Test on desktop (mouse events)
  - Test edge cases (rapid taps, scroll during press, move finger away)
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

## Notes

- Long-press duration is 500ms (standard for iOS/Android)
- Only custom categories (isCustom === true) should show action sheet
- Existing delete confirmation dialog and logic remain unchanged
- Use `setTimeout` for timer management
- Clear timers on component unmount to prevent memory leaks
- Prevent default context menu with `e.preventDefault()`
- Scale animation: 95% during press, 100% normal
- Action sheet animations: slide-up on appear, slide-down on dismiss
- Test thoroughly on both touch and mouse devices
