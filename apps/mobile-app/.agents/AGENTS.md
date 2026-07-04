# AHV Mobile App — Universal Styling Rules

All screens in the mobile app **must** follow these styling conventions to maintain visual
consistency across the entire application.

## Required Imports

Every screen file must import and use the theme hook:

```tsx
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
```

## Core Rules

1. **Always use `useTheme()`** — destructure `colors`, `typography`, `commonStyles` as needed.
2. **Never hardcode color hex values** — always reference `colors.*` tokens.
   - Exception: `'#ffffff'` is acceptable for text on primary-colored surfaces (buttons, branded gradients).
3. **Use design tokens for all numeric values**:
   - `SPACING.*` for padding, margin, and gap values.
   - `RADIUS.*` for borderRadius values.
   - `FONT_SIZE.*` for fontSize values.
4. **Use `typography.*`** for all text styles (fontSize, fontWeight, color, letterSpacing).
   Only override layout props (margins, textAlign) locally.
5. **Use `commonStyles.*`** for standard UI patterns:
   - `container`, `scroll`, `content`, `scrollContent` — screen layout
   - `card`, `cardPadded` — bordered card surfaces
   - `input` — text input fields
   - `button`, `buttonText`, `buttonDisabled`, `buttonOutline` — buttons
   - `badge`, `badgeText` — status badges
   - `listItem`, `listItemDivider` — list rows
   - `menuRow`, `menuDivider`, `menuLeft`, `menuRight` — settings menus
   - `filterTab`, `filterTabActive`, `filterText`, `filterTextActive` — filter pill tabs
   - `avatar`, `avatarSmall`, `avatarText` — circular avatars
   - `emptyContainer`, `emptyText` — empty state placeholders
   - `alertBanner`, `alertText` — warning/alert banners
   - `iconButton`, `chip`, `chipText` — icon buttons and tag-style chips
   - `sectionHeader` — title + action link row
   - `staticHeader` — pinned header above scroll
   - `center` — centered spinner/loading area
6. **Screen-specific styles** should only contain layout unique to that screen.
   If a pattern is used in ≥2 screens, move it to `buildCommonStyles()` in `theme.tsx`.
7. **Use the `createStyles(colors)` factory pattern** for screen-local styles that
   depend on theme colors. Wrap with `React.useMemo()` keyed on `colors`.

## Naming Conventions

- Style names use camelCase: `sectionTitle`, `cardPadded`, `filterTabActive`
- Token constants use UPPER_SNAKE_CASE: `SPACING`, `RADIUS`, `FONT_SIZE`
- Color tokens use descriptive names: `colors.successBg`, `colors.errorBorder`

## When Adding New Screens

1. Start with `commonStyles.container` as the root View style.
2. Use `commonStyles.scroll` + `commonStyles.scrollContent` for scrollable content.
3. Reference `typography.*` for all text elements.
4. Use `commonStyles.card` or `commonStyles.cardPadded` for card surfaces.
5. Check existing `commonStyles` before creating screen-local duplicates.
