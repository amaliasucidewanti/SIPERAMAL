import React, { useState } from "react";
import { AppState, ProgramKegiatan, User } from "../types";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Filter, 
  Search, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle,
  X,
  PlusCircle,
  RefreshCw
} from "lucide-react";

interface MonitoringProgramProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAdd: (record: any) => Promise<void>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MonitoringProgram({ state, user, onAdd, onUpdate, onDelete }: MonitoringProgramProps) {
  const [filterYear, setFilterYear] = useState<string>("2026");
  const [filterQuarter, setFilterQuarter] = useState<string>("All");
  const [filterTeam, setFilterTeam] = useState<string>("All");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Editor Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramKegiatan | null>(null);
  
  // Form fields
  const [formYear, setFormYear] = useState(2026);
  const [formQuarter, setFormQuarter] = useState<'Triwulan I' | 'Triwulan II' | 'Triwulan III' | 'Triwulan IV'>('Triwulan II');
  const [formTeam, setFormTeam] = useState('Subbag Umum');
  const [formProgram, setFormProgram] = useState('');
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formPic, setFormPic] = useState('');
  const [formTarget, setFormTarget] = useState(100);
  const [formRealisasi, setFormRealisasi] = useState(0);

  // Filter lists
  const program_kegiatan = state.program_kegiatan || [];
  const teams_list = state.teams || [];

  const years = Array.from(new Set(program_kegiatan.map(x => String(x.year))));
  const quarters = ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV'];
  const teams = teams_list.map(t => t.name);

  // Query calculation
  const filteredData = program_kegiatan.filter((item) => {
    const matchYear = filterYear === "All" || String(item.year) === filterYear;
    const matchQuarter = filterQuarter === "All" || item.triwulan === filterQuarter;
    const matchTeam = filterTeam === "All" || item.team === filterTeam;
    
    const searchLower = filterSearch.toLowerCase();
    const matchSearch = !filterSearch || 
      item.program.toLowerCase().includes(searchLower) ||
      item.kegiatan.toLowerCase().includes(searchLower) ||
      item.pic.toLowerCase().includes(searchLower);

    return matchYear && matchQuarter && matchTeam && matchSearch;
  });

  const canEditAll = user.role === 'Admin Perencanaan';
  const canUpdateProgress = user.role === 'Ketua Tim Kerja';
  const isReadOnly = user.role === 'Viewer';

  // Open modal for details/addition
  const openModal = (item: ProgramKegiatan | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormYear(item.year);
      setFormQuarter(item.triwulan);
      setFormTeam(item.team);
      setFormProgram(item.program);
      setFormKegiatan(item.kegiatan);
      setFormPic(item.pic);
      setFormTarget(item.target);
      setFormRealisasi(item.realisasi);
    } else {
      setEditingItem(null);
      setFormYear(2026);
      setFormQuarter('Triwulan II');
      // Default team is the team assigned to Chairman, or general for Admin
      setFormTeam(user.team !== 'All' ? user.team : 'Subbag Umum');
      setFormProgram('');
      setFormKegiatan('');
      setFormPic(user.name || '');
      setFormTarget(100);
      setFormRealisasi(0);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Authorization safeguard
    if (isReadOnly) return;
    if (canUpdateProgress && editingItem && editingItem.team !== user.team) {
      alert("Anda hanya diperbolehkan memperbarui progress kegiatan di tim kerja Anda sendiri!");
      return;
    }

    const record: Partial<ProgramKegiatan> = {
      year: formYear,
      triwulan: formQuarter,
      team: formTeam,
      program: formProgram,
      kegiatan: formKegiatan,
      pic: formPic,
      target: Number(formTarget) || 100,
      realisasi: Number(formRealisasi) || 0,
    };

    if (editingItem) {
      // Keep immutable parts if just updating progress
      const finalRecord = canUpdateProgress ? {
        ...editingItem,
        realisasi: record.realisasi,
      } : { ...editingItem, ...record };
      
      await onUpdate(editingItem.id, finalRecord);
    } else {
      await onAdd(record);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data kegiatan ini dari log perencanaan SIPERAMAL?")) {
      await onDelete(id);
    }
  };

  // Status highlights
  const getStatusNode = (target: number, realisasi: number) => {
    const pct = target > 0 ? (realisasi / target) * 100 : 0;
    if (pct >= 100) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-850">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Selesai (100%)
        </span>
      );
    } else if (pct >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-305 border border-amber-300 dark:border-amber-850">
          <HelpCircle className="w-3 h-3 mr-1" />
          Proses ({Math.round(pct)}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-303 border border-rose-300 dark:border-rose-850">
          <AlertCircle className="w-3 h-3 mr-1" />
          Terlambat ({Math.round(pct)}%)
        </span>
      );
    }
  };

  return (
    <div className="space-y-6" id="siperamal-monitoring-program-view">
      
      {/* Search & Controller panel */}
      <div className="bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Year filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
              >
                <option value="All">Semua Tahun</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Quarter Filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
              <select 
                value={filterQuarter}
                onChange={(e) => setFilterQuarter(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
              >
                <option value="All">Semua Triwulan</option>
                {quarters.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* Team filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
              <select 
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
              >
                <option value="All">Semua Tim Kerja</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari program/kegiatan/PIC..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Addition trigger */}
            {!isReadOnly && canEditAll && (
              <button
                onClick={() => openModal()}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kegiatan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Monitoring Kinerja Program Strategis BPMP Maluku Utara
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Menampilkan {filteredData.length} baris target instansi.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3">Rincian Kegiatan</th>
                <th className="py-2.5 px-3">Tim Kerja</th>
                <th className="py-2.5 px-3">PIC Penilai</th>
                <th className="py-2.5 px-3 text-center">Progress</th>
                <th className="py-2.5 px-3 text-center">Status Evaluasi</th>
                {!isReadOnly && <th className="py-2.5 px-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data program kegiatan ditemukan dengan kriteria penelusuran.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const pct = item.target > 0 ? (item.realisasi / item.target) * 100 : 0;
                  // Automated highlight based on percentage
                  let progColor = "bg-rose-500";
                  if (pct >= 100) progColor = "bg-emerald-500";
                  else if (pct >= 80) progColor = "bg-amber-500";

                  // Check conditional permissions
                  const canSelfEdit = canEditAll || (canUpdateProgress && item.team === user.team);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors duration-150 border-b border-slate-100 dark:border-slate-850"
                    >
                      <td className="py-2 px-3 max-w-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                        {item.program}
                      </td>
                      <td className="py-2 px-3 max-w-md text-slate-600 dark:text-slate-350 leading-relaxed text-[11px]">
                        {item.kegiatan}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px]">
                        {item.team}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap text-[10px]">
                        {item.pic}
                      </td>
                      <td className="py-2 px-3 align-middle min-w-40">
                        <div className="flex flex-col space-y-1 justify-center">
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Tgt: {item.target}%</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">Real: {item.realisasi}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded transition-all duration-500 ${progColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {getStatusNode(item.target, item.realisasi)}
                      </td>
                      {!isReadOnly && (
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center justify-center space-x-1">
                            {canSelfEdit ? (
                              <>
                                <button
                                  onClick={() => openModal(item)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 rounded-lg text-slate-400 transition-colors tooltip cursor-pointer"
                                  title={canUpdateProgress ? "Input Progress" : "Edit Kegiatan"}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {canEditAll && (
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                    title="Hapus Kegiatan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400/80 font-mono italic">Akses Terkunci</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Modal Editor */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                {editingItem 
                  ? (canUpdateProgress ? `Input Progress Kerja` : "Ubah Data Kegiatan") 
                  : "Tambah Program & Kegiatan Baru"}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {canUpdateProgress && editingItem ? (
                // Limited form for Chairmen to only input realisasi progres
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-xs rounded-xl line-clamp-4 leading-normal">
                    <strong>Program:</strong> {editingItem.program}<br/>
                    <strong>Kegiatan:</strong> {editingItem.kegiatan}<br/>
                    <strong>Tim Kerja:</strong> {editingItem.team}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Jumlah Progres Realisasi Fisik (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formRealisasi}
                      onChange={(e) => setFormRealisasi(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-full border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Masukkan nilai progres dari rentang <strong>0 s.d 100</strong>. Status akan terhitung otomatis di sistem.
                    </span>
                  </div>
                </div>
              ) : (
                // Full CRUD Form for Admin Perencanaan
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tahun</label>
                      <input 
                        type="number" 
                        required 
                        value={formYear}
                        onChange={(e) => setFormYear(parseInt(e.target.value) || 2026)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Triwulan</label>
                      <select 
                        value={formQuarter}
                        onChange={(e) => setFormQuarter(e.target.value as any)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                      >
                        {quarters.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tim Kerja Penanggungjawab</label>
                    <select 
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs"
                    >
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Program Strategis</label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="Contoh: Akselerasi Mutu Pendidikan Dasar Indonesia..."
                      value={formProgram}
                      onChange={(e) => setFormProgram(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Rincian Kegiatan</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Contoh: Pelaksanaan Bimtek PBD Jenjang PAUD dan SD Dinas..."
                      value={formKegiatan}
                      onChange={(e) => setFormKegiatan(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nama PIC Pengendali</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nama Lengkap & Gelar" 
                      value={formPic}
                      onChange={(e) => setFormPic(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Target Fisik (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="100"
                        value={formTarget}
                        onChange={(e) => setFormTarget(parseInt(e.target.value) || 100)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Realisasi Fisik (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="100"
                        value={formRealisasi}
                        onChange={(e) => setFormRealisasi(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs" 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <span>Simpan Perubahan</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
