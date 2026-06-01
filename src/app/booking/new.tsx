import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radius } from '@/styles/global';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { shadows } from '@/styles/shadows';
import { Button } from '@/components/common/Button';
import {
  BookingDuration,
  BookingType,
  TimeSlot,
  createBooking,
  getAvailableSlots,
  rescheduleBooking,
} from '@/lib/bookingService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pad a number to two digits: 9 → "09".
 */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * formatTime — "09:30" → "9:30am", "14:00" → "2:00pm".
 */
function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)}${suffix}`;
}

/**
 * Build an array of the next 14 days starting from today.
 * Each entry has the ISO date string and display parts.
 */
function buildNextFourteenDays(): Array<{
  iso: string;       // "2026-06-01"
  dayShort: string;  // "Mon"
  dayNum: string;    // "1"
  monthShort: string;// "Jun"
  isToday: boolean;
}> {
  const days = [];
  const base = new Date();
  // Normalise to midnight so day-boundary arithmetic is clean.
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    days.push({
      iso,
      dayShort: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum: String(d.getDate()),
      monthShort: d.toLocaleDateString('en-GB', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single day card in the date strip. */
const DayCard: React.FC<{
  dayShort: string;
  dayNum: string;
  monthShort: string;
  isToday: boolean;
  selected: boolean;
  onPress: () => void;
}> = ({ dayShort, dayNum, monthShort, isToday, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.dayCard, selected && styles.dayCardSelected]}
    accessibilityLabel={`${dayShort} ${dayNum} ${monthShort}${isToday ? ', today' : ''}`}
    accessibilityState={{ selected }}
  >
    {isToday && (
      <Text style={[styles.dayTodayLabel, selected && styles.dayTodayLabelSelected]}>
        Today
      </Text>
    )}
    <Text style={[styles.dayShort, selected && styles.dayTextSelected]}>{dayShort}</Text>
    <Text style={[styles.dayNum, selected && styles.dayTextSelected]}>{dayNum}</Text>
    <Text style={[styles.dayMonth, selected && styles.dayTextSelectedMuted]}>{monthShort}</Text>
  </TouchableOpacity>
);

/** A single time slot button. */
const TimeSlotButton: React.FC<{
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}> = ({ slot, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!slot.available}
    style={[
      styles.slotBtn,
      selected && styles.slotBtnSelected,
      !slot.available && styles.slotBtnUnavailable,
    ]}
    accessibilityLabel={`${formatTime(slot.start)} to ${formatTime(slot.end)}`}
    accessibilityState={{ selected, disabled: !slot.available }}
  >
    <Text
      style={[
        styles.slotBtnText,
        selected && styles.slotBtnTextSelected,
        !slot.available && styles.slotBtnTextUnavailable,
      ]}
    >
      {formatTime(slot.start)}
    </Text>
  </TouchableOpacity>
);

/** A pair of option buttons (type picker / duration picker). */
const OptionPicker: React.FC<{
  options: Array<{ value: string; label: string }>;
  selected: string;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => (
  <View style={styles.optionRow}>
    {options.map((opt) => (
      <TouchableOpacity
        key={opt.value}
        style={[styles.optionBtn, selected === opt.value && styles.optionBtnSelected]}
        onPress={() => onSelect(opt.value)}
        accessibilityLabel={opt.label}
        accessibilityState={{ selected: selected === opt.value }}
      >
        <Text
          style={[
            styles.optionBtnText,
            selected === opt.value && styles.optionBtnTextSelected,
          ]}
        >
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NewBookingScreen() {
  const router = useRouter();

  // Params are strings when passed via router.push — parse them here.
  const params = useLocalSearchParams<{
    rescheduleId?: string;
    type?: string;
    duration?: string;
  }>();

  const isRescheduling = Boolean(params.rescheduleId);

  // When rescheduling, type and duration are locked to the existing values.
  const [sessionType, setSessionType] = useState<BookingType>(
    (params.type as BookingType) ?? 'in-person',
  );
  const [duration, setDuration] = useState<BookingDuration>(
    params.duration === '60' ? 60 : 30,
  );

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-built list of 14 days — stable for the lifetime of this screen.
  const days = useMemo(() => buildNextFourteenDays(), []);

  // Fetch slots whenever the selected date or duration changes.
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false; // guard against stale async results

    async function fetchSlots() {
      setSlotsLoading(true);
      setSelectedSlot(null); // clear previous selection when date changes
      try {
        const data = await getAvailableSlots(
          selectedDate!,
          duration,
          params.rescheduleId ?? undefined,
        );
        if (!cancelled) setSlots(data);
      } catch {
        if (!cancelled) {
          Alert.alert('Error', 'Could not load available times. Please try again.');
          setSlots([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    fetchSlots();
    return () => { cancelled = true; };
  }, [selectedDate, duration, params.rescheduleId]);

  // Also clear slots when duration changes so stale slots from a different
  // duration don't flash briefly before the fetch completes.
  const handleDurationChange = useCallback((val: string) => {
    setDuration(Number(val) as BookingDuration);
    setSlots([]);
    setSelectedSlot(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      if (isRescheduling) {
        await rescheduleBooking(params.rescheduleId!, {
          date: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        });
        Alert.alert('Rescheduled!', 'Your session has been moved.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await createBooking({
          type: sessionType,
          duration,
          date: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Booking Confirmed!', 'Your session is booked.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Could not complete. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDate, selectedSlot, isRescheduling, params.rescheduleId, sessionType, duration, notes, router]);

  const canConfirm = Boolean(selectedDate && selectedSlot);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRescheduling ? 'Reschedule Session' : 'Book Session'}
          </Text>
          {/* Spacer keeps the title visually centred */}
          <View style={styles.backBtn} />
        </View>

        {/* ── Session Type (hidden when rescheduling) ── */}
        {!isRescheduling && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Session Type</Text>
            <OptionPicker
              options={[
                { value: 'in-person', label: '🎾 In-Person' },
                { value: 'online', label: '💻 Online Coaching' },
              ]}
              selected={sessionType}
              onSelect={(v) => setSessionType(v as BookingType)}
            />
          </View>
        )}

        {/* ── Duration (hidden when rescheduling) ── */}
        {!isRescheduling && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Duration</Text>
            <OptionPicker
              options={[
                { value: '30', label: '30 min' },
                { value: '60', label: '1 hour' },
              ]}
              selected={String(duration)}
              onSelect={handleDurationChange}
            />
          </View>
        )}

        {/* ── Date picker ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pick a Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {days.map((d) => (
              <DayCard
                key={d.iso}
                dayShort={d.dayShort}
                dayNum={d.dayNum}
                monthShort={d.monthShort}
                isToday={d.isToday}
                selected={selectedDate === d.iso}
                onPress={() => setSelectedDate(d.iso)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Time slots (shown only after a date is selected) ── */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Available Times</Text>
            {slotsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.slotsLoader}
              />
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => (
                  <SlotWrapper key={slot.start}>
                    <TimeSlotButton
                      slot={slot}
                      selected={selectedSlot?.start === slot.start}
                      onPress={() => setSelectedSlot(slot)}
                    />
                  </SlotWrapper>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Notes (hidden when rescheduling) ── */}
        {!isRescheduling && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Notes{' '}
              <Text style={styles.optionalHint}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Anything your coach should know..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
              value={notes}
              onChangeText={setNotes}
              accessibilityLabel="Session notes"
            />
            <Text style={styles.charCount}>{notes.length}/200</Text>
          </View>
        )}

        {/* ── Confirm button ── */}
        <View style={styles.confirmSection}>
          <Button
            label={isRescheduling ? 'Confirm Reschedule' : 'Confirm Booking'}
            fullWidth
            size="lg"
            disabled={!canConfirm}
            loading={isSubmitting}
            onPress={handleConfirm}
            accessibilityLabel={
              isRescheduling ? 'Confirm reschedule' : 'Confirm booking'
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * SlotWrapper — gives each slot button exactly 1/3 of the grid row.
 * Using a wrapper View rather than flex on the button itself keeps the
 * button's internal layout independent from the grid layout.
 */
const SlotWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.slotWrapper}>{children}</View>
);

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  optionalHint: {
    ...typography.caption,
    fontWeight: '400',
    color: colors.textMuted,
  },

  // Option pickers (type + duration)
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  optionBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  optionBtnText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionBtnTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Date strip
  dateStrip: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  dayCard: {
    width: 60,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    // Reserve space for the "Today" label so all cards have consistent height.
    minHeight: 82,
    justifyContent: 'center',
    ...shadows.sm,
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayTodayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dayTodayLabelSelected: {
    color: 'rgba(255,255,255,0.75)',
  },
  dayShort: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  dayMonth: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.textInverse,
  },
  dayTextSelectedMuted: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Time slots grid — 3 per row
  slotsLoader: {
    marginTop: spacing.base,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Each slot takes 1/3 width minus gap compensation.
  // Using '30%' is a simple approximation; for pixel-perfect layout you'd
  // use (screenWidth - padding*2 - gap*2) / 3 via useWindowDimensions.
  slotWrapper: {
    width: '30%',
  },
  slotBtn: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  slotBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotBtnUnavailable: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.border,
  },
  slotBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotBtnTextSelected: {
    color: colors.textInverse,
  },
  slotBtnTextUnavailable: {
    color: colors.textMuted,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 96,
    ...typography.body,
    textAlignVertical: 'top', // Android: start text from the top of the box
  },
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
    color: colors.textMuted,
  },

  // Confirm
  confirmSection: {
    marginTop: spacing.sm,
  },
});
