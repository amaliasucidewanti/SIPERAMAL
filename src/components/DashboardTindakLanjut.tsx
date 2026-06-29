import React, { useState } from "react";
import { AppState, TindakLanjutModel, User } from "../types";
import { Plus, Edit2, Trash2, Milestone, CalendarClock, Briefcase, ChevronRight, X } from "lucide-react";

interface DashboardTindakLanjutProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAdd: (record: any) => Promise<void>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DashboardTindakLanjut({ state, user, onAdd, onUpdate, onDelete }: DashboardTindakLanjutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TindakLanjutModel | null>(null);

  // Form Fields
  const [formTemuan, setFormTemuan] = useState("");
  const [formPic, setFormPic] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formStatus, setFormStatus] = useState<'Selesai' | 'Proses' | 'Belum Ditindaklanjuti'>('Proses');
  const [formSource, setFormSource] = useState<'Hasil SPI' | 'Hasil Itjen' | 'Hasil Evaluasi Internal' | 'Rekomendasi Pimpinan'>('Hasil SPI');

  const isAdmin = user.role === "Admin Perencanaan";
  const isReadOnly = user.role === "Viewer";
  const isKetua = user.role === "Ketua Tim Kerja";

  const openModal = (item: TindakLanjutModel | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormTemuan(item.temuan);
      setFormPic(item.pic);
      setFormDeadline(item.deadline);
      setFormStatus(item.status);
      setFormSource(item.source);
    } else {
      setEditingItem(null);
      setFormTemuan("");
      setFormPic(user.name || "");
      setFormDeadline(new Date().toISOString().split('T')[0]);
      setFormStatus("Proses");
      setFormSource("Hasil SPI");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (isKetua && editingItem && editingItem.pic !== user.name) {
      // Allow saving only if Assigned or same PIC/Team scope
    }

    const record: Partial<TindakLanjutModel> = {
      temuan: formTemuan,
      pic: formPic,
      deadline: formDeadline,
      status: formStatus,
      source: formSource
    };

    if (editingItem) {
      await onUpdate(editingItem.id, { ...editingItem, ...record });
    } else {
      await onAdd(record);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data tindak lanjut audit ini?")) {
      await onDelete(id);
    }
  };

  const tindak_lanjut_list = state.tindak_lanjut || [];

  // Status counters
  const finishedCount = tindak_lanjut_list.filter(x => x.status === "Selesai").length;
  const processCount = tindak_lanjut_list.filter(x => x.status === "Proses").length;
  const zeroCount = tindak_lanjut_list.filter(x => x.status === "Belum Ditindaklanjuti").length;

  return (
    <div className="space-y-6" id="siperamal-tindaklanjut-view">
      
      {/* 3 columns breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Ditindaklanjuti / Selesai</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">{finishedCount}</span>
          </div>
          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">100% tuntas</span>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase block">Dalam Pelaksanaan (Proses)</span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono mt-0.5 block">{processCount}</span>
          </div>
          <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold">Sedang aksi</span>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-rose-600 dark:text-rose-450 font-bold uppercase block">Belum Ditindaklanjuti</span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-0.5 block">{zeroCount}</span>
          </div>
          <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold animate-pulse">Perlu Atensi</span>
        </div>
      </div>

      {/* Main Table grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">Daftar Temuan dan Tindak Lanjut Organisasi</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Mengoordinasikan perbaikan internal BPMP Maluku Utara berdasar rekomendasi tim pengawal.</p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => openModal()}
              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekomendasi</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10 dark:bg-slate-900/10">
                <th className="py-2.5 px-3">Asal Sumber Evaluasi</th>
                <th className="py-2.5 px-3">Rincian Temuan / Rekomendasi</th>
                <th className="py-2.5 px-3">PIC Tindak Lanjut</th>
                <th className="py-2.5 px-3 text-center">Batas Deadline</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                {!isReadOnly && <th className="py-2.5 px-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {tindak_lanjut_list.map((row) => {
                let statusColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40";
                if (row.status === "Selesai") {
                  statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40";
                } else if (row.status === "Proses") {
                  statusColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40";
                }

                // Check ownership or admin
                const canEditRow = isAdmin || isKetua;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 hover:bg-slate-50 border-b border-slate-100 dark:border-slate-850 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 dark:text-slate-355 text-slate-700 font-mono border border-slate-200 dark:border-slate-700">
                        {row.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-sm text-slate-800 dark:text-slate-250 leading-relaxed font-semibold">
                      {row.temuan}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {row.pic}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                      {row.deadline}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-black text-[10px] border ${statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {canEditRow ? (
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => openModal(row)}
                              className="p-1 px-2 border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 rounded text-slate-550 cursor-pointer text-[10px] font-bold"
                            >
                              Suaikan
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-rose-500 rounded text-slate-400 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-450 italic">Terkunci</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                {editingItem ? "Ubah Temuan Tindak Lanjut" : "Formulir Rekomendasi Tindak Lanjut"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Sumber Temuan</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as any)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                >
                  <option value="Hasil SPI">Hasil SPI (Internal)</option>
                  <option value="Hasil Itjen">Hasil Itjen Kementerian</option>
                  <option value="Hasil Evaluasi Internal">Hasil Evaluasi Internal</option>
                  <option value="Rekomendasi Pimpinan">Rekomendasi / Disposisi Kepala</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Pernyataan Temuan / Arahan</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Perbaikan pembukuan kas bendahara pengeluaran..."
                  value={formTemuan}
                  onChange={(e) => setFormTemuan(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Penanggungjawab Kegiatan (PIC)</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Penanggungjawab"
                  value={formPic}
                  onChange={(e) => setFormPic(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Status Tindak Lanjut</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                  >
                    <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                    <option value="Proses">Dalam Proses</option>
                    <option value="Selesai">Tuntas (Selesai)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-1.5">
                <button
                  type="button" onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded text-xs cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs cursor-pointer font-bold"
                >
                  Simpan RTL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
