const WAITLIST_EMAIL_ERROR = 'Enter a valid email address.';

export function normalizeWaitlistEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function getWaitlistEmailError(value: unknown): string | null {
  const email = normalizeWaitlistEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return WAITLIST_EMAIL_ERROR;
  }

  return null;
}
