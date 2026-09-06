import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;

let sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!sql) {
    sql = neon(DATABASE_URL);
  }
  return sql;
}

export interface StorageProvider {
  id: string;
  provider_name: string;
  endpoint_url: string;
  bucket_name: string;
  access_key_id: string;
  secret_access_key: string;
  max_bytes: number;
  current_bytes: number;
  is_active: boolean;
}

export interface FileRecord {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  r2_key: string;
  provider_id: string;
  download_count: number;
  created_at: string;
}

export async function initDatabase() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS storage_providers (
      id TEXT PRIMARY KEY,
      provider_name TEXT,
      endpoint_url TEXT,
      bucket_name TEXT,
      access_key_id TEXT,
      secret_access_key TEXT,
      max_bytes BIGINT DEFAULT 10188208025,
      current_bytes BIGINT DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type TEXT,
      r2_key TEXT NOT NULL,
      provider_id TEXT REFERENCES storage_providers(id),
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const sql = getSql();
  const rows = (await sql`SELECT username, password FROM admin_settings WHERE id = 'singleton'`) as unknown[];
  if (rows.length > 0) {
    return rows[0] as AdminCredentials;
  }
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'lazydrop-admin-2024',
  };
}

export async function updateAdminCredentials(username: string, password: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO admin_settings (id, username, password, updated_at)
    VALUES ('singleton', ${username}, ${password}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE
    SET username = ${username}, password = ${password}, updated_at = CURRENT_TIMESTAMP
  `;
}

export function getDb() {
  return getSql();
}

export function generateId(_length?: number): string {
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

export async function addProvider(provider: Omit<StorageProvider, 'id' | 'current_bytes' | 'is_active'>): Promise<StorageProvider> {
  const sql = getSql();
  const id = generateId(12);
  const rows = (await sql`
    INSERT INTO storage_providers (id, provider_name, endpoint_url, bucket_name, access_key_id, secret_access_key, max_bytes, current_bytes, is_active)
    VALUES (${id}, ${provider.provider_name}, ${provider.endpoint_url}, ${provider.bucket_name}, ${provider.access_key_id}, ${provider.secret_access_key}, ${provider.max_bytes}, 0, true)
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
    SET current_bytes = current_bytes + ${delta}
    WHERE id = ${providerId}
  `;
}

export async function createFileRecord(file: Omit<FileRecord, 'download_count' | 'created_at'>): Promise<FileRecord> {
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO files (id, original_name, file_size, mime_type, r2_key, provider_id, download_count, created_at)
    VALUES (${file.id}, ${file.original_name}, ${file.file_size}, ${file.mime_type}, ${file.r2_key}, ${file.provider_id}, 0, CURRENT_TIMESTAMP)
    RETURNING *
  `) as unknown[];
  return rows[0] as FileRecord;
}

export async function getFileRecord(id: string): Promise<FileRecord | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM files WHERE id = ${id}`) as unknown[];
  return (rows[0] as FileRecord) ?? null;
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

export async function getStats() {
  const sql = getSql();
  const fileStats = (await sql`
    SELECT
      COUNT(*) as total_files,
      COALESCE(SUM(file_size), 0) as total_bytes,
      COALESCE(SUM(download_count), 0) as total_downloads
    FROM files
  `) as unknown[];
  const providerStats = (await sql`
    SELECT
      COUNT(*) as total_providers,
      COALESCE(SUM(current_bytes), 0) as used_bytes,
      COALESCE(SUM(max_bytes), 0) as capacity_bytes
    FROM storage_providers WHERE is_active = true
  `) as unknown[];
  return {
    files: fileStats[0],
    providers: providerStats[0],
  };
}
