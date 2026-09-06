import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Database,
  FileText,
  Shield,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
  X,
  Check,
  Loader2,
  AlertCircle,
  Save,
  LogOut,
  ChevronRight,
} from 'lucide-react';

// Simple navigation without react-router-dom
const navigateTo = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Storage provider type
interface StorageProvider {
  id: string;
  provider_name: string;
  endpoint_url: string;
  bucket_name: string;
  access_key_id: string;
  secret_access_key: string;
  max_bytes: number;
  current_bytes: number;
  is_active: boolean;
  created_at: string;
}

// File type
interface File {
  id: string;
  original_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  provider_name: string | null;
}

interface DashboardData {
  totalFiles: number;
  totalBytes: number;
  totalMaxBytes: number;
  usedPercentage: number;
  providers: StorageProvider[];
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'storage' | 'files' | 'security'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security form state
  const [securityForm, setSecurityForm] = useState({ username: '', password: '' });
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Storage form state
  const [storageForm, setStorageForm] = useState({
    provider_name: '',
    endpoint_url: '',
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    max_bytes: '10188208025',
  });
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');      if (!token) {
      navigateTo('/admin/login');
      return;
    }

    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_token');
          navigateTo('/admin/login');
          return;
        }
        throw new Error('Failed to fetch dashboard');
      }

      const data = await response.json();
      setDashboard(data);
      setProviders(data.providers || []);

      // Also fetch files
      const filesResponse = await fetch('/api/admin/files', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigateTo('/admin/login');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setStorageError(null);
    setStorageLoading(true);

    try {
      const response = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          ...storageForm,
          max_bytes: parseInt(storageForm.max_bytes) || 10188208025,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add provider');
      }

      // Clear form and refresh
      setStorageForm({
        provider_name: '',
        endpoint_url: '',
        bucket_name: '',
        access_key_id: '',
        secret_access_key: '',
        max_bytes: '10188208025',
      });

      fetchDashboard();
    } catch (err: any) {
      setStorageError(err.message);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this storage provider?')) return;

    try {
      const response = await fetch(`/api/admin/storage/${providerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete provider');
      }

      fetchDashboard();
    } catch (err) {
      setError('Failed to delete provider');
    }
  };

  const handleToggleProvider = async (providerId: string, isCurrentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/storage/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ is_active: !isCurrentlyActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle provider');
      }

      fetchDashboard();
    } catch (err) {
      setError('Failed to toggle provider');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      fetchDashboard();
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityLoading(true);

    try {
      const response = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(securityForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update credentials');
      }

      setSecurityError('Credentials updated successfully');
      setTimeout(() => setSecurityError(null), 3000);
    } catch (err: any) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const response = await fetch('/api/admin/security', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityForm({ username: data.username, password: data.password });
      }
    } catch (err) {
      console.error('Failed to load security settings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      loadSecuritySettings();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'storage' as const, label: 'Storage', icon: Database },
    { id: 'files' as const, label: 'Files', icon: FileText },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-text hidden sm:block">
              LazyDrop Admin
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="border-b border-gray-700/50 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab flex items-center gap-2 px-4 py-4 ${
                  activeTab === tab.id ? 'active' : ''
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {isLoading && activeTab === 'dashboard' ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : error && activeTab === 'dashboard' ? (
          <div className="card border-red-500/30 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={fetchDashboard} className="btn btn-primary">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && dashboard && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Files */}
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Files</p>
                        <p className="text-2xl font-bold">{dashboard.totalFiles}</p>
                      </div>
                    </div>
                  </div>

                  {/* Storage Used */}
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Database className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Storage Used</p>
                        <p className="text-2xl font-bold">
                          {formatBytes(dashboard.totalBytes)} /{' '}
                          {formatBytes(dashboard.totalMaxBytes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Storage Providers */}
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Database className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Active Providers</p>
                        <p className="text-2xl font-bold">
                          {dashboard.providers?.filter((p) => p.is_active).length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">System Status</p>
                        <p className="text-2xl font-bold text-green-400">Online</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage Gauge */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-6">Storage Pool Usage</h3>
                  <div className="space-y-4">
                    {/* Overall Gauge */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Total Usage</span>
                        <span className="font-medium">
                          {Math.round(dashboard.usedPercentage)}%
                        </span>
                      </div>
                      <div className="progress-bar h-4">
                        <div
                          className="progress-bar-fill bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${dashboard.usedPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Per Provider Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400">
                        Storage Providers
                      </h4>
                      {dashboard.providers?.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                          No storage providers configured.{' '}
                          <button
                            onClick={() => setActiveTab('storage')}
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Add one now
                          </button>
                        </p>
                      ) : (
                        dashboard.providers?.map((provider) => {
                          const percentage = provider.max_bytes > 0
                            ? (provider.current_bytes / provider.max_bytes) * 100
                            : 0;
                          return (
                            <div
                              key={provider.id}
                              className="p-4 bg-gray-800/50 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      provider.is_active ? 'bg-green-500' : 'bg-gray-500'
                                    }`}
                                  />
                                  <div>
                                    <p className="font-medium">{provider.provider_name}</p>
                                    <p className="text-sm text-gray-400">
                                      {provider.bucket_name}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {formatBytes(provider.current_bytes)} /{' '}
                                    {formatBytes(provider.max_bytes)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {Math.round(percentage)}%
                                  </p>
                                </div>
                              </div>
                              <div className="progress-bar h-2">
                                <div
                                  className={`progress-bar-fill ${
                                    percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              {percentage > 90 && (
                                <p className="text-sm text-red-400 mt-2">
                                  ⚠️ Approaching capacity
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                {/* Add Provider Form */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    Add Storage Provider
                  </h3>

                  {storageError && (
                    <div className="flex items-center gap-3 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-300">{storageError}</p>
                    </div>
                  )}

                  <form onSubmit={handleAddProvider} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Provider Name *
                      </label>
                      <input
                        type="text"
                        value={storageForm.provider_name}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, provider_name: e.target.value })
                        }
                        className="input"
                        placeholder="My B2 Bucket"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Endpoint URL *
                      </label>
                      <input
                        type="url"
                        value={storageForm.endpoint_url}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, endpoint_url: e.target.value })
                        }
                        className="input"
                        placeholder="https://s3.us-east-005.backblazeb2.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Bucket Name *
                      </label>
                      <input
                        type="text"
                        value={storageForm.bucket_name}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, bucket_name: e.target.value })
                        }
                        className="input"
                        placeholder="my-bucket"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Max Bytes *
                      </label>
                      <input
                        type="number"
                        value={storageForm.max_bytes}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, max_bytes: e.target.value })
                        }
                        className="input"
                        placeholder="10188208025"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Default ~9.5 GB (10188208025 bytes)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Access Key ID *
                      </label>
                      <input
                        type="text"
                        value={storageForm.access_key_id}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, access_key_id: e.target.value })
                        }
                        className="input"
                        placeholder="Your access key"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Secret Access Key *
                      </label>
                      <input
                        type="password"
                        value={storageForm.secret_access_key}
                        onChange={(e) =>
                          setStorageForm({ ...storageForm, secret_access_key: e.target.value })
                        }
                        className="input"
                        placeholder="Your secret key"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        disabled={storageLoading}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        {storageLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add Provider</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Storage Providers List */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Storage Providers</h3>

                  {providers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No storage providers configured yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                provider.is_active ? 'bg-green-500' : 'bg-gray-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{provider.provider_name}</p>
                              <p className="text-sm text-gray-400 truncate">
                                {provider.bucket_name} • {formatBytes(provider.current_bytes)} /{' '}
                                {formatBytes(provider.max_bytes)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleProvider(provider.id, provider.is_active)}
                              className="btn btn-secondary p-2"
                              title={provider.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {provider.is_active ? (
                                <ToggleRight className="w-5 h-5 text-green-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="btn btn-danger p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Uploaded Files</h3>
                    <span className="text-sm text-gray-400">
                      {files.length} file{files.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {files.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No files uploaded yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                              File Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                              Size
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 hidden md:table-cell">
                              Provider
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 hidden lg:table-cell">
                              Uploaded
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                          {files.map((file) => (
                            <tr key={file.id} className="hover:bg-gray-800/30">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <span className="truncate max-w-[200px]">{file.original_name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-400">
                                {formatBytes(file.file_size_bytes)}
                              </td>
                              <td className="py-3 px-4 text-gray-400 hidden md:table-cell">
                                {file.provider_name || '—'}
                              </td>
                              <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">
                                {formatDate(file.created_at)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="btn btn-danger p-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Admin Credentials
                  </h3>

                  {securityError && (
                    <div
                      className={`flex items-center gap-3 p-3 mb-4 rounded-lg ${
                        securityError.includes('successfully')
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}
                    >
                      {securityError.includes('successfully') ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <p
                        className={`text-sm ${
                          securityError.includes('successfully')
                            ? 'text-green-300'
                            : 'text-red-300'
                        }`}
                      >
                        {securityError}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSecuritySave} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Username
                      </label>
                      <input
                        type="text"
                        value={securityForm.username}
                        onChange={(e) =>
                          setSecurityForm({ ...securityForm, username: e.target.value })
                        }
                        className="input"
                        placeholder="admin"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">
                        Password
                      </label>
                      <input
                        type="password"
                        value={securityForm.password}
                        onChange={(e) =>
                          setSecurityForm({ ...securityForm, password: e.target.value })
                        }
                        className="input"
                        placeholder="Enter new password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {securityLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Credentials</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300">
                      Changing the admin password will require you to log in again with the new
                      credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
