import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { LazyLoadingError } from '@/components/LazyLoadingError';

const Landing = lazy(() => import('@/pages/Landing').then((mod) => mod.Landing));
const DownloadPage = lazy(() => import('@/pages/Download').then((mod) => mod.DownloadPage));
const AdminLogin = lazy(() => import('@/pages/AdminLogin').then((mod) => mod.AdminLogin));
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then((mod) => mod.AdminPanel));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LazyLoadingError />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/file/:fileId" element={<DownloadPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
