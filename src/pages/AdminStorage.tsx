import { useState } from 'react';
import {
  Cloud, Plus, Trash2, Check, Server, Power, ExternalLink, Info,
  HardDrive, RefreshCw, Zap, X, Shield
} from 'lucide-react';
import { api, formatBytes, StorageProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { cloudProviders, CloudProvider, getProviderById, detectProviderFromEndpoint } from '@/lib/providers';
import DataTable, { Column, Action } from '@/components/DataTable';
import { FormSection, FormField, FormActions, SaveButton, CancelButton } from '@/components/Form';

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
  const [testingId, setTestingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    provider_name: '',
    endpoint_url: '',
    bucket_name: '',
    access_key_id: '',
    secret_access_key: '',
    max_bytes: '10188208025',
    region: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Set<string>>(new Set());

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
      max_bytes: String(p.maxBytes),
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
    setFormTouched(prev => new Set(prev).add(field));
  }

  function blurField(field: string) {
    setFormTouched(prev => new Set(prev).add(field));
    validateForm();
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!form.provider_name.trim()) e.provider_name = 'Provider name is required';
    if (!form.endpoint_url.trim()) e.endpoint_url = 'Endpoint URL is required';
    else if (!/^https?:\/\//.test(form.endpoint_url)) e.endpoint_url = 'Must be a valid URL';
    if (!form.bucket_name.trim()) e.bucket_name = 'Bucket name is required';
    if (!form.access_key_id.trim()) e.access_key_id = 'Access key ID is required';
    if (!form.secret_access_key.trim()) e.secret_access_key = 'Secret access key is required';
    const maxBytes = Number(form.max_bytes);
    if (isNaN(maxBytes) || maxBytes < 0) e.max_bytes = 'Must be a non-negative number';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormTouched(new Set(Object.keys(form)));
    if (!validateForm()) {
      sounds.error();
      onNotify('error', 'Fix the errors below before saving');
      return;
    }
    sounds.click();
    setSaving(true);
    try {
      const { provider } = await api.addProvider({
        provider_type: selectedProvider?.id || 'custom',
        provider_name: form.provider_name,
        endpoint_url: form.endpoint_url,
        bucket_name: form.bucket_name,
        access_key_id: form.access_key_id,
        secret_access_key: form.secret_access_key,
        region: form.region || 'auto',
        max_bytes: parseInt(form.max_bytes) || 10188208025,
      }, token);
      try {
        const sizeInfo = await api.getBucketSize(provider.id, token);
        if (sizeInfo.success) {
          await api.updateProviderBytes(provider.id, sizeInfo.usedBytes, token);
        }
      } catch {}
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
    setFormErrors({});
    setFormTouched(new Set());
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
    try { await api.toggleProvider(id, token); onRefresh(); }
    catch (e: any) { sounds.error(); onNotify('error', e.message); }
  }

  async function handleRefreshSize(id: string) {
    sounds.click();
    setRefreshingId(id);
    try {
      const sizeInfo = await api.getBucketSize(id, token);
      if (sizeInfo.success) {
        await api.updateProviderBytes(id, sizeInfo.usedBytes, token);
        onNotify('success', `Size updated: ${formatBytes(sizeInfo.usedBytes)} (${sizeInfo.objectCount} files)`);
        onRefresh();
      } else {
        onNotify('error', 'Failed to detect size');
      }
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleTest(id: string) {
    sounds.click();
    setTestingId(id);
    try {
      const res = await api.testProvider(id, token);
      if (res.success) {
        onNotify('success', `Connection OK — ${res.fileCount} file(s) in ${res.bucket}`);
      } else {
        onNotify('error', `Connection failed: ${res.error}`);
      }
    } catch (e: any) {
      onNotify('error', `Test failed: ${e.message}`);
    } finally {
      setTestingId(null);
    }
  }

  // Compute stats
  const totalUsed = providers.reduce((sum, p) => sum + Number(p.current_bytes || 0), 0);
  const totalCap = providers.reduce((sum, p) => sum + Number(p.max_bytes || 0), 0);
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;
  const activeCount = providers.filter((p) => p.is_active).length;

  // Unique provider types for filter
  const providerTypes = [...new Set(providers.map((p) => p.provider_type || 'custom'))];

  // Filtered data
  const filteredProviders = providers.filter((p) => {
    if (filterType !== 'all' && (p.provider_type || 'custom') !== filterType) return false;
    if (filterStatus === 'active' && !p.is_active) return false;
    if (filterStatus === 'inactive' && p.is_active) return false;
    if (filterStatus === 'critical') {
      const pct = Number(p.max_bytes || 0) > 0 ? (Number(p.current_bytes || 0) / Number(p.max_bytes || 0)) * 100 : 0;
      if (pct < 90) return false;
    }
    return true;
  });

  const columns: Column<StorageProvider>[] = [
    {
      key: 'provider_name',
      label: 'Bucket',
      sortable: true,
      render: (row) => {
        const pInfo = getProviderById(row.provider_type);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${pInfo?.color || colors.primary}12` }}>
              {pInfo ? <span className="text-sm">{pInfo.icon}</span> : <Server className="w-3.5 h-3.5" style={{ color: colors.textDim }} />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{row.provider_name}</div>
              <div className="text-[10px] font-mono truncate" style={{ color: colors.textDim }}>{row.bucket_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'provider_type',
      label: 'Provider',
      sortable: true,
      render: (row) => {
        const pInfo = getProviderById(row.provider_type);
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${pInfo?.color || colors.primary}12`, color: pInfo?.color || colors.primary }}>
            {pInfo?.name || 'Custom'}
          </span>
        );
      },
    },
    {
      key: 'usage',
      label: 'Usage',
      sortable: true,
      render: (row) => {
        const current = Number(row.current_bytes || 0);
        const max = Number(row.max_bytes || 0);
        const pct = max > 0 ? (current / max) * 100 : 0;
        const isWarning = pct >= 90;
        return (
          <div className="min-w-[120px]">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span style={{ color: colors.textMuted }}>{formatBytes(current)}</span>
              <span style={{ color: isWarning ? '#f59e0b' : colors.textDim }}>{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #22c55e, #3b82f6)',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.is_active ? 'status-success' : 'status-neutral'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-mono" style={{ color: colors.textDim }}>{row.region || '—'}</span>
      ),
    },
  ];

  const rowActions: Action<StorageProvider>[] = [
    {
      label: 'Toggle active',
      icon: <Power className="w-3.5 h-3.5" />,
      onClick: (row) => handleToggleActive(row.id),
    },
    {
      label: 'Test connection',
      icon: <Zap className="w-3.5 h-3.5" />,
      onClick: (row) => handleTest(row.id),
      disabled: (row) => testingId === row.id,
    },
    {
      label: 'Refresh size',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      onClick: (row) => handleRefreshSize(row.id),
      disabled: (row) => refreshingId === row.id,
    },
    {
      label: 'Remove',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (row) => handleDelete(row.id, row.provider_name),
      variant: 'danger',
      disabled: (row) => deletingId === row.id,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4" style={{ color: '#22c55e' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Providers</span>
          </div>
          <p className="text-xl font-bold">{providers.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4" style={{ color: '#3b82f6' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Total Space</span>
          </div>
          <p className="text-xl font-bold">{formatBytes(totalCap)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" style={{ color: '#22c55e' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Active</span>
          </div>
          <p className="text-xl font-bold">{activeCount} / {providers.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4" style={{ color: usedPct >= 90 ? '#f59e0b' : '#22c55e' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Used</span>
          </div>
          <p className="text-xl font-bold">{usedPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-1.5 px-3 text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">All providers</option>
            {providerTypes.map((t) => {
              const pInfo = getProviderById(t);
              return <option key={t} value={t}>{pInfo?.name || t}</option>;
            })}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-1.5 px-3 text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="critical">Critical (90%+)</option>
          </select>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); resetForm(); sounds.click(); }}
          className="btn btn-primary text-xs"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add bucket'}
        </button>
      </div>

      {/* Add Provider Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-up">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
            <Server className="w-4 h-4" style={{ color: '#22c55e' }} />
            Select Cloud Provider
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {cloudProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProvider(p)}
                className="relative p-3 rounded-xl border text-left transition-all duration-200"
                style={{
                  background: selectedProvider?.id === p.id ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                  borderColor: selectedProvider?.id === p.id ? `${p.color}50` : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-xs font-semibold truncate">{p.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: p.color }}>{p.freeTier}</span>
                {selectedProvider?.id === p.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: p.color }}>
                    <Check className="w-2.5 h-2.5" style={{ color: '#fff' }} />
                  </div>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setSelectedProvider(null); resetForm(); sounds.click(); }}
              className="relative p-3 rounded-xl border text-left transition-all duration-200"
              style={{
                background: !selectedProvider ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                borderColor: !selectedProvider ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4" style={{ color: colors.textDim }} />
                <span className="text-xs font-semibold">Custom S3</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>Any endpoint</span>
            </button>
          </div>

          {selectedProvider && (
            <div className="mb-6 p-4 rounded-xl animate-fade-up" style={{ background: `${selectedProvider.color}08`, border: `1px solid ${selectedProvider.color}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  <div>
                    <h4 className="font-semibold text-sm">{selectedProvider.name}</h4>
                    <p className="text-xs font-mono" style={{ color: selectedProvider.color }}>{selectedProvider.protocol} — {selectedProvider.freeTier}</p>
                  </div>
                </div>
                <a href={selectedProvider.signupUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all" style={{ borderColor: `${selectedProvider.color}30`, color: selectedProvider.color }}>
                  Sign up free <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textDim }}>{selectedProvider.maxStorage}</p>
            </div>
          )}

          <form onSubmit={handleAdd} noValidate className="space-y-4">
            <FormSection title="Connection Details" icon={<Server className="w-4 h-4" />}>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Provider name" required error={formTouched.has('provider_name') ? formErrors.provider_name : undefined}>
                  <input type="text" value={form.provider_name} onChange={(e) => updateField('provider_name', e.target.value)} onBlur={() => blurField('provider_name')} placeholder="My Storage" className="input" aria-invalid={!!formErrors.provider_name} />
                </FormField>
                <FormField label="Endpoint URL" required error={formTouched.has('endpoint_url') ? formErrors.endpoint_url : undefined}>
                  <input
                    type="url"
                    value={form.endpoint_url}
                    onChange={(e) => {
                      updateField('endpoint_url', e.target.value);
                      const detected = detectProviderFromEndpoint(e.target.value);
                      if (detected && !selectedProvider) {
                        setSelectedProvider(detected);
                        setForm(prev => ({ ...prev, provider_name: detected.name, max_bytes: String(detected.maxBytes) }));
                      }
                    }}
                    onBlur={() => blurField('endpoint_url')}
                    placeholder="https://s3.amazonaws.com"
                    className="input"
                    aria-invalid={!!formErrors.endpoint_url}
                  />
                </FormField>
                <FormField label="Bucket name" required error={formTouched.has('bucket_name') ? formErrors.bucket_name : undefined}>
                  <input type="text" value={form.bucket_name} onChange={(e) => updateField('bucket_name', e.target.value)} onBlur={() => blurField('bucket_name')} placeholder="my-bucket" className="input" aria-invalid={!!formErrors.bucket_name} />
                </FormField>
                <FormField label="Region" hint={selectedProvider ? `Default: ${selectedProvider.regionPlaceholder}` : 'auto'}>
                  <input type="text" value={form.region} onChange={(e) => handleRegionChange(e.target.value)} placeholder={selectedProvider?.regionPlaceholder || 'auto'} className="input" />
                </FormField>
                <FormField label="Access key ID" required error={formTouched.has('access_key_id') ? formErrors.access_key_id : undefined}>
                  <input type="text" value={form.access_key_id} onChange={(e) => updateField('access_key_id', e.target.value)} onBlur={() => blurField('access_key_id')} className="input" aria-invalid={!!formErrors.access_key_id} />
                </FormField>
                <FormField label="Secret access key" required error={formTouched.has('secret_access_key') ? formErrors.secret_access_key : undefined}>
                  <input type="password" value={form.secret_access_key} onChange={(e) => updateField('secret_access_key', e.target.value)} onBlur={() => blurField('secret_access_key')} className="input" aria-invalid={!!formErrors.secret_access_key} />
                </FormField>
              </div>
            </FormSection>

            {selectedProvider && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                <div className="text-xs" style={{ color: colors.textDim }}>
                  Get your credentials from <a href={selectedProvider.docsUrl} target="_blank" rel="noopener" className="underline" style={{ color: selectedProvider.color }}>{selectedProvider.name} docs</a>
                </div>
              </div>
            )}

            <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs font-mono" style={{ color: colors.textDim }}>
                {Object.keys(formErrors).length > 0 ? `${Object.keys(formErrors).length} error(s) to fix` : 'Ready to save'}
              </p>
              <FormActions>
                <SaveButton loading={saving}>
                  <Plus className="w-3.5 h-3.5" />
                  Save Bucket
                </SaveButton>
                <CancelButton onClick={() => { setShowForm(false); resetForm(); sounds.click(); }}>
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </CancelButton>
              </FormActions>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProviders}
        actions={rowActions}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search buckets..."
        searchKeys={['provider_name', 'bucket_name', 'provider_type', 'region']}
        pageSize={10}
        emptyIcon={<Cloud className="w-10 h-10" />}
        emptyTitle="No storage buckets configured"
        emptyDescription="Click 'Add bucket' to connect your first S3-compatible storage provider."
      />
    </div>
  );
}
