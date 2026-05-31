/**
 * useAuth.ts — React hook that tracks the signed-in user across the app.
 *
 * This hook is the single source of truth for auth state. Any screen that
 * needs to know who is logged in (or call sign-in/out) should use this.
 */

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as authFns from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until we've checked the session

  useEffect(() => {
    // On mount: check if there is already a session saved from a previous launch.
    // This runs once and then we listen for changes below.
    authFns.getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });

    // onAuthStateChange fires whenever the session changes:
    // sign-in, sign-out, token refresh, or expiry.
    // This keeps `user` in sync without polling.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Clean up the listener when this component unmounts.
    return () => listener.subscription.unsubscribe();
  }, []); // empty array = run once on mount

  // Wrap the auth functions so callers can just `const { signIn } = useAuth()`.
  async function signIn(email: string, password: string) {
    return authFns.signIn(email, password);
  }

  async function signUp(email: string, password: string, name: string) {
    return authFns.signUp(email, password, name);
  }

  async function signOut() {
    return authFns.signOut();
  }

  return { user, isLoading, signIn, signUp, signOut };
}
