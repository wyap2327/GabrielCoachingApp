/**
 * programs.tsx — Programs tab: browse and purchase coaching programs.
 *
 * Client view: category filter + program cards with purchase state.
 * Coach view: same layout, no purchase flow (coach sees all content).
 */

import { Button } from '@/components/common/Button';
import { PROGRAMS, Program } from '@/data/programs';
import { getMyProgramIds } from '@/lib/programService';
import { colors, radius } from '@/styles/global';
import { shadows } from '@/styles/shadows';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';

// ---------------------------------------------------------------------------
// Category filter config
// ---------------------------------------------------------------------------

type FilterKey = 'All' | 'Technical' | 'Mental' | 'Physical' | 'Coaching' | 'Custom';

const FILTERS: FilterKey[] = ['All', 'Technical', 'Mental', 'Physical', 'Coaching', 'Custom'];

const CATEGORY_MAP: Record<FilterKey, Program['category'] | null> = {
  All: null,
  Technical: 'Technical Development',
  Mental: 'Mental Performance',
  Physical: 'Physical Performance',
  Coaching: 'Coaching Development',
  Custom: 'Custom',
};

// ---------------------------------------------------------------------------
// Category badge colours — each category gets a distinct tint
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<Program['category'], { bg: string; text: string }> = {
  'Technical Development': { bg: colors.primaryTint, text: colors.primary },
  'Mental Performance':    { bg: colors.infoTint,    text: colors.info },
  'Physical Performance':  { bg: colors.warningTint, text: colors.warning },
  'Coaching Development':  { bg: '#EDE9FE',           text: '#7C3AED' },
  'Custom':                { bg: colors.surfaceHigh,  text: colors.textSecondary },
};

// ---------------------------------------------------------------------------
// ProgramCard
// ---------------------------------------------------------------------------

interface ProgramCardProps {
  program: Program;
  isPurchased: boolean;
  isCoach: boolean;
  onPress: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = React.memo(({ program, isPurchased, isCoach, onPress }) => {
  const catColors = CATEGORY_COLORS[program.category];
  const totalVideos = program.sections.reduce((sum, s) => sum + s.videos.length, 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${program.name}, ${program.priceLabel}`}
      accessibilityRole="button"
    >
      {/* Category badge row */}
      <View style={styles.cardTopRow}>
        <View style={[styles.catBadge, { backgroundColor: catColors.bg }]}>
          <Text style={[styles.catBadgeText, { color: catColors.text }]}>
            {program.category}
          </Text>
        </View>
        {/* Purchased indicator for clients; coaches always have access */}
        {(isPurchased || isCoach) && (
          <View style={styles.purchasedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.purchasedBadgeText}>
              {isCoach ? 'Full Access' : 'Purchased'}
            </Text>
          </View>
        )}
      </View>

      {/* Program name */}
      <Text style={styles.cardName}>{program.name}</Text>

      {/* Goal — single line with ellipsis */}
      <Text style={styles.cardGoal} numberOfLines={2}>{program.goal}</Text>

      {/* Meta row: price / duration / video count */}
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="pricetag-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{program.priceLabel}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{program.duration}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Ionicons name="play-circle-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{totalVideos} videos</Text>
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.cardChevron}>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// ProgramsScreen
// ---------------------------------------------------------------------------

export default function ProgramsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const isCoach = profile?.role === 'coach';

  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  // Reload purchased IDs every time this tab gains focus so the list stays
  // current after returning from the detail screen.
  useFocusEffect(
    useCallback(() => {
      if (isCoach) {
        setIsLoading(false);
        return;
      }
      let cancelled = false;
      (async () => {
        try {
          const ids = await getMyProgramIds();
          if (!cancelled) setPurchasedIds(ids);
        } catch {
          if (!cancelled) Alert.alert('Error', 'Could not load your programs.');
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [isCoach]),
  );

  const filteredPrograms = activeFilter === 'All'
    ? PROGRAMS
    : PROGRAMS.filter((p) => p.category === CATEGORY_MAP[activeFilter]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Programs</Text>
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              accessibilityLabel={`Filter by ${f}`}
              accessibilityRole="button"
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading state */}
        {isLoading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {filteredPrograms.length} {filteredPrograms.length === 1 ? 'program' : 'programs'}
            </Text>

            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                isPurchased={purchasedIds.includes(program.id)}
                isCoach={isCoach}
                onPress={() => router.push({ pathname: '/programs/[id]', params: { id: program.id } })}
              />
            ))}
          </>
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
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    letterSpacing: -0.5,
  },

  // Filter chips
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterRow: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },

  resultCount: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
  },

  centred: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
  },

  // Program card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: layout.cardPadding,
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  catBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  catBadgeText: {
    ...typography.label,
    fontSize: 11,
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  purchasedBadgeText: {
    ...typography.label,
    fontSize: 11,
    color: colors.success,
  },
  cardName: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  cardGoal: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  cardChevron: {
    position: 'absolute',
    right: layout.cardPadding,
    top: '50%',
  },
});
