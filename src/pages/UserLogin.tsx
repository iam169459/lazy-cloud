import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/userAuth';
import { sounds } from '@/lib/sounds';

export default function UserLogin() {
  const { colors } = useTheme();
  const { login, register } = useUserAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = mode === 'login'
      ? await login(username, password)
      : await register(username, email, password);
    setLoading(false);
    if (result.success) {
      sounds.success();
      window.location.href = '/dashboard';
    } else {
      sounds.error();
      setError(result.error || 'Failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-md animate-fade-up">
        <div className="glass-card p-8" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: colors.gradient }}>
              <User className="w-7 h-7" style={{ color: colors.bg }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textDim }}>
              {mode === 'login' ? 'Sign in to your account' : 'Join LazyDrop to start sharing'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDim }}>Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textDim }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full pl-10"
                  style={{ background: colors.input, borderColor: colors.border, color: colors.text }}
                  placeholder="your_username"
                  required
                  minLength={3}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDim }}>Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textDim }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full pl-10"
                    style={{ background: colors.input, borderColor: colors.border, color: colors.text }}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDim }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textDim }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pl-10 pr-10"
                  style={{ background: colors.input, borderColor: colors.border, color: colors.text }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: `${colors.danger}15`, color: colors.danger, border: `1px solid ${colors.danger}30` }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              style={{ background: colors.gradient, color: colors.bg }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-xs font-medium"
              style={{ color: colors.primary }}
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs" style={{ color: colors.textDim }}>← Back to LazyDrop</Link>
        </div>
      </div>
    </div>
  );
}
