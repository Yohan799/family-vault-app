# Design Document: Category Long-Press Delete

## Overview

This design implements long-press delete functionality for custom categories in the Vault. Users can press and hold on a custom category for 500ms to trigger an action sheet with delete options, providing a mobile-friendly way to manage categories without cluttering the UI.

## Architecture

The implementation involves:
1. Adding long-press detection logic using touch and mouse event handlers
2. Creating an action sheet component that appears after long-press
3. Integrating with the existing delete confirmation dialog
4. Adding visual feedback during the long-press interaction

## Components and Interfaces

### State Management

```typescript
// New state for long-press functionality
const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
const [showActionSheet, setShowActionSheet] = useState(false);
const [actionSheetCategory, setActionSheetCategory] = useState<any | null>(null);
const [isLongPressing, setIsLongPressing] = useState(false);
```

### Event Handlers

```typescript
// Long-press detection
const handlePressStart = (category: any, e: React.TouchEvent | React.MouseEvent) => {
  if (!category.isCustom) return;
  
  e.preventDefault();
  setIsLongPressing(true);
  
  const timer = setTimeout(() => {
    setActionSheetCategory(category);
    setShowActionSheet(true);
    setIsLongPressing(false);
    // Optional: trigger haptic feedback on mobile
  }, 500);
  
  setLongPressTimer(timer);
};

const handlePressEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }
  setIsLongPressing(false);
};

const handlePressMove = (e: React.TouchEvent) => {
  // Cancel if finger moves too far from original position
  const touch = e.touches[0];
  // Calculate distance and cancel if > threshold
};
```

### Action Sheet Component

```tsx
{showActionSheet && actionSheetCategory && (
  <div 
    className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
    onClick={() => setShowActionSheet(false)}
  >
    <div 
      className="bg-card rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {getCategoryName(actionSheetCategory.id, actionSheetCategory.name, t)}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        {actionSheetCategory.documentCount} {t("common.documents")}
      </p>
      
      <div className="space-y-2">
        <Button
          onClick={() => {
            setShowActionSheet(false);
            handleDeleteClick(actionSheetCategory, {} as any);
          }}
          variant="destructive"
          className="w-full"
        >
          {t("vault.deleteCategory")}
        </Button>
        
        <Button
          onClick={() => setShowActionSheet(false)}
          variant="outline"
          className="w-full"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  </div>
)}
```

### Category Button Integration

```tsx
<button
  onClick={() => !isLongPressing && navigate(`/vault/${category.id}`)}
  onTouchStart={(e) => handlePressStart(category, e)}
  onTouchEnd={handlePressEnd}
  onTouchMove={handlePressMove}
  onMouseDown={(e) => handlePressStart(category, e)}
  onMouseUp={handlePressEnd}
  onMouseLeave={handlePressEnd}
  onContextMenu={(e) => e.preventDefault()}
  className={`w-full bg-accent rounded-2xl glass-category transition-transform duration-150 ${
    isLongPressing ? 'scale-95' : 'scale-100'
  }`}
>
  {/* Category content */}
</button>
```

## Data Models

No data model changes required. This is a UI interaction enhancement.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Long-Press Threshold

*For any* press interaction on a custom category, if the press duration is less than 500ms, the system should navigate to the category; if 500ms or more, the system should show the action sheet.

**Validates: Requirements 1.1, 1.3**

### Property 2: Custom Category Only

*For any* category in the vault, the long-press action sheet should only appear for custom categories (isCustom === true), never for default categories.

**Validates: Requirements 1.4**

### Property 3: Timer Cleanup

*For any* long-press interaction that is cancelled (finger lifted, moved away, or mouse left), the timer should be cleared to prevent memory leaks and unintended action sheets.

**Validates: Requirements 1.5**

## Error Handling

### Edge Cases

1. **Rapid Taps**: If user taps rapidly, ensure timers are properly cleared
2. **Scroll During Press**: If user starts scrolling while pressing, cancel the long-press
3. **Multiple Simultaneous Presses**: Only handle one long-press at a time
4. **Action Sheet Open During Delete**: Prevent multiple action sheets from opening

### Error Recovery

- If delete operation fails, show error toast and keep category visible
- If action sheet fails to render, fall back to direct delete confirmation
- Clear all timers on component unmount to prevent memory leaks

## Testing Strategy

### Manual Testing

1. **Long-Press Detection**
   - Press and hold custom category for 500ms → action sheet appears
   - Press and release before 500ms → navigates to category
   - Press default category for 500ms → no action sheet

2. **Action Sheet Interaction**
   - Tap "Delete Category" → confirmation dialog appears
   - Tap "Cancel" → action sheet dismisses
   - Tap outside action sheet → dismisses without action

3. **Visual Feedback**
   - During press → category scales down slightly
   - Action sheet appears → slides up animation
   - Action sheet dismisses → slides down animation

4. **Cross-Device Testing**
   - Test on iOS device (touch events)
   - Test on Android device (touch events)
   - Test on desktop with mouse (mouse events)
   - Test on tablet (touch events)

5. **Edge Cases**
   - Rapid tapping → no action sheet
   - Scroll while pressing → cancels long-press
   - Move finger away → cancels long-press
   - Multiple categories → only one action sheet at a time

### Test Cases

1. **Custom Category Long-Press**
   - Navigate to /vault
   - Long-press on a custom category
   - Verify action sheet appears with category name
   - Verify "Delete Category" and "Cancel" buttons

2. **Default Category Long-Press**
   - Navigate to /vault
   - Long-press on a default category (e.g., "Personal Documents")
   - Verify no action sheet appears
   - Verify normal navigation works

3. **Delete Flow**
   - Long-press custom category
   - Tap "Delete Category"
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify category is removed

## Implementation Notes

### Long-Press Duration

- Standard: 500ms (iOS/Android convention)
- Can be adjusted if needed for UX

### Visual Feedback

- Scale down to 95% during press
- Smooth transition (150ms duration)
- Action sheet slides up from bottom (300ms duration)

### Performance Considerations

- Use `setTimeout` for timer (lightweight)
- Clear timers on unmount with `useEffect` cleanup
- Prevent default context menu to avoid conflicts
- Use `e.stopPropagation()` on action sheet to prevent backdrop clicks

### Accessibility

- Action sheet is keyboard accessible (Tab navigation)
- Buttons have proper focus states
- Screen readers announce action sheet content
- Alternative: Consider adding a visible three-dot menu for accessibility

### Mobile Optimization

- Prevent text selection during long-press
- Prevent default touch behaviors
- Consider adding haptic feedback (Capacitor Haptics plugin)
- Test on various screen sizes

## Future Enhancements

1. **Haptic Feedback**: Add vibration when long-press is detected
2. **Additional Actions**: Add "Rename Category" option to action sheet
3. **Customizable Duration**: Allow users to adjust long-press duration in settings
4. **Visual Progress**: Show a circular progress indicator during the 500ms
5. **Accessibility Menu**: Add optional three-dot menu for users who prefer visible controls
