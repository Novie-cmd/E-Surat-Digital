
import React from 'react';
import { Letter, User } from '../types';

interface DashboardProps {
  letters: Letter[];
  users: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ letters, users }) => {
  const inCount = letters.filter(l => l.type === 'INCOMING').length;
  const outCount = letters.filter(l => l.type === 'OUTGOING').length;

  const stats = [
    { label: 'Total Surat Masuk', value: inCount, color: 'bg-emerald-500', icon: '📥' },
    { label: 'Total Surat Keluar', value: outCount, color: 'bg-blue-500', icon: '📤' },
    { label: 'Total User Sistem', value: users.length, color: 'bg-amber-500', icon: '👥' },
    { label: 'Aktivitas Hari Ini', value: letters.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, color: 'bg-indigo-500', icon: '⚡' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.color} text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">Aktivitas Terkini</h3>
          <div className="space-y-4">
            {letters.slice(0, 5).length > 0 ? (
              letters.slice(0, 5).map(letter => (
                <div key={letter.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className={`w-2 h-10 rounded-full ${letter.type === 'INCOMING' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{letter.subject}</p>
                    <p className="text-xs text-slate-500">{letter.referenceNumber} • {new Date(letter.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    letter.type === 'INCOMING' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {letter.type === 'INCOMING' ? 'Masuk' : 'Keluar'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-slate-400">Belum ada aktivitas surat.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">Statistik Cepat</h3>
          <div className="relative h-48 flex items-end justify-around gap-4 pt-8">
             <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                <div className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500" style={{ height: `${(inCount / Math.max(inCount + outCount, 1)) * 100}%` }}></div>
                <span className="text-xs font-bold text-slate-600">Masuk</span>
             </div>
             <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                <div className="w-full bg-blue-500 rounded-t-lg transition-all duration-500" style={{ height: `${(outCount / Math.max(inCount + outCount, 1)) * 100}%` }}></div>
                <span className="text-xs font-bold text-slate-600">Keluar</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
