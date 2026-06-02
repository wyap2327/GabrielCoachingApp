/**
 * programs/[id].tsx — Program detail screen.
 *
 * Unpurchased clients see a teaser + purchase CTA.
 * Purchased clients and coaches see full section/video list.
 */

import { Button } from '@/components/common/Button';
import { findProgram, Program, ProgramSection } from '@/data/programs';
import { getMyProgramIds, purchaseProgram } from '@/lib/programService';
import { colors, radius } from '@/styles/global';
import { shadows } from '@/styles/shadows';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
// Category badge colours (reused from programs tab)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<Program['category'], { bg: string; text: string }> = {
  'Technical Development': { bg: colors.primaryTint, text: colors.primary },
  'Mental Performance':    { bg: colors.infoTint,    text: colors.info },
  'Physical Performance':  { bg: colors.warningTint, text: colors.warning },
  'Coaching Development':  { bg: '#EDE9FE',           text: '#7C3AED' },
  'Custom':                { bg: colors.surfaceHigh,  text: colors.textSecondary },
};

// ---------------------------------------------------------------------------
// SectionRow — single section in the unlocked view
// ---------------------------------------------------------------------------

interface SectionRowProps {
  section: ProgramSection;
  programId: string;
}

const SectionRow: React.FC<SectionRowProps> = ({ section, programId }) => {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.videos.map((video) => (
        <TouchableOpacity
          key={video.id}
          style={styles.videoRow}
          onPress={() =>
            router.push({
              pathname: '/programs/[id]/[videoId]',
              params: { id: programId, videoId: video.id },
            })
          }
          activeOpacity={0.75}
          accessibilityLabel={`Play ${video.title}`}
          accessibilityRole="button"
        >
          {/* Thumbnail placeholder */}
          <View style={styles.videoThumb}>
            <Ionicons name="play" size={16} color={colors.textInverse} />
          </View>

          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.videoDuration}>{video.duration}</Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// TeaserSections — locked view shows section titles only
// ---------------------------------------------------------------------------

const TeaserSections: React.FC<{ sections: ProgramSection[] }> = ({ sections }) => (
  <View style={styles.teaserContainer}>
    <Text style={styles.teaserHeading}>What's included</Text>
    {sections.map((s, i) => (
      <View key={i} style={styles.teaserRow}>
        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
        <Text style={styles.teaserSectionTitle}>{s.title}</Text>
        <Text style={styles.teaserVideoCount}>{s.videos.length} videos</Text>
      </View>
    ))}
  </View>
);

// ---------------------------------------------------------------------------
// ProgramDetailScreen
// ---------------------------------------------------------------------------

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const isCoach = profile?.role === 'coach';

  const program = findProgram(id);

  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (isCoach) {
      setIsLoadingPurchase(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ids = await getMyProgramIds();
        if (!cancelled) setIsPurchased(ids.includes(id));
      } catch {
        // Non-critical — default to unpurchased state
      } finally {
        if (!cancelled) setIsLoadingPurchase(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isCoach]);

  const handlePurchase = useCallback(() => {
    if (!program) return;
    Alert.alert(
      `Purchase ${program.name}`,
      `${program.priceLabel} — you'll get instant access to all ${program.sections.reduce((n, s) => n + s.videos.length, 0)} videos.\n\nPayment will be added soon.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              await purchaseProgram(id);
              setIsPurchased(true);
              Alert.alert('Access Granted', `You now have full access to ${program.name}.`);
            } catch {
              Alert.alert('Error', 'Purchase failed. Please try again.');
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ],
    );
  }, [id, program]);

  if (!program) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centred}>
          <Text style={styles.errorText}>Program not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catColors = CATEGORY_COLORS[program.category];
  // Coach always sees full content; clients need to purchase
  const hasAccess = isCoach || isPurchased;
  const totalVideos = program.sections.reduce((n, s) => n + s.videos.length, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button + header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{program.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Category badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.catBadge, { backgroundColor: catColors.bg }]}>
            <Text style={[styles.catBadgeText, { color: catColors.text }]}>
              {program.category}
            </Text>
          </View>
          {hasAccess && (
            <View style={styles.accessBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={styles.accessBadgeText}>
                {isCoach ? 'Full Access' : 'Purchased'}
              </Text>
            </View>
          )}
        </View>

        {/* Goal */}
        <Text style={styles.goal}>{program.goal}</Text>

        {/* Price + duration */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
            <Text style={styles.metaPillText}>{program.priceLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.metaPillText}>{program.duration}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="play-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.metaPillText}>{totalVideos} videos</Text>
          </View>
        </View>

        {/* Purchased banner */}
        {hasAccess && !isCoach && (
          <View style={styles.purchasedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.purchasedBannerText}>You have full access to this program</Text>
          </View>
        )}

        {/* Content — full sections or teaser */}
        {isLoadingPurchase ? (
          <View style={styles.centred}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : hasAccess ? (
          program.sections.map((section, i) => (
            <SectionRow key={i} section={section} programId={program.id} />
          ))
        ) : (
          <TeaserSections sections={program.sections} />
        )}
      </ScrollView>

      {/* Purchase CTA — only shown to unpurchased clients */}
      {!hasAccess && !isLoadingPurchase && (
        <View style={styles.purchaseBar}>
          <View style={styles.purchaseBarInner}>
            <View>
              <Text style={styles.purchaseBarPrice}>{program.priceLabel}</Text>
              <Text style={styles.purchaseBarDuration}>{program.duration} access</Text>
            </View>
            <Button
              label="Purchase Program"
              onPress={handlePurchase}
              loading={isPurchasing}
              style={styles.purchaseBtn}
              accessibilityLabel={`Purchase ${program.name} for ${program.priceLabel}`}
            />
          </View>
        </View>
      )}
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
    paddingBottom: spacing.xxxl + 80, // clear purchase bar
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.h3,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.md,
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
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  accessBadgeText: {
    ...typography.label,
    fontSize: 11,
    color: colors.success,
  },

  goal: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
  },

  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  metaPillText: {
    ...typography.label,
    fontSize: 12,
    color: colors.primary,
  },

  purchasedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successTint,
    marginHorizontal: layout.screenPadding,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  purchasedBannerText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },

  // Section in unlocked view
  section: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  videoThumb: {
    width: 52,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  videoDuration: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Teaser (locked) view
  teaserContainer: {
    marginHorizontal: layout.screenPadding,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: layout.cardPadding,
    ...shadows.sm,
  },
  teaserHeading: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  teaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  teaserSectionTitle: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  teaserVideoCount: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Purchase bottom bar
  purchaseBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    ...shadows.md,
  },
  purchaseBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  purchaseBarPrice: {
    ...typography.h3,
    color: colors.primary,
  },
  purchaseBarDuration: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  purchaseBtn: {
    flex: 1,
  },
});
