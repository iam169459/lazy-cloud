import { neon } from '@neondatabase/serverless';
import { randomUUID, scryptSync } from 'crypto';

let sql: ReturnType<typeof neon> | null = null;

function getSql() {
  // Read lazily so .env values loaded by vite after module import are picked up
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!sql) {
    sql = neon(databaseUrl);
  }
  return sql;
}

export interface StorageProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  endpoint_url: string;
  bucket_name: string;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  max_bytes: number;
  current_bytes: number;
  is_active: boolean;
  created_at: string;
}

export interface FileRecord {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  r2_key: string;
  provider_id: string;
  user_id: string | null;
  download_count: number;
  created_at: string;
  encrypted: boolean;
  enc_iv: string | null;
  enc_auth_tag: string | null;
}

export interface UserRecord {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: string;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  totp_secret: string | null;
  totp_enabled: boolean;
  created_at: string;
  last_login: string | null;
}

export async function initDatabase() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS storage_providers (
      id TEXT PRIMARY KEY,
      provider_type TEXT DEFAULT 's3',
      provider_name TEXT,
      endpoint_url TEXT,
      bucket_name TEXT,
      access_key_id TEXT,
      secret_access_key TEXT,
      region TEXT DEFAULT 'auto',
      max_bytes BIGINT DEFAULT 10188208025,
      current_bytes BIGINT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type TEXT,
      r2_key TEXT NOT NULL,
      provider_id TEXT,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      encrypted BOOLEAN DEFAULT false,
      enc_iv TEXT,
      enc_auth_tag TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      settings TEXT DEFAULT '{}',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      totp_secret TEXT,
      totp_enabled BOOLEAN DEFAULT false
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      password_hash TEXT,
      expires_at TIMESTAMP,
      download_limit INTEGER,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT 'read',
      last_used_at TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_shares_file_id ON shares (file_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares (expires_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log (admin_id)`;

  // --- Schema migrations (idempotent, safe on every startup) ---

  // Recreate the files→providers FK with ON DELETE SET NULL so removing a
  // bucket no longer fails when files reference it; the file record survives
  // with provider_id = NULL (matches the UI warning text).
  try {
    await sql`ALTER TABLE files DROP CONSTRAINT IF EXISTS files_provider_id_fkey`;
    await sql`ALTER TABLE files ADD CONSTRAINT files_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES storage_providers(id) ON DELETE SET NULL`;
  } catch (e: any) {
    console.warn('[lazydrop] FK migration skipped:', e.message);
  }

  // Settings JSON on admin_settings (idempotent — safe on every startup)
  await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS settings TEXT DEFAULT '{}'`;

  // Email column (idempotent)
  await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS email TEXT`;

  // Add created_at to storage_providers if missing (migration for existing DBs)
  await sql`ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

  // Add encryption columns to files if missing (migration for existing DBs)
  await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS enc_iv TEXT`;
  await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS enc_auth_tag TEXT`;

  // Add region to storage_providers if missing (migration for existing DBs)
  await sql`ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'auto'`;

  // Add provider_type to storage_providers if missing (migration for existing DBs)
  await sql`ALTER TABLE storage_providers ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 's3'`;

  // Fix max_bytes for existing providers based on provider_type
  await sql`UPDATE storage_providers SET max_bytes = 10737418240 WHERE provider_type = 'backblaze-b2' AND max_bytes = 10188208025`;
  await sql`UPDATE storage_providers SET max_bytes = 10737418240 WHERE provider_type = 'cloudflare-r2' AND max_bytes = 10188208025`;
  await sql`UPDATE storage_providers SET max_bytes = 5368709120 WHERE provider_type = 'aws-s3' AND max_bytes = 10188208025`;
  await sql`UPDATE storage_providers SET max_bytes = 5368709120 WHERE provider_type = 'google-cloud' AND max_bytes = 10188208025`;
  await sql`UPDATE storage_providers SET max_bytes = 10737418240 WHERE provider_type = 'idrive-e2' AND max_bytes = 10188208025`;
  await sql`UPDATE storage_providers SET max_bytes = 1099511627776 WHERE provider_type = 'minio' AND max_bytes = 10188208025`;

  // Indexes for the hot query paths
  await sql`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_files_provider_id ON files (provider_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_storage_providers_active ON storage_providers (is_active)`;

  // --- Multi-user tables ---
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      storage_used BIGINT DEFAULT 0,
      storage_limit BIGINT DEFAULT 10737418240,
      is_active BOOLEAN DEFAULT true,
      totp_secret TEXT,
      totp_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`;

  // Add user_id to files for ownership
  await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS user_id TEXT`;
  await sql`ALTER TABLE files ADD CONSTRAINT IF NOT EXISTS files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files (user_id)`;
}

export interface AdminCredentials {
  username: string;
  password: string;
  email?: string;
  totp_enabled?: boolean;
}

export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  const sql = getSql();
  const rows = (await sql`SELECT username, password, email, totp_enabled FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  if (rows.length > 0) {
    return rows[0] as AdminCredentials;
  }
  // Check env vars — seed DB if present
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;
  const envEmail = process.env.ADMIN_EMAIL;
  if (envUser && envPass) {
    // Auto-seed from .env on first run
    try {
      await updateAdminCredentials(envUser, envPass, envEmail);
      return { username: envUser, password: envPass, email: envEmail };
    } catch {}
    return { username: envUser, password: envPass, email: envEmail };
  }
  return null;
}

export async function isAdminSetup(): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`SELECT username, password FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  if (rows.length > 0) return true;
  return !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export async function updateAdminCredentials(username: string, password: string, email?: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO admin_settings (id, username, password, email, updated_at)
    VALUES ('singleton', ${username}, ${password}, ${email || null}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE
    SET username = ${username}, password = ${password}, email = ${email || null}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getTotpSecret(): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`SELECT totp_secret FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  if (rows.length > 0) {
    const row = rows[0] as any;
    return row.totp_secret || null;
  }
  return null;
}

export async function getTotpEnabled(): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`SELECT totp_enabled FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  if (rows.length > 0) {
    const row = rows[0] as any;
    return row.totp_enabled === true;
  }
  return false;
}

export async function setTotpSecret(secret: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE admin_settings SET totp_secret = ${secret}, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'singleton'
  `;
}

export async function enableTotp(secret: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE admin_settings SET totp_secret = ${secret}, totp_enabled = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'singleton'
  `;
}

export async function disableTotp(): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE admin_settings SET totp_secret = NULL, totp_enabled = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'singleton'
  `;
}

export interface AppSettings {
  siteName: string;
  maxFileSize: string;
  allowedTypes: string;
  autoDelete: boolean;
  autoDeleteDays: string;
  enableDownloadCounter: boolean;
  enablePublicUpload: boolean;
  maxStoragePerBucket: string;
  sessionTimeout: string;
  ipWhitelist: string;
  backgroundUrl: string;
  backgroundType: 'image' | 'video' | '';
}

const DEFAULT_SETTINGS: AppSettings = {
  siteName: 'LazyDrop',
  maxFileSize: '10737418240',
  allowedTypes: '*',
  autoDelete: false,
  autoDeleteDays: '30',
  enableDownloadCounter: true,
  enablePublicUpload: false,
  maxStoragePerBucket: '10188208025',
  sessionTimeout: '30',
  ipWhitelist: '',
  backgroundUrl: '',
  backgroundType: '',
};

export async function getAppSettings(): Promise<AppSettings> {
  const sql = getSql();
  const rows = (await sql`SELECT settings FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  const raw = rows[0] as { settings?: string } | undefined;
  if (raw?.settings) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw.settings) };
    } catch {
      // corrupt settings — fall back to defaults
    }
  }
  return DEFAULT_SETTINGS;
}

export async function updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const sql = getSql();
  const next = { ...(await getAppSettings()), ...patch };
  await sql`
    INSERT INTO admin_settings (id, username, password, settings, updated_at)
    VALUES (
      'singleton',
      ${process.env.ADMIN_USERNAME || 'admin'},
      ${process.env.ADMIN_PASSWORD || 'lazydrop-admin-2024'},
      ${JSON.stringify(next)},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE
    SET settings = ${JSON.stringify(next)}, updated_at = CURRENT_TIMESTAMP
  `;
  return next;
}

export function getDb() {
  return getSql();
}

export function generateId(): string {
  return randomUUID();
}

export async function findProviderForSize(fileSize: number): Promise<StorageProvider | null> {
  const sql = getSql();
  const providers = (await sql`
    SELECT * FROM storage_providers
    WHERE is_active = true
    AND (current_bytes + ${fileSize}) <= max_bytes
    ORDER BY (max_bytes - current_bytes) DESC
    LIMIT 1
  `) as unknown[];
  return (providers[0] as StorageProvider) ?? null;
}

export async function addProvider(provider: Omit<StorageProvider, 'id' | 'current_bytes' | 'is_active' | 'created_at'>): Promise<StorageProvider> {
  const sql = getSql();
  const id = generateId();
  const rows = (await sql`
    INSERT INTO storage_providers (id, provider_type, provider_name, endpoint_url, bucket_name, access_key_id, secret_access_key, region, max_bytes, current_bytes, is_active)
    VALUES (${id}, ${provider.provider_type || 's3'}, ${provider.provider_name}, ${provider.endpoint_url}, ${provider.bucket_name}, ${provider.access_key_id}, ${provider.secret_access_key}, ${provider.region || 'auto'}, ${provider.max_bytes}, 0, true)
    RETURNING *
  `) as unknown[];
  return rows[0] as StorageProvider;
}

export async function listProviders(): Promise<StorageProvider[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM storage_providers ORDER BY provider_name`) as unknown as StorageProvider[];
}

export async function deleteProvider(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM storage_providers WHERE id = ${id}`;
}

export async function updateProviderBytes(providerId: string, delta: number): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE storage_providers
    SET current_bytes = GREATEST(0, current_bytes + ${delta})
    WHERE id = ${providerId}
  `;
}

export async function toggleProviderActive(providerId: string): Promise<StorageProvider | null> {
  const sql = getSql();
  const rows = (await sql`
    UPDATE storage_providers
    SET is_active = NOT is_active
    WHERE id = ${providerId}
    RETURNING *
  `) as unknown[];
  return (rows[0] as StorageProvider) ?? null;
}

export async function createFileRecord(file: Omit<FileRecord, 'download_count' | 'created_at'>): Promise<FileRecord> {
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO files (id, original_name, file_size, mime_type, r2_key, provider_id, download_count, created_at, encrypted, enc_iv, enc_auth_tag)
    VALUES (${file.id}, ${file.original_name}, ${file.file_size}, ${file.mime_type}, ${file.r2_key}, ${file.provider_id}, 0, CURRENT_TIMESTAMP, ${file.encrypted || false}, ${file.enc_iv || null}, ${file.enc_auth_tag || null})
    ON CONFLICT (id) DO UPDATE SET
      original_name = EXCLUDED.original_name,
      file_size = EXCLUDED.file_size,
      mime_type = EXCLUDED.mime_type,
      r2_key = EXCLUDED.r2_key,
      provider_id = EXCLUDED.provider_id
    RETURNING *
  `) as unknown[];
  return rows[0] as FileRecord;
}

export async function getFileRecord(id: string): Promise<FileRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM files WHERE id = ${id}`) as unknown[];
  return (rows[0] as FileRecord) ?? null;
}

export async function listExpiredFiles(days: number): Promise<FileRecord[]> {
  const sql = getSql();
  return (await sql`
    SELECT * FROM files
    WHERE created_at < NOW() - make_interval(days => ${days})
    ORDER BY created_at ASC
  `) as unknown as FileRecord[];
}

export async function listFiles(): Promise<(FileRecord & { provider_name: string })[]> {
  const sql = getSql();
  return (await sql`
    SELECT f.*, sp.provider_name
    FROM files f
    LEFT JOIN storage_providers sp ON f.provider_id = sp.id
    ORDER BY f.created_at DESC
  `) as unknown as (FileRecord & { provider_name: string })[];
}

export async function deleteFileRecord(id: string): Promise<FileRecord | null> {
  const sql = getSql();
  const rows = (await sql`DELETE FROM files WHERE id = ${id} RETURNING *`) as unknown[];
  return (rows[0] as FileRecord) ?? null;
}

export async function incrementDownloadCount(id: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE files SET download_count = download_count + 1 WHERE id = ${id}`;
}

export interface ShareRecord {
  id: string;
  file_id: string;
  password_hash: string | null;
  expires_at: string | null;
  download_limit: number | null;
  download_count: number;
  created_at: string;
}

export async function createShare(share: Omit<ShareRecord, 'id' | 'download_count' | 'created_at'>): Promise<ShareRecord> {
  const sql = getSql();
  const id = randomUUID();
  const rows = (await sql`
    INSERT INTO shares (id, file_id, password_hash, expires_at, download_limit)
    VALUES (${id}, ${share.file_id}, ${share.password_hash}, ${share.expires_at}, ${share.download_limit})
    RETURNING *
  `) as unknown[];
  return rows[0] as ShareRecord;
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM shares WHERE id = ${id}`) as unknown[];
  return (rows[0] as ShareRecord) ?? null;
}

export async function listShares(): Promise<ShareRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM shares ORDER BY created_at DESC`) as unknown[] as ShareRecord[];
}

export async function deleteShare(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM shares WHERE id = ${id}`;
}

export async function incrementShareDownloadCount(id: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE shares SET download_count = download_count + 1 WHERE id = ${id}`;
}

export async function getShareById(id: string): Promise<ShareRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM shares WHERE id = ${id}`) as unknown[];
  return (rows[0] as ShareRecord) ?? null;
}

export async function getSharesByFileId(fileId: string): Promise<ShareRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM shares WHERE file_id = ${fileId} ORDER BY created_at DESC`) as unknown[] as ShareRecord[];
}

export async function validateShare(shareId: string, password?: string): Promise<ShareRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM shares WHERE id = ${shareId}`) as unknown[];
  const share = rows[0] as ShareRecord | undefined;
  if (!share) return null;
  if (share.expires_at && new Date(share.expires_at) < new Date()) return null;
  if (share.download_limit && share.download_count >= share.download_limit) return null;
  if (share.password_hash) {
    if (!password) return null;
    const hash = scryptSync(password, 'lazydrop-share', 64).toString('hex');
    if (hash !== share.password_hash) return null;
  }
  return share;
}

export async function getStats(): Promise<{
  files: { total_files: string; total_bytes: string; total_downloads: string };
  providers: { total_providers: string; used_bytes: string; capacity_bytes: string };
}> {
  const sql = getSql();
  const files = (await sql`SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size, COALESCE(SUM(download_count), 0) as downloads FROM files`) as unknown[];
  const providers = (await sql`SELECT COUNT(*) as count, COALESCE(SUM(current_bytes), 0) as used, COALESCE(SUM(max_bytes), 0) as capacity FROM storage_providers`) as unknown[];
  const f = files[0] as any;
  const p = providers[0] as any;
  return {
    files: {
      total_files: String(parseInt(f.count) || 0),
      total_bytes: String(parseInt(f.size) || 0),
      total_downloads: String(parseInt(f.downloads) || 0),
    },
    providers: {
      total_providers: String(parseInt(p.count) || 0),
      used_bytes: String(parseInt(p.used) || 0),
      capacity_bytes: String(parseInt(p.capacity) || 0),
    },
  };
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_hash: string;
  permissions: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export async function createApiKey(apiKey: Omit<ApiKeyRecord, 'id' | 'last_used_at' | 'created_at'>): Promise<ApiKeyRecord> {
  const sql = getSql();
  const id = randomUUID();
  const rows = (await sql`
    INSERT INTO api_keys (id, name, key_hash, permissions, expires_at)
    VALUES (${id}, ${apiKey.name}, ${apiKey.key_hash}, ${apiKey.permissions}, ${apiKey.expires_at})
    RETURNING *
  `) as unknown[];
  return rows[0] as ApiKeyRecord;
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKeyRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM api_keys WHERE key_hash = ${keyHash}`) as unknown[];
  return (rows[0] as ApiKeyRecord) ?? null;
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM api_keys ORDER BY created_at DESC`) as unknown[] as ApiKeyRecord[];
}

export async function deleteApiKey(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM api_keys WHERE id = ${id}`;
}

export async function updateApiKeyLastUsed(id: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function createAuditLog(log: Omit<AuditLogRecord, 'id' | 'created_at'>): Promise<void> {
  const sql = getSql();
  const id = randomUUID();
  await sql`
    INSERT INTO audit_log (id, admin_id, action, details, ip_address, user_agent)
    VALUES (${id}, ${log.admin_id}, ${log.action}, ${log.details}, ${log.ip_address}, ${log.user_agent})
  `;
}

export async function listAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLogRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown[] as AuditLogRecord[];
}

export async function cleanupExpiredFiles(): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM shares WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP`;
}

// ── User functions ──

export async function createUser(username: string, email: string, passwordHash: string, role: string = 'user'): Promise<UserRecord> {
  const sql = getSql();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES (${id}, ${username}, ${email || null}, ${passwordHash}, ${role})
    RETURNING *
  ` as unknown[];
  return rows[0] as UserRecord;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE username = ${username}` as unknown[];
  return (rows[0] as UserRecord) || null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${id}` as unknown[];
  return (rows[0] as UserRecord) || null;
}

export async function listUsers(limit: number = 100, offset: number = 0): Promise<UserRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown[] as UserRecord[];
}

export async function updateUser(id: string, patch: Partial<Pick<UserRecord, 'username' | 'email' | 'role' | 'is_active' | 'storage_limit' | 'totp_secret' | 'totp_enabled' | 'password_hash' | 'last_login'>>): Promise<UserRecord | null> {
  const sql = getSql();
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) { fields.push(k); values.push(v); }
  }
  if (fields.length === 0) return getUserById(id);
  // Build dynamic update
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const result = await sql.unsafe(
    `UPDATE users SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return (result as unknown[])[0] as UserRecord || null;
}

export async function deleteUser(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM users WHERE id = ${id}`;
}

export async function updateUserStorageUsed(userId: string): Promise<void> {
  const sql = getSql();
  const rows = await sql`SELECT COALESCE(SUM(file_size), 0)::BIGINT AS total FROM files WHERE user_id = ${userId}` as unknown[];
  const total = Number((rows[0] as any).total);
  await sql`UPDATE users SET storage_used = ${total} WHERE id = ${userId}`;
}

export async function countUsers(): Promise<number> {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::INT AS count FROM users` as unknown[];
  return (rows[0] as any).count;
}

export async function listUserFiles(userId: string, limit: number = 100, offset: number = 0): Promise<FileRecord[]> {
  const sql = getSql();
  return (await sql`SELECT * FROM files WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown[] as FileRecord[];
}

export async function countUserFiles(userId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::INT AS count FROM files WHERE user_id = ${userId}` as unknown[];
  return (rows[0] as any).count;
}

export async function listUserShares(userId: string): Promise<(ShareRecord & { file_name: string })[]> {
  const sql = getSql();
  return (await sql`
    SELECT s.*, f.original_name AS file_name
    FROM shares s
    JOIN files f ON f.id = s.file_id
    WHERE f.user_id = ${userId}
    ORDER BY s.created_at DESC
  `) as unknown[] as (ShareRecord & { file_name: string })[];
}

