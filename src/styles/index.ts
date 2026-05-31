/**
 * styles/index.ts — Barrel export for the design token system.
 *
 * Instead of writing:
 *   import { colors }    from '@/styles/global';
 *   import { typography } from '@/styles/typography';
 *   import { spacing }   from '@/styles/spacing';
 *   import { shadows }   from '@/styles/shadows';
 *
 * Any file in the app can now write:
 *   import { colors, typography, spacing, shadows, radius, layout } from '@/styles';
 */

export { colors, radius, globalStyles } from './global';
export { typography, fontSizes, lineHeights } from './typography';
export { spacing, layout } from './spacing';
export { shadows } from './shadows';
