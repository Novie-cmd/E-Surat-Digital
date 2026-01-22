
import React, { useRef, useState, useEffect } from 'react';

interface ScannerProps {
  onComplete: (images: string[]) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
        console.error(err);
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use higher resolution for capture
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImages(prev => [...prev, dataUrl]);
      }
    }
  };

  const removeCaptured = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Header Info */}
      <div className="w-full flex justify-between items-center text-white z-10">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <span className="text-2xl">✕</span>
        </button>
        <div className="text-center">
          <p className="font-bold text-lg">Scan Dokumen</p>
          <p className="text-xs text-slate-400">{capturedImages.length} Halaman Terambil</p>
        </div>
        <button 
          onClick={() => onComplete(capturedImages)} 
          disabled={capturedImages.length === 0}
          className="bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          Selesai
        </button>
      </div>

      {/* Viewfinder Container */}
      <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-800 my-4">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
            <span className="text-4xl mb-4">⚠️</span>
            <p className="font-bold">{error}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-white text-black rounded-xl font-bold">Tutup</button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-300 ${flash ? 'opacity-30' : 'opacity-100'}`}
            />
            {/* Viewfinder Overlay */}
            <div className="absolute inset-8 border-2 border-white/20 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500/50"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500/50"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500/50"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500/50"></div>
            </div>
            {flash && <div className="absolute inset-0 bg-white animate-pulse"></div>}
          </>
        )}
      </div>

      {/* Captured Gallery */}
      <div className="w-full max-w-2xl h-24 flex gap-3 overflow-x-auto pb-2 px-2 scrollbar-hide no-scrollbar">
        {capturedImages.map((img, idx) => (
          <div key={idx} className="relative flex-shrink-0 w-16 h-20 rounded-lg border-2 border-white/20 overflow-hidden group">
            <img src={img} className="w-full h-full object-cover" />
            <button 
              onClick={() => removeCaptured(idx)}
              className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-bl-lg flex items-center justify-center"
            >
              ✕
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-[8px] text-white text-center font-bold">{idx + 1}</div>
          </div>
        ))}
        {capturedImages.length === 0 && (
          <div className="w-full flex items-center justify-center text-slate-600 text-sm italic">
            Ambil foto dokumen untuk melihat pratinjau halaman
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="pb-4 flex flex-col items-center gap-4">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 hover:scale-105 active:scale-90 transition-all shadow-xl shadow-indigo-900/20"
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">📸</span>
          </div>
        </button>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ketuk untuk mengambil halaman</p>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Scanner;
