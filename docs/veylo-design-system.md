# Veylo design system

The September 2026 Veylo theme adapts the supplied Phantom reference to the existing IELTS workspace. `src/app/styles/theme.css` owns the palette and semantic tokens. Components use those tokens instead of literal interface colors. The Vey mascot keeps its approved lavender volume, highlights, shadows and motion.

## Palette

| Color          | Hex       | Purpose                                                               |
| -------------- | --------- | --------------------------------------------------------------------- |
| Aubergine      | `#3C315B` | Headings, navigation, links, dark banners and game surfaces           |
| Ghost Lavender | `#E2DFFE` | Primary buttons, selected navigation, Listening and assistant bubbles |
| Periwinkle     | `#AB9FF2` | Vocabulary, secondary accents and progress on dark backgrounds        |
| Cornflower Pop | `#4A87F2` | Reading accents and small game markers                                |
| Buttercream    | `#FFFFC4` | Speaking, streak cards and daily-plan notices                         |
| Blush Mist     | `#FFDADC` | Writing and error surfaces                                            |
| Mint Signal    | `#2EC08B` | Positive progress and success indicators                              |
| Paper White    | `#FDFCFE` | Page canvas and text on dark surfaces                                 |
| White          | `#FFFFFF` | Card surfaces                                                         |
| Obsidian       | `#1C1C1C` | Body text                                                             |
| Fog            | `#86848D` | Decorative neutral tone                                               |
| Ash            | `#E9E8EA` | Separators and neutral tracks                                         |
| Bone           | `#F4F2F4` | Quiet nested surfaces                                                 |

## Functional colors

Pastel colors are surfaces, not small-text colors. Use the matching ink token for text and icons. Status information also uses labels or icons.

| Context                         | Surface                         | Text                              |
| ------------------------------- | ------------------------------- | --------------------------------- |
| Primary action                  | `--action`                      | `--action-ink`                    |
| Reading                         | `--reading-surface` (`#E9F0FE`) | `--reading-ink` (`#285BB0`)       |
| Listening                       | `--listening`                   | `--listening-ink` (`#65548E`)     |
| Writing                         | `--writing`                     | `--writing-ink` (`#864751`)       |
| Speaking                        | `--speaking`                    | `--speaking-ink` (`#74651F`)      |
| Vocabulary                      | `--vocabulary`                  | `--vocabulary-ink` (`#3C315B`)    |
| Success                         | `--success-surface` (`#E5F7EF`) | `--success` (`#176B52`)           |
| Error                           | `--danger-surface`              | `--danger` (`#A63C55`)            |
| Destructive action or recording | `--danger`                      | `--on-dark`                       |
| Dark banner                     | `--heading`                     | `--on-dark` and `--muted-on-dark` |

Muted readable text uses `#6E667D`. Primary-button hover uses `#D2CBFA`. Keyboard focus and light-surface progress use `#65548E`. Input borders use `#B5A9C9`, with a darker focus ring. Heatmaps step from Ghost Lavender through Periwinkle and lavender ink to Aubergine. Charts use distinct ink colors and keep their labels, legends and numerical values.

## Typography and geometry

- The original locally hosted fonts are restored: Nunito Sans for body text (Latin and Cyrillic) and OrbitDisplay for display headings. No font-provider network request.
- Font weights, letter spacing and line heights follow the original component typography, as requested after the palette update.
- Workspace headings retain their responsive 24–36 px scale. Landing headlines use the existing fluid display scale. Long reading passages keep their comfortable line height.
- Cards use 24 px radii; compact fields use 16 px; buttons, navigation items and tags use 100 px capsules. Circular icon controls and progress dots remain circular.
- Spacing follows a 4 px rhythm. Existing responsive layout constraints and content density determine card padding.
- Flat interface surfaces and borders replace decorative gradients and drop shadows. Primary controls may use a single `0 0 4px` lavender glow.

## Application rules

The previous red served several unrelated purposes. Large red banners now use Aubergine; ordinary red actions use Ghost Lavender; red status errors use the berry error tokens. Never perform a global replacement that conflates these roles.

Theme tokens also drive inline SVG charts, process diagrams, personality cards, introduction captions and the game canvas. Vey's SVG artwork has its own intentionally richer palette. Existing third-party logos retain their brand colors. Public feature previews are captured from the themed workspace.

Preserve keyboard focus, disabled-state visibility, reduced-motion behavior, mobile navigation, cursor tracking and audio-driven expressions when editing the theme.
