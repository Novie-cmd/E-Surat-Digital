
import React, { useState, useEffect } from 'react';
import { User, UserRole, Letter, Agenda } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LetterModule from './components/LetterModule';
import UserManagement from './components/UserManagement';
import AgendaModule from './components/AgendaModule';
import Auth from './components/Auth';

// Supabase Import
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Fungsi helper untuk validasi env var
  const isValid = (val: any) => val && val !== "undefined" && val !== "null" && val !== "";
  const isSupabaseConfigured = !!(supabase && isValid(process.env.VITE_SUPABASE_URL) && isValid(process.env.VITE_SUPABASE_ANON_KEY));

  // --- 1. SINKRONISASI USERS ---
  const fetchUsers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      if (data && data.length === 0) {
        const { error: insErr } = await supabase.from('profiles').insert([
          { username: 'admin', name: 'Administrator', role: UserRole.ADMIN, password: '123' }
        ]);
        if (!insErr) fetchUsers();
      } else if (data) {
        setUsers(data as User[]);
      }
    } catch (err: any) {
      console.error("Error users:", err.message);
      setDbError(`Gagal mengambil data user: ${err.message}. Pastikan tabel 'profiles' sudah dibuat.`);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchUsers();
      const channel = supabase.channel('profiles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchUsers();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isSupabaseConfigured]);

  // --- 2. SINKRONISASI LETTERS ---
  const fetchLetters = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('letters').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      if (data) {
        const mapped = data.map(l => ({
          id: l.id,
          type: l.type,
          referenceNumber: l.reference_number,
          date: l.date,
          sender: l.sender,
          subject: l.subject,
          description: l.description,
          scannedImages: l.scanned_images,
          disposition: l.disposition,
          check1: l.check1,
          check2: l.check2,
          createdAt: new Date(l.created_at).getTime(),
          createdBy: l.created_by
        } as Letter));
        setLetters(mapped);
      }
      setIsSyncing(false);
    } catch (err: any) {
      console.error("Error letters:", err.message);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchLetters();
      const channel = supabase.channel('letters-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'letters' }, () => {
          fetchLetters();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isSupabaseConfigured]);

  // --- 3. SINKRONISASI AGENDAS ---
  const fetchAgendas = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('agendas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      if (data) {
        const mapped = data.map(a => ({
          id: a.id,
          dayDate: a.day_date,
          items: a.items,
          signedBy: a.signed_by,
          signedNip: a.signed_nip,
          createdAt: new Date(a.created_at).getTime(),
          createdBy: a.created_by
        } as Agenda));
        setAgendas(mapped);
      }
    } catch (err: any) {
      console.error("Error agendas:", err.message);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAgendas();
      const channel = supabase.channel('agendas-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendas' }, () => {
          fetchAgendas();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isSupabaseConfigured]);

  // --- 4. AUTH HANDLERS ---
  useEffect(() => {
    const storedAuth = localStorage.getItem('esurat_auth');
    if (storedAuth) setCurrentUser(JSON.parse(storedAuth));
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('esurat_auth');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('esurat_auth', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  // --- 5. DATA MUTATION HANDLERS ---
  const addLetter = async (letter: Omit<Letter, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!supabase) return;
    const { error } = await supabase.from('letters').insert([{
      type: letter.type,
      reference_number: letter.referenceNumber,
      date: letter.date,
      sender: letter.sender,
      subject: letter.subject,
      description: letter.description,
      scanned_images: letter.scannedImages,
      disposition: letter.disposition,
      check1: letter.check1,
      check2: letter.check2,
      created_by: currentUser?.name || 'Unknown'
    }]);
    if (error) alert("Gagal menyimpan ke Supabase: " + error.message);
  };

  const deleteLetter = async (id: string) => {
    if (!supabase) return;
    if (confirm("Hapus arsip dari cloud?")) {
      await supabase.from('letters').delete().eq('id', id);
    }
  };

  const updateLetter = async (updated: Letter) => {
    if (!supabase) return;
    await supabase.from('letters').update({
      reference_number: updated.referenceNumber,
      date: updated.date,
      sender: updated.sender,
      subject: updated.subject,
      description: updated.description,
      scanned_images: updated.scannedImages,
      disposition: updated.disposition,
      check1: updated.check1,
      check2: updated.check2
    }).eq('id', updated.id);
  };

  const saveAgendas = async (updatedList: Agenda[]) => {
    if (!supabase) return;
    for (const a of updatedList) {
      const payload = {
        day_date: a.dayDate,
        items: a.items,
        signed_by: a.signedBy,
        signed_nip: a.signedNip,
        created_by: a.createdBy || currentUser?.name || 'Unknown'
      };
      
      if (a.id && a.id.length > 20) {
        await supabase.from('agendas').update(payload).eq('id', a.id);
      } else {
        await supabase.from('agendas').insert([payload]);
      }
    }
    fetchAgendas();
  };

  const handleUpdateUsers = async (updatedUsers: User[]) => {
    if (!supabase) return;
    for (const u of updatedUsers) {
      const payload = { username: u.username, name: u.name, role: u.role, password: u.password };
      if (u.id && u.id.length > 20) {
        await supabase.from('profiles').update(payload).eq('id', u.id);
      } else {
        await supabase.from('profiles').insert([payload]);
      }
    }
    fetchUsers();
  };

  // Tampilan jika konfigurasi hilang
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-2xl">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Konfigurasi Belum Lengkap</h2>
          <p className="text-slate-600 mb-6">Variabel lingkungan Supabase (URL/Key) belum diatur di Vercel atau Dashboard Anda.</p>
          <div className="bg-slate-50 p-4 rounded-xl text-left text-[10px] font-mono text-slate-500 overflow-x-auto">
            VITE_SUPABASE_URL=https://xyz.supabase.co<br/>
            VITE_SUPABASE_ANON_KEY=eyJhbGci...
          </div>
          <p className="mt-6 text-xs text-slate-400">Pastikan Anda telah menambahkan variabel lingkungan tersebut di pengaturan proyek Vercel Anda.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        {dbError && (
          <div className="fixed top-0 inset-x-0 bg-red-600 text-white p-2 text-center text-xs z-[200]">
            ⚠️ {dbError}
          </div>
        )}
        <Auth onLogin={handleLogin} users={users} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        role={currentUser.role} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <header className="mb-8 no-print flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              {isSyncing && (
                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  ⚡ SUPABASE CONNECTED
                </span>
              )}
            </div>
            <p className="text-slate-500">Selamat datang kembali, {currentUser.name}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</span>
          </div>
        </header>

        {dbError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-3">
            <span>❌</span> {dbError}
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard letters={letters} users={users} />}
        
        {activeTab === 'surat-masuk' && (
          <LetterModule 
            type="INCOMING" 
            letters={letters.filter(l => l.type === 'INCOMING')} 
            onAdd={addLetter}
            onDelete={deleteLetter}
            onUpdate={updateLetter}
            canManage={currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAF_MASUK}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'surat-keluar' && (
          <LetterModule 
            type="OUTGOING" 
            letters={letters.filter(l => l.type === 'OUTGOING')} 
            onAdd={addLetter}
            onDelete={deleteLetter}
            onUpdate={updateLetter}
            canManage={currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAF_KELUAR}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaModule 
            agendas={agendas} 
            onSave={saveAgendas} 
            canManage={currentUser.role === UserRole.ADMIN} 
          />
        )}

        {activeTab === 'users' && currentUser.role === UserRole.ADMIN && (
          <UserManagement 
            users={users} 
            onUpdateUsers={handleUpdateUsers} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
