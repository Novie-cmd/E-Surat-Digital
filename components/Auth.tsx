
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      u.username === username.toLowerCase() && 
      (u.password === password || (!u.password && password === ''))
    );
    
    if (user) {
      onLogin(user);
    } else {
      setError('Username atau Password salah. Silakan coba lagi.');
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
              <p className="text-slate-500 mt-2">Silakan masuk dengan akun Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Masukkan username"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Masukkan password"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                  ⚠️ {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
              >
                Masuk ke Sistem
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Default Login:</p>
              <p className="text-xs text-slate-500 mt-1 italic">Admin: admin / 123</p>
            </div>
          </div>
        </div>
        <p className="text-center text-indigo-300/60 mt-8 text-sm">
          &copy; 2024 E-Surat Digital NTB. Terlindungi Enkripsi Lokal.
        </p>
      </div>
    </div>
  );
};

export default Auth;
