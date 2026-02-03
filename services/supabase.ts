
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Pastikan variabel bukan string "undefined" atau kosong sebelum inisialisasi
const isValidConfig = (val: string | undefined): val is string => {
  return !!val && val !== 'undefined' && val !== 'null' && val.trim() !== '';
};

export const supabase = (isValidConfig(supabaseUrl) && isValidConfig(supabaseKey))
  ? createClient(supabaseUrl, supabaseKey)
  : null as any; // Cast as any agar tidak merusak type checking di tempat lain yang sudah diproteksi isSupabaseConfigured

if (!supabase) {
  console.warn("Supabase client not initialized: Missing or invalid credentials.");
}
