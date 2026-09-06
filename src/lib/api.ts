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

export interface StorageProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  endpoint_url: string;
  bucket_name: string;
  access_key_id: string;
  secret_access_key: string;
  max_bytes: number;
  current_bytes: number;
  is_active: boolean;
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
    new Promise<{ id: string; name: string; size: number }>((resolve, reject) => {
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

      xhr.open('POST', '/api/admin/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    }),

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

  addProvider: (provider: Omit<StorageProvider, 'id' | 'current_bytes' | 'is_active'>, token: string) =>
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

  toggleProvider: (id: string, token: string) =>
    request('/api/admin/providers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }) as Promise<{ provider: StorageProvider }>,

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
};

export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
