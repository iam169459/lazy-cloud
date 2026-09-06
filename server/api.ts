import { IncomingMessage, ServerResponse } from 'http';
import busboy from 'busboy';
import { initDatabase, findProviderForSize, addProvider, listProviders, deleteProvider, updateProviderBytes, toggleProviderActive, createFileRecord, getFileRecord, listFiles, deleteFileRecord, incrementDownloadCount, getStats, generateId, getAdminCredentials, updateAdminCredentials, getAppSettings, updateAppSettings, listExpiredFiles } from './db';
import { uploadToProvider, deleteFromProvider, getPresignedDownloadUrl } from './s3';

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
  const bb = busboy({ headers: req.headers });
  let uploadedFile: { name: string; data: Buffer[]; mimeType: string } | null = null;
  let uploadError: string | null = null;

  bb.on('file', (_fieldname, file, info) => {
    const chunks: Buffer[] = [];
    file.on('data', (chunk) => chunks.push(chunk));
    file.on('end', () => {
      uploadedFile = {
        name: info.filename || 'unnamed',
        data: chunks,
        mimeType: info.mimeType || 'application/octet-stream',
      };
    });
  });

  bb.on('error', (err: Error) => {
    uploadError = err.message;
  });

  return new Promise<boolean>((resolve) => {
    bb.on('finish', async () => {
      if (uploadError) {
        sendError(res, 400, uploadError);
        return resolve(true);
      }
      if (!uploadedFile) {
        sendError(res, 400, 'No file uploaded');
        return resolve(true);
      }

      const fileBuffer = Buffer.concat(uploadedFile.data);
      const fileSize = fileBuffer.length;

      // Enforce max file size
      const maxSize = parseInt(settings.maxFileSize) || 0;
      if (maxSize > 0 && fileSize > maxSize) {
        sendError(res, 413, `File is too large. Maximum allowed size is ${formatBytes(maxSize)}.`);
        return resolve(true);
      }

      // Enforce allowed MIME types
      const allowed = (settings.allowedTypes || '*')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length > 0 && !allowed.includes('*') && !allowed.includes(uploadedFile.mimeType.toLowerCase())) {
        sendError(res, 415, `File type ${uploadedFile.mimeType || 'unknown'} is not allowed.`);
        return resolve(true);
      }

      const provider = await findProviderForSize(fileSize);
      if (!provider) {
        const allProviders = await listProviders();
        if (allProviders.length === 0) {
          sendError(res, 507, 'No storage providers configured. Go to Storage Settings and add a bucket first.');
        } else {
          sendError(res, 507, 'No storage provider with enough space. Free up space or add another bucket in Storage Settings.');
        }
        return resolve(true);
      }

      const fileId = generateId();
      const r2Key = `${fileId}/${uploadedFile.name}`;

      try {
        await uploadToProvider(provider, r2Key, fileBuffer, uploadedFile.mimeType);
        await createFileRecord({
          id: fileId,
          original_name: uploadedFile.name,
          file_size: fileSize,
          mime_type: uploadedFile.mimeType,
          r2_key: r2Key,
          provider_id: provider.id,
        });
        await updateProviderBytes(provider.id, fileSize);
        sendJson(res, 200, { id: fileId, name: uploadedFile.name, size: fileSize });
      } catch (e: any) {
        sendError(res, 500, `Upload failed: ${e.message}`);
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
    return token === creds.password;
  } catch {
    return false;
  }
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<boolean> {
  await ensureDb();

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
      const body = await parseJsonBody(req);
      const DEFAULT_USER = process.env.ADMIN_USERNAME || 'admin';
      const DEFAULT_PASS = process.env.ADMIN_PASSWORD || 'lazydrop-admin-2024';

      let valid = false;
      let token = DEFAULT_PASS;

      if (body.username === DEFAULT_USER && body.password === DEFAULT_PASS) {
        valid = true;
      } else {
        try {
          const creds = await getAdminCredentials();
          if (body.username === creds.username && body.password === creds.password) {
            valid = true;
            token = creds.password;
          }
        } catch {
          // DB not available, only defaults work
        }
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
      return handleUpload(req, res);
    }

    if (path === '/api/upload' && req.method === 'POST') {
      const settings = await getAppSettings();
      if (!settings.enablePublicUpload) {
        sendError(res, 403, 'Public uploads are disabled');
        return true;
      }
      return handleUpload(req, res);
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
      if (!body.provider_name || !body.endpoint_url || !body.bucket_name || !body.access_key_id || !body.secret_access_key) {
        sendError(res, 400, 'All fields are required');
        return true;
      }
      const settings = await getAppSettings();
      const defaultMaxBytes = parseInt(settings.maxStoragePerBucket) || 10188208025;
      const provider = await addProvider({
        provider_type: body.provider_type || 'custom',
        provider_name: body.provider_name,
        endpoint_url: body.endpoint_url,
        bucket_name: body.bucket_name,
        access_key_id: body.access_key_id,
        secret_access_key: body.secret_access_key,
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
      if (!body.username || !body.password) {
        sendError(res, 400, 'Username and password are required');
        return true;
      }
      await updateAdminCredentials(body.username, body.password);
      sendJson(res, 200, { success: true, username: body.username });
      return true;
    }

    return false;
  } catch (e: any) {
    console.error('API error:', e);
    sendError(res, 500, e.message || 'Internal server error');
    return true;
  }
}
