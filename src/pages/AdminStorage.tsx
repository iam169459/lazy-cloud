import { useState } from 'react';
import { Cloud, Plus, Trash2, Loader2, Check, HardDrive, Server, Power, Palette } from 'lucide-react';
import { api, formatBytes, StorageProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface Props {
  providers: StorageProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminStorage({ providers, token, onRefresh, onNotify }: Props) {
  const { colors } = useTheme();
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
    sounds.click();
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
      sounds.store();
      onNotify('success', 'Storage bucket added');
      setForm({ provider_name: '', endpoint_url: '', bucket_name: '', access_key_id: '', secret_access_key: '', max_bytes: '10188208025' });
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove bucket "${name}"? Files stored here will remain in the database but won't be downloadable.`)) return;
    sounds.click();
    setDeletingId(id);
    try {
      await api.deleteProvider(id, token);
      sounds.delete();
      onNotify('success', 'Bucket removed');
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(id: string) {
    sounds.toggle();
    try {
      await api.toggleProvider(id, token);
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-gradient-sci">Storage Buckets</span>
          </h2>
          <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Manage S3-compatible storage accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button
            onClick={() => { setShowForm(!showForm); sounds.click(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#06060c] font-bold text-sm btn-sci"
            style={{ background: colors.gradient }}
          >
            {showForm ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Done' : 'Add bucket'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card-sci corner-accent rounded-2xl p-6 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Provider name" required>
              <input type="text" value={form.provider_name} onChange={(e) => { setForm({ ...form, provider_name: e.target.value }); sounds.type(); }} placeholder="My R2 Account" required className="form-input" />
            </FormField>
            <FormField label="Endpoint URL" required>
              <input type="url" value={form.endpoint_url} onChange={(e) => { setForm({ ...form, endpoint_url: e.target.value }); sounds.type(); }} placeholder="https://xxx.r2.cloudflarestorage.com" required className="form-input" />
            </FormField>
            <FormField label="Bucket name" required>
              <input type="text" value={form.bucket_name} onChange={(e) => { setForm({ ...form, bucket_name: e.target.value }); sounds.type(); }} placeholder="my-bucket" required className="form-input" />
            </FormField>
            <FormField label="Max bytes (default ~9.5 GB)">
              <input type="number" value={form.max_bytes} onChange={(e) => setForm({ ...form, max_bytes: e.target.value })} className="form-input" />
            </FormField>
            <FormField label="Access key ID" required>
              <input type="text" value={form.access_key_id} onChange={(e) => { setForm({ ...form, access_key_id: e.target.value }); sounds.type(); }} required className="form-input" />
            </FormField>
            <FormField label="Secret access key" required>
              <input type="password" value={form.secret_access_key} onChange={(e) => { setForm({ ...form, secret_access_key: e.target.value }); sounds.type(); }} required className="form-input" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save bucket
            </button>
            <button type="button" onClick={() => { setShowForm(false); sounds.click(); }} className="px-5 py-2.5 rounded-xl border text-sm transition-all" style={{ borderColor: colors.border, color: colors.textMuted }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {providers.length === 0 ? (
        <div className="card-sci rounded-2xl py-20 text-center animate-fade-in-up">
          <Cloud className="w-12 h-12 mx-auto mb-4" style={{ color: `${colors.text}15` }} />
          <p style={{ color: colors.textMuted }}>No storage buckets configured yet.</p>
          <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>CLICK_ADD_BUCKET_TO_CONNECT</p>
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
                onMouseEnter={() => sounds.hover()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300" style={{ background: `${colors.primary}10`, borderColor: p.is_active ? `${colors.primary}25` : `${colors.text}08`, color: p.is_active ? colors.primary : colors.textDim }}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{p.provider_name}</h3>
                      <p className="text-xs font-mono" style={{ color: colors.textDim }}>{p.bucket_name}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(p.id, p.provider_name)} disabled={deletingId === p.id} className="p-2 rounded-lg transition-all disabled:opacity-50" style={{ color: colors.textDim }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${colors.danger}15`; (e.currentTarget as HTMLElement).style.color = colors.danger; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = colors.textDim; }}>
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5 font-mono" style={{ color: colors.textMuted }}>
                    <span>{formatBytes(p.current_bytes)} / {formatBytes(p.max_bytes)}</span>
                    <span style={{ color: isFull ? colors.warning : colors.textDim }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: `${colors.text}05` }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%`, background: isFull ? `linear-gradient(to right, ${colors.warning}, ${colors.danger})` : colors.gradient }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: `${colors.text}08` }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(p.id)}
                      className="relative w-10 h-5 rounded-full transition-all duration-300"
                      style={{ background: p.is_active ? colors.gradient : `${colors.text}15` }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 flex items-center justify-center`} style={{ background: colors.bg, transform: p.is_active ? 'translateX(20px)' : 'translateX(0)' }}>
                        {p.is_active && <Power className="w-2 h-2" style={{ color: colors.primary }} />}
                      </span>
                    </button>
                    <span className="text-xs font-mono" style={{ color: colors.textDim }}>{p.is_active ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                  <span className="text-[10px] font-mono truncate max-w-[140px]" style={{ color: colors.textDim }}>{p.endpoint_url}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div>
      <label className="block text-[10px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>
        {label} {required && <span style={{ color: colors.primary }}>*</span>}
      </label>
      {children}
    </div>
  );
}
