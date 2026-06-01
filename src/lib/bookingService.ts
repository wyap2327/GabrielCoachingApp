/**
 * bookingService.ts — All booking-related Supabase operations.
 *
 * Plain async functions only — no classes, no state.
 * Import the supabase client and call these from screens/hooks.
 */

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingType = 'in-person' | 'online';
export type BookingDuration = 30 | 60;

export interface Booking {
  id: string;
  user_id: string;
  type: BookingType;
  duration: BookingDuration;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  notes?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  clientName?: string; // populated when the coach fetches all bookings
}

export interface TimeSlot {
  start: string;   // HH:MM e.g. "09:00"
  end: string;     // HH:MM e.g. "09:30"
  available: boolean;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Pad a number to two digits: 9 → "09", 14 → "14".
 */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Add `minutes` to a "HH:MM" string, returning a new "HH:MM" string.
 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * generateSlots — builds every possible start/end pair between 08:00 and 20:00
 * stepping by `duration` minutes. 20:00 is the hard cutoff, so a 30-min slot
 * starting at 19:30 is allowed (ends at 20:00) but one starting at 20:00 is not.
 */
function generateSlots(duration: BookingDuration): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  let current = '08:00';
  const limit = '20:00';

  while (current < limit) {
    const next = addMinutes(current, duration);
    if (next > limit) break;
    slots.push({ start: current, end: next });
    current = next;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * getMyBookings — returns the current user's upcoming confirmed bookings,
 * ordered by date then start_time. "Upcoming" means today or later.
 */
export async function getMyBookings(): Promise<Booking[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  const bookings = (data ?? []) as Booking[];
  if (bookings.length === 0) return bookings;

  // Fetch profile names for all unique user_ids so the coach can see
  // which client made each booking without a separate query per row.
  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  return bookings.map((b) => ({ ...b, clientName: nameMap.get(b.user_id) }));
}

/**
 * getAvailableSlots — generates all slots for the given duration on the given
 * date, then marks each as available or unavailable based on confirmed bookings.
 *
 * `excludeBookingId` — when rescheduling, pass the booking's own id so its
 * original slot is treated as free (the user is replacing it, not double-booking).
 *
 * Past slots on today's date are marked unavailable so users can't book backwards.
 */
export async function getAvailableSlots(
  date: string,
  duration: BookingDuration,
  excludeBookingId?: string,
): Promise<TimeSlot[]> {
  // Fetch all confirmed bookings on this date (excluding the one being rescheduled).
  let query = supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('date', date)
    .eq('status', 'confirmed');

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const taken = (data ?? []) as Array<{ start_time: string; end_time: string }>;

  // Build a Set of taken start times for O(1) lookup.
  const takenStarts = new Set(taken.map((b) => b.start_time.slice(0, 5)));

  // Current time string "HH:MM" — used to grey out past slots on today only.
  const isToday = date === new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return generateSlots(duration).map(({ start, end }) => ({
    start,
    end,
    available:
      !takenStarts.has(start) &&
      // Disable slots that have already passed today.
      !(isToday && start <= currentTime),
  }));
}

/**
 * createBooking — inserts a new confirmed booking for the current user.
 */
export async function createBooking(params: {
  type: BookingType;
  duration: BookingDuration;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<Booking> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      type: params.type,
      duration: params.duration,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      notes: params.notes ?? null,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

/**
 * cancelBooking — soft-deletes by setting status to 'cancelled'.
 * History is preserved; the row is never deleted.
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) throw error;
}

/**
 * rescheduleBooking — updates only the date and time fields of an existing booking.
 * Type, duration, and notes remain unchanged.
 */
export async function rescheduleBooking(
  bookingId: string,
  params: { date: string; startTime: string; endTime: string },
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
    })
    .eq('id', bookingId);

  if (error) throw error;
}
