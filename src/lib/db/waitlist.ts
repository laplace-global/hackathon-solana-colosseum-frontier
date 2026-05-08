import { db, waitlistEntries } from '@/lib/db';
import { normalizeWaitlistEmail } from '@/lib/waitlist';

interface SaveWaitlistEntryArgs {
  email: string;
  source?: string | null;
}

export async function saveWaitlistEntry({ email, source }: SaveWaitlistEntryArgs): Promise<void> {
  const normalizedEmail = normalizeWaitlistEmail(email);
  const normalizedSource = typeof source === 'string' && source.trim().length > 0
    ? source.trim().slice(0, 120)
    : null;

  await db
    .insert(waitlistEntries)
    .values({
      email: normalizedEmail,
      source: normalizedSource,
    })
    .onConflictDoNothing({
      target: waitlistEntries.email,
    });
}
