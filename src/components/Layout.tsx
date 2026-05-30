import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { isConfigValid } from '../lib/config';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
}

const LOGO_URL = 'https://lh5.googleusercontent.com/d/1r7PM1ogHIbxskvcauVIYaQOfSHXWGncO';

export const Layout: React.FC<LayoutProps> = ({ children, currentRoute }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const configValid = isConfigValid();

  const navigation = [
    { name: 'Dashboard', hash: '#/dashboard', icon: LayoutDashboard, current: currentRoute === 'dashboard' },
    { name: 'Patients', hash: '#/patients', icon: Users, current: currentRoute === 'patients' || currentRoute === 'patient-detail' },
    { name: 'Reports', hash: '#/reports', icon: FileText, current: currentRoute === 'reports' },
  ];

  // Admin and Staff list views
  if (isAdmin) {
    navigation.push(
      { name: 'Users', hash: '#/users', icon: UserCog, current: currentRoute === 'users' },
      { name: 'Audit Logs', hash: '#/admin', icon: Settings, current: currentRoute === 'admin' }
    );
  }

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Configuration warning banner */}
      {!configValid && (
        <div className="bg-amber-600 text-white px-4 py-2 text-sm flex items-center justify-between font-medium shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
            <span>Google Apps Script Web App URL is missing or set to placeholder. Please edit docs/config.js.</span>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="underline hover:text-amber-100 text-xs px-2 py-1 rounded"
          >
            Retry Check
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-hospital-900 text-white shrink-0 shadow-lg sticky top-0 h-screen z-20">
          {/* Clinic Brand header */}
          <div className="h-24 flex items-center gap-3 px-6 border-b border-hospital-800">
            <img
              src={LOGO_URL}
              alt="BHH Logo"
              className="h-14 w-14 object-contain rounded-xl bg-white p-1.5 shadow"
            />

            <div>
              <h1 className="font-bold text-sm tracking-wide leading-tight">BHH NCD</h1>
              <p className="text-[10px] text-hospital-400 font-medium leading-tight">
                PATIENT PROFILE SYSTEM
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigateTo(item.hash)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  item.current
                    ? 'bg-hospital-800 text-white shadow-inner font-semibold'
                    : 'text-hospital-300 hover:bg-hospital-800/40 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User profile section */}
          {user && (
            <div className="p-4 border-t border-hospital-800 bg-hospital-950/40">
              <div className="flex items-center gap-3 px-2 py-1 mb-3">
                <div className="h-9 w-9 rounded-full bg-hospital-800 flex items-center justify-center font-bold text-hospital-200">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="truncate">
                  <p className="text-xs font-semibold text-white leading-tight truncate">{user.name}</p>
                  <span className="inline-block px-2 py-0.5 mt-1 text-[9px] uppercase font-bold tracking-wider rounded bg-hospital-800/60 text-hospital-300">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-hospital-800 hover:border-warning/40 rounded-lg text-xs font-medium text-hospital-400 hover:text-warning hover:bg-warning/5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-hospital-900 text-white px-4 flex items-center justify-between shadow-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="BHH Logo"
              className="h-10 w-10 object-contain rounded-lg bg-white p-1 shadow"
            />

            <div>
              <span className="font-bold text-sm tracking-wide">BHH NCD Profile</span>
              <p className="text-[9px] text-hospital-400">Hospital Portal</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded hover:bg-hospital-850"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/60 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Nav Sidebar */}
        <div
          className={`lg:hidden fixed top-16 bottom-0 left-0 w-64 bg-hospital-900 text-white z-40 transition-transform duration-300 ease-in-out transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col`}
        >
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigateTo(item.hash)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  item.current
                    ? 'bg-hospital-800 text-white'
                    : 'text-hospital-300 hover:bg-hospital-800/40 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {user && (
            <div className="p-4 border-t border-hospital-800 bg-hospital-950/40">
              <div className="flex items-center gap-3 px-2 py-1 mb-3">
                <div className="h-9 w-9 rounded-full bg-hospital-800 flex items-center justify-center font-bold text-hospital-200">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[8px] uppercase font-bold tracking-wider rounded bg-hospital-800 text-hospital-300">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-hospital-800 hover:border-warning/45 rounded-lg text-xs font-medium text-hospital-450 hover:text-warning hover:bg-warning/5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
