
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Catatan: Gunakan environment variables untuk keamanan
// Untuk keperluan demo ini, pastikan variabel ini diatur di sistem Anda
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan
export const db = getFirestore(app);
export const storage = getStorage(app);
