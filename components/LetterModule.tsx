
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
    if (!printWindow) {
      alert('Mohon izinkan pop-up untuk mencetak surat.');
      return;
    }

    const dispositionHtml = letter.disposition ? `
      <div class="disposition-section">
        <h3 class="disposition-title">LEMBAR DISPOSISI</h3>
        <div class="disposition-meta">
          <p><strong>Instruksi Pimpinan:</strong></p>
          <div class="instruction-box">${letter.disposition.instruction || '-'}</div>
        </div>
        <table class="disposition-table">
          <thead>
            <tr>
              <th width="50">No</th>
              <th>Penerima / Jabatan</th>
              <th width="150">Status</th>
            </tr>
          </thead>
          <tbody>
            ${letter.disposition.assignments.map((asgn, i) => `
              <tr>
                <td align="center">${i + 1}</td>
                <td>${asgn.recipient}</td>
                <td align="center">${asgn.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const attachmentsHtml = (letter.scannedImages && letter.scannedImages.length > 0) ? `
      <div class="page-break"></div>
      <div class="attachments-section">
        <h3 class="section-title">LAMPIRAN BERKAS</h3>
        <div class="images-grid">
          ${letter.scannedImages.map((img, idx) => `
            <div class="attachment-item">
              <p class="img-label">Halaman ${idx + 1}</p>
              <img src="${img}" style="max-width: 100%; border: 1px solid #ddd; margin-bottom: 20px;" />
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Surat - ${letter.referenceNumber}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; margin: 0; padding: 0; }
            .letter-container { padding: 0; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; position: relative; }
            .header h1 { margin: 0; font-size: 20pt; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { margin: 0; font-size: 16pt; text-transform: uppercase; }
            .header p { margin: 5px 0 0 0; font-size: 10pt; font-style: italic; }
            
            .info-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .info-table td { padding: 5px 0; vertical-align: top; font-size: 11pt; }
            .info-table td.label { width: 120px; }
            .info-table td.colon { width: 20px; text-align: center; }

            .content-section { text-align: justify; margin-bottom: 40px; font-size: 11pt; }
            .content-title { font-weight: bold; margin-bottom: 10px; text-decoration: underline; }
            
            .disposition-section { margin-top: 50px; border: 2px solid #000; padding: 20px; page-break-inside: avoid; }
            .disposition-title { text-align: center; margin-top: 0; text-decoration: underline; font-size: 14pt; margin-bottom: 20px; }
            .instruction-box { min-height: 60px; border: 1px solid #ccc; padding: 10px; margin: 10px 0 20px 0; background: #fafafa; }
            .disposition-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .disposition-table th, .disposition-table td { border: 1px solid #000; padding: 8px; font-size: 10pt; }
            .disposition-table th { background: #f0f0f0; }

            .footer-info { margin-top: 60px; float: right; width: 250px; text-align: center; font-size: 11pt; }
            .footer-info p { margin: 0; }
            .footer-info .sign-space { height: 80px; }

            .page-break { page-break-before: always; }
            .section-title { border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 20px; text-align: center; }
            .attachment-item { text-align: center; margin-bottom: 30px; }
            .img-label { font-weight: bold; font-size: 10pt; color: #666; margin-bottom: 5px; }

            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="letter-container">
            <div class="header">
              <h1>PEMERINTAH PROVINSI NTB</h1>
              <h2>DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK</h2>
              <p>Jl. Administrasi Digital No. 1, Mataram | Telp: (0370) 123456 | Website: www.ntbprov.go.id</p>
            </div>

            <table class="info-table">
              <tr>
                <td class="label">Nomor Surat</td>
                <td class="colon">:</td>
                <td><strong>${letter.referenceNumber}</strong></td>
              </tr>
              <tr>
                <td class="label">Tanggal Surat</td>
                <td class="colon">:</td>
                <td>${new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
              <tr>
                <td class="label">${letter.type === 'INCOMING' ? 'Asal Surat' : 'Tujuan Surat'}</td>
                <td class="colon">:</td>
                <td>${letter.sender}</td>
              </tr>
              <tr>
                <td class="label">Perihal</td>
                <td class="colon">:</td>
                <td><strong>${letter.subject}</strong></td>
              </tr>
            </table>

            <div class="content-section">
              <p class="content-title">Ringkasan / Isi Surat:</p>
              <div style="white-space: pre-wrap;">${letter.description || 'Tidak ada ringkasan isi surat yang tersedia.'}</div>
            </div>

            <div class="footer-info">
              <p>Mataram, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>Petugas Arsip,</p>
              <div class="sign-space"></div>
              <p><strong>( ${letter.createdBy || 'Administrator'} )</strong></p>
            </div>

            <div style="clear: both;"></div>

            ${dispositionHtml}
          </div>

          ${attachmentsHtml}

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
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

                          <button onClick={() => handlePrint(letter)} className="text-slate-400 hover:text-indigo-600 p-1" title="Cetak Surat">🖨️</button>
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
