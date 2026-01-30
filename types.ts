
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
  password?: string; // Menambahkan password untuk keamanan
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
  createdBy?: string; // Nama user yang menginput
  disposition?: Disposition;
}

export interface AgendaItem {
  id: string;
  time: string;
  location: string;
  event: string;
  dressCode: string;
  remarks: string;
}

export interface Agenda {
  id: string;
  dayDate: string;
  items: AgendaItem[];
  signedBy?: string;
  signedNip?: string;
  createdAt: number;
  createdBy?: string; // Nama user yang menginput
}

export interface AppState {
  currentUser: User | null;
  letters: Letter[];
  users: User[];
  agendas: Agenda[];
}
