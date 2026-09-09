import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User, Check } from 'lucide-react';
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
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [setupPass2, setSetupPass2] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    const s = localStorage.getItem('ld_att');
    const t = localStorage.getItem('ld_lock');
    if (t && Date.now() - +t < LOCK) { setTimeout(() => setLocked(false), LOCK - (Date.now() - +t)); return +(s || '0'); }
    return s ? +s : 0;
  });

  useEffect(() => {
    fetch('/api/admin/needs-setup')
      .then(r => r.json())
      .then(d => { setNeedsSetup(d.needsSetup); if (d.needsSetup) setSetupMode(true); })
      .catch(() => setNeedsSetup(false));
  }, []);

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

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (user.length < 3) { setErr('Username must be at least 3 characters'); return; }
    if (pass.length < 6) { setErr('Password must be at least 6 characters'); return; }
    if (pass !== setupPass2) { setErr('Passwords do not match'); return; }
    setSetupLoading(true); sounds.click();
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (res.ok) {
        sounds.success();
        setSetupSuccess(true);
        setTimeout(() => { setSetupMode(false); setNeedsSetup(false); }, 1500);
      } else {
        sounds.error();
        setErr(data.error || 'Setup failed');
      }
    } catch {
      sounds.error();
      setErr('Network error');
    }
    setSetupLoading(false);
  }

  // Loading state
  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: colors.text }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  // Setup form
  if (setupMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 grid-bg" style={{ color: colors.text }}>
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8 animate-fade-up" onClick={() => sounds.click()}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-gradient">LazyDrop</span>
          </Link>
          <div className="card p-6 animate-scale-up">
            {setupSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                  <Check className="w-6 h-6" />
                </div>
                <h1 className="text-lg font-bold mb-1">Setup Complete</h1>
                <p className="text-xs" style={{ color: colors.textDim }}>Redirecting to login...</p>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-bold text-center mb-1">First Run Setup</h1>
                <p className="text-xs text-center mb-5" style={{ color: colors.textDim }}>Create your admin account</p>
                <form onSubmit={handleSetup} className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><User className="w-4 h-4" /></span>
                      <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoFocus className="input pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><Lock className="w-4 h-4" /></span>
                      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="At least 6 characters" className="input pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><Lock className="w-4 h-4" /></span>
                      <input type="password" value={setupPass2} onChange={(e) => setSetupPass2(e.target.value)} placeholder="Confirm password" className="input pl-10" />
                    </div>
                  </div>
                  {err && <p className="text-sm text-center animate-shake" style={{ color: colors.danger }}>{err}</p>}
                  <button type="submit" disabled={setupLoading} className="btn btn-primary w-full">
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </button>
                </form>
              </>
            )}
          </div>
          <Link to="/" className="flex items-center justify-center gap-1.5 mt-5 text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
            <ArrowLeft className="w-3 h-3" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 grid-bg" style={{ color: colors.text }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 animate-fade-up" onClick={() => sounds.click()}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><User className="w-4 h-4" /></span>
                <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoFocus className="input pl-10" disabled={locked} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: colors.textDim }}>Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}><Lock className="w-4 h-4" /></span>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" className="input pl-10" disabled={locked} />
              </div>
            </div>
            {err && <p className="text-sm text-center animate-shake" style={{ color: colors.danger }}>{err}</p>}
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
