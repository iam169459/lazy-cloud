import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Palette, Volume2, VolumeX, Trash2, Download, Upload, Shield, RotateCcw, User, KeyRound, Lock, Fingerprint, Smartphone, Check, AlertCircle, Copy, X } from 'lucide-react';
import { useTheme, ThemeId, themes } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
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
  const { username: currentUsername } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Credentials state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credErrors, setCredErrors] = useState<{ username?: string; password?: string }>({});
  const [credTouched, setCredTouched] = useState<Set<string>>(new Set());

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpStep, setTotpStep] = useState<'idle' | 'setup' | 'verify-disable'>('idle');
  const [totpQr, setTotpQr] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpCopied, setTotpCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [loaded, twoFa, creds] = await Promise.all([
          api.getSettings(),
          fetch('/api/admin/2fa/status', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          api.getCredentials(token),
        ]);
        const legacy = localStorage.getItem('lazydrop-settings');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            const merged = { ...loaded, ...parsed };
            await api.updateSettings(merged, token);
            localStorage.removeItem('lazydrop-settings');
            setSettings(merged);
          } catch { setSettings(loaded); }
        } else { setSettings(loaded); }
        setTotpEnabled(twoFa.enabled);
        setFormUsername(creds.username);
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
    setErrors(validate(settings));
  }

  function handleSave() {
    const e = validate(settings);
    setErrors(e);
    setTouched(new Set(Object.keys(settings) as (keyof AppSettings)[]));
    if (Object.keys(e).length > 0) { sounds.error(); onNotify('error', 'Fix errors before saving'); return; }
    sounds.click(); setSaving(true); sounds.setEnabled(soundEnabled);
    api.updateSettings(settings, token)
      .then(() => { sounds.success(); onNotify('success', 'Settings saved'); })
      .catch((err: unknown) => { sounds.error(); onNotify('error', errMsg(err)); })
      .finally(() => setSaving(false));
  }

  function handleReset() {
    if (!confirm('Reset all settings to defaults?')) return;
    sounds.click(); setSaving(true);
    api.updateSettings(DEFAULT_SETTINGS, token)
      .then(() => { setSettings(DEFAULT_SETTINGS); setErrors({}); setTouched(new Set()); sounds.success(); onNotify('success', 'Settings reset'); })
      .catch((err: unknown) => { sounds.error(); onNotify('error', errMsg(err)); })
      .finally(() => setSaving(false));
  }

  function handleClearLocal() {
    if (!confirm('Clear local preferences?')) return;
    sounds.delete();
    localStorage.removeItem('lazydrop-sound-enabled');
    localStorage.removeItem('lazydrop-theme');
    setSoundEnabled(true); sounds.setEnabled(true);
    onNotify('success', 'Local preferences cleared');
  }

  // ── Credentials Functions ──
  function validateCred(): { username?: string; password?: string } {
    const e: { username?: string; password?: string } = {};
    if (!formUsername.trim()) e.username = 'Username required';
    else if (formUsername.trim().length < 2) e.username = 'At least 2 characters';
    if (!formPassword) e.password = 'Password required';
    else if (formPassword.length < 4) e.password = 'At least 4 characters';
    return e;
  }

  async function handleSaveCreds(e: React.FormEvent) {
    e.preventDefault();
    const v = validateCred(); setCredErrors(v); setCredTouched(new Set(['username', 'password']));
    if (v.username || v.password) { sounds.error(); onNotify('error', 'Fix errors'); return; }
    sounds.click(); setCredSaving(true);
    try {
      await api.updateCredentials(formUsername.trim(), formPassword, token);
      sounds.success(); onNotify('success', 'Credentials updated. Please log in again.');
      setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
    } catch (e: any) { sounds.error(); onNotify('error', e.message); }
    finally { setCredSaving(false); }
  }

  // ── 2FA Functions ──
  async function handleSetup2fa() {
    setTotpLoading(true); sounds.click();
    try {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpQr(data.qr); setTotpSecret(data.secret); setTotpStep('setup'); setTotpCode('');
    } catch (e: any) { sounds.error(); onNotify('error', e.message); }
    finally { setTotpLoading(false); }
  }

  async function handleVerify2fa() {
    if (totpCode.length !== 6) { onNotify('error', 'Enter 6-digit code'); return; }
    setTotpLoading(true); sounds.click();
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpEnabled(true); setTotpStep('idle'); setTotpCode('');
      sounds.success(); onNotify('success', '2FA enabled!');
    } catch (e: any) { sounds.error(); onNotify('error', e.message); }
    finally { setTotpLoading(false); }
  }

  async function handleDisable2fa() {
    if (totpCode.length !== 6) { onNotify('error', 'Enter 6-digit code'); return; }
    setTotpLoading(true); sounds.click();
    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpEnabled(false); setTotpStep('idle'); setTotpCode('');
      sounds.success(); onNotify('success', '2FA disabled');
    } catch (e: any) { sounds.error(); onNotify('error', e.message); }
    finally { setTotpLoading(false); }
  }

  function copySecret() {
    navigator.clipboard.writeText(totpSecret);
    setTotpCopied(true); sounds.copy();
    setTimeout(() => setTotpCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.success }} />
        <p className="text-sm font-mono animate-pulse" style={{ color: colors.textDim }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
          <Settings className="w-4 h-4" style={{ color: colors.success }} />
          Settings
        </h2>
        <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
          Configuration, credentials, and security
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
                    background: theme === t ? `${colors.primary}1f` : 'transparent',
                    borderColor: theme === t ? `${colors.primary}66` : colors.border,
                    color: theme === t ? colors.primary : colors.textDim,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </FormRow>
          <FormField label="Site name" required error={touched.has('siteName') ? errors.siteName : undefined} hint="Shown on the landing page">
            <input type="text" value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} onBlur={() => blur('siteName')} className="input w-full" placeholder="LazyDrop" />
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
          <FormField label="Max file size" required error={touched.has('maxFileSize') ? errors.maxFileSize : undefined} hint="Max upload size in bytes">
            <input type="number" value={settings.maxFileSize} onChange={(e) => update('maxFileSize', e.target.value)} onBlur={() => blur('maxFileSize')} className="input w-32" min="0" />
          </FormField>
          <FormField label="Allowed file types" required error={touched.has('allowedTypes') ? errors.allowedTypes : undefined} hint="MIME types or * for all">
            <input type="text" value={settings.allowedTypes} onChange={(e) => update('allowedTypes', e.target.value)} onBlur={() => blur('allowedTypes')} className="input w-full" placeholder="*" />
          </FormField>
          <FormRow label="Download counter" desc="Track download counts">
            <Toggle checked={settings.enableDownloadCounter} onChange={(v) => update('enableDownloadCounter', v)} label="Download counter" />
          </FormRow>
        </FormSection>

        {/* Auto Cleanup */}
        <FormSection title="Auto Cleanup" icon={<Trash2 className="w-4 h-4" />}>
          <FormRow label="Auto-delete old files" desc="Remove files after X days">
            <Toggle checked={settings.autoDelete} onChange={(v) => { update('autoDelete', v); setErrors({}); }} label="Auto-delete" />
          </FormRow>
          {settings.autoDelete && (
            <FormField label="Days before deletion" required error={touched.has('autoDeleteDays') ? errors.autoDeleteDays : undefined}>
              <input type="number" value={settings.autoDeleteDays} onChange={(e) => update('autoDeleteDays', e.target.value)} onBlur={() => blur('autoDeleteDays')} className="input w-20" min="1" />
            </FormField>
          )}
        </FormSection>

        {/* Storage Limits */}
        <FormSection title="Storage Limits" icon={<Upload className="w-4 h-4" />}>
          <FormField label="Max bytes per bucket" required error={touched.has('maxStoragePerBucket') ? errors.maxStoragePerBucket : undefined} hint="Default for new buckets">
            <input type="number" value={settings.maxStoragePerBucket} onChange={(e) => update('maxStoragePerBucket', e.target.value)} onBlur={() => blur('maxStoragePerBucket')} className="input w-32" min="0" />
          </FormField>
        </FormSection>

        {/* Security */}
        <FormSection title="Public Access" icon={<Shield className="w-4 h-4" />}>
          <FormRow label="Public upload" desc="Allow anyone to upload from landing page">
            <Toggle checked={settings.enablePublicUpload} onChange={(v) => update('enablePublicUpload', v)} label="Public upload" />
          </FormRow>
        </FormSection>
      </div>

      {/* Settings CTA */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up delay-100">
        <p className="text-xs font-mono" style={{ color: colors.textDim }}>
          {JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS) ? 'Unsaved changes' : 'All saved'}
        </p>
        <FormActions>
          <SaveButton loading={saving} onClick={handleSave}>
            <Save className="w-3.5 h-3.5" />
            Save Settings
          </SaveButton>
          <CancelButton onClick={() => { setSettings(DEFAULT_SETTINGS); setErrors({}); setTouched(new Set()); }}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </CancelButton>
        </FormActions>
      </div>

      {/* ─── CREDENTIALS SECTION ─── */}
      <div className="grid md:grid-cols-2 gap-6">
        <FormSection title="Admin Credentials" icon={<KeyRound className="w-4 h-4" />}>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: colors.textDim }}>Current username</label>
            <div className="px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2" style={{ background: colors.cardBg, borderColor: colors.border, color: colors.textDim }}>
              <Fingerprint className="w-4 h-4 flex-shrink-0" style={{ color: `${colors.primary}80` }} />
              <span className="truncate">{currentUsername || 'admin'}</span>
            </div>
          </div>
          <FormField label="New username" required error={credTouched.has('username') ? credErrors.username : undefined}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><User className="w-4 h-4" /></span>
              <input type="text" value={formUsername} onChange={(e) => { setFormUsername(e.target.value); setCredTouched((p) => new Set(p).add('username')); }} onBlur={() => { setCredTouched((p) => new Set(p).add('username')); setCredErrors(validateCred()); }} className="input pl-10" autoComplete="username" />
            </div>
          </FormField>
          <FormField label="New password" required error={credTouched.has('password') ? credErrors.password : undefined} hint="You will be logged out after saving">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><Lock className="w-4 h-4" /></span>
              <input type="password" value={formPassword} onChange={(e) => { setFormPassword(e.target.value); setCredTouched((p) => new Set(p).add('password')); }} onBlur={() => { setCredTouched((p) => new Set(p).add('password')); setCredErrors(validateCred()); }} className="input pl-10" autoComplete="new-password" placeholder="Enter new password" />
            </div>
          </FormField>
          <FormActions>
            <SaveButton loading={credSaving} onClick={handleSaveCreds}>
              <Save className="w-3.5 h-3.5" />
              Save Credentials
            </SaveButton>
          </FormActions>
        </FormSection>

        {/* ─── 2FA SECTION ─── */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4" style={{ color: colors.primary }} />
            <h3 className="text-sm font-semibold">Two-Factor Auth (TOTP)</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
              background: totpEnabled ? `${colors.success}1a` : `${colors.warning}1a`,
              color: totpEnabled ? colors.success : colors.warning,
            }}>
              {totpEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>Extra security with Google Authenticator, Authy, etc.</p>

          {totpStep === 'idle' && (
            <div className="flex flex-col gap-3">
              {!totpEnabled ? (
                <button onClick={handleSetup2fa} disabled={totpLoading} className="btn btn-primary text-xs w-fit">
                  {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                  Enable 2FA
                </button>
              ) : (
                <button onClick={() => { setTotpStep('verify-disable'); setTotpCode(''); }} className="btn text-xs w-fit" style={{ background: `${colors.danger}1a`, color: colors.danger, border: `1px solid ${colors.danger}33` }}>
                  Disable 2FA
                </button>
              )}
            </div>
          )}

          {totpStep === 'setup' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {totpQr && <img src={totpQr} alt="QR" className="w-40 h-40 rounded-xl" style={{ border: `1px solid ${colors.border}` }} />}
                <div className="space-y-3 flex-1">
                  <p className="text-xs" style={{ color: colors.textDim }}>1. Scan QR with your authenticator app</p>
                  <p className="text-xs" style={{ color: colors.textDim }}>2. Or enter secret manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono break-all" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>{totpSecret}</code>
                    <button onClick={copySecret} className="p-2 rounded-lg" style={{ color: colors.textDim }}>
                      {totpCopied ? <Check className="w-4 h-4" style={{ color: colors.success }} /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: colors.textDim }}>3. Enter 6-digit code:</p>
                  <div className="flex gap-2">
                    <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} className="input font-mono text-center tracking-[0.3em] w-28" autoFocus />
                    <button onClick={handleVerify2fa} disabled={totpLoading || totpCode.length !== 6} className="btn btn-primary text-xs">
                      {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                    </button>
                    <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} className="btn text-xs" style={{ color: colors.textDim }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {totpStep === 'verify-disable' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${colors.danger}0d`, border: `1px solid ${colors.danger}26` }}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
                <p className="text-xs" style={{ color: colors.danger }}>Enter your code to confirm disabling 2FA.</p>
              </div>
              <div className="flex gap-2">
                <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} className="input font-mono text-center tracking-[0.3em] w-28" autoFocus />
                <button onClick={handleDisable2fa} disabled={totpLoading || totpCode.length !== 6} className="btn text-xs" style={{ background: `${colors.danger}1a`, color: colors.danger, border: `1px solid ${colors.danger}33` }}>
                  {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Disable'}
                </button>
                <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} className="btn text-xs" style={{ color: colors.textDim }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Local Data */}
      <div className="flex justify-end">
        <DangerButton onClick={handleClearLocal}>
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Data
        </DangerButton>
      </div>
    </div>
  );
}
