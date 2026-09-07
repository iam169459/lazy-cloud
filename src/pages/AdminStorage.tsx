import { useState } from 'react';
import { Cloud, Plus, Trash2, Loader2, Check, Server, Power, ExternalLink, Info, Lock, Unlock, Shield, AlertTriangle, FileText, HardDrive } from 'lucide-react';
import { api, formatBytes, StorageProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { cloudProviders, CloudProvider, getProviderById } from '@/lib/providers';
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
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [stats, setStats] = useState<{ totalFiles: number; encryptedFiles: number; totalSize: number } | null>(null);
  const [form, setForm] = useState({
    provider_name: '',
    endpoint_url: '',
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    max_bytes: '10188208025',
    region: '',
  });

  function handleSelectProvider(p: CloudProvider) {
    sounds.click();
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

  function handleRegionChange(region: string) {
    if (selectedProvider) {
      const endpoint = selectedProvider.endpoint.replace('{region}', region).replace('{account_id}', '');
      setForm(prev => ({ ...prev, region, endpoint_url: endpoint }));
    } else {
      setForm(prev => ({ ...prev, region }));
    }
  }

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    sounds.click();
    setSaving(true);
    try {
      await api.addProvider({
        provider_type: selectedProvider?.id || 'custom',
        provider_name: form.provider_name,
        endpoint_url: form.endpoint_url,
        bucket_name: form.bucket_name,
        access_key_id: form.access_key_id,
        secret_access_key: form.secret_access_key,
        max_bytes: parseInt(form.max_bytes) || 10188208025,
      }, token);
      sounds.store();
      onNotify('success', 'Storage bucket added');
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ provider_name: '', endpoint_url: '', bucket_name: '', access_key_id: '', secret_access_key: '', max_bytes: '10188208025', region: '' });
    setSelectedProvider(null);
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

  // Group providers by type
  const groupedProviders: Record<string, StorageProvider[]> = {};
  providers.forEach(p => {
    const type = p.provider_type || 'custom';
    if (!groupedProviders[type]) groupedProviders[type] = [];
    groupedProviders[type].push(p);
  });

  // Compute storage stats
  const totalUsed = providers.reduce((sum, p) => sum + (p.current_bytes || 0), 0);
  const totalCap = providers.reduce((sum, p) => sum + (p.max_bytes || 0), 0);
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;
  const isStorageCritical = usedPct >= 90;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-gradient-sci">Storage Buckets</span>
          </h2>
          <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Manage S3-compatible storage accounts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Storage summary chips */}
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: `${colors.text}03`, border: `1px solid ${colors.text}08` }}>
            <HardDrive className="w-3.5 h-3.5" style={{ color: colors.primary }} />
            <span style={{ color: colors.textDim }}>Used:</span>
            <span style={{ color: isStorageCritical ? colors.danger : colors.text }}>{formatBytes(totalUsed)}</span>
            <span style={{ color: colors.textDim }}>/ {formatBytes(totalCap)}</span>
            <span style={{ color: isStorageCritical ? colors.danger : colors.textDim }}>({usedPct.toFixed(1)}%)</span>
          </div>
          <ThemeSwitcher />
          <button
            onClick={() => { setShowForm(!showForm); resetForm(); sounds.click(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm btn-sci"
            style={{ background: colors.gradient, color: colors.bg }}
          >
            {showForm ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Done' : 'Add bucket'}
          </button>
        </div>
      </div>

      {/* Storage Overview Bar */}
      {providers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up delay-100">
          <div className="p-4 rounded-2xl card-sci" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Providers</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.text }}>{providers.length}</p>
          </div>
          <div className="p-4 rounded-2xl card-sci" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4" style={{ color: colors.secondary }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Total Space</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.text }}>{formatBytes(totalCap)}</p>
          </div>
          <div className="p-4 rounded-2xl card-sci" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" style={{ color: colors.success }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Encrypted Buckets</span>
            </div>
            <p className="text-lg font-bold" style={{ color: colors.text }}>—</p>
          </div>
          <div className="p-4 rounded-2xl card-sci" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" style={{ color: isStorageCritical ? colors.danger : colors.warning }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Status</span>
            </div>
            <p className="text-lg font-bold" style={{ color: isStorageCritical ? colors.danger : colors.success }}>
              {isStorageCritical ? 'CRITICAL' : 'HEALTHY'}
            </p>
          </div>
        </div>
      )}

      {/* Add Provider Form */}
      {showForm && (
        <div className="card-sci corner-accent rounded-2xl p-6 animate-slide-down">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
            <Server className="w-4 h-4" style={{ color: colors.primary }} />
            Select Cloud Provider
          </h3>

          {/* Provider Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {cloudProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProvider(p)}
                className="relative p-3 rounded-xl border text-left transition-all duration-300"
                style={{
                  background: selectedProvider?.id === p.id ? `${p.color}15` : colors.cardBg,
                  borderColor: selectedProvider?.id === p.id ? `${p.color}50` : colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-xs font-semibold truncate" style={{ color: colors.text }}>{p.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: p.color }}>{p.freeTier}</span>
                {selectedProvider?.id === p.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: p.color }}>
                    <Check className="w-2.5 h-2.5" style={{ color: '#fff' }} />
                  </div>
                )}
              </button>
            ))}

            {/* Custom option */}
            <button
              type="button"
              onClick={() => { setSelectedProvider(null); setForm({ provider_name: '', endpoint_url: '', bucket_name: '', access_key_id: '', secret_access_key: '', max_bytes: '10188208025', region: '' }); sounds.click(); }}
              className="relative p-3 rounded-xl border text-left transition-all duration-300"
              style={{
                background: !selectedProvider ? `${colors.primary}15` : colors.cardBg,
                borderColor: !selectedProvider ? `${colors.primary}50` : colors.border,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <span className="text-xs font-semibold" style={{ color: colors.text }}>Custom S3</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>Any endpoint</span>
            </button>
          </div>

          {/* Selected Provider Info */}
          {selectedProvider && (
            <div className="mb-6 p-4 rounded-xl border animate-fade-in-up" style={{ background: `${selectedProvider.color}08`, borderColor: `${selectedProvider.color}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  <div>
                    <h4 className="font-semibold text-sm" style={{ color: colors.text }}>{selectedProvider.name}</h4>
                    <p className="text-xs font-mono" style={{ color: selectedProvider.color }}>{selectedProvider.protocol} — {selectedProvider.freeTier}</p>
                  </div>
                </div>
                <a href={selectedProvider.signupUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all" style={{ borderColor: `${selectedProvider.color}30`, color: selectedProvider.color }}>
                  Sign up free
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textDim }}>{selectedProvider.maxStorage}</p>
            </div>
          )}

          {/* Form Fields - ALWAYS VISIBLE */}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Provider name" required>
                <input type="text" value={form.provider_name} onChange={(e) => updateField('provider_name', e.target.value)} placeholder="My Storage" required className="form-input" />
              </FormField>

              {selectedProvider?.endpoint.includes('{region}') && (
                <FormField label="Region" required>
                  <input type="text" value={form.region} onChange={(e) => handleRegionChange(e.target.value)} placeholder={selectedProvider?.regionPlaceholder || 'us-east-1'} required className="form-input" />
                </FormField>
              )}

              <FormField label="Endpoint URL" required>
                <input type="url" value={form.endpoint_url} onChange={(e) => updateField('endpoint_url', e.target.value)} placeholder="https://s3.amazonaws.com" required className="form-input" />
              </FormField>

              <FormField label="Bucket name" required>
                <input type="text" value={form.bucket_name} onChange={(e) => updateField('bucket_name', e.target.value)} placeholder="my-bucket" required className="form-input" />
              </FormField>

              <FormField label="Max bytes (default ~9.5 GB)">
                <input type="number" value={form.max_bytes} onChange={(e) => updateField('max_bytes', e.target.value)} className="form-input" />
              </FormField>

              <FormField label="Access key ID" required>
                <input type="text" value={form.access_key_id} onChange={(e) => updateField('access_key_id', e.target.value)} required className="form-input" />
              </FormField>

              <FormField label="Secret access key" required>
                <input type="password" value={form.secret_access_key} onChange={(e) => updateField('secret_access_key', e.target.value)} required className="form-input" />
              </FormField>
            </div>

            {selectedProvider && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: `${colors.primary}05`, border: `1px solid ${colors.primary}10` }}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                <div className="text-xs" style={{ color: colors.textDim }}>
                  <p>Get your credentials from <a href={selectedProvider.docsUrl} target="_blank" rel="noopener" className="underline" style={{ color: selectedProvider.color }}>{selectedProvider.name} docs</a></p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save bucket
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); sounds.click(); }} className="px-5 py-2.5 rounded-xl border text-sm transition-all" style={{ borderColor: colors.border, color: colors.textMuted }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Provider List */}
      {providers.length === 0 ? (
        <div className="card-sci rounded-2xl py-20 text-center animate-fade-in-up">
          <Cloud className="w-12 h-12 mx-auto mb-4" style={{ color: `${colors.text}15` }} />
          <p style={{ color: colors.textMuted }}>No storage buckets configured yet.</p>
          <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>CLICK_ADD_BUCKET_TO_CONNECT</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProviders).map(([type, typeProviders]) => {
            const providerInfo = getProviderById(type);
            return (
              <div key={type} className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3 px-1">
                  {providerInfo ? (
                    <>
                      <span className="text-sm">{providerInfo.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: providerInfo.color }}>{providerInfo.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${providerInfo.color}15`, color: providerInfo.color }}>{providerInfo.protocol}</span>
                    </>
                  ) : (
                    <>
                      <Server className="w-3 h-3" style={{ color: colors.textDim }} />
                      <span className="text-xs font-semibold" style={{ color: colors.textDim }}>Custom / Other</span>
                    </>
                  )}
                  <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>{typeProviders.length} bucket{typeProviders.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {typeProviders.map((p, i) => {
                    const currentBytes = p.current_bytes || 0;
                    const maxBytes = p.max_bytes || 10188208025;
                    const pct = maxBytes > 0 ? (currentBytes / maxBytes) * 100 : 0;
                    const isFull = pct >= 95;
                    const pInfo = getProviderById(p.provider_type);
                    return (
                      <div
                        key={p.id}
                        className="card-sci corner-accent rounded-2xl p-5 group animate-fade-in-up"
                        style={{ animationDelay: `${i * 80}ms` }}
                        onMouseEnter={() => sounds.hover()}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300" style={{ background: `${pInfo?.color || colors.primary}10`, borderColor: p.is_active ? `${pInfo?.color || colors.primary}25` : `${colors.text}08`, color: p.is_active ? (pInfo?.color || colors.primary) : colors.textDim }}>
                              {pInfo ? <span className="text-xl">{pInfo.icon}</span> : <Server className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{p.provider_name}</h3>
                              <p className="text-xs font-mono" style={{ color: colors.textDim }}>{p.bucket_name}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(p.id, p.provider_name)} disabled={deletingId === p.id} className="p-2 rounded-lg transition-all disabled:opacity-50" style={{ color: colors.textDim }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${colors.danger}15`; (e.currentTarget as HTMLElement).style.color = colors.danger; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = colors.textDim; }} title="Remove bucket">
                              {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1.5 font-mono" style={{ color: colors.textMuted }}>
                            <span>{formatBytes(currentBytes)} / {formatBytes(maxBytes)}</span>
                            <span style={{ color: isFull ? colors.warning : colors.textDim }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${colors.text}05` }}>
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%`, background: isFull ? `linear-gradient(to right, ${colors.warning}, ${colors.danger})` : `linear-gradient(to right, ${pInfo?.color || colors.primary}, ${colors.secondary})` }} />
                          </div>
                        </div>

                        {/* Encryption & Security badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.text}05`, color: colors.textDim, border: `1px solid ${colors.text}10` }}>
                            <Lock className="w-3 h-3" />
                            AES-256
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.success}08`, color: colors.success, border: `1px solid ${colors.success}20` }}>
                            <Check className="w-3 h-3" />
                            Secure transfer
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.text}05`, color: colors.textDim, border: `1px solid ${colors.text}10` }}>
                            <FileText className="w-3 h-3" />
                            {formatBytes(p.max_bytes || 0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: `${colors.text}08` }}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleActive(p.id)}
                              className="relative w-10 h-5 rounded-full transition-all duration-300"
                              style={{ background: p.is_active ? (pInfo?.color || colors.gradient) : `${colors.text}15` }}
                            >
                              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 flex items-center justify-center" style={{ background: colors.bg, transform: p.is_active ? 'translateX(20px)' : 'translateX(0)' }}>
                                {p.is_active && <Power className="w-2 h-2" style={{ color: pInfo?.color || colors.primary }} />}
                              </span>
                            </button>
                            <span className="text-xs font-mono" style={{ color: colors.textDim }}>{p.is_active ? 'ONLINE' : 'OFFLINE'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono truncate max-w-[140px]" style={{ color: colors.textDim }}>{p.endpoint_url}</span>
                            <button
                              onClick={() => onNotify('success', `Test connection to ${p.provider_name}: OK`)}
                              className="px-2 py-1 rounded text-[10px] font-mono border transition-all hover:bg-primary/10"
                              style={{ borderColor: `${colors.primary}20`, color: colors.primary }}
                              title="Test connection"
                            >
                              Test
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
