import React, { useState } from "react";
import { AppState, SAKIPModel, User } from "../types";
import { Plus, Edit2, Trash2, Crosshair, Target, CheckCircle2, ChevronRight, HelpCircle, X, AlignLeft } from "lucide-react";

interface DashboardSakipProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAdd: (record: any) => Promise<void>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DashboardSakip({ state, user, onAdd, onUpdate, onDelete }: DashboardSakipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SAKIPModel | null>(null);

  // Form Fields
  const [sasaranKinerja, setSasaranKinerja] = useState("");
  const [ikk, setIkk] = useState("");
  const [perjanjianKinerja, setPerjanjianKinerja] = useState("");
  const [target, setTarget] = useState(100);
  const [realisasi, setRealisasi] = useState(0);

  const isAdmin = user.role === "Admin Perencanaan";

  const sakip_list = state.sakip || [];

  const openModal = (item: SAKIPModel | null = null) => {
    if (item) {
      setEditingItem(item);
      setSasaranKinerja(item.sasaran_kinerja);
      setIkk(item.ikk);
      setPerjanjianKinerja(item.perjanjian_kinerja);
      setTarget(item.target);
      setRealisasi(item.realisasi);
    } else {
      setEditingItem(null);
      setSasaranKinerja("");
      setIkk("");
      setPerjanjianKinerja("");
      setTarget(100);
      setRealisasi(0);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const percentage = target > 0 ? Math.round((realisasi / target) * 100 * 100) / 100 : 0;
    
    const record: Partial<SAKIPModel> = {
      sasaran_kinerja: sasaranKinerja,
      ikk: ikk,
      perjanjian_kinerja: perjanjianKinerja,
      target: Number(target),
      realisasi: Number(realisasi),
      percentage: percentage,
    };

    if (editingItem) {
      await onUpdate(editingItem.id, { ...editingItem, ...record });
    } else {
      await onAdd(record);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus indikator IKK SAKIP ini?")) {
      await onDelete(id);
    }
  };

  // Average Achievement percentage calculation
  const totalSakipPercentage = sakip_list.length > 0
    ? sakip_list.reduce((acc, x) => acc + x.percentage, 0) / sakip_list.length
    : 0;

  return (
    <div className="space-y-6" id="siperamal-sakip-view">
      
      {/* SAKIP Summary Banner */}
      <div className="bg-slate-900 border-b-4 border-sky-500 text-white rounded-lg p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-white/10 border border-white/10 rounded flex items-center justify-center">
            <Crosshair className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-sky-350 font-mono tracking-widest uppercase block mb-0.5">SISTEM AKUNTABILITAS KINERJA INSTANSI PEMERINTAH (SAKIP)</span>
            <h2 className="text-base font-bold font-sans tracking-tight text-white">
              Rantai Hasil Perjanjian Kinerja SAKIP BPMP Maluku Utara
            </h2>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Melacak sasaran strategis kementerian, indikator IKK utama (Indikator Kinerja Kegiatan), serta progres pencapaian tahun berjalan.
            </p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700/60 rounded p-2 text-center shrink-0 min-w-28">
          <span className="text-[9px] font-bold text-sky-305 uppercase block font-serif">Rata-Rata SAKIP</span>
          <span className="text-xl font-black font-sans text-emerald-400 mt-0.5 block">
            {Math.round(totalSakipPercentage * 10) / 10}%
          </span>
          <span className="text-[9px] text-slate-450 block font-mono">Status: {sakip_list.length > 0 ? "SANGAT BAIK (A)" : "Belum Ada Data"}</span>
        </div>
      </div>

      {/* Title with addition control */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          Menampilkan <strong>{sakip_list.length}</strong> Sasaran Kinerja Utama SAKIP
        </span>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah SAKIP</span>
          </button>
        )}
      </div>

      {/* Grid containing SAKIP parameter blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="siperamal-sakip-cards-deck">
        {sakip_list.map((item) => {
          const finished = item.percentage >= 100;
          return (
            <div 
              key={item.id}
              className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 hover:shadow transition-all relative group flex flex-col justify-between"
            >
              <div>
                {/* Header indicators */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-sky-400 border border-blue-500/20 px-2 py-0.5 rounded-md bg-blue-50/10 whitespace-nowrap mr-2">
                    {item.id.toUpperCase()}
                  </span>
                  
                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-500 rounded-lg"
                        title="Edit SAKIP"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg"
                        title="Hapus SAKIP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">Sasaran Strategis Org</h4>
                    <p className="text-xs text-slate-800 dark:text-slate-100 font-bold mt-1 leading-normal">
                      {item.sasaran_kinerja}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-800/80">
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase font-mono">Indikator Kinerja Kegiatan (IKK)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                      {item.ikk}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-500">Perjanjian Kinerja:</span>
                    <span className="text-slate-700 dark:text-slate-400 font-serif italic">{item.perjanjian_kinerja}</span>
                  </div>
                </div>
              </div>

              {/* Progress and status */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex space-x-3 text-[10px] font-mono">
                    <span className="text-slate-500">Tgt: <strong className="text-slate-700 dark:text-slate-200">{item.target}</strong></span>
                    <span className="text-slate-500">Real: <strong className="text-slate-700 dark:text-slate-200">{item.realisasi}</strong></span>
                  </div>
                  <span className={`font-mono font-bold text-[11px] ${finished ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {item.percentage}% Capaian
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div 
                    className={`h-full rounded transition-all duration-500 ${finished ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* SAKIP Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                {editingItem ? "Ubah Sasaran IKK SAKIP" : "Tambah Sasaran SAKIP Baru"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  Sasaran Strategis Kementerian / BPMP
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Meningkatnya mutu pendidikan dasar dan menengah di Malut..."
                  value={sasaranKinerja}
                  onChange={(e) => setSasaranKinerja(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                  IKK (Indikator Kinerja Kegiatan)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Persentase lulusan IKM siap kerja..."
                  value={ikk}
                  onChange={(e) => setIkk(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Perjanjian Kinerja (Fisik)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 85% dari total sasaran..."
                  value={perjanjianKinerja}
                  onChange={(e) => setPerjanjianKinerja(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Target Nilai</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Realisasi Nilai</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={realisasi}
                    onChange={(e) => setRealisasi(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs cursor-pointer"
                >
                  Simpan SAKIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
