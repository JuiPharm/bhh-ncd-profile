import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { PatientDetail } from './pages/PatientDetail';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';
import { Users } from './pages/Users';
import { SharePortal } from './pages/SharePortal';
import { Loader } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse path and params
  const hashPath = currentHash.split('?')[0];

  // Route matches Share Portal directly without authentication
  if (hashPath.startsWith('#/share')) {
    return <SharePortal />;
  }

  // Handle Loading Session State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-8 w-8 text-hospital-300 animate-spin mx-auto" />
          <span className="text-xs text-slate-400 font-semibold block">Loading Hospital Portal...</span>
        </div>
      </div>
    );
  }

  // Redirect to Login if unauthenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Route matches for authenticated hospital staff
  if (hashPath === '#/dashboard') {
    return <Dashboard />;
  }
  
  if (hashPath === '#/patients') {
    return <PatientList />;
  }

  // Regex matching for /patients/:id
  const patientDetailMatch = hashPath.match(/^#\/patients\/([^/]+)$/);
  if (patientDetailMatch) {
    const id = patientDetailMatch[1];
    return <PatientDetail patientId={id} />;
  }

  if (hashPath === '#/reports') {
    return <Reports />;
  }

  if (hashPath === '#/admin') {
    return <Admin />;
  }

  if (hashPath === '#/users') {
    return <Users />;
  }

  // Default fallback redirect to dashboard
  setTimeout(() => {
    window.location.hash = '#/dashboard';
  }, 0);
  
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
