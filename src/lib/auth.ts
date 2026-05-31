/**
 * auth.ts — Plain async functions that wrap Supabase auth calls.
 *
 * Why plain functions instead of a class?
 * Simpler to import, simpler to test, and there's no shared state here —
 * Supabase's own client holds the session internally.
 */

import { supabase } from './supabase';

// Returns the currently signed-in user, or null if nobody is logged in.
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Signs in with email + password. Returns the user on success, or an error.
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user ?? null, error };
}

// Creates a new account, then stores the user's name in their profile metadata.
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // `data` is stored in the user's auth metadata — accessible as user.user_metadata.
      data: { name },
    },
  });
  return { user: data.user ?? null, error };
}

// Signs out the current user and clears the local session.
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Sends a password reset email. Supabase handles the email delivery.
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
}
