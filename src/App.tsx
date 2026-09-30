import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { UserAuthProvider } from '@/lib/userAuth';
import LoadingBar from '@/components/LoadingBar';
import { GridBackground, Scanlines, OrbGlow, ParticleField } from '@/components/sci-fi';
import { SkeletonPage } from '@/components/skeleton';
import { fadeIn } from '@/lib/animations';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load standalone pages (don't need special props)
const Landing = lazy(() => import('@/pages/Landing'));
const UserLogin = lazy(() => import('@/pages/UserLogin'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const DownloadPage = lazy(() => import('@/pages/Download'));
const SharePage = lazy(() => import('@/pages/SharePage'));
const PreviewPage = lazy(() => import('@/pages/PreviewPage'));
const CoinsPage = lazy(() => import('@/pages/CoinsPage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));

// Admin pages that need props - not lazy loaded
import AdminPanel from '@/pages/AdminPanel';

function SkeletonFallback({ type = 'dashboard' }: { type?: string }) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <SkeletonPage type={type} />
    </motion.div>
  );
}

function AppContent() {
  const location = useLocation();

  // Drive the top loading bar across route transitions
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('lazy-load-start'));
    const t = setTimeout(() => window.dispatchEvent(new CustomEvent('lazy-load-done')), 700);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      <LoadingBar />
      <GridBackground animate intensity={0.8} />
      <Scanlines speed={1} opacity={0.3} />
      <OrbGlow variant="orb1" size={500} blur={150} />
      <OrbGlow variant="orb2" size={300} blur={100} />
      <OrbGlow variant="orb3" size={400} blur={120} />
      <ParticleField count={30} speed={0.5} particleSize={1.5} />

      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location} children={[
          <Route key="home" path="/" element={
            <Suspense fallback={<SkeletonFallback type="dashboard" />}>
              <Landing />
            </Suspense>
          } />,
          <Route key="login" path="/login" element={
            <Suspense fallback={<SkeletonFallback type="form" />}>
              <UserLogin />
            </Suspense>
          } />,
          <Route key="dashboard" path="/dashboard" element={
            <Suspense fallback={<SkeletonFallback type="dashboard" />}>
              <UserDashboard />
            </Suspense>
          } />,
          <Route key="admin-login" path="/admin/login" element={<AdminLogin />} />,
          <Route key="admin" path="/admin/*" element={<AdminPanel />} />,
          <Route key="file" path="/file/:fileId" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <DownloadPage />
            </Suspense>
          } />,
          <Route key="share" path="/s/:shareId" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <SharePage />
            </Suspense>
          } />,
          <Route key="preview" path="/preview/:fileId" element={<PreviewPage />} />,
          <Route key="coins" path="/coins" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <CoinsPage />
            </Suspense>
          } />,
          <Route key="shop" path="/shop" element={
            <Suspense fallback={<SkeletonFallback type="list" />}>
              <ShopPage />
            </Suspense>
          } />,
          <Route key="wildcard" path="*" element={<Navigate to="/" replace />} />
        ]} />
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
