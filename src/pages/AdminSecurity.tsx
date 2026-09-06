import { useState, useEffect } from 'react';
import { Shield, Loader2, Save, User, KeyRound, Lock, Fingerprint } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

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

  useEffect(() => {
    api.getCredentials(token)
      .then((data) => setFormUsername(data.username))
      .catch((e) => onNotify('error', e.message))
      .finally(() => setLoading(false));
  }, [token, onNotify]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword.trim()) {
      sounds.error();
      onNotify('error', 'Username and password are required');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
        <p className="text-sm font-mono animate-pulse-glow" style={{ color: colors.textMuted }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: colors.primary }} />
          <span className="text-gradient-sci">Security / Credentials</span>
        </h2>
        <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Update your admin username and password</p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg card-sci corner-accent rounded-2xl p-5 sm:p-6 space-y-4 sm:space-y-5 animate-fade-in-up delay-100">
        <div>
          <label className="block text-[11px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Current username</label>
          <div className="px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2" style={{ background: `${colors.text}02`, borderColor: `${colors.text}05`, color: colors.textDim }}>
            <Fingerprint className="w-4 h-4 flex-shrink-0" style={{ color: `${colors.primary}80` }} />
            <span className="truncate">{currentUsername || 'admin'}</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>
            New username <span style={{ color: colors.primary }}>*</span>
          </label>
          <div className="input-icon-wrap">
            <span className="input-icon"><User className="w-4 h-4" style={{ color: colors.textDim }} /></span>
            <input type="text" value={formUsername} onChange={(e) => { setFormUsername(e.target.value); sounds.type(); }} placeholder="admin" required className="form-input" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>
            New password <span style={{ color: colors.primary }}>*</span>
          </label>
          <div className="input-icon-wrap">
            <span className="input-icon"><KeyRound className="w-4 h-4" style={{ color: colors.textDim }} /></span>
            <input type="password" value={formPassword} onChange={(e) => { setFormPassword(e.target.value); sounds.type(); }} placeholder="Enter new password" required className="form-input" />
          </div>
          <p className="text-[11px] mt-1.5 font-mono" style={{ color: colors.textDim }}>You will be logged out after saving</p>
        </div>

        <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save credentials
        </button>
      </form>

      <div className="max-w-lg rounded-2xl p-3 sm:p-4 flex items-start gap-3 animate-fade-in-up delay-200" style={{ background: `${colors.warning}08`, border: `1px solid ${colors.warning}15` }}>
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: `${colors.warning}90` }} />
        <p className="text-[11px] sm:text-xs leading-relaxed font-mono" style={{ color: `${colors.warning}80` }}>
          If no custom credentials have been set, the system falls back to default credentials (username: <span style={{ color: colors.warning }}>admin</span>).
        </p>
      </div>
    </div>
  );
}
