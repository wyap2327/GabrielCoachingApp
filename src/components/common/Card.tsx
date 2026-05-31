/**
 * Card.tsx — Surface container for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - When onPress is provided the card wraps its children in TouchableOpacity,
 *   giving the full card a tap target. This avoids the anti-pattern of making
 *   only the title or icon tappable, which fails accessibility minimum target
 *   size requirements (44x44pt per Apple HIG).
 * - The `padding` prop (default true) lets callers opt out of the standard
 *   inner padding when they need edge-to-edge content (e.g. an image header).
 * - Shadow is sm by default — cards are the most common surface so we use the
 *   lowest level. Escalate to md/lg only for modals and bottom sheets.
 * - We use `activeOpacity={0.92}` (not the RN default 0.2) so the press
 *   feedback is subtle — aggressive dimming looks cheap on light UIs.
 */

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { colors, radius } from '@/styles/global';
import { shadows } from '@/styles/shadows';
import { spacing } from '@/styles/spacing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardProps {
    children: React.ReactNode;
    /** When provided, wraps the card in a TouchableOpacity. */
    onPress?: () => void;
    /** Include standard inner padding (default: true). */
    padding?: boolean;
    /** Additional styles merged onto the card container. */
    style?: StyleProp<ViewStyle>;
    /** Accessibility label for tappable cards. */
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Card: React.FC<CardProps> = ({
    children,
    onPress,
    padding = true,
    style,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const cardStyle: StyleProp<ViewStyle> = [
        styles.card,
        padding && styles.padded,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.92}
                style={cardStyle}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
            {children}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        // Spread shadow tokens — includes both iOS shadow props and Android elevation.
        ...shadows.sm,
        // A hairline border gives cards a crisp edge on very bright screens
        // without relying solely on shadow (which Android elevation renders differently).
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        // Overflow hidden clips children to the rounded corners.
        overflow: 'hidden',
    },
    padded: {
        padding: spacing.base,
    },
});

export default Card;
