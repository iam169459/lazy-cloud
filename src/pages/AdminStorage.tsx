import { useState } from 'react';
import { Cloud, Plus, Trash2, Loader2, Check, Server, Power, ExternalLink, HardDrive } from 'lucide-react';
import { api, formatBytes, StorageProvider } from '@/lib/api';
import { cloudProviders, CloudProvider, getProviderById, detectProviderFromEndpoint } from '@/lib/providers';

interface Props {
  providers: StorageProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminStorage({ providers, token, onRefresh, onNotify }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [form, setForm] = useState({
    provider_name: '',
    endpoint_url: '',
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    max_bytes: '10188208025',
    region: 'auto',
  });

  function handleSelectProvider(p: CloudProvider) {
    setSelectedProvider(p);
    const endpoint = p.endpoint.replace('{region}', p.regionPlaceholder).replace('{account_id}', '');
    setForm({
      provider_name: p.name,
      endpoint_url: endpoint,
      bucket_name: '',
      access_key_id: '',
      secret_access_key: '',
      max_bytes: '10188208025',
      region: p.regionPlaceholder,
    });
  }

  function resetForm() {
    setForm({ provider_name: '', endpoint_url: '', bucket_name: '', access_key_id: '', secret_access_key: '', max_bytes: '10188208025', region: 'auto' });
    setSelectedProvider(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addProvider({
        provider_type: selectedProvider?.id || 'custom',
        provider_name: form.provider_name,
        endpoint_url: form.endpoint_url,
        bucket_name: form.bucket_name,
        access_key_id: form.access_key_id,
        secret_access_key: form.secret_access_key,
        region: form.region || 'auto',
        max_bytes: parseInt(form.max_bytes) || 10188208025,
      }, token);
      onNotify('success', 'Storage bucket added');
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove bucket "${name}"? Files stored here will remain in the database but won't be downloadable.`)) return;
    setDeletingId(id);
    try {
      await api.deleteProvider(id, token);
      onNotify('success', 'Bucket removed');
      onRefresh();
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(id: string) {
    try {
      await api.toggleProvider(id, token);
      onRefresh();
    } catch (e: any) {
      onNotify('error', e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-gray-400" />
            Storage Buckets
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage S3-compatible storage accounts. Files auto-route to the next bucket with space.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0a0a0f] font-semibold text-sm hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all"
        >
          {showForm ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Done' : 'Add bucket'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" />
            {!selectedProvider ? 'Select Cloud Provider' : 'Connect Bucket'}
          </h3>

          {!selectedProvider && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {cloudProviders.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p)}
                  className="relative p-3 rounded-xl border text-left transition-all duration-300 hover:border-white/30"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-xs font-semibold truncate text-white">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: p.color }}>{p.freeTier}</span>
                </button>
              ))}
            </div>
          )}

          {selectedProvider && (
            <div className="p-4 rounded-xl border" style={{ background: `${selectedProvider.color}08`, borderColor: `${selectedProvider.color}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{selectedProvider.name}</h4>
                    <p className="text-xs font-mono" style={{ color: selectedProvider.color }}>{selectedProvider.protocol} — {selectedProvider.freeTier}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={selectedProvider.signupUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all" style={{ borderColor: `${selectedProvider.color}30`, color: selectedProvider.color }}>
                    Sign up free
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button type="button" onClick={() => { setSelectedProvider(null); setForm(prev => ({ ...prev, provider_name: '' })); }} className="text-[10px] px-2 py-1.5 rounded-lg border border-white/10 text-gray-400 font-mono">
                    Change
                  </button>
                </div>
              </div>
              <p className="text-xs mt-2 text-gray-500">{selectedProvider.maxStorage}</p>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Bucket name" required>
                <input type="text" value={form.bucket_name} onChange={(e) => setForm({ ...form, bucket_name: e.target.value })} placeholder="my-bucket" required className="form-input" />
              </FormField>

              <FormField label="Access key ID" required>
                <input type="text" value={form.access_key_id} onChange={(e) => setForm({ ...form, access_key_id: e.target.value })} required className="form-input" />
              </FormField>

              <FormField label="Secret access key" required>
                <input type="password" value={form.secret_access_key} onChange={(e) => setForm({ ...form, secret_access_key: e.target.value })} required className="form-input" />
              </FormField>

              {!selectedProvider && (
                <FormField label="Endpoint URL" required>
                  <input
                    type="url"
                    value={form.endpoint_url}
                    onChange={(e) => {
                      setForm({ ...form, endpoint_url: e.target.value });
                      const detected = detectProviderFromEndpoint(e.target.value);
                      if (detected && !selectedProvider) {
                        setSelectedProvider(detected);
                        setForm(prev => ({ ...prev, endpoint_url: e.target.value, provider_name: detected.name }));
                      }
                    }}
                    onBlur={(e) => {
                      const detected = detectProviderFromEndpoint(e.target.value);
                      if (detected) {
                        setSelectedProvider(detected);
                        setForm(prev => ({ ...prev, provider_name: detected.name }));
                      }
                    }}
                    placeholder="https://s3.amazonaws.com"
                    required
                    className="form-input"
                  />
                </FormField>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 text-[#0a0a0f] font-semibold text-sm hover:bg-emerald-300 transition-all disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Connect
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 py-16 text-center text-gray-500">
          <Cloud className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No storage buckets configured yet.</p>
          <p className="text-sm mt-1">Click "Add bucket" to connect your first S3-compatible account.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const pct = p.max_bytes > 0 ? (p.current_bytes / p.max_bytes) * 100 : 0;
            const isFull = pct >= 95;
            const pInfo = getProviderById(p.provider_type);
            return (
              <div key={p.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pInfo?.color || '#3b82f6'}20` }}>
                      {pInfo ? <span className="text-xl">{pInfo.icon}</span> : <HardDrive className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{p.provider_name}</h3>
                      <p className="text-xs text-gray-500">{p.bucket_name}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(p.id, p.provider_name)} disabled={deletingId === p.id} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{formatBytes(p.current_bytes)} / {formatBytes(p.max_bytes)} used</span>
                    <span className={isFull ? 'text-amber-400' : 'text-gray-500'}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isFull ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleToggleActive(p.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${p.is_active ? 'bg-emerald-400' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${p.is_active ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-xs text-gray-500">{p.is_active ? 'Active' : 'Inactive'}</span>
                  <span className="text-xs text-gray-600 ml-auto truncate">{p.endpoint_url}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.625rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .form-input::placeholder { color: #6b7280; }
        .form-input:focus {
          border-color: rgba(52,211,153,0.5);
          box-shadow: 0 0 0 1px rgba(52,211,153,0.3);
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">
        {label} {required && <span className="text-emerald-400">*</span>}
      </label>
      {children}
    </div>
  );
}
