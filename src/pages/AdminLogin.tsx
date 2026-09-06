import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Zap, User } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0a0a0f]" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">LazyDrop</span>
        </Link>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-gray-400 text-center mb-6">Enter your credentials to manage files</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0a0a0f] font-semibold text-sm hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
