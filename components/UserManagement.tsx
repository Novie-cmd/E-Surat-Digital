
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: UserRole.STAF_MASUK
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };
    onUpdateUsers([...users, newUser]);
    setFormData({ username: '', name: '', role: UserRole.STAF_MASUK });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus user ini?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
        >
          <span>+</span> Tambah User Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama Lengkap</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Username</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-500">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                    user.role === UserRole.STAF_MASUK ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={user.username === 'admin'}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-xl font-bold text-indigo-900">Tambah User Baru</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Username</label>
                <input 
                  required 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="username_login"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Role Pengguna</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.STAF_MASUK}>Staf Surat Masuk</option>
                  <option value={UserRole.STAF_KELUAR}>Staf Surat Keluar</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
