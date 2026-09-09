import { useState } from 'react';
import { Plus, Trash2, Copy, Check, Key, Shield, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { api, ApiKey } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import DataTable, { Column, BulkAction } from '@/components/DataTable';
import { FormSection, FormField, FormActions, SaveButton, CancelButton } from '@/components/Form';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminApiKeys({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ id: string; key: string; name: string } | null>(null);
  const [form, setForm] = useState({ name: '', permissions: 'read', expiresInDays: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Set<string>>(new Set());

  async function loadKeys() {
    try {
      const { keys: loadedKeys } = await api.listApiKeys(token);
      setKeys(loadedKeys);
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setLoading(false);
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
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.permissions) e.permissions = 'Permissions required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
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
      const result = await api.createApiKey(
        form.name,
        form.permissions,
        form.expiresInDays ? parseInt(form.expiresInDays) : undefined,
        token
      );
      sounds.store();
      onNotify('success', 'API key created');
      setNewKey({ id: result.key.id, key: result.key.key, name: result.key.name });
      setForm({ name: '', permissions: 'read', expiresInDays: '' });
      setShowForm(false);
      setFormErrors({});
      setFormTouched(new Set());
      loadKeys();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete API key "${name}"?`)) return;
    sounds.click();
    setDeletingId(id);
    try {
      await api.deleteApiKey(id, token);
      sounds.delete();
      onNotify('success', 'API key deleted');
      loadKeys();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    sounds.copy();
    onNotify('success', 'API key copied to clipboard');
  }

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-medium truncate max-w-[200px]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
          {row.permissions}
        </span>
      ),
    },
    {
      key: 'last_used_at',
      label: 'Last Used',
      sortable: true,
      render: (row) => (
        <span className="text-xs" style={{ color: row.last_used_at ? colors.textMuted : colors.textDim }}>
          {row.last_used_at ? new Date(row.last_used_at).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'expires_at',
      label: 'Expires',
      sortable: true,
      render: (row) => {
        if (!row.expires_at) return <span className="text-xs" style={{ color: colors.textDim }}>Never</span>;
        const expired = new Date(row.expires_at) < new Date();
        return (
          <span className="text-xs" style={{ color: expired ? '#ef4444' : colors.textMuted }}>
            {expired ? 'Expired ' : ''}{new Date(row.expires_at).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-xs" style={{ color: colors.textDim }}>{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const rowActions = [
    {
      label: 'Copy key (only works once)',
      icon: <Copy className="w-3.5 h-3.5" />,
      onClick: (row) => onNotify('error', 'Key only shown once at creation'),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (row) => handleDelete(row.id, row.name),
      variant: 'danger',
      disabled: (row) => deletingId === row.id,
    },
  ];

  const bulkActions: BulkAction<ApiKey>[] = [
    {
      label: 'Delete selected',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: async (selected) => {
        sounds.click();
        if (!confirm(`Delete ${selected.length} API key(s)?`)) return;
        for (const k of selected) {
          try { await api.deleteApiKey(k.id, token); } catch {}
        }
        sounds.delete();
        onNotify('success', `Deleted ${selected.length} API key(s)`);
        loadKeys();
      },
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => { setShowForm(!showForm); sounds.click(); }}
          className="btn btn-primary text-xs"
        >
          {showForm ? <AlertCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Create API key'}
        </button>
      </div>

      {/* Create Key Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-up">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
            <Key className="w-4 h-4" style={{ color: '#22c55e' }} />
            Create API Key
          </h3>
          <form onSubmit={handleCreate} noValidate className="space-y-4">
            <FormSection title="Key Details" icon={<Key className="w-4 h-4" />}>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Name" required error={formTouched.has('name') ? formErrors.name : undefined}>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} onBlur={() => blurField('name')} placeholder="My App" className="input" aria-invalid={!!formErrors.name} />
                </FormField>
                <FormField label="Permissions" required error={formTouched.has('permissions') ? formErrors.permissions : undefined}>
                  <select value={form.permissions} onChange={(e) => updateField('permissions', e.target.value)} onBlur={() => blurField('permissions')} className="input" aria-invalid={!!formErrors.permissions}>
                    <option value="read">Read only (list, download)</option>
                    <option value="write">Read + Write (upload)</option>
                    <option value="admin">Full admin access</option>
                  </select>
                </FormField>
                <FormField label="Expires in days (optional)">
                  <input type="number" value={form.expiresInDays} onChange={(e) => updateField('expiresInDays', e.target.value)} onBlur={() => blurField('expiresInDays')} placeholder="e.g. 30" min="1" max="365" className="input" />
                </FormField>
              </div>
            </FormSection>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs font-mono" style={{ color: colors.textDim }}>
                {Object.keys(formErrors).length > 0 ? `${Object.keys(formErrors).length} error(s) to fix` : 'Ready to save'}
              </p>
              <FormActions>
                <SaveButton loading={saving}>
                  <Plus className="w-3.5 h-3.5" />
                  Create Key
                </SaveButton>
                <CancelButton onClick={() => { setShowForm(false); sounds.click(); }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  Cancel
                </CancelButton>
              </FormActions>
            </div>
          </form>
        </div>
      )}

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" style={{ color: '#22c55e' }} />
                API Key Created
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
                <code className="text-xs font-mono truncate flex-1 mr-2" style={{ color: 'var(--fg)' }}>{newKey.key}</code>
                <button
                  onClick={() => copyKey(newKey.key)}
                  className="btn btn-secondary text-xs flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>This key will only be shown once. Save it securely.</span>
              </div>
              <button
                onClick={() => { setNewKey(null); sounds.click(); }}
                className="btn btn-primary w-full"
              >
                <Check className="w-3.5 h-3.5" />
                I've saved the key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={keys}
        actions={rowActions}
        bulkActions={bulkActions}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search API keys..."
        searchKeys={['name', 'permissions']}
        pageSize={10}
        selectable
        loading={loading}
        emptyIcon={<Key className="w-10 h-10" />}
        emptyTitle="No API keys created"
        emptyDescription="Click 'Create API key' to generate a new key for programmatic access."
      />
    </div>
  );
}