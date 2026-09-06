import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User, Fingerprint } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    sounds.click();
    const ok = await login(username, password);
    if (ok) {
      sounds.success();
      navigate('/admin');
    } else {
      sounds.error();
      setError('Invalid username or password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden grid-bg">
      <div className="scanline-overlay" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full blur-[120px] animate-float-slow" style={{ background: colors.orb1 }} />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full blur-[100px] animate-float" style={{ background: colors.orb2, animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10 animate-fade-in-up" onClick={() => sounds.click()}>
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center animate-glow-pulse" style={{ background: colors.gradient }}>
            <Zap className="w-5 h-5" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gradient-sci">LazyDrop</span>
            <div className="h-px bg-gradient-to-r from-emerald-400/50 to-transparent mt-0.5" />
          </div>
        </Link>

        <div className="card-sci corner-accent rounded-3xl p-8 animate-scale-in">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-hologram" />

          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl border flex items-center justify-center animate-pulse-glow" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20` }}>
              <Fingerprint className="w-8 h-8" style={{ color: colors.primary }} />
              <div className="absolute inset-0 rounded-2xl border animate-ping" style={{ borderColor: `${colors.primary}10`, animationDuration: '3s' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1 text-gradient-sci">Admin Access</h1>
          <p className="text-sm text-center mb-6" style={{ color: colors.textMuted }}>Enter your credentials to manage files</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: colors.textDim }} />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); sounds.type(); }}
                placeholder="Username"
                autoFocus
                className="form-input pl-11"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: colors.textDim }} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); sounds.type(); }}
                placeholder="Password"
                className="form-input pl-11"
              />
            </div>
            {error && (
              <p className="text-sm text-center animate-shake" style={{ color: colors.danger }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60"
              style={{ background: colors.gradient }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-8 text-sm transition-colors animate-fade-in-up delay-300" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
