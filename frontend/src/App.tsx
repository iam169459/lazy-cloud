import React, { useState, useEffect } from 'react';
import { UploadLanding } from './pages/UploadLanding';
import { DownloadPage } from './pages/DownloadPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPanel } from './pages/AdminPanel';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    const handleHashChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Simple navigation function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Inject navigate into window for pages to use
  useEffect(() => {
    (window as any).navigate = navigate;
  }, []);

  const renderPage = () => {
    if (currentPath === '/admin/login') {
      return <AdminLogin />;
    }

    if (currentPath.startsWith('/admin')) {
      return <AdminPanel />;
    }

    if (currentPath.startsWith('/d/')) {
      const token = currentPath.split('/d/')[1];
      if (token) {
        return <DownloadPage token={token} />;
      }
    }

    return <UploadLanding />;
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {renderPage()}
    </div>
  );
};

export default App;
