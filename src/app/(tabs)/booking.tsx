import { Button } from '@/components/common/Button';
import {
  Booking,
  cancelBooking,
  getMyBookings,
} from '@/lib/bookingService';
import { colors, radius } from '@/styles/global';
import { shadows } from '@/styles/shadows';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Helpers — defined outside the component so they're not re-created on render.
// ---------------------------------------------------------------------------

/**
 * formatDate — turns "2026-06-02" into "Monday, 2 June".
 * Appending T00:00:00 forces local-time parsing; without it, the Date
 * constructor treats a bare YYYY-MM-DD as UTC midnight, which can shift
 * the displayed day by one depending on the device's timezone.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * formatTime — turns "09:30" or "09:30:00" into "9:30am".
 */
function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const minute = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${hour}:${minute}${suffix}`;
}

// ---------------------------------------------------------------------------
// BookingCard — renders a single upcoming session
// ---------------------------------------------------------------------------

interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
  onReschedule: (booking: Booking) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, onReschedule }) => {
  const isInPerson = booking.type === 'in-person';
  const durationLabel = booking.duration === 30 ? '30 min' : '1 hr';

  return (
    <View style={styles.card}>
      {/* Top row: type badge + duration pill */}
      <View style={styles.cardTopRow}>
        <View
          style={[
            styles.badge,
            isInPerson ? styles.badgeGreen : styles.badgeBlue,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isInPerson ? styles.badgeTextGreen : styles.badgeTextBlue,
            ]}
          >
            {isInPerson ? 'In-Person' : 'Online'}
          </Text>
        </View>
        <Text style={styles.durationLabel}>{durationLabel}</Text>
      </View>

      {/* Client name — only visible on the coach's view */}
      {booking.clientName && (
        <Text style={styles.clientName}>{booking.clientName}</Text>
      )}

      {/* Date */}
      <Text style={styles.cardDate}>{formatDate(booking.date)}</Text>

      {/* Time range */}
      <Text style={styles.cardTime}>
        {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
      </Text>

      {/* Optional notes */}
      {booking.notes ? (
        <Text style={styles.cardNotes}>{booking.notes}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionReschedule]}
          onPress={() => onReschedule(booking)}
          accessibilityLabel="Reschedule this session"
        >
          <Text style={[styles.actionBtnText, styles.actionRescheduleText]}>
            Reschedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionCancel]}
          onPress={() => onCancel(booking.id)}
          accessibilityLabel="Cancel this session"
        >
          <Text style={[styles.actionBtnText, styles.actionCancelText]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// BookingScreen
// ---------------------------------------------------------------------------

export default function BookingScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch {
      Alert.alert('Error', 'Could not load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = useCallback((id: string) => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(id);
              // Remove from local state immediately — no need to refetch.
              setBookings((prev) => prev.filter((b) => b.id !== id));
            } catch {
              Alert.alert('Error', 'Could not cancel. Please try again.');
            }
          },
        },
      ],
    );
  }, []);

  const handleReschedule = useCallback((booking: Booking) => {
    // Pass the existing type and duration as params so new.tsx can lock them.
    router.push({
      pathname: '/booking/new',
      params: {
        rescheduleId: booking.id,
        type: booking.type,
        duration: String(booking.duration),
      },
    });
  }, [router]);

  // Re-fetch when navigating back from new.tsx after a successful booking.
  // expo-router's useFocusEffect equivalent is handled by re-mounting when the
  // tab regains focus, but for a stack-back scenario we use a focus listener.
  // Simplest approach: pass a refresh callback via router events.
  // For now, the user can pull-to-refresh. A proper focus refetch would require
  // expo-router's useFocusEffect — add it later if needed.

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchBookings(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Booking</Text>
          <Button
            label="Book Session"
            size="sm"
            onPress={() => router.push('/booking/new')}
            accessibilityLabel="Book a new session"
          />
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>Upcoming Sessions</Text>

        {/* States: loading / empty / list */}
        {isLoading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎾</Text>
            <Text style={styles.emptyTitle}>No upcoming sessions</Text>
            <Text style={styles.emptyBody}>
              Tap "Book Session" to schedule your first session with your coach.
            </Text>
          </View>
        ) : (
          bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancel}
              onReschedule={handleReschedule}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  centred: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Booking card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: layout.cardPadding,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeGreen: {
    backgroundColor: colors.primaryTint,
  },
  badgeBlue: {
    backgroundColor: colors.infoTint,
  },
  badgeText: {
    ...typography.label,
    fontSize: 12,
  },
  badgeTextGreen: {
    color: colors.primary,
  },
  badgeTextBlue: {
    color: colors.info,
  },
  durationLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDate: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  cardTime: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardNotes: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  // Action buttons — small pill-style, not full-height
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionReschedule: {
    backgroundColor: colors.primaryTint,
  },
  actionCancel: {
    backgroundColor: colors.errorTint,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionRescheduleText: {
    color: colors.primary,
  },
  actionCancelText: {
    color: colors.error,
  },
});
