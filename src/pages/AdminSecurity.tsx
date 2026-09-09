import { useState, useEffect } from 'react';
import { Shield, Loader2, Save, User, KeyRound, Lock, Fingerprint, X, Smartphone, Check, AlertCircle, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { FormSection, FormField, FormActions, SaveButton, CancelButton } from '@/components/Form';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
  onCredentialsChanged: (newPassword: string, newUsername: string) => void;
}

export default function AdminSecurity({ token, onNotify, onCredentialsChanged }: Props) {
  const { username: currentUsername } = useAuth();
  const { colors } = useTheme();
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpStep, setTotpStep] = useState<'idle' | 'setup' | 'verify-disable'>('idle');
  const [totpQr, setTotpQr] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpCopied, setTotpCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getCredentials(token),
      fetch('/api/admin/2fa/status', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([creds, twoFa]) => { setFormUsername(creds.username); setTotpEnabled(twoFa.enabled); })
      .catch((e) => onNotify('error', e.message))
      .finally(() => setLoading(false));
  }, [token, onNotify]);

  function validate(): { username?: string; password?: string } {
    const e: { username?: string; password?: string } = {};
    if (!formUsername.trim()) e.username = 'Username is required';
    else if (formUsername.trim().length < 2) e.username = 'Username must be at least 2 characters';
    if (!formPassword) e.password = 'Password is required';
    else if (formPassword.length < 4) e.password = 'Password must be at least 4 characters';
    return e;
  }

  function blur(field: string) {
    setTouched((prev) => new Set(prev).add(field));
    setErrors(validate());
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setTouched(new Set(['username', 'password']));
    if (v.username || v.password) {
      sounds.error();
      onNotify('error', 'Fix the errors below before saving');
      return;
    }
    sounds.click();
    setSaving(true);
    try {
      await api.updateCredentials(formUsername.trim(), formPassword, token);
      sounds.success();
      onNotify('success', 'Credentials updated. Please log in again with your new credentials.');
      onCredentialsChanged(formPassword, formUsername.trim());
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFormPassword('');
    setErrors({});
    setTouched(new Set());
  }

  // ── 2FA Functions ──
  async function handleSetup2fa() {
    setTotpLoading(true); sounds.click();
    try {
      const res = await fetch('/api/admin/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpQr(data.qr);
      setTotpSecret(data.secret);
      setTotpStep('setup');
      setTotpCode('');
    } catch (e: any) {
      sounds.error(); onNotify('error', e.message);
    } finally { setTotpLoading(false); }
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
    } catch (e: any) {
      sounds.error(); onNotify('error', e.message);
    } finally { setTotpLoading(false); }
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
    } catch (e: any) {
      sounds.error(); onNotify('error', e.message);
    } finally { setTotpLoading(false); }
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

  const hasChanges = formPassword.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
          <Shield className="w-4 h-4" style={{ color: colors.success }} />
          Security / Credentials
        </h2>
        <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
          Update your admin username and password
        </p>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSave} noValidate>
        <FormSection title="Admin Credentials" icon={<Shield className="w-4 h-4" />}>
          {/* Current Username (read-only) */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: colors.textDim }}>
              Current username
            </label>
            <div className="px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2" style={{ background: colors.cardBg, borderColor: colors.border, color: colors.textDim }}>
              <Fingerprint className="w-4 h-4 flex-shrink-0" style={{ color: `${colors.success}80` }} />
              <span className="truncate">{currentUsername || 'admin'}</span>
            </div>
          </div>

          {/* New Username */}
          <FormField
            label="New username"
            required
            error={touched.has('username') ? errors.username : undefined}
            hint="The admin username used to log in"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}>
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => { setFormUsername(e.target.value); setTouched((prev) => new Set(prev).add('username')); }}
                onBlur={() => blur('username')}
                placeholder="admin"
                className="input pl-10"
                aria-invalid={!!errors.username}
                autoComplete="username"
              />
            </div>
          </FormField>

          {/* New Password */}
          <FormField
            label="New password"
            required
            error={touched.has('password') ? errors.password : undefined}
            hint="You will be logged out after saving"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}>
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => { setFormPassword(e.target.value); setTouched((prev) => new Set(prev).add('password')); }}
                onBlur={() => blur('password')}
                placeholder="Enter new password"
                className="input pl-10"
                aria-invalid={!!errors.password}
                autoComplete="new-password"
              />
            </div>
          </FormField>
        </FormSection>

        {/* CTA Bar */}
        <div className="glass-card p-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up delay-100">
          <p className="text-xs font-mono" style={{ color: colors.textDim }}>
            {hasChanges ? 'Credentials will be updated on save' : 'No changes'}
          </p>
          <FormActions>
            <SaveButton loading={saving}>
              <Save className="w-3.5 h-3.5" />
              Save Credentials
            </SaveButton>
            <CancelButton onClick={handleCancel}>
              <X className="w-3.5 h-3.5" />
              Discard
            </CancelButton>
          </FormActions>
        </div>
      </form>

      {/* Warning */}
      <div className="max-w-lg glass-card p-3 sm:p-4 flex items-start gap-3 animate-fade-up delay-200" style={{ border: `1px solid ${colors.warning}26` }}>
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.warning }} />
        <p className="text-[11px] sm:text-xs leading-relaxed font-mono" style={{ color: `${colors.warning}b3` }}>
          If no custom credentials have been set, the system falls back to default credentials (username: <span style={{ color: colors.warning }}>admin</span>).
        </p>
      </div>

      {/* 2FA Section */}
      <div className="glass-card p-5 animate-fade-up delay-300">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4" style={{ color: colors.primary }} />
          <h3 className="text-sm font-semibold">Two-Factor Authentication (TOTP)</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
            background: totpEnabled ? `${colors.success}1a` : `${colors.warning}1a`,
            color: totpEnabled ? colors.success : colors.warning,
          }}>
            {totpEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <p className="text-xs mb-4" style={{ color: colors.textDim }}>
          Add an extra layer of security. Use Google Authenticator, Authy, or any TOTP app.
        </p>

        {totpStep === 'idle' && (
          <div className="flex flex-col gap-3">
            {!totpEnabled ? (
              <button
                onClick={handleSetup2fa}
                disabled={totpLoading}
                className="btn btn-primary text-xs w-fit"
              >
                {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                Enable 2FA
              </button>
            ) : (
              <button
                onClick={() => { setTotpStep('verify-disable'); setTotpCode(''); }}
                className="btn text-xs w-fit"
                style={{ background: `${colors.danger}1a`, color: colors.danger, border: `1px solid ${colors.danger}33` }}
              >
                Disable 2FA
              </button>
            )}
          </div>
        )}

        {/* Setup: Show QR + ask for code */}
        {totpStep === 'setup' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {totpQr && (
                <div className="flex-shrink-0">
                  <img src={totpQr} alt="QR Code" className="w-48 h-48 rounded-xl" style={{ border: `1px solid ${colors.border}` }} />
                </div>
              )}
              <div className="space-y-3 flex-1">
                <p className="text-xs" style={{ color: colors.textDim }}>1. Scan this QR code with your authenticator app</p>
                <p className="text-xs" style={{ color: colors.textDim }}>2. Or enter this secret manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono break-all" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>
                    {totpSecret}
                  </code>
                  <button onClick={copySecret} className="p-2 rounded-lg" style={{ color: colors.textDim }} title="Copy secret">
                    {totpCopied ? <Check className="w-4 h-4" style={{ color: colors.success }} /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs" style={{ color: colors.textDim }}>3. Enter the 6-digit code from your app:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="input font-mono text-center tracking-[0.3em] w-32"
                    autoFocus
                  />
                  <button onClick={handleVerify2fa} disabled={totpLoading || totpCode.length !== 6} className="btn btn-primary text-xs">
                    {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Verify
                  </button>
                  <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} className="btn text-xs" style={{ color: colors.textDim }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disable: Ask for code to confirm */}
        {totpStep === 'verify-disable' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${colors.danger}0d`, border: `1px solid ${colors.danger}26` }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.danger }} />
              <p className="text-xs" style={{ color: colors.danger }}>Enter your current authenticator code to confirm disabling 2FA.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="input font-mono text-center tracking-[0.3em] w-32"
                autoFocus
              />
              <button onClick={handleDisable2fa} disabled={totpLoading || totpCode.length !== 6} className="btn text-xs" style={{ background: `${colors.danger}1a`, color: colors.danger, border: `1px solid ${colors.danger}33` }}>
                {totpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Disable'}
              </button>
              <button onClick={() => { setTotpStep('idle'); setTotpCode(''); }} className="btn text-xs" style={{ color: colors.textDim }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
