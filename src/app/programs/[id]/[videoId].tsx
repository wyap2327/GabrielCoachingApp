/**
 * programs/[id]/[videoId].tsx — Video player screen.
 *
 * Renders a YoutubeIframe at the top, video metadata below,
 * and a "Next Video" button when there is a subsequent video
 * in the same section.
 */

import { findVideo, getNextVideo } from '@/data/programs';
import { colors, radius } from '@/styles/global';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Button } from '@/components/common/Button';

export default function VideoPlayerScreen() {
  const { id, videoId } = useLocalSearchParams<{ id: string; videoId: string }>();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const found = findVideo(id, videoId);
  const nextVideo = getNextVideo(id, videoId);

  // YoutubeIframe requires a playing state that we control.
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state: string) => {
    // Pause when the native player reports "ended" so the UI reflects reality.
    if (state === 'ended') setPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (!nextVideo) return;
    router.replace({
      pathname: '/programs/[id]/[videoId]',
      params: { id, videoId: nextVideo.id },
    });
  }, [id, nextVideo, router]);

  if (!found) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centred}>
          <Text style={styles.errorText}>Video not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { video, section } = found;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Back button + video title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{video.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* YouTube player — height fixed at 240, width fills screen */}
      <View style={styles.playerWrapper}>
        <YoutubeIframe
          height={240}
          width={screenWidth}
          videoId={video.youtubeId}
          play={playing}
          onChangeState={onStateChange}
        />
      </View>

      {/* Metadata */}
      <View style={styles.meta}>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.sectionName}>{section.title}</Text>

        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      {/* Next video button */}
      {nextVideo && (
        <View style={styles.nextBtnContainer}>
          <Button
            label={`Next: ${nextVideo.title}`}
            onPress={handleNext}
            rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.textInverse} />}
            fullWidth
            accessibilityLabel={`Play next video: ${nextVideo.title}`}
          />
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
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...typography.h4,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },

  // Player — sits flush edge-to-edge directly below the header.
  playerWrapper: {
    backgroundColor: '#000',
  },

  // Metadata below player
  meta: {
    padding: layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  videoTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  durationText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  nextBtnContainer: {
    padding: layout.screenPadding,
    paddingTop: spacing.xl,
  },
});
