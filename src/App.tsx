import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, Component, ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth';
import { UserAuthProvider } from '@/lib/userAuth';
import { ThemeProvider } from '@/lib/theme';
import { api, AppSettings } from '@/lib/api';

const Landing = lazy(() => import('@/pages/Landing'));
const DownloadPage = lazy(() => import('@/pages/Download'));
const PreviewPage = lazy(() => import('@/pages/PreviewPage'));
const SharePage = lazy(() => import('@/pages/SharePage'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const UserLogin = lazy(() => import('@/pages/UserLogin'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );
}

function Background() {
  const [bg, setBg] = useState<{ url: string; type: string }>({ url: '', type: '' });

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s.backgroundUrl) setBg({ url: s.backgroundUrl, type: s.backgroundType });
    }).catch(() => {});
  }, []);

  if (!bg.url) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {bg.type === 'video' ? (
        <video
          src={bg.url}
          className="w-full h-full object-cover"
          muted
          autoPlay
          loop
          playsInline
        />
      ) : (
        <img src={bg.url} alt="" className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: '#0f172a', color: '#e2e8f0' }}>
          <div className="max-w-md text-center space-y-4">
            <p className="text-lg font-semibold" style={{ color: '#ef4444' }}>Something went wrong</p>
            <p className="text-sm opacity-70">{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <UserAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Background />
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/file/:fileId" element={<DownloadPage />} />
              <Route path="/preview/:id" element={<PreviewPage />} />
              <Route path="/s/:id" element={<SharePage />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/register" element={<UserLogin />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      </UserAuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
