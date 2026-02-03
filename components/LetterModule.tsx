
import React, { useState, useRef } from 'react';
import { Letter, LetterType, Disposition, UserRole, DispositionAssignment } from '../types';
import { analyzeLetter } from '../services/geminiService';
import Scanner from './Scanner';

interface LetterModuleProps {
  type: LetterType;
  letters: Letter[];
  onAdd: (letter: Omit<Letter, 'id' | 'createdAt' | 'createdBy'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (letter: Letter) => void;
  canManage: boolean;
  userRole?: UserRole;
}

const LetterModule: React.FC<LetterModuleProps> = ({ type, letters, onAdd, onDelete, onUpdate, canManage, userRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    sender: '',
    subject: '',
    description: '',
    scannedImages: [] as string[],
    disposition: undefined as Disposition | undefined,
    check1: false,
    check2: false
  });

  const handleAnalyze = async () => {
    if (!formData.description) {
      alert('Harap isi deskripsi surat untuk dianalisis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeLetter(formData.description);
      if (result) {
        setFormData(prev => ({
          ...prev,
          description: `Analisis AI:\nRingkasan: ${result.summary}\nKategori: ${result.category}\nPrioritas: ${result.priority}\n\n${prev.description}`
        }));
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert('Gagal menganalisis surat.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLetter) {
      onUpdate({ ...editingLetter, ...formData });
      setEditingLetter(null);
    } else {
      onAdd({ ...formData, type });
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0],
      sender: '',
      subject: '',
      description: '',
      scannedImages: [],
      disposition: undefined,
      check1: false,
      check2: false
    });
    setNewRecipient('');
    setShowDisposition(false);
  };

  const handleEdit = (letter: Letter) => {
    setFormData({
      referenceNumber: letter.referenceNumber,
      date: letter.date,
      sender: letter.sender,
      subject: letter.subject,
      description: letter.description || '',
      scannedImages: letter.scannedImages || [],
      disposition: letter.disposition,
      check1: letter.check1 || false,
      check2: letter.check2 || false
    });
    setShowDisposition(!!letter.disposition);
    setEditingLetter(letter);
    setShowForm(true);
  };

  const toggleCheck = (letter: Letter, field: 'check1' | 'check2') => {
    onUpdate({
      ...letter,
      [field]: !letter[field]
    });
  };

  const handlePrint = (letter: Letter) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dispositionHtml = letter.disposition ? `
      <div style="margin-top: 30px; border: 2px solid #000; padding: 15px;">
        <h3 style="text-align: center; margin-top: 0; text-decoration: underline;">LEMBAR DISPOSISI</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="border-bottom: 1px solid #000;">
            <td style="padding: 8px; font-weight: bold; width: 30%;">Instruksi Pimpinan:</td>
            <td style="padding: 8px;">${letter.disposition.instruction || '-'}</td>
          </tr>
        </table>
        <h4 style="margin-bottom: 5px;">Diteruskan Kepada:</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #000; padding: 5px;">No</th>
              <th style="border: 1px solid #000; padding: 5px;">Penerima / Jabatan</th>
              <th style="border: 1px solid #000; padding: 5px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${letter.disposition.assignments.map((asgn, i) => `
              <tr>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${i + 1}</td>
                <td style="border: 1px solid #000; padding: 5px;">${asgn.recipient}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${asgn.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Surat - ${letter.referenceNumber}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info-table { width: 100%; margin-bottom: 20px; }
            .info-table td { padding: 5px 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">INSTANSI PEMERINTAH REPUBLIK INDONESIA</h2>
            <p style="margin: 5px 0;">Jl. Administrasi Digital No. 1, Jakarta | Telp: (021) 123456</p>
          </div>
          <table class="info-table">
            <tr><td style="width: 150px;">Nomor Surat</td><td>: ${letter.referenceNumber}</td></tr>
            <tr><td>Tanggal</td><td>: ${new Date(letter.date).toLocaleDateString('id-ID')}</td></tr>
            <tr><td>Asal/Tujuan</td><td>: ${letter.sender}</td></tr>
            <tr><td>Perihal</td><td>: <strong>${letter.subject}</strong></td></tr>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Ringkasan Isi:</strong></p>
            <p style="text-align: justify;">${letter.description || 'Tidak ada ringkasan.'}</p>
          </div>
          ${dispositionHtml}
          <div style="margin-top: 50px; text-align: right;">
            <p>Diinput oleh: ${letter.createdBy || 'Sistem'}</p>
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            scannedImages: [...prev.scannedImages, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      scannedImages: prev.scannedImages.filter((_, i) => i !== idx)
    }));
  };

  const handleScannerComplete = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      scannedImages: [...prev.scannedImages, ...images]
    }));
    setShowScanner(false);
  };

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    const currentDisp = formData.disposition || { assignments: [], instruction: '', date: new Date().toISOString().split('T')[0] };
    const newAssignment: DispositionAssignment = { recipient: newRecipient.trim(), status: 'Menunggu' };
    setFormData({ ...formData, disposition: { ...currentDisp, assignments: [...currentDisp.assignments, newAssignment] } });
    setNewRecipient('');
  };

  const updateAssignmentStatus = (index: number, status: DispositionAssignment['status']) => {
    if (!formData.disposition) return;
    const updatedAssignments = [...formData.disposition.assignments];
    updatedAssignments[index].status = status;
    setFormData({ ...formData, disposition: { ...formData.disposition, assignments: updatedAssignments } });
  };

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div className="relative flex-1 max-w-xs">
           <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
           <input type="text" placeholder="Cari nomor/perihal..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm" />
        </div>
        {canManage && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
            <span>+</span> {type === 'INCOMING' ? 'Input Surat Masuk' : 'Input Surat Keluar'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl / No. Surat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{type === 'INCOMING' ? 'Pengirim' : 'Penerima'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Perihal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Arsip</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {letters.length > 0 ? (
                letters.map(letter => {
                  // Logika Warna Huruf: 
                  // Prioritas 1: check2 (Pink)
                  // Prioritas 2: check1 (Blue)
                  // Default: Slate-800
                  const rowTextColor = letter.check2 
                    ? 'text-pink-600 font-medium' 
                    : letter.check1 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-slate-800';

                  return (
                    <tr key={letter.id} className={`hover:bg-slate-50/50 transition-colors ${rowTextColor}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{new Date(letter.date).toLocaleDateString('id-ID')}</p>
                        <p className="text-[10px] opacity-60 font-mono mt-0.5">{letter.referenceNumber}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{letter.sender}</td>
                      <td className="px-6 py-4">
                        <p className="line-clamp-1 font-medium">{letter.subject}</p>
                        <p className="text-[10px] opacity-60 mt-1">👤 {letter.createdBy || 'Sistem'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {letter.scannedImages && letter.scannedImages.length > 0 ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                            {letter.scannedImages.length} Berkas
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Kosong</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* 2 Checklist Tambahan */}
                          <div className="flex gap-2 mr-2 border-r border-slate-100 pr-3">
                            <label className="flex items-center gap-1 cursor-pointer group" title="Tandai Status 1 (Biru)">
                              <input 
                                type="checkbox" 
                                checked={!!letter.check1} 
                                onChange={() => toggleCheck(letter, 'check1')}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group" title="Tandai Status 2 (Pink)">
                              <input 
                                type="checkbox" 
                                checked={!!letter.check2} 
                                onChange={() => toggleCheck(letter, 'check2')}
                                className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                              />
                            </label>
                          </div>

                          <button onClick={() => handlePrint(letter)} className="text-slate-400 hover:text-indigo-600 p-1">🖨️</button>
                          {canManage && (
                            <>
                              <button onClick={() => handleEdit(letter)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold px-2 py-1">Ubah</button>
                              <button onClick={() => onDelete(letter.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1">Hapus</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Belum ada data surat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-y-auto max-h-[95vh] animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingLetter ? 'Ubah Data' : 'Arsip Baru'} {type === 'INCOMING' ? 'Surat Masuk' : 'Surat Keluar'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Nomor Surat" />
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>

              <input required value={formData.sender} onChange={e => setFormData({...formData, sender: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder={type === 'INCOMING' ? "Pengirim" : "Penerima"} />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Lampiran Berkas</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">📁 File</button>
                    <button type="button" onClick={() => setShowScanner(true)} className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">📸 Kamera</button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl min-h-[100px] flex flex-wrap gap-2">
                  {formData.scannedImages.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-24 bg-white rounded-lg shadow-sm border overflow-hidden">
                      {file.startsWith('data:application/pdf') ? <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs">PDF</div> : <img src={file} className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-[10px]">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" placeholder="Perihal" />

              <div className="space-y-2">
                <div className="flex justify-between">
                   <label className="text-sm font-bold text-slate-700">Isi Ringkas</label>
                   <button type="button" onClick={handleAnalyze} disabled={isAnalyzing} className="text-xs font-bold text-indigo-600">✨ Analisis AI</button>
                </div>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" placeholder="Ringkasan isi..." />
              </div>

              {type === 'INCOMING' && (
                <div className="border border-amber-200 rounded-2xl p-6 bg-amber-50/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-bold text-amber-900">📋 Lembar Disposisi</h3>
                    {!showDisposition && <button type="button" onClick={() => setShowDisposition(true)} className="text-xs font-bold text-white bg-amber-600 px-4 py-2 rounded-xl">Buka Disposisi</button>}
                  </div>

                  {showDisposition && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <input value={newRecipient} onChange={e => setNewRecipient(e.target.value)} className="flex-1 px-4 py-2 border rounded-xl text-sm outline-none" placeholder="Penerima..." />
                          <button type="button" onClick={addRecipient} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Tambah</button>
                        </div>
                      )}
                      <div className="bg-white border rounded-xl divide-y">
                        {formData.disposition?.assignments.map((asgn, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3">
                            <span className="text-sm font-medium">{asgn.recipient}</span>
                            <select value={asgn.status} onChange={e => updateAssignmentStatus(idx, e.target.value as any)} className="text-xs border-none bg-amber-50 rounded-lg px-2 py-1">
                              <option value="Menunggu">Menunggu</option>
                              <option value="Proses">Proses</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-slate-500 font-bold">Batal</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Simpan Arsip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && <Scanner onComplete={handleScannerComplete} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default LetterModule;
