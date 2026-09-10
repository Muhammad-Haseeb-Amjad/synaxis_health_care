---
name: Synaxis Health
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#23acf1'
  on-tertiary-container: '#003d59'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width: 280px
  container_max_width: 1440px
  gutter: 24px
  margin_desktop: 40px
  margin_mobile: 16px
  base_unit: 8px
---

## Brand & Style
The design system for this platform reflects a high-tech, medical distribution aesthetic that balances life-saving reliability with cutting-edge software. The style is a refined **Glassmorphism**, utilizing deep atmospheric layering, frosted glass surfaces, and subtle luminous accents.

The target audience is healthcare administrators and logistics managers who require clarity in high-stakes environments. The emotional response is one of calm authority, precision, and technological sophistication. Visual interest is generated through light refraction and "glow-state" interactive elements, moving away from flat enterprise norms toward a more immersive, depth-driven interface.

## Colors
The palette is rooted in a fixed dark-mode environment to reduce eye strain and provide a premium "command center" feel.

- **Primary (Vibrant Teal):** Used for successful status indicators, primary actions, and critical data points.
- **Secondary (Electric Violet):** Used for advanced analytics, secondary accents, and interactive "glow" effects.
- **Base (Deep Navy/Charcoal):** The foundation of the UI, providing a high-contrast backdrop for glass surfaces.
- **Accents:** Gradients transition from Primary to Secondary to denote motion or progress. Surfaces utilize a semi-transparent white or primary-tinted overlay to achieve the glass effect.

## Typography
The system uses a dual-font approach. **Manrope** is used for headlines to provide a modern, slightly geometric character that feels refined. **Inter** is utilized for body text and interface labels to ensure maximum legibility for dense medical data and tabular information.

For mobile screens, `display-lg` should downscale to 32px and `headline-lg` to 24px to maintain readability within smaller viewport constraints. High-contrast white is reserved for primary headers, while secondary text uses a 60-70% opacity white to maintain hierarchy.

## Layout & Spacing
The layout follows a **Fixed Sidebar** model with a fluid main content area. This ensures that the global navigation is always accessible for rapid switching between distribution channels and patient data.

- **Sidebar:** Fixed at 280px with a high-blur glass effect.
- **Grid:** 12-column system for the main content area.
- **Rhythm:** An 8px base unit drives all padding and margins. Generous whitespace (minimum 32px between major sections) is mandatory to prevent the glass surfaces from feeling cluttered.
- **Breakpoints:** Mobile (under 768px) collapses the sidebar into a hamburger menu and reduces side margins to 16px.

## Elevation & Depth
Depth in this design system is achieved through light and transparency rather than heavy shadows.

1.  **Base Layer:** The solid #0F172A background.
2.  **Mid Layer (Containers):** Semi-transparent surfaces with a 20px-40px backdrop blur and a 1px "inner-glow" border (White @ 10% opacity) to define edges.
3.  **Top Layer (Modals/Popovers):** Higher transparency with a subtle secondary color shadow (Electric Violet @ 15% opacity) to create a "floating" effect.
4.  **Interactive Glow:** On hover, cards and buttons should emit a soft radial gradient glow from the cursor position or the element center to indicate focus.

## Shapes
The shape language is sophisticated and approachable. All primary containers and buttons use a medium roundedness (0.5rem / 8px). 

Large dashboard "Glass Cards" utilize `rounded-xl` (1.5rem / 24px) to emphasize the soft, fluid nature of the glass material. Iconic elements or status pips should remain perfectly circular to contrast with the structured grid.

## Components
- **Glass Cards:** The primary container. Must have a `backdrop-filter: blur(20px)`, a subtle 1px border, and a linear gradient background from `rgba(255,255,255, 0.05)` to `transparent`.
- **Buttons:**
    - *Primary:* Solid Teal to Emerald gradient with a white text label. 
    - *Secondary:* Ghost style with a teal border and a soft glow on hover.
- **Inputs:** Darker than the background with a 1px border that illuminates in Teal when focused.
- **Chips/Badges:** Small, pill-shaped elements with low-opacity background fills (e.g., Status: Active = Teal fill at 15% opacity, Teal text).
- **Sidebar Nav:** High-blur background. Active states should use a vertical "light bar" on the left edge and a subtle gradient background behind the menu item.
- **Data Visualization:** Line charts should use "glow-paths"—thick lines with a drop-shadow of the same color to simulate neon light.