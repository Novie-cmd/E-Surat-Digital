
import React, { useState, useEffect } from 'react';
import { User, UserRole, Letter, Agenda } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LetterModule from './components/LetterModule';
import UserManagement from './components/UserManagement';
import AgendaModule from './components/AgendaModule';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  useEffect(() => {
    const storedLetters = localStorage.getItem('esurat_letters');
    const storedUsers = localStorage.getItem('esurat_users');
    const storedAuth = localStorage.getItem('esurat_auth');
    const storedAgendas = localStorage.getItem('esurat_agendas');

    if (storedLetters) setLetters(JSON.parse(storedLetters));
    if (storedAgendas) setAgendas(JSON.parse(storedAgendas));
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const defaultUsers: User[] = [
        { id: '1', username: 'admin', name: 'Administrator', role: UserRole.ADMIN },
        { id: '2', username: 'masuk', name: 'Staf Surat Masuk', role: UserRole.STAF_MASUK },
        { id: '3', username: 'keluar', name: 'Staf Surat Keluar', role: UserRole.STAF_KELUAR },
      ];
      setUsers(defaultUsers);
      localStorage.setItem('esurat_users', JSON.stringify(defaultUsers));
    }

    if (storedAuth) setCurrentUser(JSON.parse(storedAuth));
  }, []);

  useEffect(() => {
    localStorage.setItem('esurat_letters', JSON.stringify(letters));
  }, [letters]);

  useEffect(() => {
    localStorage.setItem('esurat_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('esurat_agendas', JSON.stringify(agendas));
  }, [agendas]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('esurat_auth');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('esurat_auth', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const addLetter = (letter: Omit<Letter, 'id' | 'createdAt'>) => {
    const newLetter: Letter = {
      ...letter,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    setLetters(prev => [newLetter, ...prev]);
  };

  const deleteLetter = (id: string) => {
    setLetters(prev => prev.filter(l => l.id !== id));
  };

  const updateLetter = (updated: Letter) => {
    setLetters(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const saveAgendas = (updated: Agenda[]) => {
    setAgendas(updated);
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
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 no-print">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <p className="text-slate-500">Selamat datang kembali, {currentUser.name}</p>
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
            onUpdateUsers={(updated) => setUsers(updated)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
