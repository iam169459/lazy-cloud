export interface FileInfo {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  download_count: number;
}

export interface FileWithProvider extends FileInfo {
  provider_name: string;
  r2_key: string;
  provider_id: string;
}

export interface ShareInfo {
  shareId: string;
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
  requiresPassword: boolean;
  expiresAt: string | null;
  downloadLimit: number | null;
  downloadsRemaining: number | null;
}

export interface ShareCreateResult {
  share: {
    id: string;
    file_id: string;
    password_hash: string | null;
    expires_at: string | null;
    download_limit: number | null;
    download_count: number;
    created_at: string;
  };
  shareUrl: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  permissions: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreateResult {
  key: {
    id: string;
    name: string;
    permissions: string;
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
    key: string;
  };
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
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

export interface Stats {
  files: {
    total_files: string;
    total_bytes: string;
    total_downloads: string;
  };
  providers: {
    total_providers: string;
    used_bytes: string;
    capacity_bytes: string;
  };
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
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  getFileInfo: (id: string) =>
    request(`/api/file?id=${encodeURIComponent(id)}`) as Promise<FileInfo>,

  getDownloadUrl: (id: string) =>
    request(`/api/download?id=${encodeURIComponent(id)}`) as Promise<{ url: string }>,

  getEncryptedDownloadUrl: (id: string) =>
    request(`/api/download/encrypted?id=${encodeURIComponent(id)}`) as Promise<{ url: string }>,

  adminLogin: (username: string, password: string) =>
    request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }) as Promise<{ success: boolean }>,

  getStats: (token: string) =>
    request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<Stats>,

  uploadFile: (file: File, token: string, onProgress?: (pct: number) => void) =>
    uploadRequest(file, '/api/admin/upload', token, onProgress),

  encryptFile: (file: File, token: string, onProgress?: (pct: number) => void) =>
    uploadRequest(file, '/api/admin/upload/encrypted', token, onProgress),

  uploadPublic: (file: File, onProgress?: (pct: number) => void) =>
    uploadRequest(file, '/api/upload', null, onProgress),

  getSettings: () =>
    request('/api/settings') as Promise<AppSettings>,

  updateSettings: (settings: Partial<AppSettings>, token: string) =>
    request('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    }) as Promise<{ settings: AppSettings }>,

  listFiles: (token: string) =>
    request('/api/admin/files', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ files: FileWithProvider[] }>,

  deleteFile: (id: string, token: string) =>
    request('/api/admin/files/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ success: boolean }>,

  listProviders: (token: string) =>
    request('/api/admin/providers', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ providers: StorageProvider[] }>,

  addProvider: (provider: Omit<StorageProvider, 'id' | 'current_bytes' | 'is_active' | 'created_at'>, token: string) =>
    request('/api/admin/providers/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(provider),
    }) as Promise<{ provider: StorageProvider }>,

  deleteProvider: (id: string, token: string) =>
    request('/api/admin/providers/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ success: boolean }>,

  getBucketSize: (id: string, token: string) =>
    request('/api/admin/providers/size', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ success: boolean; usedBytes: number; objectCount: number }>,

  updateProviderBytes: (id: string, bytes: number, token: string) =>
    request('/api/admin/providers/update-bytes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, bytes }),
    }) as Promise<{ success: boolean }>,

  getSecurityStatus: (token: string) =>
    request('/api/admin/security/status', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ encryption: { enabled: boolean; usingDefault: boolean }; fileTTL: { enabled: boolean; defaultDays: number }; sessionTimeout: number; ipWhitelist: string[] }>,

  updateFileTTL: (settings: { enabled: boolean; defaultDays: number }, token: string) =>
    request('/api/admin/security/file-ttl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    }) as Promise<{ success: boolean }>,

  updateSessionTimeout: (minutes: number, token: string) =>
    request('/api/admin/security/session-timeout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ minutes }),
    }) as Promise<{ success: boolean }>,

  updateIpWhitelist: (ips: string[], token: string) =>
    request('/api/admin/security/ip-whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ips }),
    }) as Promise<{ success: boolean }>,

  toggleEncryption: (enabled: boolean, token: string) =>
    request('/api/admin/security/encryption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled }),
    }) as Promise<{ success: boolean }>,

  toggleProvider: (id: string, token: string) =>
    request('/api/admin/providers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ provider: StorageProvider }>,

  testProvider: (id: string, token: string) =>
    request('/api/admin/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ success: boolean; fileCount?: number; bucket: string; error?: string }>,

  getCredentials: (token: string) =>
    request('/api/admin/credentials', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ username: string }>,

  updateCredentials: (username: string, password: string, token: string) =>
    request('/api/admin/credentials/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password }),
    }) as Promise<{ success: boolean; username: string }>,

  getShareInfo: (shareId: string) =>
    request(`/api/share?id=${encodeURIComponent(shareId)}`) as Promise<ShareInfo>,

  downloadSharedFile: (shareId: string, password?: string) =>
    request(`/api/share/download?id=${encodeURIComponent(shareId)}${password ? `&password=${encodeURIComponent(password)}` : ''}`) as Promise<{ url: string; name: string; size: number }>,

  createShare: (fileId: string, password?: string, expiresInDays?: number, downloadLimit?: number, token?: string) =>
    request('/api/admin/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ fileId, password, expiresInDays, downloadLimit }),
    }) as Promise<ShareCreateResult>,

  listShares: (fileId: string, token: string) =>
    request(`/api/admin/shares?fileId=${encodeURIComponent(fileId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ shares: any[] }>,

  deleteShare: (shareId: string, token: string) =>
    request('/api/admin/shares/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: shareId }),
    }) as Promise<{ success: boolean }>,

  listApiKeys: (token: string) =>
    request('/api/admin/api-keys', {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ keys: ApiKey[] }>,

  createApiKey: (name: string, permissions: string, expiresInDays: number | undefined, token: string) =>
    request('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, permissions, expiresInDays }),
    }) as Promise<ApiKeyCreateResult>,

  deleteApiKey: (id: string, token: string) =>
    request('/api/admin/api-keys/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ success: boolean }>,

  getAuditLogs: (token: string, limit?: number, offset?: number) =>
    request(`/api/admin/audit-log${limit ? `?limit=${limit}` : ''}${offset ? `${limit ? '&' : '?'}offset=${offset}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ logs: AuditLogEntry[] }>,

  getPreviewUrl: (fileId: string) => `/api/preview?id=${encodeURIComponent(fileId)}`,

  scanStorage: (token: string) =>
    request('/api/admin/scan/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }) as Promise<{
      buckets: { provider: string; bucket: string; files: { key: string; size: number }[]; error?: string }[];
      summary: {
        totalBuckets: number;
        totalS3Objects: number;
        totalDbRecords: number;
        orphanedFiles: number;
        orphanedItems: { key: string; size: number; provider_id: string; provider_name: string; bucket_name: string }[];
        totalStorageBytes: number;
      };
    }>,

  fixOrphaned: (items: { key: string; provider_id: string; size: number }[], token: string) =>
    request('/api/admin/scan/fix-orphaned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items }),
    }) as Promise<{ fixed: number; failed: number; results: { key: string; success: boolean; error?: string }[] }>,

  autoFix: (token: string) =>
    request('/api/admin/scan/auto-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }) as Promise<{ fixed: number; failed: number; results: { key: string; success: boolean; error?: string }[]; message?: string }>,

  scanDatabase: (token: string) =>
    request('/api/admin/scan/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }) as Promise<{
      records: { fileId: string; name: string; provider: string; exists: boolean; error?: string }[];
      summary: {
        totalDbRecords: number;
        verified: number;
        missing: number;
        missingFiles: { id: string; name: string; reason: string }[];
      };
    }>,
};

function uploadRequest(
  file: File,
  url: string,
  token: string | null,
  onProgress?: (pct: number) => void
): Promise<{ id: string; name: string; size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Upload failed'));
        }
      } catch {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export function formatBytes(bytes: number | string | undefined | null): string {
  const n = Number(bytes);
  if (!n || n === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
