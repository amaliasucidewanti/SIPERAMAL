import React, { useState } from "react";
import { AppState, RisikoModel, User } from "../types";
import { Plus, Edit2, Trash2, ShieldAlert, AlertTriangle, CheckCircle, HelpCircle, Flame, Heart, Info, X } from "lucide-react";

interface DashboardRisikoProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAdd: (record: any) => Promise<void>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DashboardRisiko({ state, user, onAdd, onUpdate, onDelete }: DashboardRisikoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RisikoModel | null>(null);

  // Form Fields
  const [risikoText, setRisikoText] = useState("");
  const [tingkatRisiko, setTingkatRisiko] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [mitigasi, setMitigasi] = useState("");
  const [pic, setPic] = useState("");
  const [status, setStatus] = useState<'Teratasi' | 'Proses' | 'Belum'>('Proses');

  const isAdmin = user.role === "Admin Perencanaan";

  const risiko_list = state.risiko || [];

  const openModal = (item: RisikoModel | null = null) => {
    if (item) {
      setEditingItem(item);
      setRisikoText(item.risiko);
      setTingkatRisiko(item.tingkat_risiko);
      setMitigasi(item.mitigasi);
      setPic(item.pic);
      setStatus(item.status);
    } else {
      setEditingItem(null);
      setRisikoText("");
      setTingkatRisiko("Sedang");
      setMitigasi("");
      setPic(user.team !== "All" ? user.name : "Subbag Umum");
      setStatus("Proses");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const record: Partial<RisikoModel> = {
      risiko: risikoText,
      tingkat_risiko: tingkatRisiko,
      mitigasi: mitigasi,
      pic: pic,
      status: status
    };

    if (editingItem) {
      await onUpdate(editingItem.id, { ...editingItem, ...record });
    } else {
      await onAdd(record);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus profil risiko instansi ini?")) {
      await onDelete(id);
    }
  };

  // Counting risks for the Matrix
  const highCount = risiko_list.filter(x => x.tingkat_risiko === 'Tinggi').length;
  const mediumCount = risiko_list.filter(x => x.tingkat_risiko === 'Sedang').length;
  const lowCount = risiko_list.filter(x => x.tingkat_risiko === 'Rendah').length;

  return (
    <div className="space-y-6" id="siperamal-risiko-view">
      
      {/* 3D Risk Matrix panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="siperamal-risk-matrix-panel">
        
        {/* High Risk Status Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 hover:shadow transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-bold text-rose-500 font-mono tracking-wider block">LEVEL GAWAT</span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">High Risk (Tinggi)</h3>
              <p className="text-xl font-black text-rose-600 dark:text-rose-450 mt-1 font-mono">{highCount}</p>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Kategori risiko yang membutuhkan mitigasi aktif sesegera mungkin berdasar telaah Kepala BPMP.
          </p>
        </div>

        {/* Medium Risk Status Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 hover:shadow transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-bold text-amber-500 font-mono tracking-wider block">LEVEL WASPADA</span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">Medium Risk (Sedang)</h3>
              <p className="text-xl font-black text-amber-600 dark:text-amber-450 mt-1 font-mono">{mediumCount}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Kategori risiko yang terus dipantau rutin oleh tiap PIC pelaksana dalam rincian program kerja triwulan.
          </p>
        </div>

        {/* Low Risk Status Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 hover:shadow transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-bold text-emerald-500 font-mono tracking-wider block">LEVEL AMAN</span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">Low Risk (Rendah)</h3>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1 font-mono">{lowCount}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Risiko dengan tingkat dampak minimal, tergolong dapat diatasi dengan mekanisme operasional harian.
          </p>
        </div>

      </div>

      {/* Risk table block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Daftar Pengendalian Risiko Organisasi (Risk Matrix)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Sistem deteksi dini hambatan serta strategi penanggulangan (Mitigasi).</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Risiko</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10 dark:bg-slate-900/10">
                <th className="py-2.5 px-3">Pernyataan Risiko</th>
                <th className="py-2.5 px-3 text-center">Tingkat Ancaman</th>
                <th className="py-2.5 px-3">Langkah Mitigasi Kontrol</th>
                <th className="py-2.5 px-3">PIC Pengawas</th>
                <th className="py-2.5 px-3 text-center">Status Mitigasi</th>
                {isAdmin && <th className="py-2.5 px-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {risiko_list.map((row) => {
                let badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450";
                if (row.tingkat_risiko === "Sedang") {
                  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-450";
                } else if (row.tingkat_risiko === "Rendah") {
                  badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400";
                }

                let stateBadge = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                if (row.status === "Teratasi") {
                  stateBadge = "bg-emerald-500 text-white dark:bg-emerald-600";
                } else if (row.status === "Proses") {
                  stateBadge = "bg-blue-600 text-white dark:bg-blue-700";
                }

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 hover:bg-slate-50 border-b border-slate-100 dark:border-slate-850">
                    <td className="py-2.5 px-3 max-w-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                      {row.risiko}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-black text-[10px] border ${badgeStyle}`}>
                        {row.tingkat_risiko}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-sm text-slate-600 dark:text-slate-350 leading-relaxed italic">
                      {row.mitigasi}
                    </td>
                    <td className="py-2.5 px-3 text-slate-550 dark:text-slate-400 font-mono whitespace-nowrap">
                      {row.pic}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${stateBadge}`}>
                        {row.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openModal(row)}
                            className="p-1 px-2 border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 rounded text-slate-500 cursor-pointer text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 hover:bg-slate-105 dark:hover:bg-slate-800 hover:text-rose-500 rounded text-slate-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
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
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                {editingItem ? "Ubah Profil Risiko" : "Tambah Formulir Risiko Instansi"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Pernyataan Risiko</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Hambatan implementasi karena keterlambatan regulasi daerah..."
                  value={risikoText}
                  onChange={(e) => setRisikoText(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tingkat Risiko</label>
                  <select
                    value={tingkatRisiko}
                    onChange={(e) => setTingkatRisiko(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                  >
                    <option value="Tinggi">Tinggi (High)</option>
                    <option value="Sedang">Sedang (Medium)</option>
                    <option value="Rendah">Rendah (Low)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Status Mitigasi</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                  >
                    <option value="Belum">Belum Dimulai</option>
                    <option value="Proses">Sedang Diupayakan (Proses)</option>
                    <option value="Teratasi">Selesai Diantisipasi (Teratasi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">Langkah Mitigasi / Strategi Kontrol</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Mengadakan rapat koordinasi formal lintas dinas..."
                  value={mitigasi}
                  onChange={(e) => setMitigasi(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">PIC Pengawas Lapangan</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Penanggungjawab"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button" onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs cursor-pointer"
                >
                  Simpan Risiko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
