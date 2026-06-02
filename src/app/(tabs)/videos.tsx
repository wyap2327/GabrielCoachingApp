/**
 * videos.tsx — Videos tab.
 *
 * Client view: upload videos from gallery for coach review; list own submissions.
 * Coach view: list all client submissions; tap to open detail and add feedback.
 */

import { Button } from '@/components/common/Button';
import { PROGRAMS } from '@/data/programs';
import {
  addCoachFeedback,
  getMyProgramIds,
  getVideoSubmissions,
  submitVideo,
  uploadVideoToStorage,
  VideoSubmission,
} from '@/lib/programService';
import { colors, radius } from '@/styles/global';
import { shadows } from '@/styles/shadows';
import { layout, spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ reviewed: boolean }> = ({ reviewed }) => (
  <View style={[styles.statusBadge, reviewed ? styles.statusReviewed : styles.statusPending]}>
    <Text style={[styles.statusText, reviewed ? styles.statusReviewedText : styles.statusPendingText]}>
      {reviewed ? 'Reviewed' : 'Pending Review'}
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// ClientSubmissionCard
// ---------------------------------------------------------------------------

const ClientSubmissionCard: React.FC<{ item: VideoSubmission }> = ({ item }) => {
  const programName = item.program_id
    ? PROGRAMS.find((p) => p.id === item.program_id)?.name ?? 'Program'
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <StatusBadge reviewed={!!item.coach_feedback} />
      </View>

      {programName && (
        <Text style={styles.cardMeta}>{programName}</Text>
      )}
      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>

      {item.notes && (
        <Text style={styles.cardNotes}>"{item.notes}"</Text>
      )}

      {item.coach_feedback && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackLabel}>Coach feedback</Text>
          <Text style={styles.feedbackText}>{item.coach_feedback}</Text>
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// CoachSubmissionCard — tappable row in the coach's list
// ---------------------------------------------------------------------------

interface CoachCardProps {
  item: VideoSubmission;
  onPress: (item: VideoSubmission) => void;
}

const CoachSubmissionCard: React.FC<CoachCardProps> = ({ item, onPress }) => {
  const programName = item.program_id
    ? PROGRAMS.find((p) => p.id === item.program_id)?.name ?? 'Program'
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      accessibilityLabel={`Review submission from ${item.clientName}: ${item.title}`}
      accessibilityRole="button"
    >
      <View style={styles.cardTopRow}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <StatusBadge reviewed={!!item.coach_feedback} />
      </View>

      {programName && (
        <Text style={styles.cardMeta}>{programName}</Text>
      )}
      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>

      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap to review</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// CoachReviewModal — shown when coach taps a submission
// ---------------------------------------------------------------------------

interface ReviewModalProps {
  item: VideoSubmission | null;
  onClose: () => void;
  onSaved: () => void;
}

const CoachReviewModal: React.FC<ReviewModalProps> = ({ item, onClose, onSaved }) => {
  const [feedback, setFeedback] = useState(item?.coach_feedback ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync feedback field when modal opens with a new item.
  React.useEffect(() => {
    setFeedback(item?.coach_feedback ?? '');
  }, [item]);

  const handleSave = async () => {
    if (!item || !feedback.trim()) {
      Alert.alert('Error', 'Please enter feedback before saving.');
      return;
    }
    setIsSaving(true);
    try {
      await addCoachFeedback(item.id, feedback.trim());
      onSaved();
    } catch {
      Alert.alert('Error', 'Could not save feedback. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) return null;

  const programName = item.program_id
    ? PROGRAMS.find((p) => p.id === item.program_id)?.name ?? 'Program'
    : null;

  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.title}</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMeta}>
              {item.clientName}{programName ? ` · ${programName}` : ''} · {formatDate(item.created_at)}
            </Text>

            {/* Open video link */}
            <TouchableOpacity
              style={styles.openVideoBtn}
              onPress={() => Linking.openURL(item.video_url)}
              accessibilityLabel="Open video"
              accessibilityRole="link"
            >
              <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.openVideoBtnText}>Open Video</Text>
            </TouchableOpacity>

            {/* Client notes */}
            {item.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Client notes</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            ) : null}

            {/* Feedback input */}
            <Text style={styles.inputLabel}>Your Feedback</Text>
            <TextInput
              style={styles.feedbackInput}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Add coaching feedback..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessibilityLabel="Coach feedback"
            />

            <Button
              label="Save Feedback"
              onPress={handleSave}
              loading={isSaving}
              fullWidth
              style={styles.saveFeedbackBtn}
              accessibilityLabel="Save feedback"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// UploadModal — client upload flow
// ---------------------------------------------------------------------------

interface UploadModalProps {
  visible: boolean;
  purchasedProgramIds: string[];
  onClose: () => void;
  onUploaded: () => void;
  userId: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  visible, purchasedProgramIds, onClose, onUploaded, userId,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [pickedVideo, setPickedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const purchasedPrograms = PROGRAMS.filter((p) => purchasedProgramIds.includes(p.id));

  const reset = () => {
    setTitle('');
    setNotes('');
    setSelectedProgramId('');
    setPickedVideo(null);
    setUploadProgress('');
  };

  const handleClose = () => { reset(); onClose(); };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPickedVideo(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your video.');
      return;
    }
    if (!pickedVideo) {
      Alert.alert('Error', 'Please select a video to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading video...');

    try {
      // Derive a safe filename from the asset URI.
      const rawName = pickedVideo.uri.split('/').pop() ?? 'video.mp4';
      const mimeType = pickedVideo.mimeType ?? 'video/mp4';

      const videoUrl = await uploadVideoToStorage(userId, pickedVideo.uri, rawName, mimeType);

      setUploadProgress('Saving details...');

      await submitVideo({
        title: title.trim(),
        videoUrl,
        programId: selectedProgramId || undefined,
        notes: notes.trim() || undefined,
      });

      reset();
      onUploaded();
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not upload your video. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Video</Text>
              <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Video picker */}
            <TouchableOpacity
              style={[styles.videoPicker, pickedVideo && styles.videoPickerSelected]}
              onPress={pickVideo}
              accessibilityLabel="Pick a video from your library"
              accessibilityRole="button"
            >
              <Ionicons
                name={pickedVideo ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={32}
                color={pickedVideo ? colors.success : colors.primary}
              />
              <Text style={styles.videoPickerText}>
                {pickedVideo
                  ? pickedVideo.uri.split('/').pop()
                  : 'Tap to select a video from your library'}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Forehand drill practice"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Video title"
            />

            {/* Program selector */}
            {purchasedPrograms.length > 0 && (
              <>
                <Text style={styles.inputLabel}>Link to Program (optional)</Text>
                <View style={styles.programSelector}>
                  <TouchableOpacity
                    style={[styles.programOption, !selectedProgramId && styles.programOptionSelected]}
                    onPress={() => setSelectedProgramId('')}
                    accessibilityLabel="No program"
                    accessibilityRole="radio"
                  >
                    <Text style={[
                      styles.programOptionText,
                      !selectedProgramId && styles.programOptionTextSelected,
                    ]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {purchasedPrograms.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.programOption,
                        selectedProgramId === p.id && styles.programOptionSelected,
                      ]}
                      onPress={() => setSelectedProgramId(p.id)}
                      accessibilityLabel={p.name}
                      accessibilityRole="radio"
                    >
                      <Text
                        style={[
                          styles.programOptionText,
                          selectedProgramId === p.id && styles.programOptionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Notes */}
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMulti]}
              value={notes}
              onChangeText={setNotes}
              placeholder="What would you like your coach to focus on?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Notes for coach"
            />

            {/* Upload progress feedback */}
            {uploadProgress ? (
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.progressText}>{uploadProgress}</Text>
              </View>
            ) : null}

            <Button
              label="Upload Video"
              onPress={handleUpload}
              loading={isUploading}
              fullWidth
              style={styles.uploadBtn}
              accessibilityLabel="Upload video"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// VideosScreen
// ---------------------------------------------------------------------------

export default function VideosScreen() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const isCoach = profile?.role === 'coach';

  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<VideoSubmission | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const [subs, ids] = await Promise.all([
        getVideoSubmissions(),
        isCoach ? Promise.resolve([]) : getMyProgramIds(),
      ]);
      setSubmissions(subs);
      if (!isCoach) setPurchasedIds(ids);
    } catch {
      Alert.alert('Error', 'Could not load videos. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isCoach]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Split coach's list into pending first, then reviewed.
  const pendingSubmissions = submissions.filter((s) => !s.coach_feedback);
  const reviewedSubmissions = submissions.filter((s) => !!s.coach_feedback);

  const handleReviewSaved = useCallback(() => {
    setReviewItem(null);
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isCoach ? 'Video Reviews' : 'My Videos'}
          </Text>
          {!isCoach && (
            <Button
              label="Upload"
              size="sm"
              onPress={() => setShowUploadModal(true)}
              leftIcon={<Ionicons name="cloud-upload-outline" size={15} color={colors.textInverse} />}
              accessibilityLabel="Upload a video"
            />
          )}
        </View>

        {/* Loading */}
        {isLoading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>

        ) : isCoach ? (
          /* ---- Coach view ---- */
          <>
            {submissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyTitle}>No submissions yet</Text>
                <Text style={styles.emptyBody}>Client video submissions will appear here.</Text>
              </View>
            ) : (
              <>
                {pendingSubmissions.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Pending Review ({pendingSubmissions.length})</Text>
                    {pendingSubmissions.map((item) => (
                      <CoachSubmissionCard key={item.id} item={item} onPress={setReviewItem} />
                    ))}
                  </>
                )}
                {reviewedSubmissions.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, pendingSubmissions.length > 0 && { marginTop: spacing.lg }]}>
                      Reviewed ({reviewedSubmissions.length})
                    </Text>
                    {reviewedSubmissions.map((item) => (
                      <CoachSubmissionCard key={item.id} item={item} onPress={setReviewItem} />
                    ))}
                  </>
                )}
              </>
            )}
          </>

        ) : (
          /* ---- Client view ---- */
          <>
            {submissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎾</Text>
                <Text style={styles.emptyTitle}>No videos yet</Text>
                <Text style={styles.emptyBody}>
                  Upload a practice or match video and your coach will review it with feedback.
                </Text>
                <Button
                  label="Upload Your First Video"
                  onPress={() => setShowUploadModal(true)}
                  style={styles.emptyBtn}
                  accessibilityLabel="Upload your first video"
                />
              </View>
            ) : (
              submissions.map((item) => (
                <ClientSubmissionCard key={item.id} item={item} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {!isCoach && user && (
        <UploadModal
          visible={showUploadModal}
          purchasedProgramIds={purchasedIds}
          userId={user.id}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            setShowUploadModal(false);
            fetchData();
          }}
        />
      )}

      {isCoach && (
        <CoachReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onSaved={handleReviewSaved}
        />
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
    paddingBottom: spacing.xxxl,
  },
  centred: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    letterSpacing: -0.5,
  },

  sectionLabel: {
    ...typography.h4,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    marginTop: spacing.sm,
  },

  // Submission card (shared base)
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
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h4,
    flex: 1,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardNotes: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  statusPending: {
    backgroundColor: colors.warningTint,
  },
  statusReviewed: {
    backgroundColor: colors.successTint,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
  },
  statusPendingText: {
    color: colors.warning,
  },
  statusReviewedText: {
    color: colors.success,
  },

  // Coach feedback box on client cards
  feedbackBox: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  feedbackLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },

  // Coach card extras
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...typography.label,
    color: colors.primary,
    marginBottom: 2,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 2,
  },
  tapHintText: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // ---- Modal shared --------------------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxxl,
    maxHeight: '90%',
    ...shadows.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  modalMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // Coach review modal
  openVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  openVideoBtnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notesLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 120,
    backgroundColor: colors.surfaceHigh,
  },
  saveFeedbackBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  // Upload modal
  videoPicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  videoPickerSelected: {
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  videoPickerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: layout.inputHeight,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceHigh,
  },
  textInputMulti: {
    height: 90,
    paddingTop: spacing.md,
  },
  programSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  programOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  programOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  programOptionText: {
    ...typography.label,
    fontSize: 12,
    color: colors.textSecondary,
  },
  programOptionTextSelected: {
    color: colors.textInverse,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  uploadBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
