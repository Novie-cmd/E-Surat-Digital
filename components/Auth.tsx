
import React, { useState } from 'react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface AuthProps {
  onLogin: (user: any) => void;
  isSyncing: boolean;
  isUnauthorized?: boolean;
  onLogout?: () => void;
  firebaseUser?: any;
}

const Auth: React.FC<AuthProps> = ({ onLogin, isSyncing, isUnauthorized, onLogout, firebaseUser }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // We pass the firebase user, App.tsx will handle role mapping
        onLogin(result.user);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Gagal masuk dengan Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-200 mx-auto mb-6">
                ES
              </div>
              <h1 className="text-2xl font-bold text-slate-800">E-Surat Digital</h1>
              <p className="text-slate-500 mt-2">Sistem Persuratan Terintegrasi Firebase</p>
            </div>

            <div className="space-y-6">
              {!firebaseUser ? (
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading || isSyncing}
                  className="w-full py-4 bg-white border-2 border-slate-100 hover:border-indigo-200 text-slate-700 rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 ${isUnauthorized ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'} text-sm font-medium rounded-2xl border text-center`}>
                    <p className="font-bold mb-1">{isUnauthorized ? 'Akses Ditolak' : 'Menunggu Profil...'}</p>
                    <p>{isUnauthorized ? 'Akun Google Anda belum terdaftar di sistem ini. Silakan hubungi Administrator.' : 'Sedang memuat profil pengguna Anda dari database.'}</p>
                    {isSyncing && !isUnauthorized && <div className="mt-2 text-[10px] animate-pulse">⚡ MENGHUBUNGKAN KE FIRESTORE...</div>}
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    Keluar & Coba Akun Lain
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100">
                  ⚠️ {error}
                </div>
              )}
              
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs text-indigo-700 leading-relaxed">
                  <strong>Catatan:</strong> Gunakan akun Google yang terdaftar sebagai Administrator untuk mengelola sistem.
                </p>
              </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Status Koneksi:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="text-xs text-slate-500 font-medium">{isSyncing ? 'Menghubungkan ke Firebase...' : 'Firebase Siap'}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-indigo-300/60 mt-8 text-sm">
          &copy; 2024 E-Surat Digital NTB. Powered by Firebase.
        </p>
      </div>
    </div>
  );
};

export default Auth;
