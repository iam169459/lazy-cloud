import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('lazydrop_login_attempts');
    const ts = localStorage.getItem('lazydrop_login_lockout');
    if (ts && Date.now() - parseInt(ts) < LOCKOUT_MS) {
      setTimeout(() => setLocked(false), LOCKOUT_MS - (Date.now() - parseInt(ts)));
      return parseInt(saved || '0');
    }
    return saved ? parseInt(saved) : 0;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError('');
    sounds.click();

    const ok = await login(username, password);
    if (ok) {
      localStorage.removeItem('lazydrop_login_attempts');
      localStorage.removeItem('lazydrop_login_lockout');
      sounds.success();
      navigate('/admin');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      localStorage.setItem('lazydrop_login_attempts', String(next));
      if (next >= MAX_ATTEMPTS) {
        localStorage.setItem('lazydrop_login_lockout', String(Date.now()));
        setLocked(true);
        setError(`Too many attempts. Locked for ${LOCKOUT_MS / 1000}s.`);
        setTimeout(() => { setLocked(false); setAttempts(0); localStorage.removeItem('lazydrop_login_attempts'); localStorage.removeItem('lazydrop_login_lockout'); }, LOCKOUT_MS);
      } else {
        sounds.error();
        setError(`Invalid credentials. ${MAX_ATTEMPTS - next} attempts left.`);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 grid-bg" style={{ color: colors.text }}>
      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up" onClick={() => sounds.click()}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center animate-glow-pulse" style={{ background: colors.gradient }}>
            <Zap className="w-4 h-4" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-gradient-sci">LazyDrop</span>
        </Link>

        <div className="card-sci rounded-2xl p-6 animate-scale-in">
          <h1 className="text-lg font-bold text-center mb-1" style={{ color: colors.text }}>Admin Access</h1>
          <p className="text-xs text-center mb-5" style={{ color: colors.textDim }}>Enter your credentials</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] mb-1 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Username</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><User className="w-4 h-4" style={{ color: colors.textDim }} /></span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus autoComplete="username" className="form-input" disabled={locked} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] mb-1 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><Lock className="w-4 h-4" style={{ color: colors.textDim }} /></span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className="form-input" disabled={locked} />
              </div>
            </div>
            {error && <p className="text-sm text-center animate-shake" style={{ color: colors.danger }}>{error}</p>}
            <button type="submit" disabled={loading || locked} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : locked ? 'Locked' : 'Sign in'}
            </button>
          </form>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-5 text-xs animate-fade-in-up delay-200" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
