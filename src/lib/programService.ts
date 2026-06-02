/**
 * programService.ts — Supabase operations for program purchases and video submissions.
 *
 * Plain async functions only — no classes, no state.
 */

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoSubmission {
  id: string;
  user_id: string;
  program_id: string | null;
  title: string;
  video_url: string;
  notes: string | null;
  coach_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  clientName?: string; // populated from profiles join
}

// ---------------------------------------------------------------------------
// Program purchases
// ---------------------------------------------------------------------------

/** Returns the list of program_ids the current user has purchased. */
export async function getMyProgramIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_programs')
    .select('program_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return (data ?? []).map((row) => row.program_id as string);
}

/** Insert a purchase record for the current user. Silently succeeds if already purchased (unique constraint). */
export async function purchaseProgram(programId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_programs')
    .upsert(
      { user_id: user.id, program_id: programId },
      { onConflict: 'user_id,program_id', ignoreDuplicates: true },
    );

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Video submissions
// ---------------------------------------------------------------------------

/**
 * getVideoSubmissions — coach receives all rows joined with client names;
 * clients receive only their own rows.
 */
export async function getVideoSubmissions(): Promise<VideoSubmission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch the caller's role to decide scope.
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  const isCoach = profileRow?.role === 'coach';

  let query = supabase
    .from('video_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  // Clients only see their own submissions; coaches see all.
  if (!isCoach) {
    query = query.eq('user_id', user.id);
  }

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  // For the coach view, resolve display names in a single batch query.
  if (isCoach) {
    const userIds = [...new Set(rows.map((r) => r.user_id as string))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name as string]));
    return rows.map((r) => ({
      ...(r as VideoSubmission),
      clientName: nameMap.get(r.user_id) ?? 'Unknown',
    }));
  }

  return rows as VideoSubmission[];
}

/** Insert a new video submission row for the current user. */
export async function submitVideo(params: {
  programId?: string;
  title: string;
  videoUrl: string;
  notes?: string;
}): Promise<VideoSubmission> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('video_submissions')
    .insert({
      user_id: user.id,
      program_id: params.programId ?? null,
      title: params.title,
      video_url: params.videoUrl,
      notes: params.notes ?? null,
      coach_feedback: null,
      reviewed_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as VideoSubmission;
}

/** Coach updates the feedback field and stamps reviewed_at. */
export async function addCoachFeedback(submissionId: string, feedback: string): Promise<void> {
  const { error } = await supabase
    .from('video_submissions')
    .update({
      coach_feedback: feedback,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Storage upload helper
// ---------------------------------------------------------------------------

/**
 * uploadVideoToStorage — uploads a local file URI to Supabase Storage.
 * Returns the public URL of the uploaded file.
 *
 * Path convention: {userId}/{timestamp}-{filename}
 * This keeps each user's files in their own folder, which the storage RLS
 * policy uses to gate per-user access.
 */
export async function uploadVideoToStorage(
  userId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const timestamp = Date.now();
  const storagePath = `${userId}/${timestamp}-${fileName}`;

  // React Native fetch turns a local file:// URI into an ArrayBuffer-compatible blob.
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('video-submissions')
    .upload(storagePath, blob, { contentType: mimeType, upsert: false });

  if (uploadError) throw uploadError;

  // Generate a signed URL valid for 10 years — effectively permanent for stored videos.
  const { data: signedData, error: signedError } = await supabase.storage
    .from('video-submissions')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

  if (signedError) throw signedError;
  return signedData.signedUrl;
}
