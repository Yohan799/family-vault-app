# Design Document: Auth Glowing Logo

## Overview

This design adds a glowing shield logo to the sign-in and sign-up screens, matching the visual style from the onboarding screens. The logo features nested circular backgrounds with gradient effects and pulse animations to create an engaging, premium feel.

## Architecture

The implementation involves updating the existing shield icon sections on both auth screens to include:
1. Nested div structure with layered circular backgrounds
2. Gradient backgrounds using Tailwind's gradient utilities
3. CSS animations for pulse effects
4. Shadow effects for the glow appearance

## Components and Interfaces

### Affected Components

1. **SignIn.tsx**
   - Current: Simple shield icon in a circular background
   - Updated: Nested circles with gradients and animations

2. **SignUp.tsx**
   - Current: Simple shield icon in a circular background
   - Updated: Nested circles with gradients and animations

### Logo Structure

```tsx
<div className="flex justify-center">
  {/* Outer circle with gradient and shadow */}
  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center shadow-lg shadow-primary/10">
    {/* Inner circle with gradient and pulse animation */}
    <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center animate-pulse">
      {/* Shield icon */}
      <Shield className="w-8 h-8 text-primary" />
    </div>
  </div>
</div>
```

## Data Models

No data model changes required. This is a pure UI enhancement.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Logo Consistency

*For any* authentication screen (onboarding, sign-in, sign-up), the glowing logo should have the same visual structure with nested circles, gradients, and animations.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Visual Hierarchy

*For any* auth screen with the glowing logo, the logo should be visually prominent but not interfere with form elements or user interactions.

**Validates: Requirements 2.5, 3.5**

### Property 3: Animation Smoothness

*For any* glowing logo instance, the pulse animation should run continuously and smoothly without performance degradation.

**Validates: Requirements 1.4, 2.2, 3.3**

## Error Handling

No error handling required. This is a visual enhancement with no functional logic.

## Testing Strategy

### Manual Testing

Since this is a visual enhancement, testing will be manual:

1. **Visual Verification**
   - Compare logo appearance across onboarding, sign-in, and sign-up screens
   - Verify gradient colors match the design
   - Confirm pulse animation is smooth and continuous
   - Check shadow effects create the desired glow

2. **Responsive Testing**
   - Test on different screen sizes (mobile, tablet, desktop)
   - Verify logo scales appropriately
   - Ensure spacing is consistent

3. **Cross-Screen Consistency**
   - Navigate between onboarding → sign-up → sign-in
   - Verify visual consistency across all screens
   - Check that logo positioning is centered

### Test Cases

1. **Sign-In Screen**
   - Navigate to /signin
   - Verify glowing logo is displayed above the form
   - Confirm nested circles with gradients
   - Verify pulse animation on inner circle
   - Check shadow glow effect

2. **Sign-Up Screen**
   - Navigate to /signup
   - Verify glowing logo is displayed above the form
   - Confirm visual consistency with sign-in screen
   - Verify animations work correctly

3. **Comparison with Onboarding**
   - View onboarding screen
   - Compare logo styling with auth screens
   - Verify consistent sizing and colors

## Implementation Notes

### Changes Required

1. **SignIn.tsx**
   - Replace the simple shield icon section (lines ~105-109)
   - Add nested div structure with gradients
   - Apply shadow and animation classes

2. **SignUp.tsx**
   - Replace the simple shield icon section (lines ~145-149)
   - Add nested div structure with gradients
   - Apply shadow and animation classes

### Sizing

- Outer circle: `w-20 h-20` (80px)
- Inner circle: `w-16 h-16` (64px)
- Shield icon: `w-8 h-8` (32px)

### Colors and Effects

- Outer gradient: `from-primary/20 to-primary/5`
- Inner gradient: `from-primary/30 to-primary/10`
- Shadow: `shadow-lg shadow-primary/10`
- Animation: `animate-pulse` on inner circle

### Accessibility

- Logo is decorative, no alt text needed
- Does not interfere with form accessibility
- Maintains sufficient contrast for visibility

## Performance Impact

Minimal performance impact:
- CSS animations are GPU-accelerated
- No JavaScript required for animations
- Static gradients have no runtime cost
