'use client';

export const AUTH_EMAIL = 'ajinnexa@gmail.com';
export const AUTH_PASSWORD = 'nexa@123';
const SESSION_KEY = 'nexa-session';
export const SESSION_EVENT = 'nexa-session-changed';

export type NexaSession = {
  email: string;
  name: string;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getSession(): NexaSession | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<NexaSession>;
    if (!parsed.email || !parsed.name) return null;
    return { email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}

export function saveSession(session: NexaSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function updateSessionName(name: string) {
  const session = getSession();
  if (!session) return null;
  const next = { ...session, name: name.trim() || session.name };
  saveSession(next);
  return next;
}

export function clearSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}
