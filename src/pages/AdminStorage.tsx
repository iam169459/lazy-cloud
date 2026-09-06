import { useState } from 'react';
import { Cloud, Plus, Trash2, Loader2, Check, HardDrive, Server, Power } from 'lucide-react';
import { api, formatBytes, StorageProvider } from '@/lib/api';

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
  const [form, setForm] = useState({
    provider_name: '',
    endpoint_url: '',
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    max_bytes: '10188208025',
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addProvider({
        provider_name: form.provider_name,
        endpoint_url: form.endpoint_url,
        bucket_name: form.bucket_name,
        access_key_id: form.access_key_id,
        secret_access_key: form.secret_access_key,
        max_bytes: parseInt(form.max_bytes) || 10188208025,
      }, token);
      onNotify('success', 'Storage bucket added');
      setForm({ provider_name: '', endpoint_url: '', bucket_name: '', access_key_id: '', secret_access_key: '', max_bytes: '10188208025' });
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
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="text-gradient-sci">Storage Buckets</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-mono">Manage S3-compatible storage accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci"
        >
          {showForm ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Done' : 'Add bucket'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card-sci corner-accent rounded-2xl p-6 space-y-4 animate-scale-in">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Provider name" required>
              <input type="text" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} placeholder="My R2 Account" required className="form-input" />
            </FormField>
            <FormField label="Endpoint URL" required>
              <input type="url" value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} placeholder="https://xxx.r2.cloudflarestorage.com" required className="form-input" />
            </FormField>
            <FormField label="Bucket name" required>
              <input type="text" value={form.bucket_name} onChange={(e) => setForm({ ...form, bucket_name: e.target.value })} placeholder="my-bucket" required className="form-input" />
            </FormField>
            <FormField label="Max bytes (default ~9.5 GB)">
              <input type="number" value={form.max_bytes} onChange={(e) => setForm({ ...form, max_bytes: e.target.value })} className="form-input" />
            </FormField>
            <FormField label="Access key ID" required>
              <input type="text" value={form.access_key_id} onChange={(e) => setForm({ ...form, access_key_id: e.target.value })} required className="form-input" />
            </FormField>
            <FormField label="Secret access key" required>
              <input type="password" value={form.secret_access_key} onChange={(e) => setForm({ ...form, secret_access_key: e.target.value })} required className="form-input" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save bucket
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-emerald-400/20 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {providers.length === 0 ? (
        <div className="card-sci rounded-2xl py-20 text-center animate-fade-in-up">
          <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No storage buckets configured yet.</p>
          <p className="text-sm text-gray-600 mt-1 font-mono">CLICK_ADD_BUCKET_TO_CONNECT</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((p, i) => {
            const pct = p.max_bytes > 0 ? (p.current_bytes / p.max_bytes) * 100 : 0;
            const isFull = pct >= 95;
            return (
              <div
                key={p.id}
                className="card-sci corner-accent rounded-2xl p-5 group animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border flex items-center justify-center transition-all duration-300 ${
                      p.is_active ? 'border-emerald-400/20 group-hover:glow-emerald' : 'border-white/5'
                    }`}>
                      <Server className={`w-5 h-5 transition-colors ${p.is_active ? 'text-emerald-400' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{p.provider_name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{p.bucket_name}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(p.id, p.provider_name)} disabled={deletingId === p.id} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all disabled:opacity-50">
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-gray-400">{formatBytes(p.current_bytes)} / {formatBytes(p.max_bytes)}</span>
                    <span className={isFull ? 'text-amber-400' : 'text-gray-500'}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-cyan-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(p.id)}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                        p.is_active
                          ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 glow-emerald'
                          : 'bg-gray-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#06060c] transition-transform duration-300 flex items-center justify-center ${
                        p.is_active ? 'translate-x-5' : ''
                      }`}>
                        {p.is_active && <Power className="w-2 h-2 text-emerald-400" />}
                      </span>
                    </button>
                    <span className="text-xs text-gray-500 font-mono">{p.is_active ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono truncate max-w-[140px]">{p.endpoint_url}</span>
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
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.3s ease;
        }
        .form-input::placeholder { color: #4b5563; }
        .form-input:focus {
          border-color: rgba(52,211,153,0.4);
          box-shadow: 0 0 20px rgba(52,211,153,0.08);
          background: rgba(52,211,153,0.02);
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1.5 font-mono uppercase tracking-wider">
        {label} {required && <span className="text-emerald-400">*</span>}
      </label>
      {children}
    </div>
  );
}
