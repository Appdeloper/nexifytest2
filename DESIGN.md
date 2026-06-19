---
name: Nexify Connect Premium Cyber-Glass System
version: 1.0.0
colors:
  background: '#0D0D0D' # AMOLED Deep Black
  surface: 'rgba(22, 17, 40, 0.45)' # Translucent Deep Indigo (Glass Card Background)
  border: 'rgba(255, 255, 255, 0.08)' # Cyber-Thin Translucent Border
  accent_cyan: '#00F2FE' # Neon Cyber Cyan (Glows and Active States)
  accent_purple: '#9B51E0' # Neon Cyber Purple (Glows and Secondary Accents)
  accent_red: '#FF4D4D' # Alert/Destructive actions
  text_primary: '#FFFFFF' # Pure White
  text_muted: '#A0A0C0' # Soft Blue-Gray Muted Text
typography:
  font_family: 'Inter, SF Pro Display, system-ui, sans-serif'
  font_sizes:
    title_large: '24px'
    title_medium: '18px'
    body_large: '15px'
    body_medium: '13px'
    caption: '10px'
shadows:
  glow_cyan: '0 0 15px rgba(0, 242, 254, 0.35)'
  glow_purple: '0 0 15px rgba(155, 81, 224, 0.35)'
  glass_shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
---

# Nexify Connect Design System (Google Stitch Format)

This design system dictates a cyber-premium, futuristic, dark-themed experience with heavy use of glassmorphism, glowing borders, and neon indicators. It is the absolute source of truth for UI generation.

## 🎨 Visual Identity & Principles

1. **Aesthetic Tone**: High-tech, futuristic, clean, and extremely premium. Avoid generic flat or solid panels. 
2. **Glassmorphism**: Surfaces must feel like translucent sheets of frosted glass floating above an AMOLED abyss.
3. **Neon Accents**: Cyan and purple are used as active indicators, key CTAs, and focus glows. Never use plain primary colors (solid red/green/blue).

---

## 📐 Layout & Spacing
- **Outer Padding**: Always use a consistent padding of `16px` to `20px` for screen containers.
- **Card Spacing**: Spacing between card groups should be strictly `12px` to `16px`.
- **Safe Area**: Maintain safe area buffers for notches, home indicators, and keyboards.

---

## 🧱 Component Styling Rules

### 1. Cards (Surfaces)
- **Background**: `rgba(22, 17, 40, 0.45)` with a backdrop blur of `16px`.
- **Border**: Solid `1px` border of `rgba(255, 255, 255, 0.08)` to define the glass sheet.
- **Rounding**: `RoundedCornerShape(16.dp)` or `16px` border-radius.

### 2. Buttons & CTAs
- **Gradients**: Accent buttons should use a horizontal gradient from `#9B51E0` (Purple) to `#00F2FE` (Cyan).
- **Interactive State**: Add a subtle hover/press scale-shrink trigger (`0.97x` scale transition) and active glowing shadow.
- **Borders**: Hollow buttons should use a `1.5px` border of `rgba(0, 242, 254, 0.3)` with white or cyan text.

### 3. Inputs & Forms
- **Fields**: Background of `rgba(22, 17, 40, 0.2)` with a `1px` translucent border.
- **Active Focus**: When focused, the border transitions to solid `#00F2FE` (Cyan) and projects a soft `glow_cyan` backdrop glow.

### 4. Avatars & Indicators
- **Shape**: Smooth circular avatar frames.
- **Status Indicators**: Active indicators (e.g. online dot) should be `#10B981` (Emerald Green) floating over the bottom-right corner of the avatar with a `#0D0D0D` mask border.

---

## ⚠️ Design Don'ts (Strict Constraints)
- **NO Plain Backgrounds**: Never use solid grey or pure white backgrounds.
- **NO Raw Colors**: Do not use primary red (`#FF0000`), green (`#00FF00`), or blue (`#0000FF`). Use the specified HSL/hex neon overrides.
- **NO Sharp Edges**: All interactive components must have a minimum rounding of `8px`, preferably `12px` to `16px`.
- **NO Heavy Drop Shadows**: Use soft glows (`glow_cyan` / `glow_purple`) instead of heavy black shadows.
