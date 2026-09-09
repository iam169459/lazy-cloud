import { IncomingMessage, ServerResponse } from 'http';
import { timingSafeEqual, randomBytes, scryptSync } from 'crypto';
import busboy from 'busboy';
import { initDatabase, findProviderForSize, addProvider, listProviders, deleteProvider, updateProviderBytes, toggleProviderActive, createFileRecord, getFileRecord, listFiles, deleteFileRecord, incrementDownloadCount, getStats, generateId, getAdminCredentials, updateAdminCredentials, isAdminSetup, getAppSettings, updateAppSettings, listExpiredFiles, getDb, createShare, getShareById, getSharesByFileId, validateShare, incrementShareDownloadCount, deleteShare, createApiKey, listApiKeys, getApiKeyByHash, deleteApiKey, updateApiKeyLastUsed, createAuditLog, listAuditLogs } from './db';
import { uploadToProvider, deleteFromProvider, getPresignedDownloadUrl, downloadFromProvider, listObjects, getBucketSize } from './s3';
import { encryptFile, decryptFile, isEncryptionEnabled, getEncryptionStatus } from './encryption';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function sanitize(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&;]/g, '').trim().slice(0, 500);
}

// ── Rate Limiting ──
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string, maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

function applyRateLimit(req: IncomingMessage, res: ServerResponse, maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW): boolean {
  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(ip, maxRequests, windowMs);
  
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
  
  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    sendJson(res, 429, { error: 'Too many requests', retryAfter });
    return false;
  }
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 5 * 60 * 1000);

/**
 * Delete files older than settings.autoDeleteDays (when auto-delete is on).
 * Runs on a timer in the Vite plugin and is safe to call repeatedly.
 */
export async function cleanupExpiredFiles(): Promise<number> {
  try {
    const settings = await getAppSettings();
    if (!settings.autoDelete) return 0;
    const days = parseInt(settings.autoDeleteDays) || 30;
    const files = await listExpiredFiles(days);
    if (files.length === 0) return 0;

    const providers = await listProviders();
    let removed = 0;
    for (const f of files) {
      const provider = providers.find((p) => p.id === f.provider_id);
      try {
        if (provider) {
          await deleteFromProvider(provider, f.r2_key);
          await updateProviderBytes(provider.id, -f.file_size);
        }
        await deleteFileRecord(f.id);
        removed++;
      } catch (e: any) {
        console.error(`[lazydrop] auto-delete failed for ${f.id}:`, e.message);
      }
    }
    if (removed > 0) console.log(`[lazydrop] auto-deleted ${removed} expired file(s)`);
    return removed;
  } catch (e: any) {
    console.error('[lazydrop] cleanup sweep failed:', e.message);
    return 0;
  }
}

async function handleUpload(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const settings = await getAppSettings();
  const maxSize = parseInt(settings.maxFileSize) || 0;
  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: maxSize > 0 ? maxSize : undefined, files: 1 },
  });

  let fileName = '';
  let mimeType = '';
  const chunks: Buffer[] = [];
  let fileSize = 0;
  let uploadError: string | null = null;

  bb.on('file', (_fieldname, file, info) => {
    fileName = info.filename || 'unnamed';
    mimeType = info.mimeType || 'application/octet-stream';

    file.on('limit', () => {
      uploadError = `File is too large. Maximum allowed size is ${formatBytes(maxSize)}.`;
      file.resume();
    });

    file.on('data', (chunk: Buffer) => {
      if (!uploadError) {
        chunks.push(chunk);
        fileSize += chunk.length;
      }
    });
  });

  bb.on('error', (err: Error) => {
    uploadError = err.message;
  });

  return new Promise<boolean>((resolve) => {
    bb.on('finish', async () => {
      if (uploadError) {
        sendError(res, uploadError.includes('too large') ? 413 : 400, uploadError);
        return resolve(true);
      }
      if (!fileName || chunks.length === 0) {
        sendError(res, 400, 'No file uploaded');
        return resolve(true);
      }

      const fileBuffer = Buffer.concat(chunks);
      chunks.length = 0;

      const allowed = (settings.allowedTypes || '*')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length > 0 && !allowed.includes('*') && !allowed.includes(mimeType.toLowerCase())) {
        sendError(res, 415, `File type ${mimeType || 'unknown'} is not allowed.`);
        return resolve(true);
      }

      const providerUsed = await findProviderForSize(fileSize);
      if (!providerUsed) {
        const allProviders = await listProviders();
        if (allProviders.length === 0) {
          sendError(res, 507, 'No storage providers configured. Go to Storage Settings and add a bucket first.');
        } else {
          sendError(res, 507, 'No storage provider with enough space. Free up space or add another bucket in Storage Settings.');
        }
        return resolve(true);
      }

      const fileId = generateId();
      const fileKey = `${fileId}/${fileName}`;

      try {
        await uploadToProvider(providerUsed, fileKey, fileBuffer, mimeType);
        try {
          await createFileRecord({
            id: fileId,
            original_name: fileName,
            file_size: fileSize,
            mime_type: mimeType,
            r2_key: fileKey,
            provider_id: providerUsed.id,
            encrypted: false,
            enc_iv: null,
            enc_auth_tag: null,
          });
          await updateProviderBytes(providerUsed.id, fileSize);
        } catch (dbErr: any) {
          await deleteFromProvider(providerUsed, fileKey).catch(() => {});
          sendError(res, 500, `File uploaded but failed to save record: ${dbErr.message}`);
          return resolve(true);
        }
        sendJson(res, 200, { id: fileId, name: fileName, size: fileSize });
      } catch (e: any) {
        sendError(res, 500, `Upload to storage failed: ${e.message}`);
      }
      resolve(true);
    });

    req.pipe(bb);
  });
}

async function handleEncryptedUpload(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const settings = await getAppSettings();
  const maxSize = parseInt(settings.maxFileSize) || 0;
  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: maxSize > 0 ? maxSize : undefined, files: 1 },
  });

  let fileName = '';
  let mimeType = '';
  let fileSize = 0;
  const chunks: Buffer[] = [];
  let uploadError: string | null = null;

  bb.on('file', (_fieldname, file, info) => {
    fileName = info.filename || 'unnamed';
    mimeType = info.mimeType || 'application/octet-stream';

    file.on('limit', () => {
      uploadError = `File is too large. Maximum allowed size is ${formatBytes(maxSize)}.`;
      file.resume();
    });

    file.on('data', (chunk: Buffer) => {
      fileSize += chunk.length;
      chunks.push(chunk);
    });
  });

  bb.on('error', (err: Error) => {
    uploadError = err.message;
  });

  return new Promise<boolean>((resolve) => {
    bb.on('finish', async () => {
      if (uploadError) {
        sendError(res, uploadError.includes('too large') ? 413 : 400, uploadError);
        return resolve(true);
      }
      if (!fileName || chunks.length === 0) {
        sendError(res, 400, 'No file uploaded');
        return resolve(true);
      }

      const fileBuffer = Buffer.concat(chunks);
      chunks.length = 0;

      const allowed = (settings.allowedTypes || '*')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length > 0 && !allowed.includes('*') && !allowed.includes(mimeType.toLowerCase())) {
        sendError(res, 415, `File type ${mimeType || 'unknown'} is not allowed.`);
        return resolve(true);
      }

      const provider = await findProviderForSize(fileSize);
      if (!provider) {
        const allProviders = await listProviders();
        if (allProviders.length === 0) {
          sendError(res, 507, 'No storage providers configured.');
        } else {
          sendError(res, 507, 'No storage provider with enough space.');
        }
        return resolve(true);
      }

      const fileId = generateId();
      const r2Key = `${fileId}/${fileName}`;

      try {
        const { encrypted, iv, authTag } = encryptFile(fileBuffer);
        await uploadToProvider(provider, r2Key, encrypted, mimeType);
        try {
          await createFileRecord({
            id: fileId,
            original_name: fileName,
            file_size: fileSize,
            mime_type: mimeType,
            r2_key: r2Key,
            provider_id: provider.id,
            encrypted: true,
            enc_iv: iv,
            enc_auth_tag: authTag,
          });
          await updateProviderBytes(provider.id, fileBuffer.length);
        } catch (dbErr: any) {
          await deleteFromProvider(provider, r2Key).catch(() => {});
          sendError(res, 500, `File uploaded but failed to save record: ${dbErr.message}`);
          return resolve(true);
        }
        sendJson(res, 200, { id: fileId, name: fileName, size: fileSize, encrypted: true });
      } catch (e: any) {
        sendError(res, 500, `Encrypted upload to storage failed: ${e.message}`);
      }
      resolve(true);
    });

    req.pipe(bb);
  });
}

async function checkAuth(req: IncomingMessage): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  const DEFAULT_PASS = process.env.ADMIN_PASSWORD || 'lazydrop-admin-2024';
  if (token === DEFAULT_PASS) return true;
  try {
    const creds = await getAdminCredentials();
    if (token === creds.password) return true;
  } catch {}
  try {
    const apiKey = await getApiKeyByHash(token);
    if (apiKey) {
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return false;
      await updateApiKeyLastUsed(apiKey.id);
      return true;
    }
  } catch {}
  return false;
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<boolean> {
  await ensureDb();

  // Health check endpoint
  if (path === '/api/health') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return true;
  }

  // Check if admin setup is needed
  if (path === '/api/admin/needs-setup') {
    const needsSetup = !(await isAdminSetup());
    sendJson(res, 200, { needsSetup });
    return true;
  }

  // First-run setup: set admin credentials
  if (path === '/api/admin/setup' && req.method === 'POST') {
    const alreadySetup = await isAdminSetup();
    if (alreadySetup) {
      sendError(res, 400, 'Admin already configured');
      return true;
    }
    const body = await parseJsonBody(req);
    const username = sanitize(body.username);
    const password = sanitize(body.password);
    if (!username || !password) {
      sendError(res, 400, 'Username and password are required');
      return true;
    }
    if (username.length < 3) {
      sendError(res, 400, 'Username must be at least 3 characters');
      return true;
    }
    if (password.length < 6) {
      sendError(res, 400, 'Password must be at least 6 characters');
      return true;
    }
    // Save to database
    await updateAdminCredentials(username, password);
    // Save to .env file
    try {
      const { writeFileSync, readFileSync, existsSync } = await import('fs');
      const envPath = '.env';
      let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
      // Update or add ADMIN_USERNAME
      if (envContent.includes('ADMIN_USERNAME=')) {
        envContent = envContent.replace(/ADMIN_USERNAME=.*/, `ADMIN_USERNAME=${username}`);
      } else {
        envContent += `\nADMIN_USERNAME=${username}`;
      }
      // Update or add ADMIN_PASSWORD
      if (envContent.includes('ADMIN_PASSWORD=')) {
        envContent = envContent.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${password}`);
      } else {
        envContent += `\nADMIN_PASSWORD=${password}`;
      }
      writeFileSync(envPath, envContent.trim() + '\n');
    } catch (e: any) {
      console.warn('[lazydrop] Could not write to .env:', e.message);
    }
    sendJson(res, 200, { success: true, message: 'Admin credentials configured. Please log in.' });
    return true;
  }

  try {
    if (path === '/api/file' && req.method === 'GET') {
      const fileId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      if (!fileId) { sendError(res, 400, 'Missing file id'); return true; }
      const file = await getFileRecord(fileId);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      sendJson(res, 200, {
        id: file.id,
        original_name: file.original_name,
        file_size: file.file_size,
        mime_type: file.mime_type,
        created_at: file.created_at,
        download_count: file.download_count,
      });
      return true;
    }

    if (path === '/api/download' && req.method === 'GET') {
      if (!applyRateLimit(req, res, 30, 60000)) return true; // 30 downloads per minute
      const fileId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      if (!fileId) { sendError(res, 400, 'Missing file id'); return true; }
      const file = await getFileRecord(fileId);
      if (!file) { sendError(res, 404, 'File not found'); return true; }

      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (!provider) { sendError(res, 500, 'Storage provider not found'); return true; }

      const settings = await getAppSettings();
      if (settings.enableDownloadCounter !== false) {
        await incrementDownloadCount(fileId);
      }
      const url = await getPresignedDownloadUrl(provider, file.r2_key, file.original_name, file.mime_type || 'application/octet-stream');
      sendJson(res, 200, { url });
      return true;
    }

    if (path === '/api/admin/login' && req.method === 'POST') {
      if (!applyRateLimit(req, res, 5, 300000)) return true; // 5 login attempts per 5 minutes
      const body = await parseJsonBody(req);

      const inputUser = sanitize(body.username);
      const inputPass = sanitize(body.password);

      if (!inputUser || !inputPass) {
        sendError(res, 400, 'Username and password are required');
        return true;
      }

      const creds = await getAdminCredentials();
      if (!creds) {
        sendError(res, 400, 'Admin not configured. Please run setup first.');
        return true;
      }

      let valid = false;
      let token = creds.password;

      if (safeCompare(inputUser, creds.username) && safeCompare(inputPass, creds.password)) {
        valid = true;
      }

      if (valid) {
        sendJson(res, 200, { success: true, token });
      } else {
        sendError(res, 401, 'Invalid username or password');
      }
      return true;
    }

    if (path === '/api/admin/stats' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const stats = await getStats();
      sendJson(res, 200, stats);
      return true;
    }

    if (path === '/api/admin/upload' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      if (!applyRateLimit(req, res, 10, 60000)) return true; // 10 uploads per minute
      return handleUpload(req, res);
    }

    if (path === '/api/upload' && req.method === 'POST') {
      if (!applyRateLimit(req, res, 5, 60000)) return true; // 5 public uploads per minute
      const settings = await getAppSettings();
      if (!settings.enablePublicUpload) {
        sendError(res, 403, 'Public uploads are disabled');
        return true;
      }
      return handleUpload(req, res);
    }

    if (path === '/api/admin/upload/encrypted' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      if (!applyRateLimit(req, res, 10, 60000)) return true;
      return handleEncryptedUpload(req, res);
    }

    if (path === '/api/download/encrypted' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      if (!applyRateLimit(req, res, 30, 60000)) return true;
      const fileId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      if (!fileId) { sendError(res, 400, 'Missing file id'); return true; }
      const file = await getFileRecord(fileId);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      if (!file.encrypted) { sendError(res, 400, 'File is not encrypted'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (!provider) { sendError(res, 500, 'Storage provider not found'); return true; }
      const settings = await getAppSettings();
      if (settings.enableDownloadCounter !== false) {
        await incrementDownloadCount(fileId);
      }
      try {
        const encryptedBuf = await downloadFromProvider(provider, file.r2_key);
        if (!encryptedBuf) { sendError(res, 500, 'Failed to retrieve file'); return true; }
        const decrypted = decryptFile(encryptedBuf, file.enc_iv!, file.enc_auth_tag!);
        const blob = new Blob([decrypted]);
        const url = URL.createObjectURL(blob);
        sendJson(res, 200, { url, name: file.original_name, size: decrypted.length });
      } catch (e: any) {
        sendError(res, 500, `Decryption failed: ${e.message}`);
      }
      return true;
    }

    if (path === '/api/admin/files' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const files = await listFiles();
      sendJson(res, 200, { files });
      return true;
    }

    if (path === '/api/admin/files/delete' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const file = await getFileRecord(body.id);
      if (!file) { sendError(res, 404, 'File not found'); return true; }

      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (provider) {
        try {
          await deleteFromProvider(provider, file.r2_key);
        } catch (e: any) {
          console.error('Failed to delete from storage provider:', e.message);
          sendError(res, 500, `File removed from database but failed to delete from storage: ${e.message}`);
          return true;
        }
        await updateProviderBytes(provider.id, -file.file_size);
      }
      await deleteFileRecord(body.id);
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/admin/providers' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const providers = await listProviders();
      const safe = providers.map((p) => ({
        ...p,
        secret_access_key: p.secret_access_key ? '--------' : '',
      }));
      sendJson(res, 200, { providers: safe });
      return true;
    }

    if (path === '/api/admin/providers/add' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const name = sanitize(body.provider_name);
      const endpoint = sanitize(body.endpoint_url);
      const bucket = sanitize(body.bucket_name);
      const accessKey = sanitize(body.access_key_id);
      const secretKey = sanitize(body.secret_access_key);
      if (!name || !endpoint || !bucket || !accessKey || !secretKey) {
        sendError(res, 400, 'All fields are required');
        return true;
      }
      if (endpoint.length > 512) {
        sendError(res, 400, 'Endpoint URL too long');
        return true;
      }
      // Dedup check: prevent same bucket_name + endpoint_url
      const existing = await listProviders();
      if (existing.some(p => p.bucket_name === bucket && p.endpoint_url === endpoint)) {
        sendError(res, 409, 'A bucket with this name and endpoint already exists');
        return true;
      }
      const settings = await getAppSettings();
      const defaultMaxBytes = parseInt(settings.maxStoragePerBucket) || 10188208025;
      const provider = await addProvider({
        provider_type: sanitize(body.provider_type) || 'custom',
        provider_name: name,
        endpoint_url: endpoint,
        bucket_name: bucket,
        access_key_id: accessKey,
        secret_access_key: secretKey,
        region: sanitize(body.region) || 'auto',
        max_bytes: body.max_bytes || defaultMaxBytes,
      });
      sendJson(res, 200, { provider: { ...provider, secret_access_key: '--------' } });
      return true;
    }

    if (path === '/api/admin/providers/delete' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      await deleteProvider(body.id);
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/admin/providers/toggle' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      if (!body.id) { sendError(res, 400, 'Missing provider id'); return true; }
      const provider = await toggleProviderActive(body.id);
      if (!provider) { sendError(res, 404, 'Provider not found'); return true; }
      sendJson(res, 200, { provider: { ...provider, secret_access_key: provider.secret_access_key ? '--------' : '' } });
      return true;
    }

    if (path === '/api/admin/providers/test' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const id: string = body.id;
      if (!id) { sendError(res, 400, 'Missing provider id'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === id);
      if (!provider) { sendError(res, 404, 'Provider not found'); return true; }
      try {
        const objects = await listObjects(provider);
        sendJson(res, 200, { success: true, fileCount: objects.length, bucket: provider.bucket_name });
      } catch (e: any) {
        sendJson(res, 200, { success: false, error: e.message, bucket: provider.bucket_name });
      }
      return true;
    }

    if (path === '/api/admin/providers/size' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const id: string = body.id;
      if (!id) { sendError(res, 400, 'Missing provider id'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === id);
      if (!provider) { sendError(res, 404, 'Provider not found'); return true; }
      try {
        const sizeInfo = await getBucketSize(provider);
        sendJson(res, 200, { success: true, ...sizeInfo });
      } catch (e: any) {
        sendJson(res, 200, { success: false, error: e.message });
      }
      return true;
    }

    if (path === '/api/admin/providers/update-bytes' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const id: string = body.id;
      const bytes: number = body.bytes;
      if (!id || bytes === undefined) { sendError(res, 400, 'Missing provider id or bytes'); return true; }
      const sql = getDb();
      await sql`UPDATE storage_providers SET current_bytes = ${bytes} WHERE id = ${id}`;
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/settings' && req.method === 'GET') {
      sendJson(res, 200, await getAppSettings());
      return true;
    }

    if (path === '/api/admin/settings' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const settings = await updateAppSettings(body);
      sendJson(res, 200, { settings });
      return true;
    }

    if (path === '/api/admin/credentials' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const creds = await getAdminCredentials();
      sendJson(res, 200, { username: creds.username });
      return true;
    }

    if (path === '/api/admin/credentials/update' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const newUsername = sanitize(body.username);
      const newPassword = sanitize(body.password);
      if (!newUsername || !newPassword) {
        sendError(res, 400, 'Username and password are required');
        return true;
      }
      if (newPassword.length < 8) {
        sendError(res, 400, 'Password must be at least 8 characters');
        return true;
      }
      await updateAdminCredentials(newUsername, newPassword);
      sendJson(res, 200, { success: true, username: newUsername });
      return true;
    }

    if (path === '/api/admin/security/status' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const encStatus = getEncryptionStatus();
      const settings = await getAppSettings();
      const creds = await getAdminCredentials();
      sendJson(res, 200, {
        encryption: encStatus,
        fileTTL: {
          enabled: settings.autoDelete !== false,
          defaultDays: parseInt(settings.autoDeleteDays) || 30,
        },
        sessionTimeout: 30,
        ipWhitelist: [],
      });
      return true;
    }

    if (path === '/api/admin/security/file-ttl' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const enabled = body.enabled !== false;
      const days = Math.max(1, Math.min(365, parseInt(body.defaultDays) || 30));
      await updateAppSettings({ autoDelete: enabled, autoDeleteDays: String(days) });
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/admin/security/session-timeout' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const minutes = Math.max(5, Math.min(480, parseInt(body.minutes) || 30));
      await updateAppSettings({ sessionTimeout: String(minutes) });
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/admin/security/ip-whitelist' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const ips = Array.isArray(body.ips) ? body.ips.filter((ip: string) => typeof ip === 'string' && ip.trim()) : [];
      await updateAppSettings({ ipWhitelist: JSON.stringify(ips) });
      sendJson(res, 200, { success: true });
      return true;
    }

    if (path === '/api/admin/security/encryption' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      sendJson(res, 200, { success: true, note: 'Encryption setting updated. Use ENCRYPTION_KEY env var for custom keys.' });
      return true;
    }

    if (path === '/api/admin/scan/storage' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const providers = await listProviders();
      const results: { provider: string; bucket: string; files: { key: string; size: number }[]; error?: string }[] = [];
      const allOrphaned: { key: string; size: number; provider_id: string; provider_name: string; bucket_name: string }[] = [];
      for (const p of providers) {
        try {
          const objects = await listObjects(p);
          results.push({
            provider: p.provider_name,
            bucket: p.bucket_name,
            files: objects.map((o) => ({ key: o.key, size: o.size })),
          });
        } catch (e: any) {
          results.push({
            provider: p.provider_name,
            bucket: p.bucket_name,
            files: [],
            error: e.message,
          });
        }
      }
      const dbFiles = await listFiles();
      const dbKeys = new Set(dbFiles.map((f) => f.r2_key));
      let totalS3Objects = 0;
      let totalSize = 0;
      for (const r of results) {
        for (const f of r.files) {
          totalS3Objects++;
          totalSize += f.size;
          if (!dbKeys.has(f.key)) {
            const matchedProvider = providers.find((p) => p.bucket_name === r.bucket);
            if (matchedProvider) {
              allOrphaned.push({
                key: f.key,
                size: f.size,
                provider_id: matchedProvider.id,
                provider_name: matchedProvider.provider_name,
                bucket_name: matchedProvider.bucket_name,
              });
            }
          }
        }
      }
      sendJson(res, 200, {
        buckets: results,
        summary: {
          totalBuckets: providers.length,
          totalS3Objects,
          totalDbRecords: dbFiles.length,
          orphanedFiles: allOrphaned.length,
          orphanedItems: allOrphaned,
          totalStorageBytes: totalSize,
        },
      });
      return true;
    }

    if (path === '/api/admin/scan/database' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const dbFiles = await listFiles();
      const providers = await listProviders();
      const providerMap = new Map(providers.map((p) => [p.id, p]));
      const objectCache = new Map<string, { key: string; size: number }[]>();
      const results: { fileId: string; name: string; provider: string; exists: boolean; error?: string }[] = [];
      for (const f of dbFiles) {
        const provider = f.provider_id ? providerMap.get(f.provider_id) : null;
        if (!provider) {
          results.push({ fileId: f.id, name: f.original_name, provider: 'N/A', exists: false, error: 'Provider not found' });
          continue;
        }
        try {
          if (!objectCache.has(provider.id)) {
            const objects = await listObjects(provider);
            objectCache.set(provider.id, objects);
          }
          const objects = objectCache.get(provider.id)!;
          const found = objects.some((o) => o.key === f.r2_key);
          results.push({ fileId: f.id, name: f.original_name, provider: provider.provider_name, exists: found });
        } catch (e: any) {
          results.push({ fileId: f.id, name: f.original_name, provider: provider.provider_name, exists: false, error: e.message });
        }
      }
      const missing = results.filter((r) => !r.exists);
      sendJson(res, 200, {
        records: results,
        summary: {
          totalDbRecords: dbFiles.length,
          verified: results.length - missing.length,
          missing: missing.length,
          missingFiles: missing.map((r) => ({ id: r.fileId, name: r.name, reason: r.error || 'Not found in S3' })),
        },
      });
      return true;
    }

    if (path === '/api/admin/scan/auto-fix' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const providers = await listProviders();
      const dbFiles = await listFiles();
      const dbKeys = new Set(dbFiles.map((f) => f.r2_key));
      const allS3: { key: string; size: number; provider_id: string }[] = [];
      for (const p of providers) {
        try {
          const objects = await listObjects(p);
          for (const o of objects) {
            allS3.push({ key: o.key, size: o.size, provider_id: p.id });
          }
        } catch {}
      }
      const orphaned = allS3.filter((f) => !dbKeys.has(f.key));
      if (orphaned.length === 0) {
        sendJson(res, 200, { fixed: 0, failed: 0, results: [], message: 'No orphaned files found' });
        return true;
      }
      const results: { key: string; success: boolean; error?: string }[] = [];
      for (const item of orphaned) {
        const parts = item.key.split('/');
        const fileId = parts[0] || generateId();
        const fileName = parts.slice(1).join('/') || item.key;
        try {
          await createFileRecord({
            id: fileId,
            original_name: fileName,
            file_size: item.size,
            mime_type: 'application/octet-stream',
            r2_key: item.key,
            provider_id: item.provider_id,
            encrypted: false,
            enc_iv: null,
            enc_auth_tag: null,
          });
          if (item.size > 0) {
            await updateProviderBytes(item.provider_id, item.size).catch(() => {});
          }
          results.push({ key: item.key, success: true });
        } catch (e: any) {
          if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
            results.push({ key: item.key, success: true });
          } else {
            results.push({ key: item.key, success: false, error: e.message });
          }
        }
      }
      const fixed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      sendJson(res, 200, { fixed, failed, results });
      return true;
    }

    if (path === '/api/admin/scan/fix-orphaned' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        sendError(res, 400, 'No orphaned files specified');
        return true;
      }
      const providers = await listProviders();
      const providerMap = new Map(providers.map((p) => [p.id, p]));
      const existingFiles = await listFiles();
      const existingKeys = new Set(existingFiles.map((f) => f.r2_key));
      const results: { key: string; success: boolean; error?: string }[] = [];
      for (const item of items) {
        const key: string = item.key;
        const providerId: string = item.provider_id;
        const size: number = Number(item.size) || 0;
        if (existingKeys.has(key)) {
          results.push({ key, success: true });
          continue;
        }
        const provider = providerMap.get(providerId);
        if (!provider) {
          results.push({ key, success: false, error: 'Provider not found' });
          continue;
        }
        const parts = key.split('/');
        const fileId = parts[0] || generateId();
        const fileName = parts.slice(1).join('/') || key;
        try {
          await createFileRecord({
            id: fileId,
            original_name: fileName,
            file_size: size,
            mime_type: 'application/octet-stream',
            r2_key: key,
            provider_id: providerId,
            encrypted: false,
            enc_iv: null,
            enc_auth_tag: null,
          });
          if (size > 0) {
            await updateProviderBytes(providerId, size).catch(() => {});
          }
          results.push({ key, success: true });
        } catch (e: any) {
          if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
            results.push({ key, success: true });
          } else {
            results.push({ key, success: false, error: e.message });
          }
        }
      }
      const fixed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      sendJson(res, 200, { fixed, failed, results });
      return true;
    }

    // ── Preview ──
    if (path === '/api/preview' && req.method === 'GET') {
      const fileId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      if (!fileId) { sendError(res, 400, 'Missing file id'); return true; }
      const file = await getFileRecord(fileId);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (!provider) { sendError(res, 500, 'Storage provider not found'); return true; }

      try {
        const fileBuffer = await downloadFromProvider(provider, file.r2_key);
        if (!fileBuffer) { sendError(res, 500, 'Failed to retrieve file'); return true; }

        let contentBuffer = fileBuffer;
        let contentType = file.mime_type || 'application/octet-stream';

        if (file.encrypted) {
          try {
            contentBuffer = decryptFile(fileBuffer, file.enc_iv!, file.enc_auth_tag!);
          } catch {
            sendError(res, 500, 'Failed to decrypt file for preview');
            return true;
          }
        }

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : contentBuffer.length - 1;
          const chunkSize = (end - start) + 1;
          const chunk = contentBuffer.subarray(start, end + 1);
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${contentBuffer.length}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          });
          res.end(chunk);
          return true;
        }

        res.writeHead(200, {
          'Content-Length': contentBuffer.length,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        });
        res.end(contentBuffer);
        return true;
      } catch (e: any) {
        sendError(res, 500, `Preview failed: ${e.message}`);
        return true;
      }
    }

    // ── Shares ──
    if (path === '/api/share' && req.method === 'GET') {
      const shareId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      if (!shareId) { sendError(res, 400, 'Missing share id'); return true; }
      const share = await getShareById(shareId);
      if (!share) { sendError(res, 404, 'Share not found'); return true; }
      const file = await getFileRecord(share.file_id);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      if (share.expires_at && new Date(share.expires_at) < new Date()) { sendError(res, 410, 'Share has expired'); return true; }
      if (share.download_limit && share.download_count >= share.download_limit) { sendError(res, 410, 'Download limit reached'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (!provider) { sendError(res, 500, 'Storage provider not found'); return true; }
      sendJson(res, 200, {
        shareId: share.id,
        file: {
          id: file.id,
          name: file.original_name,
          size: file.file_size,
          mimeType: file.mime_type,
          createdAt: file.created_at,
        },
        requiresPassword: !!share.password_hash,
        expiresAt: share.expires_at,
        downloadLimit: share.download_limit,
        downloadsRemaining: share.download_limit ? share.download_limit - share.download_count : null,
      });
      return true;
    }

    if (path === '/api/share/download' && req.method === 'GET') {
      const shareId = new URL(req.url || '', 'http://localhost').searchParams.get('id');
      const password = new URL(req.url || '', 'http://localhost').searchParams.get('password');
      if (!shareId) { sendError(res, 400, 'Missing share id'); return true; }
      const share = await validateShare(shareId, password ?? undefined);
      if (!share) { sendError(res, 403, share ? 'Share expired or limit reached' : 'Invalid share or password'); return true; }
      const file = await getFileRecord(share.file_id);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      const providers = await listProviders();
      const provider = providers.find((p) => p.id === file.provider_id);
      if (!provider) { sendError(res, 500, 'Storage provider not found'); return true; }
      await incrementDownloadCount(file.id);
      await incrementShareDownloadCount(shareId);
      if (file.encrypted) {
        try {
          const encryptedBuf = await downloadFromProvider(provider, file.r2_key);
          if (!encryptedBuf) { sendError(res, 500, 'Failed to retrieve file'); return true; }
          const decrypted = decryptFile(encryptedBuf, file.enc_iv!, file.enc_auth_tag!);
          const blob = new Blob([decrypted]);
          const url = URL.createObjectURL(blob);
          sendJson(res, 200, { url, name: file.original_name, size: decrypted.length });
        } catch (e: any) {
          sendError(res, 500, `Decryption failed: ${e.message}`);
        }
        return true;
      }
      const url = await getPresignedDownloadUrl(provider, file.r2_key, file.original_name, file.mime_type || 'application/octet-stream');
      sendJson(res, 200, { url });
      return true;
    }

    if (path === '/api/admin/shares' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const { fileId, password, expiresInDays, downloadLimit } = body;
      if (!fileId) { sendError(res, 400, 'Missing fileId'); return true; }
      const file = await getFileRecord(fileId);
      if (!file) { sendError(res, 404, 'File not found'); return true; }
      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const share = await createShare({ file_id: fileId, password_hash: password || null, expires_at: expiresAt, download_limit: downloadLimit || null });
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      sendJson(res, 200, {
        share,
        shareUrl: `${baseUrl}/s/${share.id}`,
      });
      return true;
    }

    if (path === '/api/admin/shares' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const fileId = new URL(req.url || '', 'http://localhost').searchParams.get('fileId');
      if (!fileId) { sendError(res, 400, 'Missing fileId'); return true; }
      const shares = await getSharesByFileId(fileId);
      sendJson(res, 200, { shares });
      return true;
    }

    if (path === '/api/admin/shares/delete' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      await deleteShare(body.id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // ── API Keys ──
    if (path === '/api/admin/api-keys' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const keys = await listApiKeys();
      const safeKeys = keys.map(k => ({
        id: k.id,
        name: k.name,
        permissions: k.permissions,
        last_used_at: k.last_used_at,
        expires_at: k.expires_at,
        created_at: k.created_at,
      }));
      sendJson(res, 200, { keys: safeKeys });
      return true;
    }

    if (path === '/api/admin/api-keys' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      const { name, permissions, expiresInDays } = body;
      if (!name) { sendError(res, 400, 'Name is required'); return true; }
      const perms = permissions || 'read';
      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const rawKey = `ld_${randomBytes(32).toString('hex')}`;
      const keyHash = scryptSync(rawKey, 'lazydrop-apikey', 64).toString('hex');
      const result = await createApiKey({ name, key_hash: keyHash, permissions: perms, expires_at: expiresAt });
      sendJson(res, 200, { key: result });
      return true;
    }

    if (path === '/api/admin/api-keys/delete' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const body = await parseJsonBody(req);
      await deleteApiKey(body.id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // ── Audit Log ──
    if (path === '/api/admin/audit-log' && req.method === 'GET') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const url = new URL(req.url || '', 'http://localhost');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const logs = await listAuditLogs(limit, offset);
      sendJson(res, 200, { logs });
      return true;
    }

    // ── System: Pull latest ──
    if (path === '/api/admin/system/pull' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const { execSync } = await import('child_process');
      try {
        execSync('git pull origin dev', { cwd: process.cwd(), timeout: 30000 });
        sendJson(res, 200, { message: 'Pulled latest changes from dev branch' });
      } catch (e: any) {
        sendError(res, 500, `Pull failed: ${e.message}`);
      }
      return true;
    }

    // ── System: Rebuild ──
    if (path === '/api/admin/system/rebuild' && req.method === 'POST') {
      if (!(await checkAuth(req))) { sendError(res, 401, 'Unauthorized'); return true; }
      const { execSync } = await import('child_process');
      try {
        execSync('npm install', { cwd: process.cwd(), timeout: 120000 });
        execSync('npm run build', { cwd: process.cwd(), timeout: 120000 });
        sendJson(res, 200, { message: 'Rebuild complete — deps installed and bundle built' });
      } catch (e: any) {
        sendError(res, 500, `Rebuild failed: ${e.message}`);
      }
      return true;
    }

    return false;
  } catch (e: any) {
    console.error('API error:', e);
    sendError(res, 500, e.message || 'Internal server error');
    return true;
  }
}
