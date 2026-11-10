import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || scryptSync('lazydrop-default-encryption-key-2024', 'lazydrop-salt', 32);

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
