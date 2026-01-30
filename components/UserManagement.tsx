
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: UserRole.STAF_MASUK,
    password: ''
  });

  const resetForm = () => {
    setFormData({ username: '', name: '', role: UserRole.STAF_MASUK, password: '' });
    setEditingUser(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setError('');
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: user.password || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi username tidak boleh kosong
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    // Cek duplikasi username (hanya jika tambah baru atau ganti username saat edit)
    const isUsernameExists = users.some(u => 
      u.username === formData.username.toLowerCase() && 
      (!editingUser || u.id !== editingUser.id)
    );

    if (isUsernameExists) {
      setError('Username sudah digunakan oleh staf lain.');
      return;
    }
    
    if (editingUser) {
      // Proses Update (Ubah)
      const updatedUsers = users.map(u => 
        u.id === editingUser.id ? { ...u, ...formData, username: formData.username.toLowerCase() } : u
      );
      onUpdateUsers(updatedUsers);
    } else {
      // Proses Masuk (Tambah Baru)
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        username: formData.username.toLowerCase()
      };
      onUpdateUsers([...users, newUser]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, username: string) => {
    // Proteksi: Admin utama tidak boleh dihapus
    if (username === 'admin') {
      alert('Akun administrator utama tidak dapat dihapus demi keamanan sistem.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akses untuk "${username}"? Staf ini tidak akan bisa login lagi.`)) {
      const filteredUsers = users.filter(u => u.id !== id);
      onUpdateUsers(filteredUsers);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Daftar Pengguna Sistem</h3>
          <p className="text-sm text-slate-500">Kelola hak akses dan akun staf E-Surat</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
          <span className="text-xl">+</span> Tambah User (Masuk)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role / Hak Akses</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <p className="font-semibold text-slate-800">{user.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                      user.role === UserRole.STAF_MASUK ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-bold px-3 py-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      Ubah
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id, user.username)}
                      className={`text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors ${user.username === 'admin' ? 'opacity-20 cursor-not-allowed' : ''}`}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{editingUser ? '📝' : '👤'}</span>
                <h2 className="text-xl font-bold">
                  {editingUser ? 'Ubah Profil Staf' : 'Masuk Data Staf Baru'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2 animate-bounce">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" 
                  placeholder="Nama lengkap staf"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username Login</label>
                <input 
                  required 
                  disabled={editingUser?.username === 'admin'}
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all font-mono" 
                  placeholder="username_akses"
                />
                {editingUser?.username === 'admin' && <p className="text-[10px] text-slate-400 italic">Username admin utama tidak bisa diubah.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password Baru</label>
                <input 
                  type="text"
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" 
                  placeholder="Password untuk login"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tingkat Hak Akses</label>
                <select 
                  disabled={editingUser?.username === 'admin'}
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                >
                  <option value={UserRole.ADMIN}>Administrator (Semua Menu)</option>
                  <option value={UserRole.STAF_MASUK}>Staf Surat Masuk (Input Surat Masuk)</option>
                  <option value={UserRole.STAF_KELUAR}>Staf Surat Keluar (Input Surat Keluar)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Masuk Data Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
