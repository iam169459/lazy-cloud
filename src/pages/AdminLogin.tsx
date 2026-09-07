import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

const MAX = 5, LOCK = 30_000;

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { colors } = useTheme();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    const s = localStorage.getItem('ld_att');
    const t = localStorage.getItem('ld_lock');
    if (t && Date.now() - +t < LOCK) { setTimeout(() => setLocked(false), LOCK - (Date.now() - +t)); return +(s || '0'); }
    return s ? +s : 0;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true); setErr(''); sounds.click();
    const ok = await login(user, pass);
    if (ok) { localStorage.removeItem('ld_att'); localStorage.removeItem('ld_lock'); sounds.success(); nav('/admin'); }
    else {
      const n = attempts + 1; setAttempts(n); localStorage.setItem('ld_att', String(n));
      if (n >= MAX) { localStorage.setItem('ld_lock', String(Date.now())); setLocked(true); setErr(`Locked for ${LOCK / 1000}s.`); setTimeout(() => { setLocked(false); setAttempts(0); localStorage.removeItem('ld_att'); localStorage.removeItem('ld_lock'); }, LOCK); }
      else { sounds.error(); setErr(`Invalid. ${MAX - n} left.`); }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 grid-bg" style={{ color: colors.text }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 animate-fade-up" onClick={() => sounds.click()}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-gradient">LazyDrop</span>
        </Link>
        <div className="card p-6 animate-scale-up">
          <h1 className="text-lg font-bold text-center mb-1">Admin Access</h1>
          <p className="text-xs text-center mb-5" style={{ color: colors.textDim }}>Enter your credentials</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Username</label>
              <div className="input-group">
                <span className="input-icon"><User className="w-4 h-4" /></span>
                <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoFocus className="input" disabled={locked} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Password</label>
              <div className="input-group">
                <span className="input-icon"><Lock className="w-4 h-4" /></span>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" className="input" disabled={locked} />
              </div>
            </div>
            {err && <p className="text-sm text-center animate-shake" style={{ color: '#ef4444' }}>{err}</p>}
            <button type="submit" disabled={loading || locked} className="btn btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : locked ? 'Locked' : 'Sign in'}
            </button>
          </form>
        </div>
        <Link to="/" className="flex items-center justify-center gap-1.5 mt-5 text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
          <ArrowLeft className="w-3 h-3" /> Back to home
        </Link>
      </div>
    </div>
  );
}
