/**
 * supabase.ts — Supabase client, initialised once and reused everywhere.
 *
 * Where to get your URL and anon key:
 *   1. Go to https://supabase.com and create a free project.
 *   2. In the left sidebar: Settings > API.
 *   3. Copy "Project URL" → SUPABASE_URL below.
 *   4. Copy "anon public" key → SUPABASE_ANON_KEY below.
 *
 * The anon key is safe to ship in the app — Supabase Row Level Security
 * (RLS) controls what users can actually read/write. It is NOT a secret key.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// TODO: Replace these with your real values from the Supabase dashboard.
const SUPABASE_URL = 'https://qhyxcntsgrahfrdzpkyl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gSvxa7eB5Yx6Wyzv5CDVcw_D8HqNda7';

// AsyncStorage crashes on web because it checks for `window` during SSR
// (server-side rendering). This adapter uses localStorage on web instead,
// with a typeof guard for the SSR pass where even window doesn't exist yet.
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) =>
          typeof window !== 'undefined'
            ? Promise.resolve(window.localStorage.getItem(key))
            : Promise.resolve(null),
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // Disable URL-based session detection — this is a mobile app, not a browser.
    detectSessionInUrl: false,
  },
});
