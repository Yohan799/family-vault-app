# Design Document: Vault Glassmorphism

## Overview

This design document specifies the implementation of glassmorphism (frosted glass) visual effects for the vault interface. The design creates a progressive depth hierarchy using semi-transparent backgrounds with backdrop blur, subtle borders, and soft shadows. The implementation leverages Tailwind CSS utilities and custom CSS classes to ensure consistency, performance, and maintainability.

## Architecture

### Component Structure

```
Vault Interface
├── VaultHome (Categories)
│   ├── Category Cards (Level 1 Glass)
│   ├── Custom Category Cards (Level 1 Glass)
│   └── Add Category Button (Light Glass)
├── CategoryView (Subcategories)
│   ├── Subcategory Cards (Level 2 Glass)
│   ├── Custom Subcategory Cards (Level 2 Glass)
│   └── Add Subcategory Button (Light Glass)
└── NestedFolderView (Folders)
    ├── Folder Cards (Level 3 Glass)
    ├── Custom Folder Cards (Level 3 Glass)
    └── Add Folder Button (Light Glass)
```

### Design Principles

1. **Progressive Depth**: Each level increases in glassmorphism intensity
2. **Performance First**: Use GPU-accelerated properties and CSS containment
3. **Accessibility**: Maintain WCAG 2.1 AA contrast ratios
4. **Responsive**: Optimize for mobile with reduced blur on smaller devices
5. **Graceful Degradation**: Fallback to solid backgrounds when backdrop-filter unsupported

## Components and Interfaces

### 1. Glassmorphism Utility Classes

Create reusable Tailwind CSS utility classes in `src/index.css`:

```css
@layer utilities {
  /* Level 1: Category Cards - Subtle Glass */
  .glass-category {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: backdrop-filter 200ms ease-in-out, 
                box-shadow 200ms ease-in-out,
                transform 150ms ease-in-out;
  }

  .glass-category:hover {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .glass-category:active {
    transform: scale(0.98);
  }

  /* Level 2: Subcategory Cards - Medium Glass */
  .glass-subcategory {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transition: backdrop-filter 200ms ease-in-out, 
                box-shadow 200ms ease-in-out,
                transform 150ms ease-in-out;
  }

  .glass-subcategory:hover {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .glass-subcategory:active {
    transform: scale(0.98);
  }

  /* Level 3: Folder Cards - Strong Glass */
  .glass-folder {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: backdrop-filter 200ms ease-in-out, 
                box-shadow 200ms ease-in-out,
                transform 150ms ease-in-out;
  }

  .glass-folder:hover {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .glass-folder:active {
    transform: scale(0.98);
  }

  /* Add Button - Light Glass */
  .glass-add-button {
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: backdrop-filter 200ms ease-in-out,
                box-shadow 200ms ease-in-out,
                transform 150ms ease-in-out;
  }

  .glass-add-button:hover {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .glass-add-button:active {
    transform: scale(0.98);
  }

  /* Mobile Optimization - Reduced Blur */
  @media (max-width: 768px) {
    .glass-category {
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .glass-category:hover {
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
    }

    .glass-subcategory {
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
    }

    .glass-subcategory:hover {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .glass-folder {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .glass-folder:hover {
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
    }

    .glass-add-button {
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .glass-add-button:hover {
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
    }
  }

  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    .glass-category,
    .glass-subcategory,
    .glass-folder,
    .glass-add-button {
      transition: none;
    }
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .glass-category,
    .glass-subcategory,
    .glass-folder {
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
  }

  /* Fallback for browsers without backdrop-filter support */
  @supports not (backdrop-filter: blur(1px)) {
    .glass-category,
    .glass-subcategory,
    .glass-folder,
    .glass-add-button {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      /* Keep existing background colors, just remove blur */
    }
  }

  /* Performance Optimization */
  .glass-category,
  .glass-subcategory,
  .glass-folder,
  .glass-add-button {
    will-change: backdrop-filter, transform;
    contain: layout style paint;
  }
}
```

### 2. Component Integration

#### VaultHome.tsx - Category Cards

Keep existing background colors and add glass effect:

**Before:**
```tsx
className="w-full bg-accent rounded-2xl tile-premium"
```

**After:**
```tsx
className="w-full bg-accent rounded-2xl glass-category"
```

**Add Button Before:**
```tsx
className="bg-accent border-2 border-dashed border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center tile-premium min-h-[140px]"
```

**Add Button After:**
```tsx
className="bg-accent border-2 border-dashed border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center glass-add-button min-h-[140px]"
```

#### CategoryView.tsx - Subcategory Cards

Keep existing background colors and add glass effect:

**Before:**
```tsx
className="w-full h-full bg-accent rounded-2xl p-5 flex flex-col items-center justify-between tile-premium min-h-[160px]"
```

**After:**
```tsx
className="w-full h-full bg-accent rounded-2xl p-5 flex flex-col items-center justify-between glass-subcategory min-h-[160px]"
```

**Add Button Before:**
```tsx
className="bg-accent border-2 border-dashed border-primary rounded-2xl p-5 flex flex-col items-center justify-center tile-premium min-h-[160px]"
```

**Add Button After:**
```tsx
className="bg-accent border-2 border-dashed border-primary rounded-2xl p-5 flex flex-col items-center justify-center glass-add-button min-h-[160px]"
```

#### NestedFolderView.tsx - Folder Cards

Keep existing background colors and add glass effect:

**Before:**
```tsx
className="w-full bg-[#DBEAFE] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
```

**After:**
```tsx
className="w-full bg-[#DBEAFE] rounded-2xl p-5 flex flex-col items-center justify-center glass-folder"
```

**Add Button Before:**
```tsx
className="bg-[#DBEAFE] border-2 border-dashed border-[#2563EB] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
```

**Add Button After:**
```tsx
className="bg-[#DBEAFE] border-2 border-dashed border-[#2563EB] rounded-2xl p-5 flex flex-col items-center justify-center glass-add-button"
```

## Data Models

### Glassmorphism Configuration

```typescript
interface GlassmorphismConfig {
  level: 'category' | 'subcategory' | 'folder' | 'add-button';
  baseOpacity: number;
  blurAmount: number;
  hoverBlurAmount: number;
  borderOpacity: number;
  shadowIntensity: 'light' | 'medium' | 'strong';
  customColor?: string;
}

const GLASS_CONFIGS: Record<string, GlassmorphismConfig> = {
  category: {
    level: 'category',
    baseOpacity: 0.05,
    blurAmount: 8,
    hoverBlurAmount: 12,
    borderOpacity: 0.2,
    shadowIntensity: 'light'
  },
  subcategory: {
    level: 'subcategory',
    baseOpacity: 0.08,
    blurAmount: 12,
    hoverBlurAmount: 16,
    borderOpacity: 0.25,
    shadowIntensity: 'medium'
  },
  folder: {
    level: 'folder',
    baseOpacity: 0.10,
    blurAmount: 16,
    hoverBlurAmount: 20,
    borderOpacity: 0.3,
    shadowIntensity: 'strong'
  },
  addButton: {
    level: 'add-button',
    baseOpacity: 0.03,
    blurAmount: 6,
    hoverBlurAmount: 10,
    borderOpacity: 0.15,
    shadowIntensity: 'light'
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Glass Effect Consistency

*For any* vault card (category, subcategory, or folder), when rendered, the glassmorphism effect should include all required CSS properties: semi-transparent background, backdrop-filter blur, border with specified opacity, and appropriate shadow.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4**

### Property 2: Progressive Depth Hierarchy

*For any* sequence of cards from category → subcategory → folder, the backdrop blur amount should increase monotonically (category < subcategory < folder).

**Validates: Requirements 1.2, 2.2, 3.2**

### Property 3: Hover State Enhancement

*For any* vault card, when hovered, the backdrop blur and shadow intensity should increase smoothly with the specified transition duration.

**Validates: Requirements 1.5, 1.6, 2.5, 2.6, 3.5, 3.6, 7.1, 7.2**

### Property 4: Accessibility Contrast Preservation

*For any* card with glassmorphism applied, the text contrast ratio should remain at or above 4.5:1 (WCAG AA standard).

**Validates: Requirements 1.7, 2.7, 3.7, 8.1, 8.2**

### Property 5: Mobile Performance Optimization

*For any* viewport width less than 768px, the backdrop blur values should be reduced by approximately 25% compared to desktop values.

**Validates: Requirements 5.1, 9.1**

### Property 6: Browser Fallback Graceful Degradation

*For any* browser that does not support backdrop-filter, the system should apply a solid background with high opacity (≥ 0.85) as a fallback.

**Validates: Requirements 5.4, 10.1, 10.5**

### Property 7: Reduced Motion Compliance

*For any* user with prefers-reduced-motion enabled, all glassmorphism transitions should be disabled.

**Validates: Requirements 8.3**

### Property 8: Touch Target Minimum Size

*For any* interactive card element, the minimum touch target size should be 44x44 pixels on mobile devices.

**Validates: Requirements 5.3**

### Property 9: Animation Performance

*For any* glassmorphism hover transition, the animation should use GPU-accelerated properties (transform, opacity, backdrop-filter) and maintain 60fps.

**Validates: Requirements 7.5, 9.1, 9.2**

### Property 10: Existing Color Preservation

*For any* vault card with glassmorphism applied, the existing background color should be preserved and only backdrop-filter, border, and shadow effects should be added.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### 1. Backdrop-Filter Support Detection

```typescript
function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false;
  
  const testElement = document.createElement('div');
  testElement.style.backdropFilter = 'blur(1px)';
  testElement.style.webkitBackdropFilter = 'blur(1px)';
  
  const supportsStandard = testElement.style.backdropFilter !== '';
  const supportsWebkit = testElement.style.webkitBackdropFilter !== '';
  
  return supportsStandard || supportsWebkit;
}

// Apply fallback class if not supported
if (!supportsBackdropFilter()) {
  document.documentElement.classList.add('no-backdrop-filter');
}
```

### 2. Performance Monitoring

```typescript
function monitorGlassPerformance() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16.67) { // Below 60fps
          console.warn('Glass effect causing performance issues:', entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
}
```

### 3. Contrast Ratio Validation

```typescript
function validateContrastRatio(backgroundColor: string, textColor: string): boolean {
  // Calculate relative luminance
  const getLuminance = (color: string): number => {
    // Implementation of WCAG luminance calculation
    // ...
    return 0; // placeholder
  };
  
  const bgLuminance = getLuminance(backgroundColor);
  const textLuminance = getLuminance(textColor);
  
  const ratio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                (Math.min(bgLuminance, textLuminance) + 0.05);
  
  return ratio >= 4.5; // WCAG AA standard
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific glassmorphism behaviors and edge cases:

1. **CSS Class Application**
   - Test that correct glass classes are applied to each card type
   - Test that fallback classes are applied when backdrop-filter unsupported
   - Test that mobile-specific classes are applied on small viewports

2. **Color Utility Functions**
   - Test `getGlassBackgroundColor` with various color formats (hex, rgb, hsl)
   - Test `getGlassStyle` returns correct opacity for each level
   - Test custom color integration with glassmorphism

3. **Accessibility Validation**
   - Test contrast ratio calculation function
   - Test that text remains readable on glass backgrounds
   - Test focus indicators remain visible

4. **Browser Support Detection**
   - Test `supportsBackdropFilter` function
   - Test fallback application when support is false
   - Test webkit prefix handling for Safari

### Property-Based Tests

Property-based tests will verify universal behaviors across all glassmorphism implementations. Each test should run a minimum of 100 iterations.

1. **Property Test: Glass Effect Consistency**
   - Generate random card types (category, subcategory, folder)
   - Verify all required CSS properties are present
   - Tag: **Feature: vault-glassmorphism, Property 1: Glass Effect Consistency**

2. **Property Test: Progressive Depth Hierarchy**
   - Generate sequences of nested cards
   - Verify blur values increase monotonically
   - Tag: **Feature: vault-glassmorphism, Property 2: Progressive Depth Hierarchy**

3. **Property Test: Hover State Enhancement**
   - Generate random card types
   - Simulate hover events
   - Verify blur and shadow increase
   - Tag: **Feature: vault-glassmorphism, Property 3: Hover State Enhancement**

4. **Property Test: Accessibility Contrast Preservation**
   - Generate random background colors
   - Apply glassmorphism with various opacities
   - Verify contrast ratio ≥ 4.5:1
   - Tag: **Feature: vault-glassmorphism, Property 4: Accessibility Contrast Preservation**

5. **Property Test: Mobile Performance Optimization**
   - Generate random viewport widths
   - Verify blur reduction on mobile (< 768px)
   - Tag: **Feature: vault-glassmorphism, Property 5: Mobile Performance Optimization**

6. **Property Test: Browser Fallback Graceful Degradation**
   - Mock backdrop-filter support as false
   - Verify solid background fallback applied
   - Verify opacity ≥ 0.85
   - Tag: **Feature: vault-glassmorphism, Property 6: Browser Fallback Graceful Degradation**

7. **Property Test: Existing Color Preservation**
   - Generate random card types
   - Apply glassmorphism
   - Verify background color remains unchanged
   - Verify only backdrop-filter, border, and shadow are added
   - Tag: **Feature: vault-glassmorphism, Property 10: Existing Color Preservation**

### Integration Tests

1. **VaultHome Integration**
   - Render VaultHome with multiple categories
   - Verify all category cards have glass effects
   - Verify add button has light glass effect
   - Test hover interactions

2. **CategoryView Integration**
   - Render CategoryView with multiple subcategories
   - Verify all subcategory cards have glass effects
   - Verify glass intensity is greater than categories
   - Test hover interactions

3. **NestedFolderView Integration**
   - Render NestedFolderView with multiple folders
   - Verify all folder cards have glass effects
   - Verify glass intensity is greatest at this level
   - Test hover interactions

4. **Cross-Browser Testing**
   - Test on Chrome (backdrop-filter supported)
   - Test on Safari (webkit prefix required)
   - Test on Firefox (backdrop-filter supported)
   - Test on older browsers (fallback required)

5. **Performance Testing**
   - Render 20+ cards with glassmorphism
   - Measure scroll performance (should maintain 60fps)
   - Measure hover transition performance
   - Test on mobile devices

### Visual Regression Tests

1. **Screenshot Comparison**
   - Capture screenshots of category cards with glass effects
   - Capture screenshots of subcategory cards with glass effects
   - Capture screenshots of folder cards with glass effects
   - Compare against baseline images

2. **Hover State Verification**
   - Capture screenshots of cards in hover state
   - Verify blur and shadow increase
   - Compare against baseline hover images

3. **Mobile Responsive Verification**
   - Capture screenshots at 375px, 768px, 1024px widths
   - Verify glass effects scale appropriately
   - Compare against baseline responsive images

## Implementation Notes

### Performance Considerations

1. **CSS Containment**: Use `contain: layout style paint` to isolate glass effects
2. **Will-Change**: Apply `will-change: backdrop-filter, transform` for hover optimization
3. **Lazy Loading**: Consider lazy-loading glass effects for cards below the fold
4. **GPU Acceleration**: Ensure all animations use GPU-accelerated properties

### Browser Compatibility

- **Chrome/Edge**: Full support for backdrop-filter
- **Safari**: Requires -webkit-backdrop-filter prefix
- **Firefox**: Full support for backdrop-filter (v103+)
- **Older Browsers**: Graceful degradation to solid backgrounds

### Accessibility Checklist

- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Icon contrast ratio ≥ 3:1 (WCAG AA)
- [ ] Focus indicators visible (2px solid outline)
- [ ] Reduced motion support (disable transitions)
- [ ] High contrast mode support (increase border opacity)
- [ ] Touch targets ≥ 44x44px on mobile

### Mobile Optimization

- Reduce blur values by 25% on viewports < 768px
- Test on actual devices (iOS Safari, Android Chrome)
- Monitor battery impact of backdrop-filter
- Consider disabling glass effects on low-end devices
