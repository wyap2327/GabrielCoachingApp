/**
 * [id].tsx — Chat screen for a single conversation.
 *
 * Reads `id` (conversationId) from the URL via useLocalSearchParams.
 * Works for both coach and client — the sender_id on each message
 * determines alignment and tick rendering.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/styles/global';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  type Message,
} from '@/lib/messageService';
import { supabase } from '@/lib/supabase';

const MAX_CHARS = 500;

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [otherName, setOtherName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Message>>(null);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!conversationId || !user) return;

    (async () => {
      try {
        const [msgs] = await Promise.all([
          getMessages(conversationId),
          markMessagesAsRead(conversationId),
        ]);
        setMessages(msgs);
        resolveOtherName(msgs);
      } catch {
        setError('Could not load messages.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [conversationId, user]);

  // ---------------------------------------------------------------------------
  // Resolve the header name from the conversation participants.
  // We look up the other person's profile by fetching the conversation row.
  // ---------------------------------------------------------------------------

  async function resolveOtherName(msgs: Message[]) {
    if (!user) return;
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('client_id, coach_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      const otherId = conv.client_id === user.id ? conv.coach_id : conv.client_id;

      const { data: p } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', otherId)
        .single();

      if (p) setOtherName(p.name);
    } catch {
      // Non-critical — header just stays blank.
    }
  }

  // ---------------------------------------------------------------------------
  // Supabase Realtime subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates if the INSERT fires for a message we already
            // added optimistically (sender gets their own INSERT event back).
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark incoming messages as read immediately while the screen is open.
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead(conversationId).catch(() => {});
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Handles is_read flipping to true — updates tick colour on coach bubbles.
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || !conversationId) return;

    setIsSending(true);
    setInputText('');
    try {
      const sent = await sendMessage(conversationId, text);
      // Add the message immediately so the sender sees it without waiting
      // for the Realtime event (which may have a small delay).
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]
      );
    } catch {
      // Restore input on failure so the user doesn't lose their message.
      setInputText(text);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, conversationId]);

  // Scroll to bottom whenever messages change.
  useEffect(() => {
    if (messages.length > 0) {
      // Small timeout lets the list finish rendering before scrolling.
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isTyping = inputText.length > 0;
  const canSend = inputText.trim().length > 0 && !isSending;

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
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerName} numberOfLines={1}>
          {otherName || '...'}
        </Text>
        {/* Spacer to keep name centred */}
        <View style={styles.backBtn} />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Account for the tab bar height so the input doesn't hide behind it.
        keyboardVerticalOffset={0}
      >
        {/* Message list — plain ascending order, newest at bottom */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.sender_id === user?.id}
              // Ticks are only shown on messages sent by the coach.
              // profile?.role tells us who the current user is:
              // - coach sees their own outgoing ticks
              // - client never sees ticks (isCoachMessage will be false for them)
              isCoachMessage={profile?.role === 'coach' && item.sender_id === user?.id}
            />
          )}
        />

        {/* Input row */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={(t) => setInputText(t.slice(0, MAX_CHARS))}
                placeholder="Type a message…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_CHARS}
                accessibilityLabel="Message input"
              />
              {/* Character counter — only shown once typing starts */}
              {isTyping && (
                <Text style={styles.charCount}>
                  {inputText.length}/{MAX_CHARS}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Ionicons name="send" size={18} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Message bubble component
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isCoachMessage: boolean; // true = this message was sent by the coach (show tick)
}

function MessageBubble({ message, isOwnMessage, isCoachMessage }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isOwnMessage ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text style={isOwnMessage ? styles.bubbleTextOwn : styles.bubbleTextOther}>
          {message.content}
        </Text>

        {/* Timestamp + read tick (tick only for coach-sent messages) */}
        <View style={styles.bubbleMeta}>
          <Text style={isOwnMessage ? styles.timeOwn : styles.timeOther}>{time}</Text>
          {isCoachMessage && (
            // ✓ grey = not yet read by client, blue = client has read it.
            <Text style={[styles.tick, message.is_read ? styles.tickRead : styles.tickUnread]}>
              ✓
            </Text>
          )}
        </View>
      </View>
    </View>
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
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    ...typography.h4,
    flex: 1,
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.errorTint,
    borderRadius: radius.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },

  // Message list
  messageList: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyChatText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Bubble layout
  bubbleRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    // Flatten bottom-right corner to indicate sent direction.
    borderBottomRightRadius: radius.xs,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleTextOwn: {
    ...typography.body,
    color: colors.textInverse,
  },
  bubbleTextOther: {
    ...typography.body,
    color: colors.textPrimary,
  },

  // Meta row inside bubble (timestamp + tick)
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 3,
  },
  timeOwn: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
  },
  timeOther: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tick: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  tickUnread: {
    color: 'rgba(255,255,255,0.5)',
  },
  tickRead: {
    // Blue tick — distinct colour on the green bubble.
    color: '#90CAF9',
  },

  // Input row
  inputSafeArea: {
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: 2,
    color: colors.textMuted,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
});
