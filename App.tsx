
import React, { useState, useEffect } from 'react';
import { User, UserRole, Letter, Agenda } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LetterModule from './components/LetterModule';
import UserManagement from './components/UserManagement';
import AgendaModule from './components/AgendaModule';
import Auth from './components/Auth';

// Firebase Imports
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // 1. Sinkronisasi User (Real-time)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      if (userData.length === 0) {
        // Init default users jika Firestore kosong
        const defaultUsers: User[] = [
          { id: '1', username: 'admin', name: 'Administrator', role: UserRole.ADMIN, password: '123' },
          { id: '2', username: 'masuk', name: 'Staf Surat Masuk', role: UserRole.STAF_MASUK, password: '123' },
          { id: '3', username: 'keluar', name: 'Staf Surat Keluar', role: UserRole.STAF_KELUAR, password: '123' },
        ];
        defaultUsers.forEach(u => setDoc(doc(db, 'users', u.id), u));
      } else {
        setUsers(userData);
      }
    });
    return () => unsub();
  }, []);

  // 2. Sinkronisasi Surat (Real-time)
  useEffect(() => {
    const q = query(collection(db, 'letters'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const letterData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
      setLetters(letterData);
      setIsSyncing(false);
    });
    return () => unsub();
  }, []);

  // 3. Sinkronisasi Agenda (Real-time)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agendas'), (snapshot) => {
      const agendaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
      setAgendas(agendaData);
    });
    return () => unsub();
  }, []);

  // 4. Cek Session Login Lokal
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

  // Database Handlers
  const addLetter = async (letter: Omit<Letter, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      await addDoc(collection(db, 'letters'), {
        ...letter,
        createdAt: Date.now(),
        createdBy: currentUser?.name || 'Unknown'
      });
    } catch (e) {
      console.error("Error adding letter: ", e);
      alert("Gagal menyimpan ke Cloud Firestore.");
    }
  };

  const deleteLetter = async (id: string) => {
    if (confirm("Hapus arsip dari cloud?")) {
      await deleteDoc(doc(db, 'letters', id));
    }
  };

  const updateLetter = async (updated: Letter) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, 'letters', id), data);
  };

  const saveAgendas = async (updated: Agenda[]) => {
    // Karena struktur data kita menyimpan list agenda, kita update per item atau koleksi
    // Untuk simplifikasi, kita asumsikan update per dokumen ID
    updated.forEach(async (a) => {
      const agendaData = { ...a, createdBy: a.createdBy || currentUser?.name || 'Unknown' };
      await setDoc(doc(db, 'agendas', a.id), agendaData);
    });
  };

  const handleUpdateUsers = (updatedUsers: User[]) => {
    // Sync perubahan user ke Firestore
    updatedUsers.forEach(async (u) => {
      await setDoc(doc(db, 'users', u.id), u);
    });
    
    // Jika ada yang dihapus di lokal tapi ada di firestore, 
    // logika di atas perlu disesuaikan dengan diffing.
    // Tapi untuk UserManagement kita sudah mengirimkan array lengkap.
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} users={users} />;
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
                  ☁️ SINKRONISASI CLOUD
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
