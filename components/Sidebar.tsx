
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.STAF_MASUK, UserRole.STAF_KELUAR] },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: '📥', roles: [UserRole.ADMIN, UserRole.STAF_MASUK] },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: '📤', roles: [UserRole.ADMIN, UserRole.STAF_KELUAR] },
    { id: 'agenda', label: 'Agenda Kegiatan', icon: '🗓️', roles: [UserRole.ADMIN, UserRole.STAF_MASUK, UserRole.STAF_KELUAR] },
    { id: 'users', label: 'Manajemen User', icon: '👥', roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col h-full shadow-xl no-print">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-xl font-bold shadow-lg">
            ES
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">E-Surat</h1>
            <span className="text-xs text-indigo-300">Digital Archive</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.filter(item => item.roles.includes(role)).map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-700 text-white shadow-inner' 
                  : 'hover:bg-indigo-800 text-indigo-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-indigo-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-indigo-900 font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-indigo-300 uppercase tracking-wider">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-800 hover:bg-red-600 rounded-lg transition-colors text-sm font-medium"
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
