import { useLocation } from 'react-router-dom';

export function LazyLoadingError() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md mx-auto">
        <div className="text-white mb-4">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h2 className="text-xl font-bold">Loading...</h2>
        </div>
        <p className="text-gray-400">
          Navigating to <code className="font-medium">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
}