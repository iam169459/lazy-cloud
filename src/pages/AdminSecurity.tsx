import { useState, useEffect } from 'react';
import { Shield, Loader2, Save, User, KeyRound, Check, Lock, Fingerprint } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-gray-500 font-mono animate-pulse-glow">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-gradient-sci">Security / Credentials</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-mono">
          Update your admin username and password
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg card-sci corner-accent rounded-2xl p-6 space-y-5 animate-fade-in-up delay-100">
        {/* Holographic line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-hologram" />

        <div>
          <label className="block text-[10px] text-gray-500 mb-1.5 font-mono uppercase tracking-wider">Current username</label>
          <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-gray-500 font-mono flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-emerald-400/50" />
            {currentUsername || 'admin'}
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 mb-1.5 font-mono uppercase tracking-wider">
            New username <span className="text-emerald-400">*</span>
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400/40 focus:bg-emerald-400/5 focus:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 mb-1.5 font-mono uppercase tracking-wider">
            New password <span className="text-emerald-400">*</span>
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400/40 focus:bg-emerald-400/5 focus:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-300"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5 font-mono">You will be logged out after saving</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save credentials
        </button>
      </form>

      <div className="max-w-lg rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 flex items-start gap-3 animate-fade-in-up delay-200">
        <Lock className="w-4 h-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300/60 leading-relaxed font-mono">
          If no custom credentials have been set, the system falls back to default credentials (username: <span className="text-amber-300">admin</span>).
        </p>
      </div>
    </div>
  );
}
