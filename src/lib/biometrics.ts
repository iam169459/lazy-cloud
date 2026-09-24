import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
  WebAuthnError,
} from '@simplewebauthn/browser';
import { api } from './api';

export interface BiometricsSupport {
  supported: boolean;
  platformAvailable: boolean;
}

export async function getBiometricsSupport(): Promise<BiometricsSupport> {
  if (typeof window === 'undefined' || !browserSupportsWebAuthn()) {
    return { supported: false, platformAvailable: false };
  }
  try {
    const platformAvailable = await platformAuthenticatorIsAvailable();
    return { supported: true, platformAvailable };
  } catch {
    return { supported: true, platformAvailable: false };
  }
}

function isUserCancelError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const name = (e as any).name || '';
  const message = (e.message || '').toLowerCase();
  if (name === 'NotAllowedError') return true;
  if (name === 'AbortError') return true;
  if (message.includes('not allowed') || message.includes('cancel') || message.includes('abort')) {
    return true;
  }
  if (e instanceof WebAuthnError) {
    return e.name === 'NotAllowedError' || e.name === 'AbortError';
  }
  return false;
}

export function friendlyBiometricsError(e: unknown): string {
  if (isUserCancelError(e)) return 'Biometric prompt was cancelled.';
  if (e instanceof Error && e.message) return e.message;
  return 'Biometric operation failed.';
}

/**
 * Enroll a platform passkey for the currently logged-in user.
 * Requires a valid auth token (Bearer).
 */
export async function enableBiometrics(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const support = await getBiometricsSupport();
    if (!support.supported) {
      return { success: false, error: 'This browser does not support passkeys/WebAuthn.' };
    }
    if (!support.platformAvailable) {
      return {
        success: false,
        error: 'No platform authenticator (Touch ID / Face ID / Windows Hello) available on this device.',
      };
    }

    const { options } = await api.bioRegisterOptions(token);
    const attestationResponse = await startRegistration({ optionsJSON: options });
    const result = await api.bioRegisterVerify(token, attestationResponse);
    if (!result?.success) {
      return { success: false, error: 'Passkey registration was not accepted by the server.' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyBiometricsError(e) };
  }
}

/**
 * Log in with a platform passkey (no password).
 * Returns a standard auth token + user on success.
 */
export async function loginWithBiometrics(
  username: string
): Promise<{
  success: boolean;
  token?: string;
  user?: { id: string; username: string; email: string; role: string };
  error?: string;
}> {
  try {
    const support = await getBiometricsSupport();
    if (!support.supported) {
      return { success: false, error: 'This browser does not support passkeys/WebAuthn.' };
    }

    const { options } = await api.bioLoginOptions(username);
    const assertion = await startAuthentication({ optionsJSON: options });
    const result = await api.bioLoginVerify({
      response: assertion,
      credentialId: assertion.id,
      username,
    });

    if (!result?.success || !result.token) {
      return { success: false, error: result?.error || 'Passkey login failed.' };
    }
    return { success: true, token: result.token, user: result.user };
  } catch (e) {
    return { success: false, error: friendlyBiometricsError(e) };
  }
}

/**
 * React-friendly wrappers (thin hooks-friendly helpers).
 */
export async function enableBiometricsForUser(token: string) {
  return enableBiometrics(token);
}

export async function loginWithBiometricsForUser(username: string) {
  return loginWithBiometrics(username);
}
