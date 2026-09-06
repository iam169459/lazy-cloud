import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User, Fingerprint } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(username, password);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden grid-bg">
      <div className="scanline-overlay" />

      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hex grid decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute top-10 left-10 w-32 h-32 border border-emerald-400 rotate-45 animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-24 h-24 border border-cyan-400 rotate-12 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10 animate-fade-in-up">
          <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center glow-emerald">
            <Zap className="w-5 h-5 text-[#06060c]" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gradient-sci">LazyDrop</span>
            <div className="h-px bg-gradient-to-r from-emerald-400/50 to-transparent mt-0.5" />
          </div>
        </Link>

        <div className="card-sci corner-accent rounded-3xl p-8 animate-scale-in">
          {/* Scanning line effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-hologram" />

          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 border border-emerald-400/20 flex items-center justify-center animate-pulse-glow">
              <Fingerprint className="w-8 h-8 text-emerald-400" />
              <div className="absolute inset-0 rounded-2xl border border-emerald-400/10 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1 text-gradient-sci">Admin Access</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Enter your credentials to manage files</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400/40 focus:bg-emerald-400/5 focus:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-300"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400/40 focus:bg-emerald-400/5 focus:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-300"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center animate-fade-in-up">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-8 text-sm text-gray-500 hover:text-emerald-400 transition-colors animate-fade-in-up delay-300">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
