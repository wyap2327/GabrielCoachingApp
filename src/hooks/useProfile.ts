/**
 * useProfile.ts — Fetches the current user's profile (id, name, role).
 *
 * Kept deliberately thin: just wraps getMyProfile() so screens don't
 * need to manage their own loading state for this common operation.
 */

import { useState, useEffect } from 'react';
import { getMyProfile, type Profile } from '@/lib/messageService';
import { useAuth } from '@/hooks/useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const p = await getMyProfile();
        if (!cancelled) setProfile(p);
      } catch (err) {
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { profile, isLoading, error };
}
