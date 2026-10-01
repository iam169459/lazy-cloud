import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * AES-256 needs exactly 32 bytes. `ENCRYPTION_KEY` is a free-form string from
 * .env, and handing that string straight to createCipheriv throws
 * ("Invalid key length"), which broke encrypted uploads for anyone who set it.
 * Accept a 64-char hex key as-is, otherwise derive one deterministically so
 * the same env value always decrypts what it encrypted.
 */
function resolveKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    return scryptSync('lazydrop-default-encryption-key-2024', 'lazydrop-salt', 32);
  }
  if (/^[0-9a-f]{64}$/i.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  return scryptSync(envKey, 'lazydrop-salt', 32);
}

const ENCRYPTION_KEY = resolveKey();

export function encryptFile(buffer: Buffer): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptFile(encrypted: Buffer, iv: string, authTag: string): Buffer {
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function isEncryptionEnabled(): boolean {
  const envKey = process.env.ENCRYPTION_KEY;
  return !!(envKey && envKey.length >= 32);
}

export function getEncryptionStatus(): { enabled: boolean; usingDefault: boolean } {
  const envKey = process.env.ENCRYPTION_KEY;
  return {
    enabled: !!(envKey && envKey.length >= 32),
    usingDefault: !envKey,
  };
}
