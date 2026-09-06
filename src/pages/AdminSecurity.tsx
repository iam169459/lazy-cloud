import { useState, useEffect } from 'react';
import { Shield, Loader2, Save, User, KeyRound, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
  onCredentialsChanged: (newPassword: string, newUsername: string) => void;
}

export default function AdminSecurity({ token, onNotify, onCredentialsChanged }: Props) {
  const { username: currentUsername } = useAuth();
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCredentials(token)
      .then((data) => {
        setFormUsername(data.username);
      })
      .catch((e) => onNotify('error', e.message))
      .finally(() => setLoading(false));
  }, [token, onNotify]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword.trim()) {
      onNotify('error', 'Username and password are required');
      return;
    }
    setSaving(true);
    try {
      await api.updateCredentials(formUsername.trim(), formPassword, token);
      onNotify('success', 'Credentials updated. Please log in again with your new credentials.');
      onCredentialsChanged(formPassword, formUsername.trim());
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          Security / Credentials
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Update your admin username and password. Changes are stored in the database and persist across restarts.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg rounded-2xl bg-white/[0.03] border border-white/10 p-6 space-y-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Current username</label>
          <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-gray-500">
            {currentUsername || 'admin'}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            New username <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            New password <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">You will be logged out after saving. Sign in with your new credentials.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 text-[#0a0a0f] font-semibold text-sm hover:bg-emerald-300 transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save credentials
        </button>
      </form>

      <div className="max-w-lg rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
        <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          If no custom credentials have been set, the system falls back to the default credentials from the server configuration (username: <span className="font-mono">admin</span>).
        </p>
      </div>
    </div>
  );
}
