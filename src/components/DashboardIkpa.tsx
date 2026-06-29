import React, { useState } from "react";
import { AppState, IKPAModel, User } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Plus, Edit2, Trash2, Gauge, Landmark, DollarSign, CalendarCheck, TrendingUp, X } from "lucide-react";

interface DashboardIkpaProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAdd: (record: any) => Promise<void>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DashboardIkpa({ state, user, onAdd, onUpdate, onDelete }: DashboardIkpaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IKPAModel | null>(null);

  // Form Fields
  const [formMonth, setFormMonth] = useState("Juli");
  const [formRevisi, setFormRevisi] = useState(100);
  const [formDeviasi, setFormDeviasi] = useState(100);
  const [formPenyerapan, setFormPenyerapan] = useState(0);
  const [formTagihan, setFormTagihan] = useState(100);
  const [formOutput, setFormOutput] = useState(100);

  const isAdmin = user.role === "Admin Perencanaan";

  const ikpa_list = state.ikpa || [];

  const openModal = (item: IKPAModel | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormMonth(item.month);
      setFormRevisi(item.revisi_dipa);
      setFormDeviasi(item.deviasi_halaman_iii);
      setFormPenyerapan(item.penyerapan_anggaran);
      setFormTagihan(item.penyelesaian_tagihan);
      setFormOutput(item.capaian_output);
    } else {
      setEditingItem(null);
      setFormMonth("Juli");
      setFormRevisi(100);
      setFormDeviasi(100);
      setFormPenyerapan(0);
      setFormTagihan(100);
      setFormOutput(100);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Calculate aggregate score (standard IKPA uses averages or weighted)
    const score = Math.round(((Number(formRevisi) + Number(formDeviasi) + Number(formTagihan) + Number(formOutput)) / 4) * 10) / 10;

    const record: Partial<IKPAModel> = {
      month: formMonth,
      revisi_dipa: Number(formRevisi),
      deviasi_halaman_iii: Number(formDeviasi),
      penyerapan_anggaran: Number(formPenyerapan),
      penyelesaian_tagihan: Number(formTagihan),
      capaian_output: Number(formOutput),
      nilai_ikpa: score
    };

    if (editingItem) {
      await onUpdate(editingItem.id, { ...editingItem, ...record });
    } else {
      await onAdd(record);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data IKPA bulanan ini?")) {
      await onDelete(id);
    }
  };

  // Compute overall average values
  const count = ikpa_list.length || 1;
  const avgRevisi = Math.round((ikpa_list.reduce((acc, x) => acc + x.revisi_dipa, 0) / count) * 10) / 10;
  const avgDeviasi = Math.round((ikpa_list.reduce((acc, x) => acc + x.deviasi_halaman_iii, 0) / count) * 10) / 10;
  const avgPenyerapan = Math.round((ikpa_list.reduce((acc, x) => acc + x.penyerapan_anggaran, 0) / count) * 10) / 10;
  const avgTagihan = Math.round((ikpa_list.reduce((acc, x) => acc + x.penyelesaian_tagihan, 0) / count) * 10) / 10;
  const avgOutput = Math.round((ikpa_list.reduce((acc, x) => acc + x.capaian_output, 0) / count) * 10) / 10;
  const latestIkpa = ikpa_list[ikpa_list.length - 1];

  // Map Recharts comparison data
  const compareData = [
    { name: "Revisi DIPA", RataRata: avgRevisi, Target: 95 },
    { name: "Deviasi Hal III", RataRata: avgDeviasi, Target: 90 },
    { name: "Penyelesaian Tagihan", RataRata: avgTagihan, Target: 98 },
    { name: "Capaian Output", RataRata: avgOutput, Target: 95 }
  ];

  return (
    <div className="space-y-6" id="siperamal-ikpa-view">
      
      {/* Upper overview box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
          <Landmark className="w-4 h-4 text-blue-600 mb-1" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kualitas Perencanaan</span>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{avgRevisi}%</h4>
          <span className="text-[9px] text-emerald-500 font-mono block mt-0.5">Revisi DIPA</span>
        </div>
        
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
          <TrendingUp className="w-4 h-4 text-violet-500 mb-1" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Akurasi Perencanaan</span>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{avgDeviasi}%</h4>
          <span className="text-[9px] text-blue-500 font-mono block mt-0.5">Rasio Akurasi Hal III</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
          <DollarSign className="w-4 h-4 text-emerald-600 mb-1" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Realisasi Akumulatif</span>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{latestIkpa ? latestIkpa.penyerapan_anggaran : 0}%</h4>
          <span className="text-[9px] text-amber-500 font-mono block mt-0.5">Realisasi Anggaran</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
          <CalendarCheck className="w-4 h-4 text-indigo-600 mb-1" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ketepatan Tagihan</span>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{avgTagihan}%</h4>
          <span className="text-[9px] text-emerald-500 font-mono block mt-0.5">Penyelesaian SPM</span>
        </div>
      </div>

      {/* Detail Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Rincian Multi-Sub-Indikator IKPA Bulanan
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ikpa_list}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" name="Revisi DIPA" dataKey="revisi_dipa" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" name="Deviasi Hal III" dataKey="deviasi_halaman_iii" stroke="#a855f7" strokeWidth={2} />
                <Line type="monotone" name="Capaian Output" dataKey="capaian_output" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" name="Nilai IKPA" dataKey="nilai_ikpa" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar comparison Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Pencapaian vs Target Kementerian
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 105]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="RataRata" name="Rata-Rata BPMP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" name="Target Kemenkeu" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Monthly data grid & controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Evaluasi Rapor Keuangan dan DIPA</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Detail rujukan nilai indeks kepuasan perbendaharaan per bulan.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Nilai Bulanan</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10 dark:bg-slate-900/10">
                <th className="py-2.5 px-3">Bulan Pelaksanaan</th>
                <th className="py-2.5 px-3 text-center">Revisi DIPA</th>
                <th className="py-2.5 px-3 text-center">Deviasi Halaman III</th>
                <th className="py-2.5 px-3 text-center">Penyerapan Anggaran DIPA</th>
                <th className="py-2.5 px-3 text-center">Penyelesaian SPM Tagihan</th>
                <th className="py-2.5 px-3 text-center">Capaian Output Kerja</th>
                <th className="py-2.5 px-3 text-center">Nilai IKPA Bulanan</th>
                {isAdmin && <th className="py-2.5 px-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
              {ikpa_list.map((row) => {
                let badgeStyle = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450";
                if (row.nilai_ikpa >= 95) {
                  badgeStyle = "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
                } else if (row.nilai_ikpa >= 90) {
                  badgeStyle = "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
                } else if (row.nilai_ikpa >= 80) {
                  badgeStyle = "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
                }

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 hover:bg-slate-50 border-b border-slate-100 dark:border-slate-850">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      {row.month} 2026
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{row.revisi_dipa}%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-600 dark:text-indigo-400">{row.deviasi_halaman_iii}%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">{row.penyerapan_anggaran}%</td>
                    <td className="py-2.5 px-3 text-center font-mono">{row.penyelesaian_tagihan}%</td>
                    <td className="py-2.5 px-3 text-center font-mono">{row.capaian_output}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-bold font-mono transition-all text-[11px] border ${badgeStyle}`}>
                        {row.nilai_ikpa}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openModal(row)}
                            className="p-1 px-2 border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 rounded text-slate-500 transition-colors cursor-pointer text-[10px] font-bold"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-rose-500 rounded text-slate-400 transition-colors cursor-pointer"
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
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                {editingItem ? "Ubah Indikator Keuangan" : "Input Evaluasi Bulanan Baru"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1">Bulan Pelaksanaan</label>
                <select 
                  value={formMonth} 
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs"
                >
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Revisi DIPA (%)</label>
                  <input 
                    type="number" required min="0" max="100" value={formRevisi}
                    onChange={(e) => setFormRevisi(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Dev Halaman III (%)</label>
                  <input 
                    type="number" required min="0" max="100" value={formDeviasi}
                    onChange={(e) => setFormDeviasi(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Penyerapan Anggaran DIPA (%)</label>
                <input 
                  type="number" step="0.1" required min="0" max="100" value={formPenyerapan}
                  onChange={(e) => setFormPenyerapan(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Ketepatan SPM (%)</label>
                  <input 
                    type="number" required min="0" max="100" value={formTagihan}
                    onChange={(e) => setFormTagihan(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Capaian Output (%)</label>
                  <input 
                    type="number" required min="0" max="100" value={formOutput}
                    onChange={(e) => setFormOutput(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                  />
                </div>
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
                  Simpan RK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
