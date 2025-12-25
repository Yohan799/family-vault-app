# Implementation Plan: Auth Glowing Logo

## Overview

This plan adds a glowing shield logo to the sign-in and sign-up screens, matching the visual style from the onboarding screens with nested circles, gradients, and pulse animations.

## Tasks

- [x] 1. Update SignIn screen with glowing logo
  - Replace the simple shield icon section with nested circular structure
  - Add outer circle with gradient background (from-primary/20 to-primary/5)
  - Add inner circle with gradient background (from-primary/30 to-primary/10)
  - Apply pulse animation to inner circle
  - Add shadow effect (shadow-lg shadow-primary/10) to outer circle
  - Ensure shield icon is properly sized (w-8 h-8)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3_

- [x] 2. Update SignUp screen with glowing logo
  - Replace the simple shield icon section with nested circular structure
  - Apply the same gradient, animation, and shadow styles as SignIn
  - Ensure visual consistency with SignIn screen
  - Verify logo fits well with the sign-up form layout
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

- [x] 3. Manual testing checkpoint
  - Test SignIn screen: verify glowing logo appears correctly
  - Test SignUp screen: verify glowing logo appears correctly
  - Compare with Onboarding screen: verify visual consistency
  - Test pulse animation: ensure smooth continuous animation
  - Test on different screen sizes: verify responsive behavior
  - Verify logo doesn't interfere with form usability
  - Check shadow glow effect is visible
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

## Notes

- All changes are CSS/JSX modifications, no logic changes
- Use exact same structure as onboarding screen for consistency
- Sizing: outer circle 80px, inner circle 64px, icon 32px
- The pulse animation is built into Tailwind with `animate-pulse`
- No JavaScript animations needed - all CSS-based
- Focus on visual consistency across all three screens
