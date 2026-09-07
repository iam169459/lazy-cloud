import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Palette, Volume2, VolumeX, Trash2, Download, Upload, Shield, RotateCcw } from 'lucide-react';
import { useTheme, ThemeId, themes } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import { FormSection, FormField, FormRow, Toggle, FormActions, SaveButton, CancelButton, DangerButton } from '@/components/Form';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

const DEFAULT_SETTINGS: AppSettings = {
  siteName: 'LazyDrop',
  maxFileSize: '10737418240',
  allowedTypes: '*',
  autoDelete: false,
  autoDeleteDays: '30',
  enableDownloadCounter: true,
  enablePublicUpload: false,
  maxStoragePerBucket: '10188208025',
};

type Errors = Partial<Record<keyof AppSettings, string>>;

function validate(settings: AppSettings): Errors {
  const e: Errors = {};
  if (!settings.siteName.trim()) e.siteName = 'Site name is required';
  const maxFile = Number(settings.maxFileSize);
  if (isNaN(maxFile) || maxFile < 0) e.maxFileSize = 'Must be a non-negative number';
  if (!settings.allowedTypes.trim()) e.allowedTypes = 'At least one type is required';
  if (settings.autoDelete) {
    const days = Number(settings.autoDeleteDays);
    if (isNaN(days) || days < 1) e.autoDeleteDays = 'Must be at least 1 day';
  }
  const maxStorage = Number(settings.maxStoragePerBucket);
  if (isNaN(maxStorage) || maxStorage < 0) e.maxStoragePerBucket = 'Must be a non-negative number';
  return e;
}

export default function AdminAdvanced({ token, onNotify }: Props) {
  const { theme, setTheme, colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        let loaded = await api.getSettings();
        const legacy = localStorage.getItem('lazydrop-settings');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            loaded = { ...loaded, ...parsed };
            await api.updateSettings(loaded, token);
            localStorage.removeItem('lazydrop-settings');
          } catch {}
        }
        setSettings(loaded);
      } catch (e: unknown) {
        onNotify('error', errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, onNotify]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
  }

  function blur(key: keyof AppSettings) {
    setTouched((prev) => new Set(prev).add(key));
    const e = validate(settings);
    setErrors(e);
  }

  function handleSave() {
    const e = validate(settings);
    setErrors(e);
    setTouched(new Set(Object.keys(settings) as (keyof AppSettings)[]));
    if (Object.keys(e).length > 0) {
      sounds.error();
      onNotify('error', 'Fix the errors below before saving');
      return;
    }
    sounds.click();
    setSaving(true);
    sounds.setEnabled(soundEnabled);
    api.updateSettings(settings, token)
      .then(() => { sounds.success(); onNotify('success', 'Settings saved — new limits are enforced on uploads'); })
      .catch((err: unknown) => { sounds.error(); onNotify('error', errMsg(err)); })
      .finally(() => setSaving(false));
  }

  function handleReset() {
    if (!confirm('Reset all settings to defaults?')) return;
    sounds.click();
    setSaving(true);
    api.updateSettings(DEFAULT_SETTINGS, token)
      .then(() => {
        setSettings(DEFAULT_SETTINGS);
        setErrors({});
        setTouched(new Set());
        sounds.success();
        onNotify('success', 'Settings reset to defaults');
      })
      .catch((err: unknown) => { sounds.error(); onNotify('error', errMsg(err)); })
      .finally(() => setSaving(false));
  }

  function handleClearLocal() {
    if (!confirm('Clear local sound preference and theme? Server settings are kept.')) return;
    sounds.delete();
    localStorage.removeItem('lazydrop-sound-enabled');
    localStorage.removeItem('lazydrop-theme');
    setSoundEnabled(true);
    sounds.setEnabled(true);
    onNotify('success', 'Local preferences cleared');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22c55e' }} />
        <p className="text-sm font-mono animate-pulse" style={{ color: colors.textDim }}>LOADING_SETTINGS...</p>
      </div>
    );
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
          <Settings className="w-4 h-4" style={{ color: '#22c55e' }} />
          Advanced Settings
        </h2>
        <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
          Saved to the server and enforced on every upload and download
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Appearance */}
        <FormSection title="Appearance" icon={<Palette className="w-4 h-4" />}>
          <FormRow label="Theme" desc="Choose your visual style">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(themes) as ThemeId[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTheme(t); sounds.click(); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer"
                  style={{
                    background: theme === t ? 'rgba(34,197,94,0.12)' : 'transparent',
                    borderColor: theme === t ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)',
                    color: theme === t ? '#22c55e' : colors.textDim,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </FormRow>
          <FormField
            label="Site name"
            required
            error={touched.has('siteName') ? errors.siteName : undefined}
            hint="Shown on the landing page and browser title"
          >
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => update('siteName', e.target.value)}
              onBlur={() => blur('siteName')}
              className="input w-full"
              aria-invalid={!!errors.siteName}
              placeholder="LazyDrop"
            />
          </FormField>
        </FormSection>

        {/* Sound */}
        <FormSection title="Sound Effects" icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}>
          <FormRow label="Enable sounds" desc="Play sounds on interactions">
            <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Enable sounds" />
          </FormRow>
        </FormSection>

        {/* File Settings */}
        <FormSection title="File Management" icon={<Download className="w-4 h-4" />}>
          <FormField
            label="Max file size"
            required
            error={touched.has('maxFileSize') ? errors.maxFileSize : undefined}
            hint="Maximum upload size in bytes (0 = unlimited)"
          >
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => update('maxFileSize', e.target.value)}
              onBlur={() => blur('maxFileSize')}
              className="input w-32"
              aria-invalid={!!errors.maxFileSize}
              min="0"
            />
          </FormField>
          <FormField
            label="Allowed file types"
            required
            error={touched.has('allowedTypes') ? errors.allowedTypes : undefined}
            hint="Comma-separated MIME types or * for all"
          >
            <input
              type="text"
              value={settings.allowedTypes}
              onChange={(e) => update('allowedTypes', e.target.value)}
              onBlur={() => blur('allowedTypes')}
              className="input w-full"
              aria-invalid={!!errors.allowedTypes}
              placeholder="*"
            />
          </FormField>
          <FormRow label="Download counter" desc="Track download counts">
            <Toggle
              checked={settings.enableDownloadCounter}
              onChange={(v) => update('enableDownloadCounter', v)}
              label="Download counter"
            />
          </FormRow>
        </FormSection>

        {/* Auto Cleanup */}
        <FormSection title="Auto Cleanup" icon={<Trash2 className="w-4 h-4" />}>
          <FormRow label="Auto-delete old files" desc="Remove files after X days">
            <Toggle
              checked={settings.autoDelete}
              onChange={(v) => { update('autoDelete', v); setErrors({}); }}
              label="Auto-delete old files"
            />
          </FormRow>
          {settings.autoDelete && (
            <FormField
              label="Days before deletion"
              required
              error={touched.has('autoDeleteDays') ? errors.autoDeleteDays : undefined}
              hint="Files older than this are deleted (checked hourly)"
            >
              <input
                type="number"
                value={settings.autoDeleteDays}
                onChange={(e) => update('autoDeleteDays', e.target.value)}
                onBlur={() => blur('autoDeleteDays')}
                className="input w-20"
                aria-invalid={!!errors.autoDeleteDays}
                min="1"
              />
            </FormField>
          )}
        </FormSection>

        {/* Storage Limits */}
        <FormSection title="Storage Limits" icon={<Upload className="w-4 h-4" />}>
          <FormField
            label="Max bytes per bucket"
            required
            error={touched.has('maxStoragePerBucket') ? errors.maxStoragePerBucket : undefined}
            hint="Default limit used for new buckets"
          >
            <input
              type="number"
              value={settings.maxStoragePerBucket}
              onChange={(e) => update('maxStoragePerBucket', e.target.value)}
              onBlur={() => blur('maxStoragePerBucket')}
              className="input w-32"
              aria-invalid={!!errors.maxStoragePerBucket}
              min="0"
            />
          </FormField>
        </FormSection>

        {/* Security */}
        <FormSection title="Security" icon={<Shield className="w-4 h-4" />}>
          <FormRow label="Public upload" desc="Allow anyone to upload from the landing page">
            <Toggle
              checked={settings.enablePublicUpload}
              onChange={(v) => update('enablePublicUpload', v)}
              label="Public upload"
            />
          </FormRow>
        </FormSection>
      </div>

      {/* CTA Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up delay-300">
        <p className="text-xs font-mono" style={{ color: colors.textDim }}>
          {hasChanges ? 'Unsaved changes detected' : 'All changes saved'}
        </p>
        <FormActions>
          <SaveButton loading={saving}>
            <Save className="w-3.5 h-3.5" />
            Save Settings
          </SaveButton>
          <CancelButton onClick={() => { setSettings(DEFAULT_SETTINGS); setErrors({}); setTouched(new Set()); }}>
            <RotateCcw className="w-3.5 h-3.5" />
            Discard
          </CancelButton>
          <DangerButton onClick={handleClearLocal}>
            <Trash2 className="w-3.5 h-3.5" />
            Clear Local Data
          </DangerButton>
        </FormActions>
      </div>
    </div>
  );
}
