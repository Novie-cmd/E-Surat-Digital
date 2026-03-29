
import React, { useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Letter, Agenda } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LetterModule from './components/LetterModule';
import UserManagement from './components/UserManagement';
import AgendaModule from './components/AgendaModule';
import Auth from './components/Auth';

// Firebase Imports
import { db, auth } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs, 
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

// Error Handling Types
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Terjadi kesalahan pada aplikasi.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "Anda tidak memiliki izin untuk melakukan operasi ini.";
        }
      } catch (e) {
        // Not JSON
      }

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ups! Terjadi Kesalahan</h2>
            <p className="text-slate-600 mb-6">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [viewingFilesLetter, setViewingFilesLetter] = useState<Letter | null>(null);
  const [isQuickScan, setIsQuickScan] = useState(false);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setDbError(`Kesalahan Database (${operationType}): ${errInfo.error}`);
    return errInfo;
  };

  const sanitizeData = (data: any) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      } else if (sanitized[key] !== null && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    return sanitized;
  };

  // Validate Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          setDbError("Gagal terhubung ke Firestore. Pastikan konfigurasi Firebase sudah benar.");
        }
      }
    }
    testConnection();
  }, []);

  // 1. Firebase Auth Listener
  useEffect(() => {
    console.log("Setting up onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged fired. User:", user ? user.email : "null");
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (!user) {
        setCurrentUser(null);
        setIsSyncing(false);
      }
    }, (error) => {
      console.error("onAuthStateChanged error:", error);
      setIsAuthReady(true); // Still mark as ready so we don't stay stuck
      setDbError(`Auth error: ${error.message}`);
    });
    return () => unsubscribe();
  }, []);

  // 2. Map Firebase User to App Profile
  useEffect(() => {
    if (!firebaseUser) return;

    const userProfile = users.find(u => u.id === firebaseUser.uid || u.username === firebaseUser.email);
    if (userProfile) {
      setCurrentUser(userProfile);
    } else if (firebaseUser.email === "noviharyanto062@gmail.com") {
      // Bootstrap admin
      setCurrentUser({
        id: firebaseUser.uid,
        username: firebaseUser.email || 'admin',
        name: firebaseUser.displayName || 'Administrator',
        role: UserRole.ADMIN
      });
    }
  }, [firebaseUser, users]);

  // --- 1. SINKRONISASI USERS ---
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) {
      setIsUsersLoaded(false);
      return;
    }

    const path = 'users';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      if (data.length === 0 && firebaseUser?.email === "noviharyanto062@gmail.com") {
        // Initial Admin bootstrap if collection is empty
        const adminData = { 
          username: firebaseUser.email, 
          name: firebaseUser.displayName || 'Administrator', 
          role: UserRole.ADMIN, 
          password: '123' 
        };
        setDoc(doc(db, path, firebaseUser.uid), adminData).catch(err => console.error("Bootstrap error:", err));
      } else {
        setUsers(data);
      }
      setIsUsersLoaded(true);
    }, (error) => {
      setDbError(`Gagal memuat data pengguna: ${error.message}`);
      setIsSyncing(false);
      setIsUsersLoaded(true);
    });

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  // --- 2. SINKRONISASI LETTERS ---
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const path = 'letters';
    setIsSyncing(true);
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
      setLetters(data);
      setIsSyncing(false);
    }, (error) => {
      setDbError(`Gagal memuat data surat: ${error.message}`);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  // --- 3. SINKRONISASI AGENDAS ---
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const path = 'agendas';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
      setAgendas(data);
    }, (error) => {
      setDbError(`Gagal memuat data agenda: ${error.message}`);
    });

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  // --- 4. AUTH HANDLERS ---
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = (user: any) => {
    // onAuthStateChanged handles the state, but we can set tab here
    setActiveTab('dashboard');
  };

  // --- 5. DATA MUTATION HANDLERS ---
  const addLetter = async (letter: Omit<Letter, 'id' | 'createdAt' | 'createdBy'>) => {
    const path = 'letters';
    setDbError(null);
    try {
      const payload = sanitizeData({
        ...letter,
        createdAt: Date.now(),
        createdBy: currentUser?.name || 'Unknown'
      });
      await addDoc(collection(db, path), payload);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return false;
    }
  };

  const deleteLetter = async (id: string) => {
    const path = `letters/${id}`;
    if (confirm("Hapus arsip dari cloud?")) {
      try {
        await deleteDoc(doc(db, 'letters', id));
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
        return false;
      }
    }
    return false;
  };

  const updateLetter = async (updated: Letter) => {
    const { id, ...data } = updated;
    const path = `letters/${id}`;
    try {
      const payload = sanitizeData(data);
      await updateDoc(doc(db, 'letters', id), payload);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const saveAgendas = async (updatedList: Agenda[]) => {
    const path = 'agendas';
    try {
      for (const a of updatedList) {
        const { id, ...data } = a;
        const payload = sanitizeData({
          ...data,
          createdBy: a.createdBy || currentUser?.name || 'Unknown',
          createdAt: a.createdAt || Date.now()
        });
        
        if (id && id.length > 15) {
          await updateDoc(doc(db, path, id), payload);
        } else {
          await addDoc(collection(db, path), payload);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleUpdateUsers = async (updatedUsers: User[]) => {
    const path = 'users';
    try {
      // Find deleted users
      const currentIds = updatedUsers.map(u => u.id);
      const deletedUsers = users.filter(u => !currentIds.includes(u.id));
      
      for (const u of deletedUsers) {
        await deleteDoc(doc(db, path, u.id));
      }

      for (const u of updatedUsers) {
        const { id, ...data } = u;
        if (id && id.length > 15) {
          await updateDoc(doc(db, path, id), data);
        } else {
          await addDoc(collection(db, path), data);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (!currentUser) {
    const isInitialLoading = !isAuthReady || (firebaseUser && !isUsersLoaded);
    const isUnauthorized = firebaseUser && isUsersLoaded && !currentUser;

    return (
      <ErrorBoundary>
        {dbError && (
          <div className="fixed top-0 inset-x-0 bg-red-600 text-white p-2 text-center text-xs z-[200]">
            ⚠️ {dbError}
          </div>
        )}
        <Auth 
          onLogin={handleLogin} 
          isSyncing={isInitialLoading} 
          isUnauthorized={isUnauthorized}
          onLogout={handleLogout}
          firebaseUser={firebaseUser}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
                    ⚡ FIREBASE CONNECTED
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

          {activeTab === 'dashboard' && (
            <Dashboard 
              letters={letters} 
              users={users} 
              onViewFiles={setViewingFilesLetter} 
              onQuickScan={() => {
                setActiveTab('surat-masuk');
                setIsQuickScan(true);
              }}
            />
          )}
          
          {activeTab === 'surat-masuk' && (
            <LetterModule 
              type="INCOMING" 
              letters={letters.filter(l => l.type === 'INCOMING')} 
              onAdd={addLetter}
              onDelete={deleteLetter}
              onUpdate={updateLetter}
              onViewFiles={setViewingFilesLetter}
              defaultOpenScanner={isQuickScan}
              onScannerClose={() => setIsQuickScan(false)}
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
              onViewFiles={setViewingFilesLetter}
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

      {viewingFilesLetter && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Lampiran Berkas</h3>
                <p className="text-xs text-slate-500">{viewingFilesLetter.referenceNumber} - {viewingFilesLetter.subject}</p>
              </div>
              <button onClick={() => setViewingFilesLetter(null)} className="text-slate-400 hover:text-slate-600 p-2 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className="grid grid-cols-1 gap-8">
                {viewingFilesLetter.scannedImages?.map((img, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <span className="text-sm font-bold text-slate-600">Halaman {idx + 1}</span>
                      <a 
                        href={img} 
                        download={`Lampiran_${viewingFilesLetter.referenceNumber}_Hal_${idx+1}`}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Unduh Berkas
                      </a>
                    </div>
                    {img.startsWith('data:application/pdf') ? (
                      <iframe src={img} className="w-full h-[600px] rounded-lg border" title={`PDF Halaman ${idx + 1}`} />
                    ) : (
                      <img src={img} alt={`Lampiran ${idx + 1}`} className="w-full h-auto rounded-lg shadow-inner" referrerPolicy="no-referrer" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end">
              <button onClick={() => setViewingFilesLetter(null)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default App;
