import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { isConfigValid } from '../lib/config';
import { Lock, Mail, AlertTriangle, KeyRound } from 'lucide-react';

const LOGO_URL = 'https://lh5.googleusercontent.com/d/1r7PM1ogHIbxskvcauVIYaQOfSHXWGncO';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const configValid = isConfigValid();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      window.location.hash = '#/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check your credentials or internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-hospital-900 p-8 text-white text-center flex flex-col items-center">
          <img
            src={LOGO_URL}
            alt="BHH Logo"
            className="h-24 w-24 object-contain rounded-2xl bg-white p-2 shadow-lg mb-4"
          />

          <h2 className="font-bold text-xl tracking-wide">BHH NCD Portal</h2>
          <p className="text-[10px] text-hospital-300 tracking-widest uppercase mt-1">
            Chronic Patient Record System
          </p>
        </div>

        {/* Setup Error block if sheet is not connected */}
        {!configValid ? (
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm leading-tight">Database Not Connected</h4>
                <p className="text-xs text-amber-700 mt-1 leading-normal">
                  The Google Apps Script API URL is missing or set to placeholder. Follow these steps to deploy:
                </p>
              </div>
            </div>

            <ol className="text-xs text-slate-600 list-decimal list-inside space-y-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
              <li>Create a new Google Sheet.</li>
              <li>Open Extensions &gt; Apps Script.</li>
              <li>
                Paste the code from{' '}
                <code className="font-mono bg-slate-100 px-1 rounded">apps-script/Code.gs</code>.
              </li>
              <li>
                Set script properties{' '}
                <code className="font-mono bg-slate-100 px-1 rounded">SHEET_ID</code> and{' '}
                <code className="font-mono bg-slate-100 px-1 rounded">SETUP_KEY</code>.
              </li>
              <li>Deploy as Web App (Execute as "Me", Access: "Anyone").</li>
              <li>
                Copy the Web App URL and paste it in{' '}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-hospital-700">
                  docs/config.js
                </code>.
              </li>
            </ol>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow"
            >
              Refresh Configuration Check
            </button>
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-550 p-3.5 rounded-xl text-xs text-red-800 font-semibold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@bhh.local"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg text-xs transition-colors shadow-lg"
            >
              <KeyRound className="h-4 w-4" />
              {isSubmitting ? 'Verifying...' : 'Sign In to Portal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
