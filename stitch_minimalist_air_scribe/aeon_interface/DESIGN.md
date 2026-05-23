---
name: Aeon Interface
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6cb'
  on-secondary: '#2f3034'
  secondary-container: '#46464b'
  on-secondary-container: '#b5b4ba'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e7'
  secondary-fixed-dim: '#c6c6cb'
  on-secondary-fixed: '#1a1b1f'
  on-secondary-fixed-variant: '#46464b'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-sm: 16px
  margin-md: 40px
  margin-lg: 80px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for a futuristic air-writing interface, prioritizing spatial clarity and high-end utility. The brand personality is clinical, precise, and unobtrusive, functioning more as a professional tool than a lifestyle application. It targets power users and creatives who require a distraction-free environment where the interface recedes to highlight the user's input.

The aesthetic follows a **Refined Glassmorphism** movement. By utilizing monochromatic translucency, the UI maintains a sense of "presence" in a 3D spatial environment without blocking the user's field of view. Every element is designed with a utilitarian ethos—eschewing decorative flourishes for functional depth, structured hierarchies, and high-contrast legibility. The emotional response is one of calm, professional focus and technological sophistication.

## Colors

The palette is strictly monochromatic to ensure maximum focus on the air-writing content. 

- **Primary (Pure White):** Used for active states, primary text, and essential glyphs to ensure high visibility against dark or varied backgrounds.
- **Secondary (Mid-Gray):** Used for secondary information, inactive icons, and descriptive labels.
- **Neutral (Black/Near-Black):** Serves as the base for glass blurs and high-contrast background elements.
- **Surface Tints:** Varying levels of opacity (10% to 40%) applied to white and black surfaces to create the "glass" effect.

The default mode is **dark**, optimized for AR/VR environments where light-on-dark provides better legibility and reduced eye strain.

## Typography

This design system utilizes **Inter** for all primary interface elements due to its exceptional legibility and neutral, systematic character. To reinforce the "high-end creative tool" aesthetic, **JetBrains Mono** is used for labels, metadata, and technical readouts, providing a distinct functional contrast.

- **Headlines:** Set with tighter letter spacing and semi-bold weights to command attention.
- **Body:** Prioritizes breathability with a generous 1.6x line height for longer instructional text.
- **Labels:** Always uppercase when using JetBrains Mono to signify "System Data" or "Status."

## Layout & Spacing

The layout philosophy is based on a **Fluid Grid** with generous whitespace to ensure the interface never feels cluttered in a spatial context. 

- **The 8px Rule:** All dimensions, padding, and margins are multiples of 8px to maintain a rhythmic, systematic feel.
- **Spatial Margins:** On desktop/spatial view, containers use large 80px margins to "float" content in the center of the visual field.
- **Responsive Behavior:** On mobile/small viewports, margins compress to 16px, and multi-column technical panels reflow into a single-column stack.
- **Gutters:** A fixed 24px gutter ensures that even when the glass panels are transparent, the separation of information remains distinct.

## Elevation & Depth

Hierarchy is established through **Backdrop Blurs** and **Subtle Outlines** rather than heavy drop shadows.

1.  **Base Layer:** 0% opacity, used for the workspace background.
2.  **Surface Level:** 10-20% opacity black with a 20px backdrop blur. This is the standard panel background.
3.  **Floating Level:** 30% opacity black with a 40px backdrop blur and a 1px solid white border at 15% opacity. This is used for menus and popovers.
4.  **Shadows:** Shadows are "Ambient"—extremely soft, 0% offset, large spread (30px+), and low opacity (10%), used only to separate overlapping glass layers.

This "Stacked Glass" approach creates a sense of physical layering in a digital air-writing space.

## Shapes

The design system employs **Soft** (Level 1) roundedness. 

- **Components:** Standard buttons and inputs use a 0.25rem (4px) radius to maintain a professional, sharp look without being aggressive.
- **Panels/Cards:** Larger containers use 0.5rem (8px) to provide a subtle visual softening of the workspace.
- **Exceptions:** No pill shapes are used. All elements adhere to a strict rectangular geometry to emphasize the "professional OS" aesthetic.

## Components

- **Buttons:** 
    - *Primary:* Solid white background with black text. No transparency.
    - *Secondary:* Ghost style with 1px white border (30% opacity) and white text.
    - *State:* On hover, secondary buttons fill to 10% white opacity.
- **Input Fields:** 
    - Underlined or subtly boxed with 10% white background. 
    - Focus state: Border opacity increases to 100% white.
- **Chips/Tags:** 
    - Small, 4px rounded rectangles using JetBrains Mono. 
    - Used for "Tool Mode" or "Coordinate" indicators.
- **Cards/Panels:** 
    - Always feature the 20px backdrop blur. 
    - Header sections of panels are separated by a 1px white line at 10% opacity.
- **Lists:** 
    - Clean, no dividers. Hover states are indicated by a 5% white background fill that extends to the panel edges.
- **Checkboxes/Radios:** 
    - Strict squares and circles. When active, they are filled solid white with a "check" or "dot" knocked out in black.