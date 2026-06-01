/**
 * messageService.ts — All messaging-related Supabase operations.
 *
 * Plain async functions only — no classes, no state.
 */

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  name: string;
  role: 'coach' | 'client';
}

export interface Conversation {
  id: string;
  client_id: string;
  coach_id: string;
  client: Profile;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

/** Fetch the current user's profile row. */
export async function getMyProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

/** Fetch the single profile with role='coach'. Used by clients to find Gabriel. */
export async function getCoach(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'coach')
    .maybeSingle(); // returns null instead of error when no row found

  if (error) throw error;
  return data as Profile | null;
}

// ---------------------------------------------------------------------------
// Conversation helpers
// ---------------------------------------------------------------------------

/**
 * getOrCreateConversation — upserts the client/coach pair and returns the
 * conversation id. onConflict is safe to call repeatedly from clients.
 */
export async function getOrCreateConversation(
  clientId: string,
  coachId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      { client_id: clientId, coach_id: coachId },
      { onConflict: 'client_id,coach_id', ignoreDuplicates: false },
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

/**
 * getConversations — used by the coach. Returns all conversations with the
 * client's profile, the last message preview, and the count of unread messages
 * (messages sent BY the client that the coach hasn't read yet).
 *
 * We do two separate queries because Supabase's aggregation support over
 * foreign tables is limited in the JS client; plain queries are clearer.
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch all conversations where the current user is the coach.
  const { data: convRows, error: convErr } = await supabase
    .from('conversations')
    .select('id, client_id, coach_id')
    .eq('coach_id', user.id);

  if (convErr) throw convErr;
  if (!convRows || convRows.length === 0) return [];

  const convIds = convRows.map((c) => c.id);
  const clientIds = [...new Set(convRows.map((c) => c.client_id))];

  // Fetch client profiles in one round-trip.
  const { data: profileRows, error: profileErr } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('id', clientIds);

  if (profileErr) throw profileErr;

  const profileMap = new Map<string, Profile>(
    (profileRows ?? []).map((p) => [p.id, p as Profile]),
  );

  // Fetch the latest message per conversation. We get all messages ordered
  // descending then deduplicate in JS — simpler than a subquery via the REST API.
  const { data: msgRows, error: msgErr } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at, is_read, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  if (msgErr) throw msgErr;

  // Build per-conversation last-message and unread count from the message list.
  const lastMsgMap = new Map<string, { content: string; created_at: string }>();
  const unreadMap = new Map<string, number>();

  for (const msg of msgRows ?? []) {
    // First message encountered per conversation (list is desc) = most recent.
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
      });
    }
    // Unread = sent by someone else, not yet read.
    if (msg.sender_id !== user.id && !msg.is_read) {
      unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1);
    }
  }

  const conversations: Conversation[] = convRows.map((c) => ({
    id: c.id,
    client_id: c.client_id,
    coach_id: c.coach_id,
    client: profileMap.get(c.client_id) ?? { id: c.client_id, name: 'Unknown', role: 'client' },
    lastMessage: lastMsgMap.get(c.id)?.content,
    lastMessageAt: lastMsgMap.get(c.id)?.created_at,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }));

  // Sort by most recent message first (conversations without messages go last).
  conversations.sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return b.lastMessageAt.localeCompare(a.lastMessageAt);
  });

  return conversations;
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/** Fetch all messages in a conversation, oldest first. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

/** Insert a new message. sender_id is always the current user. */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

/**
 * markMessagesAsRead — marks all messages in this conversation as read
 * where the sender is NOT the current user (i.e. messages received, not sent).
 */
export async function markMessagesAsRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', user.id); // only mark messages you received, not ones you sent

  if (error) throw error;
}
