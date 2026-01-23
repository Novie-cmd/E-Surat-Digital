
import React, { useState, useMemo } from 'react';
import { Agenda, AgendaItem } from '../types';

interface AgendaModuleProps {
  agendas: Agenda[];
  onSave: (agendas: Agenda[]) => void;
  canManage: boolean;
}

const AgendaModule: React.FC<AgendaModuleProps> = ({ agendas, onSave, canManage }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [rawDate, setRawDate] = useState(''); // To hold YYYY-MM-DD from input[type="date"]
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Agenda>({
    id: '',
    dayDate: '',
    items: [],
    signedBy: 'Novi Haryanto, S. Adm',
    signedNip: '197111201991031003',
    createdAt: 0
  });

  const [newItem, setNewItem] = useState<Omit<AgendaItem, 'id'>>({
    time: '',
    location: '',
    event: '',
    dressCode: 'Menyesuaikan',
    remarks: ''
  });

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
    const dayName = days[date.getDay()];
    
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return `${dayName}/ ${formatter.format(date)}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawDate(value);
    setFormData(prev => ({
      ...prev,
      dayDate: formatIndonesianDate(value)
    }));
  };

  const handleAddItem = () => {
    if (!newItem.event) return;

    if (editingItemIndex !== null) {
      // Logic for editing existing item
      const updatedItems = [...formData.items];
      updatedItems[editingItemIndex] = {
        ...newItem,
        id: formData.items[editingItemIndex].id
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setEditingItemIndex(null);
    } else {
      // Logic for adding new item
      const item: AgendaItem = {
        ...newItem,
        id: Math.random().toString(36).substr(2, 9)
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    }

    setNewItem({
      time: '',
      location: '',
      event: '',
      dressCode: 'Menyesuaikan',
      remarks: ''
    });
  };

  const handleEditItemRequest = (index: number) => {
    const itemToEdit = formData.items[index];
    setNewItem({
      time: itemToEdit.time,
      location: itemToEdit.location,
      event: itemToEdit.event,
      dressCode: itemToEdit.dressCode,
      remarks: itemToEdit.remarks
    });
    setEditingItemIndex(index);
    // Scroll to input section for better UX
    document.getElementById('item-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditItem = () => {
    setEditingItemIndex(null);
    setNewItem({
      time: '',
      location: '',
      event: '',
      dressCode: 'Menyesuaikan',
      remarks: ''
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    if (editingItemIndex !== null) setEditingItemIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedAgendas;
    if (editingAgenda) {
      updatedAgendas = agendas.map(a => a.id === editingAgenda.id ? { ...formData } : a);
    } else {
      updatedAgendas = [{ ...formData, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }, ...agendas];
    }
    onSave(updatedAgendas);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: '',
      dayDate: '',
      items: [],
      signedBy: 'Novi Haryanto, S. Adm',
      signedNip: '197111201991031003',
      createdAt: 0
    });
    setRawDate('');
    setEditingAgenda(null);
    setEditingItemIndex(null);
  };

  const handleEdit = (agenda: Agenda) => {
    setFormData(agenda);
    setEditingAgenda(agenda);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus agenda ini?')) {
      onSave(agendas.filter(a => a.id !== id));
    }
  };

  const handlePrint = (agenda: Agenda) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = agenda.items.map((item, idx) => {
      const remarksList = item.remarks.split('\n').filter(r => r.trim()).map(r => `<li>${r}</li>`).join('');
      return `
        <tr>
          ${idx === 0 ? `<td rowspan="${agenda.items.length}" style="border: 1px solid black; padding: 10px; vertical-align: top; text-align: center; font-weight: bold;">${agenda.dayDate}</td>` : ''}
          <td style="border: 1px solid black; padding: 10px; text-align: center;">${item.time}</td>
          <td style="border: 1px solid black; padding: 10px;">${item.location}</td>
          <td style="border: 1px solid black; padding: 10px;">${item.event}</td>
          <td style="border: 1px solid black; padding: 10px; text-align: center;">${item.dressCode}</td>
          <td style="border: 1px solid black; padding: 10px;">
            <ul style="margin: 0; padding-left: 20px;">${remarksList}</ul>
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Agenda Kepala Dinas</title>
          <style>
            @page { size: landscape; margin: 1cm; }
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
            .header p { margin: 5px 0; font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { border: 1px solid black; padding: 8px; background: #f0f0f0; text-transform: uppercase; }
            .footer { margin-top: 40px; margin-left: 70%; text-align: center; }
            .signature-box { margin-top: 60px; font-weight: bold; text-decoration: underline; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>AGENDA KEPALA DINAS</h2>
            <h2>DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU</h2>
            <h2>PROVINSI NUSA TENGGARA BARAT</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">HARI/TANGGAL</th>
                <th style="width: 10%;">WAKTU</th>
                <th style="width: 15%;">TEMPAT</th>
                <th style="width: 30%;">ACARA/KEGIATAN</th>
                <th style="width: 15%;">PAKAIAN</th>
                <th style="width: 15%;">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            <p>Mengetahui,</p>
            <p>Kepala Sub Bagian Umum</p>
            <div class="signature-box">${agenda.signedBy}</div>
            <p style="margin-top: 5px;">${agenda.signedNip}</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl font-bold text-slate-800">Daftar Agenda</h2>
        {canManage && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md"
          >
            + Buat Agenda Harian
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {agendas.length > 0 ? agendas.map(agenda => (
          <div key={agenda.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-600 font-bold">{agenda.dayDate}</p>
                <p className="text-xs text-slate-500">{agenda.items.length} Kegiatan Terjadwal</p>
              </div>
              <span className="text-2xl">🗓️</span>
            </div>
            <div className="space-y-2 border-t pt-3">
               {agenda.items.slice(0, 2).map(item => (
                 <p key={item.id} className="text-sm text-slate-600 truncate">• {item.time} - {item.event}</p>
               ))}
               {agenda.items.length > 2 && <p className="text-xs text-slate-400 italic">+{agenda.items.length - 2} lainnya...</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handlePrint(agenda)}
                title="Cetak/Preview Agenda"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-xs"
              >
                🖨️ Pratinjau
              </button>
              {canManage && (
                <>
                  <button onClick={() => handleEdit(agenda)} title="Edit" className="bg-indigo-50 text-indigo-600 p-2 rounded-lg text-xs">📝</button>
                  <button onClick={() => handleDelete(agenda.id)} title="Hapus" className="bg-red-50 text-red-500 p-2 rounded-lg text-xs">🗑️</button>
                </>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Belum ada agenda kegiatan yang dibuat.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl my-auto animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20 rounded-t-3xl">
              <h3 className="text-xl font-bold text-slate-800">{editingAgenda ? 'Ubah' : 'Buat'} Agenda Harian</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Tanggal Agenda</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="date"
                      required 
                      value={rawDate} 
                      onChange={handleDateChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                    {formData.dayDate && (
                      <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                        Format Tampilan: <span className="underline">{formData.dayDate}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Penandatangan (Kasubag Umum)</label>
                  <input 
                    required 
                    value={formData.signedBy} 
                    onChange={e => setFormData({...formData, signedBy: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div id="item-form-anchor" className={`${editingItemIndex !== null ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'} p-6 rounded-2xl space-y-4 border transition-colors duration-300`}>
                <div className="flex justify-between items-center">
                  <h4 className={`font-bold ${editingItemIndex !== null ? 'text-indigo-700' : 'text-slate-700'} text-sm uppercase tracking-wider`}>
                    {editingItemIndex !== null ? '📝 Edit Item Kegiatan' : 'Tambah Item Kegiatan'}
                  </h4>
                  {editingItemIndex !== null && (
                    <button type="button" onClick={cancelEditItem} className="text-xs font-bold text-red-500 hover:underline">Batal Edit</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Waktu</label>
                    <input 
                      placeholder="e.g. 08.00" 
                      value={newItem.time}
                      onChange={e => setNewItem({...newItem, time: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat</label>
                    <input 
                      placeholder="e.g. Ruang Rapat" 
                      value={newItem.location}
                      onChange={e => setNewItem({...newItem, location: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pakaian</label>
                    <input 
                      placeholder="e.g. Menyesuaikan" 
                      value={newItem.dressCode}
                      onChange={e => setNewItem({...newItem, dressCode: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acara / Kegiatan</label>
                  <textarea 
                    placeholder="Ketik detail acara..." 
                    value={newItem.event}
                    onChange={e => setNewItem({...newItem, event: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:ring-1 focus:ring-indigo-300"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan / Peserta</label>
                  <textarea 
                    placeholder="Gunakan baris baru untuk daftar peserta (e.g. Kadis)" 
                    value={newItem.remarks}
                    onChange={e => setNewItem({...newItem, remarks: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:ring-1 focus:ring-indigo-300"
                    rows={2}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className={`w-full py-2.5 ${editingItemIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-[0.98]`}
                >
                  {editingItemIndex !== null ? '💾 Simpan Perubahan Item' : '+ Tambahkan ke Daftar'}
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 text-sm">Daftar Kegiatan ({formData.items.length}):</h4>
                <div className="overflow-hidden border border-slate-100 rounded-xl shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-[10px] uppercase text-slate-400 font-bold">Waktu</th>
                        <th className="px-4 py-2 text-[10px] uppercase text-slate-400 font-bold">Acara</th>
                        <th className="px-4 py-2 text-[10px] uppercase text-slate-400 font-bold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, idx) => (
                        <tr key={item.id} className={editingItemIndex === idx ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{item.time}</td>
                          <td className="px-4 py-3 text-slate-700">{item.event}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                type="button" 
                                onClick={() => handleEditItemRequest(idx)} 
                                title="Edit Item"
                                className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                              >
                                ✏️
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveItem(item.id)} 
                                title="Hapus Item"
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Belum ada item ditambahkan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white rounded-b-3xl">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
              <button 
                type="submit" 
                onClick={(e) => {
                  const form = (e.target as HTMLButtonElement).closest('div')?.previousSibling as HTMLFormElement;
                  if (form && form.checkValidity()) {
                    handleSubmit(e as any);
                  } else {
                    form?.reportValidity();
                  }
                }}
                disabled={formData.items.length === 0 || !formData.dayDate}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
              >
                Simpan Agenda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaModule;
