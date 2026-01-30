
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
    disposition: undefined as Disposition | undefined
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
      disposition: undefined
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
      disposition: letter.disposition
    });
    setShowDisposition(!!letter.disposition);
    setEditingLetter(letter);
    setShowForm(true);
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

    const imageAttachments = (letter.scannedImages || [])
      .filter(img => !img.startsWith('data:application/pdf'))
      .map(img => `<img src="${img}" style="max-width: 100%; margin-bottom: 20px; display: block;" />`)
      .join('');

    const pdfAttachmentsCount = (letter.scannedImages || [])
      .filter(img => img.startsWith('data:application/pdf')).length;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Surat - ${letter.referenceNumber}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info-table { width: 100%; margin-bottom: 20px; }
            .info-table td { padding: 5px 0; vertical-align: top; }
            .attachments-section { page-break-before: always; }
            .pdf-notice { padding: 10px; border: 1px dashed #666; background: #f9f9f9; margin-top: 10px; }
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
            <br><br><br>
            <p>( __________________________ )</p>
            <p>Petugas Arsip</p>
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
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        if (!isValidType) {
          alert(`File ${file.name} tidak didukung. Gunakan JPG/PNG atau PDF.`);
          return;
        }

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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    
    setFormData({
      ...formData,
      disposition: {
        ...currentDisp,
        assignments: [...currentDisp.assignments, newAssignment]
      }
    });
    setNewRecipient('');
  };

  const removeRecipient = (index: number) => {
    if (!formData.disposition) return;
    const updatedAssignments = formData.disposition.assignments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      disposition: {
        ...formData.disposition,
        assignments: updatedAssignments
      }
    });
  };

  const updateAssignmentStatus = (index: number, status: DispositionAssignment['status']) => {
    if (!formData.disposition) return;
    const updatedAssignments = [...formData.disposition.assignments];
    updatedAssignments[index].status = status;
    setFormData({
      ...formData,
      disposition: {
        ...formData.disposition,
        assignments: updatedAssignments
      }
    });
  };

  const updateInstruction = (instruction: string) => {
    const currentDisp = formData.disposition || { assignments: [], instruction: '', date: new Date().toISOString().split('T')[0] };
    setFormData({
      ...formData,
      disposition: { ...currentDisp, instruction }
    });
  };

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div className="relative flex-1 max-w-xs">
           <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
           <input 
            type="text" 
            placeholder="Cari nomor/perihal..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
           />
        </div>
        {canManage && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
          >
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Perihal / Petugas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Arsip Digital</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {letters.length > 0 ? (
                letters.map(letter => (
                  <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{new Date(letter.date).toLocaleDateString('id-ID')}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{letter.referenceNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{letter.sender}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 line-clamp-1 font-medium">{letter.subject}</p>
                      <p className="text-[10px] text-indigo-500 font-bold mt-1">👤 Oleh: {letter.createdBy || 'Sistem'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {letter.scannedImages && letter.scannedImages.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {letter.scannedImages.slice(0, 3).map((file, i) => (
                              <div key={i} className="w-8 h-8 rounded-md border-2 border-white overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                                {file.startsWith('data:application/pdf') ? (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 w-full h-full flex items-center justify-center">PDF</span>
                                ) : (
                                  <img src={file} className="w-full h-full object-cover" />
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {letter.scannedImages.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Tanpa Berkas</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handlePrint(letter)} 
                        title="Cetak/Preview"
                        className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        🖨️
                      </button>
                      {canManage && (
                        <>
                          <button onClick={() => handleEdit(letter)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold px-3 py-1 hover:bg-indigo-50 rounded-lg transition-colors">Ubah</button>
                          <button onClick={() => onDelete(letter.id)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 hover:bg-red-50 rounded-lg transition-colors">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Belum ada data surat tersedia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-y-auto max-h-[95vh] animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{editingLetter ? '📁' : '📥'}</span>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingLetter ? 'Ubah Data' : 'Arsip Baru'} {type === 'INCOMING' ? 'Surat Masuk' : 'Surat Keluar'}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nomor Surat</label>
                  <input 
                    required 
                    value={formData.referenceNumber} 
                    onChange={e => setFormData({...formData, referenceNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Contoh: 001/A1/DISDIK/2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tanggal Surat</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{type === 'INCOMING' ? 'Pengirim (Instansi/Personal)' : 'Penerima / Tujuan'}</label>
                <input 
                  required 
                  value={formData.sender} 
                  onChange={e => setFormData({...formData, sender: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder={type === 'INCOMING' ? "Nama Instansi Asal" : "Nama Instansi Tujuan"}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Unggah Lampiran (JPG/PNG atau PDF)</label>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*,application/pdf" 
                      onChange={handleFileUpload}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm transition-colors"
                    >
                      📁 Unggah Berkas
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowScanner(true)}
                      className="text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
                    >
                      📸 Kamera HP
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl min-h-[140px]">
                  {formData.scannedImages.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {formData.scannedImages.map((file, idx) => (
                        <div key={idx} className="relative group w-28 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg border-2 border-white bg-white">
                          {file.startsWith('data:application/pdf') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-2 text-center">
                              <span className="text-3xl mb-1">📄</span>
                              <span className="text-[10px] font-bold">PDF</span>
                            </div>
                          ) : (
                            <img src={file} className="w-full h-full object-cover" />
                          )}
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm shadow-xl hover:bg-red-700 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white text-center py-1 font-bold">{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <p className="text-xs font-bold uppercase tracking-widest">Belum ada lampiran</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Perihal</label>
                <input 
                  required 
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800" 
                  placeholder="Ringkasan perihal surat"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Isi Ringkas / Deskripsi</label>
                  <button 
                    type="button" 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isAnalyzing ? 'Proses...' : '✨ Analisis AI'}
                  </button>
                </div>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                  placeholder="Ringkasan isi surat..."
                />
              </div>

              {type === 'INCOMING' && (
                <div className="border-2 border-dashed border-amber-200 rounded-2xl p-6 bg-amber-50/10 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-bold text-amber-900 flex items-center gap-2">
                      <span className="text-xl">📋</span> Lembar Disposisi Digital
                    </h3>
                    {!showDisposition && (
                      <button 
                        type="button" 
                        onClick={() => setShowDisposition(true)}
                        className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl transition-all shadow-md"
                      >
                        Buka Disposisi
                      </button>
                    )}
                  </div>

                  {showDisposition && (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <input 
                            value={newRecipient}
                            onChange={e => setNewRecipient(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                            className="flex-1 px-4 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white" 
                            placeholder="Unit / Jabatan Penerima..."
                          />
                          <button 
                            type="button" 
                            onClick={addRecipient}
                            className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 shadow-sm"
                          >
                            Tambah
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="bg-white border border-amber-100 rounded-xl divide-y divide-amber-50 overflow-hidden shadow-sm">
                          {formData.disposition?.assignments && formData.disposition.assignments.length > 0 ? (
                            formData.disposition.assignments.map((asgn, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 hover:bg-amber-50/30 transition-colors">
                                <span className="text-sm font-medium text-slate-700">{asgn.recipient}</span>
                                <div className="flex items-center gap-3">
                                  <select 
                                    value={asgn.status}
                                    onChange={e => updateAssignmentStatus(idx, e.target.value as any)}
                                    className="text-xs border-none bg-amber-50 text-amber-800 rounded-lg px-2 py-1 font-bold"
                                  >
                                    <option value="Menunggu">Menunggu</option>
                                    <option value="Proses">Proses</option>
                                    <option value="Selesai">Selesai</option>
                                  </select>
                                  {isAdmin && (
                                    <button type="button" onClick={() => removeRecipient(idx)} className="text-red-300 hover:text-red-500 transition-colors p-1">✕</button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-center text-xs text-slate-400 italic">Belum ada unit kerja ditunjuk.</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Instruksi:</label>
                        <textarea 
                          readOnly={!isAdmin}
                          rows={2} 
                          value={formData.disposition?.instruction || ''}
                          onChange={e => updateInstruction(e.target.value)}
                          className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm resize-none shadow-sm" 
                          placeholder="Instruksi pimpinan..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white py-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all">
                  {editingLetter ? 'Simpan Perubahan' : 'Simpan Arsip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <Scanner 
          onComplete={handleScannerComplete}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default LetterModule;
