import { useState, useEffect } from 'react';
import { Shield, Loader2, Save, User, KeyRound, Lock, Fingerprint, X } from 'lucide-react';
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

  useEffect(() => {
    api.getCredentials(token)
      .then((data) => setFormUsername(data.username))
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22c55e' }} />
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
          <Shield className="w-4 h-4" style={{ color: '#22c55e' }} />
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
            <div className="px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', color: colors.textDim }}>
              <Fingerprint className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(34,197,94,0.5)' }} />
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
      <div className="max-w-lg glass-card p-3 sm:p-4 flex items-start gap-3 animate-fade-up delay-200" style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
        <p className="text-[11px] sm:text-xs leading-relaxed font-mono" style={{ color: 'rgba(245,158,11,0.7)' }}>
          If no custom credentials have been set, the system falls back to default credentials (username: <span style={{ color: '#f59e0b' }}>admin</span>).
        </p>
      </div>
    </div>
  );
}
