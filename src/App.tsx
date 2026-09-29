import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { UserAuthProvider } from '@/lib/userAuth';
import LoadingBar from '@/components/LoadingBar';
import { GridBackground, Scanlines, OrbGlow, ParticleField } from '@/components/sci-fi';
import { SkeletonPage } from '@/components/skeleton';
import { fadeIn } from '@/lib/animations';
import { motion } from 'framer-motion';

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
    <motion.div variants={fadeIn} initial="hidden" animate="enter">
      <SkeletonPage type={type} />
    </motion.div>
  );
}

function AppContent() {
  return (
    <>
      <LoadingBar />
      <GridBackground animate intensity={0.8} />
      <Scanlines speed={1} opacity={0.3} />
      <OrbGlow variant="orb1" size={500} blur={150} />
      <OrbGlow variant="orb2" size={300} blur={100} />
      <OrbGlow variant="orb3" size={400} blur={120} />
      <ParticleField count={30} speed={0.5} size={1.5} />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/dashboard" element={
            <Suspense fallback={<SkeletonFallback type="dashboard" />}>
              <UserDashboard />
            </Suspense>
          } />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/file/:fileId" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <DownloadPage />
            </Suspense>
          } />
          <Route path="/s/:shareId" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <SharePage />
            </Suspense>
          } />
          <Route path="/preview/:fileId" element={<PreviewPage />} />
          <Route path="/coins" element={
            <Suspense fallback={<SkeletonFallback type="stats" />}>
              <CoinsPage />
            </Suspense>
          } />
          <Route path="/shop" element={
            <Suspense fallback={<SkeletonFallback type="list" />}>
              <ShopPage />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserAuthProvider>
          <AppContent />
        </UserAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
