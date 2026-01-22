
export enum UserRole {
  ADMIN = 'ADMIN',
  STAF_MASUK = 'STAF_MASUK',
  STAF_KELUAR = 'STAF_KELUAR'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export type LetterType = 'INCOMING' | 'OUTGOING';

export interface DispositionAssignment {
  recipient: string;
  status: 'Menunggu' | 'Proses' | 'Selesai';
}

export interface Disposition {
  assignments: DispositionAssignment[];
  instruction: string;
  date: string;
}

export interface Letter {
  id: string;
  type: LetterType;
  referenceNumber: string;
  date: string;
  sender: string;
  subject: string;
  description?: string;
  fileUrl?: string;
  scannedImages?: string[];
  createdAt: number;
  disposition?: Disposition;
}

export interface AgendaItem {
  id: string;
  time: string;
  location: string;
  event: string;
  dressCode: string;
  remarks: string; // Digunakan untuk daftar peserta (Kadis, dll)
}

export interface Agenda {
  id: string;
  dayDate: string; // Contoh: "Jum'at/ 23 Januari 2026"
  items: AgendaItem[];
  signedBy?: string; // Nama penandatangan
  signedNip?: string; // NIP penandatangan
  createdAt: number;
}

export interface AppState {
  currentUser: User | null;
  letters: Letter[];
  users: User[];
  agendas: Agenda[];
}
