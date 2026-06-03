/**
 * messages.tsx — Tab entry point for the messaging feature.
 *
 * Coach → sees a list of all client conversations.
 * Client → immediately redirected into their single conversation with the coach.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/styles/global';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useProfile } from '@/hooks/useProfile';
import {
  getConversations,
  getCoach,
  getOrCreateConversation,
  type Conversation,
} from '@/lib/messageService';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Coach view — conversation list
// ---------------------------------------------------------------------------

function CoachView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      setError('Could not load conversations.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh every time the coach navigates back to this tab so the
  // preview and unread count always reflect the latest messages.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    load(true);
  }, [load]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Messages</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Clients will appear here once they sign up.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => router.push(`/messages/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Conversation row — used inside the coach FlatList
// ---------------------------------------------------------------------------

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
}

function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const initials = conversation.client.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const timestamp = conversation.lastMessageAt
    ? formatTime(conversation.lastMessageAt)
    : '';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.client.name}`}
    >
      {/* Avatar — initials circle */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Name + last message preview */}
      <View style={styles.rowBody}>
        <Text style={styles.clientName}>{conversation.client.name}</Text>
        {conversation.lastMessage ? (
          <Text style={styles.preview} numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
        ) : (
          <Text style={[styles.preview, styles.previewEmpty]}>No messages yet</Text>
        )}
      </View>

      {/* Timestamp + unread dot */}
      <View style={styles.rowMeta}>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        {conversation.unreadCount > 0 && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Client view — auto-redirect to their conversation
// ---------------------------------------------------------------------------

function ClientView() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const coach = await getCoach();
        if (!coach) {
          setError('No coach account found. Please contact support.');
          return;
        }
        const conversationId = await getOrCreateConversation(user.id, coach.id);
        // Push (not replace) so the tab remains in the history stack and
        // the back button on the chat screen can return here normally.
        router.push(`/messages/${conversationId}`);
      } catch {
        setError('Could not connect to your conversation. Please try again.');
      }
    })();
  }, [user]);

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Root export — switches on role
// ---------------------------------------------------------------------------

export default function MessagesScreen() {
  const { profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return profile.role === 'coach' ? <CoachView /> : <ClientView />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp as "HH:MM" today or "Day" / "DD/MM" for older. */
function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const daysDiff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (daysDiff < 7) {
    return date.toLocaleDateString([], { weekday: 'short' }); // "Mon", "Tue" …
  }

  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pageHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: AVATAR_SIZE + spacing.base + spacing.md, // align with text, not avatar edge
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 16,
  },
  rowBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  clientName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  preview: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  previewEmpty: {
    fontStyle: 'italic',
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timestamp: {
    ...typography.caption,
  },
  // Blue dot indicating unread messages.
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.info,
  },
  errorBanner: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.errorTint,
    borderRadius: radius.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
