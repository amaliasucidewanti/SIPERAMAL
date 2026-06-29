import React, { useState } from "react";
import { AppState, Pelaporan, User, LaporanDetail } from "../types";
import { 
  Trophy, 
  Award, 
  Medal, 
  Edit3, 
  ShieldAlert, 
  CheckCircle, 
  Save, 
  HelpCircle, 
  Sparkles, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  FileCheck,
  X,
  Filter
} from "lucide-react";

interface MonitoringPelaporanProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onUpdate: (id: string, record: any) => Promise<void>;
  onUpdateState: (state: AppState) => void;
}

export function MonitoringPelaporan({ state, user, onUpdate, onUpdateState }: MonitoringPelaporanProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields for Inline Kepatuhan Edit
  const [formBulanan, setFormBulanan] = useState(100);
  const [formKegiatan, setFormKegiatan] = useState(105);
  const [formDukung, setFormDukung] = useState(100);

  // Form fields for Laporan Upload
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedTeam, setSelectedTeam] = useState(user.role === 'Admin Perencanaan' ? "Subbag Umum" : user.team);
  const [selectedPkId, setSelectedPkId] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Drag and drop states
  const [dragDocActive, setDragDocActive] = useState(false);
  const [dragPhotoActive, setDragPhotoActive] = useState(false);

  // Upload progress & states
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Verification dialog/drawer state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationStatusInput, setVerificationStatusInput] = useState<'Disetujui' | 'Perlu Perbaikan'>('Disetujui');
  const [verificationNotesInput, setVerificationNotesInput] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Filter list
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Menunggu Verifikasi' | 'Disetujui' | 'Perlu Perbaikan'>('Semua');

  const isAdmin = user.role === 'Admin Perencanaan';
  const canSelfEdit = user.role === 'Ketua Tim Kerja';
  const isReadOnly = user.role === 'Viewer';

  const pelaporan_list = state.pelaporan || [];

  // Calculate sorted leaderboard
  const leaderBoard = [...pelaporan_list].sort((a, b) => b.compliance - a.compliance);

  const startEdit = (p: Pelaporan) => {
    if (canSelfEdit && p.team !== user.team) {
      alert("Anda hanya dikuasakan memperbarui laporan kepatuhan tim kerja Anda sendiri!");
      return;
    }
    setEditingId(p.id);
    setFormBulanan(p.laporan_bulanan);
    setFormKegiatan(p.laporan_kegiatan);
    setFormDukung(p.data_dukung);
  };

  const handleSave = async (id: string, p: Pelaporan) => {
    const updated: Partial<Pelaporan> = {
      laporan_bulanan: Number(formBulanan),
      laporan_kegiatan: Number(formKegiatan),
      data_dukung: Number(formDukung)
    };
    await onUpdate(id, { ...p, ...updated });
    setEditingId(null);
  };

  // Filter active activities based on selected team for file upload
  const activeTeamForUpload = isAdmin ? selectedTeam : user.team;
  const teamActivities = (state.program_kegiatan || []).filter(pk => pk.team === activeTeamForUpload);

  // Handle Drag & Drop Events for Doc File
  const handleDragDoc = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragDocActive(true);
    } else if (e.type === "dragleave") {
      setDragDocActive(false);
    }
  };

  const handleDropDoc = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragDocActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx'].includes(ext || '')) {
        setDocFile(file);
      } else {
        alert("Format berkas dokumen tidak valid! Hanya mendukung PDF, DOC, atau DOCX.");
      }
    }
  };

  // Handle Drag & Drop Events for Photo File
  const handleDragPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragPhotoActive(true);
    } else if (e.type === "dragleave") {
      setDragPhotoActive(false);
    }
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragPhotoActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
      } else {
        alert("Format berkas foto tidak valid! Harap unggah tipe gambar (JPG, PNG).");
      }
    }
  };

  // Document submit handler
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !photoFile) {
      alert("Harap pilih dokumen laporan kegiatan dan foto dokumentasi kegiatan terlebih dahulu!");
      return;
    }

    const selectedPkItem = teamActivities.find(pk => pk.id === selectedPkId);
    if (!selectedPkItem && teamActivities.length > 0 && selectedPkId !== "") {
      alert("Harap pilih kegiatan valid!");
      return;
    }

    const prgName = selectedPkItem ? selectedPkItem.program : "Program Kerja Tambahan";
    const kegName = selectedPkItem ? selectedPkItem.kegiatan : (selectedPkId || "Kegiatan Satuan Kerja");

    setUploading(true);
    setUploadStatus("Menyiapkan berkas dan mengunggah...");

    const formData = new FormData();
    formData.append("year", String(selectedYear));
    formData.append("team", activeTeamForUpload);
    formData.append("program", prgName);
    formData.append("kegiatan", kegName);
    formData.append("username", user.username);
    formData.append("document", docFile);
    formData.append("photo", photoFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        onUpdateState(resData.state);
        setUploadStatus("Unggah Sukses! Berkas tersimpan ke Google Drive dan link disinkronkan ke Spreadsheet.");
        
        // Reset form
        setDocFile(null);
        setPhotoFile(null);
        setSelectedPkId("");
        
        setTimeout(() => setUploadStatus(null), 5000);
      } else {
        setUploadStatus(`Gagal Mengunggah: ${resData.message || "Ulangi sesaat lagi."}`);
      }
    } catch (err: any) {
      setUploadStatus(`Error Upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Verifikasi handler for Tim Perencanaan
  const handleVerifySubmit = async (id: string) => {
    setSubmittingVerification(true);
    try {
      const response = await fetch("/api/verify-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: verificationStatusInput,
          notes: verificationNotesInput,
          username: user.username
        })
      });

      if (response.ok) {
        const resData = await response.json();
        onUpdateState(resData.state);
        setVerifyingId(null);
        setVerificationNotesInput("");
        alert(`Verifikasi Laporan berhasil dikirim dengan status '${verificationStatusInput}' dan otomatis disinkronkan ke Google Spreadsheet.`);
      } else {
        alert("Gagal memproses verifikasi laporan ke Google Sheets.");
      }
    } catch (err: any) {
      alert(`Error Verifikasi: ${err.message}`);
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Get laporan detail lists
  const laporanDetailList = state.laporan_detail || [];

  // Filter lists based on status selection
  const filteredDetails = laporanDetailList.filter(l => {
    if (statusFilter === 'Semua') return true;
    return l.verificationStatus === statusFilter;
  });

  return (
    <div className="space-y-6" id="siperamal-monitoring-pelaporan-view">
      
      {/* 3D-effect Leaderboard Podium */}
      <div className="bg-slate-900 border-b-4 border-sky-500 text-white rounded-lg p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-sky-400 font-mono tracking-wider bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20 uppercase">
            Leaderboard Kepatuhan Tim
          </span>
          <h2 className="text-sm font-bold font-sans text-slate-100 flex items-center mt-2">
            <Trophy className="w-4 h-4 text-yellow-400 mr-2 animate-bounce" />
            Peringkat Kinerja Administrasi Satuan BPMP
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-lg leading-relaxed">
            Peringkat dihitung secara dinamis dari rata-rata pemenuhan berkas Laporan Bulanan, Laporan Kegiatan, dan unggah Data Dukung (Eviden).
          </p>

          {/* Podium Representation */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end max-w-2xl mx-auto pt-2">
            
            {leaderBoard[1] && (
              <div id="podium-2" className="flex flex-col items-center p-2.5 bg-slate-800/40 backdrop-blur-xs rounded border border-slate-700/30 text-center transition-all">
                <Medal className="w-6 h-6 text-slate-300 drop-shadow-[0_2px_10px_rgba(200,200,200,0.3)] mb-1" />
                <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wide">Peringkat 2</span>
                <span className="font-bold text-slate-200 mt-0.5 text-xs block">{leaderBoard[1].team}</span>
                <span className="text-lg font-black text-slate-100 font-mono mt-0.5 block">{leaderBoard[1].compliance}%</span>
                <div className="w-full bg-slate-700/40 h-1 rounded overflow-hidden mt-1.5">
                  <div className="bg-slate-300 h-full" style={{ width: `${leaderBoard[1].compliance}%` }}></div>
                </div>
              </div>
            )}

            {leaderBoard[0] && (
              <div id="podium-1" className="flex flex-col items-center p-3 bg-slate-850 rounded border-2 border-yellow-500/50 text-center shadow-xl md:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 bg-yellow-500/20 rounded-bl border-l border-b border-yellow-500/30">
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                </div>
                <Award className="w-8 h-8 text-yellow-500 drop-shadow-[0_4px_15px_rgba(234,179,8,0.4)] mb-1" />
                <span className="text-[9px] font-black uppercase text-yellow-400 font-mono tracking-widest">Peringkat 1</span>
                <span className="font-black text-white mt-0.5 text-sm block">{leaderBoard[0].team}</span>
                <span className="text-xl font-black text-yellow-500 font-mono mt-0.5 block">{leaderBoard[0].compliance}%</span>
                <div className="w-full bg-slate-700/60 h-1.5 rounded overflow-hidden mt-2">
                  <div className="bg-yellow-500 h-full" style={{ width: `${leaderBoard[0].compliance}%` }}></div>
                </div>
              </div>
            )}

            {leaderBoard[2] && (
              <div id="podium-3" className="flex flex-col items-center p-2.5 bg-slate-800/40 backdrop-blur-xs rounded border border-slate-700/30 text-center transition-all">
                <Medal className="w-6 h-6 text-amber-700 drop-shadow-[0_2px_10px_rgba(180,83,9,0.3)] mb-1" />
                <span className="text-[9px] font-black uppercase text-amber-600 font-mono tracking-wide">Peringkat 3</span>
                <span className="font-bold text-slate-200 mt-0.5 text-xs block">{leaderBoard[2].team}</span>
                <span className="text-lg font-black text-slate-100 font-mono mt-0.5 block">{leaderBoard[2].compliance}%</span>
                <div className="w-full bg-slate-700/40 h-1 rounded overflow-hidden mt-1.5">
                  <div className="bg-amber-700 h-full" style={{ width: `${leaderBoard[2].compliance}%` }}></div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rincian Kepatuhan Table Cards */}
      <div className="bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
            Tabel Parameter Kepatuhan Administrasi per Tim Kerja
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Gunakan penggeser target di bawah ini apabila Anda login sebagai penilai atau ketua tim penanggungjawab.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10 dark:bg-slate-900/10">
                <th className="py-2.5 px-3">Unit Tim Kerja</th>
                <th className="py-2.5 px-3 text-center">Laporan Bulanan (Rutin)</th>
                <th className="py-2.5 px-3 text-center">Laporan Kegiatan (Selesai Pelakasi)</th>
                <th className="py-2.5 px-3 text-center">Kelengkapan Data Dukung (Eviden)</th>
                <th className="py-2.5 px-3 text-center">Rata-rata Kepatuhan</th>
                {!isReadOnly && <th className="py-2.5 px-3 text-center">Koreksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {pelaporan_list.map((p) => {
                const isEditing = editingId === p.id;
                const percent = p.compliance;
                
                let badgeColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40";
                if (percent >= 90) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40";
                else if (percent >= 80) badgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40";

                const isLeader = leaderBoard[0]?.id === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850 hover:bg-slate-50 border-b border-slate-100 dark:border-slate-850">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{p.team}</span>
                        {isLeader && (
                          <span className="inline-flex px-1.5 py-0.5 text-[9px] font-black uppercase text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 rounded border border-yellow-300 dark:border-yellow-900/40 whitespace-nowrap">
                            TOP 1
                          </span>
                        )}
                      </div>
                    </td>

                    {isEditing ? (
                      /* Inline Editor Cells */
                      <>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-blue-600 block mb-1 font-mono">{formBulanan}%</span>
                            <div className="flex items-center space-x-2 w-28">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={formBulanan}
                                onChange={(e) => setFormBulanan(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-indigo-600 block mb-1 font-mono">{formKegiatan}%</span>
                            <div className="flex items-center space-x-2 w-28">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={formKegiatan}
                                onChange={(e) => setFormKegiatan(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-emerald-600 block mb-1 font-mono">{formDukung}%</span>
                            <div className="flex items-center space-x-2 w-28">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={formDukung}
                                onChange={(e) => setFormDukung(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Display Cells */
                      <>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 text-xs">
                          <div className="flex flex-col items-center space-y-0.5">
                            <span>{p.laporan_bulanan}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{ width: `${p.laporan_bulanan}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 text-xs">
                          <div className="flex flex-col items-center space-y-0.5">
                            <span>{p.laporan_kegiatan}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded overflow-hidden">
                              <div className="bg-indigo-400 h-full" style={{ width: `${p.laporan_kegiatan}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 text-xs">
                          <div className="flex flex-col items-center space-y-0.5">
                            <span>{p.data_dukung}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${p.data_dukung}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </>
                    )}

                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded font-bold text-[11px] border ${badgeColor}`}>
                        {percent}%
                      </span>
                    </td>

                    {!isReadOnly && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center">
                          {isEditing ? (
                            <button
                              onClick={() => handleSave(p.id, p)}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 border border-indigo-700 cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          ) : (
                            (isAdmin || (canSelfEdit && p.team === user.team)) ? (
                              <button
                                onClick={() => startEdit(p)}
                                className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded transition-colors cursor-pointer"
                                title="Koreksi Nilai"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400/80 font-mono italic">Terkunci</span>
                            )
                          )}
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

      {/* Upload Laporan & Verifikasi Workflow Workspace Section */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-850">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <FileCheck className="w-4 h-4 text-sky-500 mr-2" />
              Verifikasi & Dokumentasi Berkas Kegiatan (Drive / Sheets)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Setiap berkas dokumen laporan (PDF, DOC, DOCX) & Foto yang diunggah akan otomatis disimpan ke Google Drive dan langsung tersinkronisasi ke Google Spreadsheet secara real-time.
            </p>
          </div>
          {state.sheets_config.isConnected && (
            <span className="mt-2 md:mt-0 inline-flex items-center px-2 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Workspace Synced (Real-time)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT: File Upload Area (Only for penanggung jawab / Admin) */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm flex flex-col h-full">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                <Upload className="w-3.5 h-3.5 text-blue-500 mr-2" />
                Unggah Laporan Baru
              </h3>

              {isReadOnly ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-850 rounded">
                  <ShieldAlert className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Akses Viewer Terbatas</p>
                  <p className="text-[10px] text-slate-400 mt-1">Anda tidak memiliki otorisasi mengunggah berkas penugasan kegiatan.</p>
                </div>
              ) : (
                <form onSubmit={handleUploadReport} className="space-y-3 flex flex-col h-full justify-between">
                  
                  <div className="space-y-2.5">
                    {/* Year selection */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tahun Kegiatan</label>
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-hidden"
                      >
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                        <option value={2028}>2028</option>
                      </select>
                    </div>

                    {/* Team selection */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tim Kerja</label>
                      {isAdmin ? (
                        <select 
                          value={selectedTeam}
                          onChange={(e) => {
                            setSelectedTeam(e.target.value);
                            setSelectedPkId(""); // reset selected kegiatan
                          }}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-hidden"
                        >
                          {state.teams.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          {user.team}
                        </div>
                      )}
                    </div>

                    {/* Program/Kegiatan selection */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pilih Kegiatan (PBD/Fisik)</label>
                      <select 
                        value={selectedPkId}
                        onChange={(e) => setSelectedPkId(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-hidden"
                        required
                      >
                        <option value="">-- Hubungkan ke Kegiatan Aktif --</option>
                        {teamActivities.map(act => (
                          <option key={act.id} value={act.id}>{act.kegiatan.substring(0, 50)}...</option>
                        ))}
                        <option value="Kegiatan Lainnya / Ad-hoc">Kegiatan Lainnya / Ad-hoc</option>
                      </select>
                    </div>

                    {/* Drag-and-drop uploader area for Document (PDF/DOC/DOCX) */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Berkas Laporan Kegiatan (PDF, DOCX)</label>
                      <div 
                        onDragEnter={handleDragDoc}
                        onDragOver={handleDragDoc}
                        onDragLeave={handleDragDoc}
                        onDrop={handleDropDoc}
                        onClick={() => document.getElementById('siperamal-doc-input')?.click()}
                        className={`border-2 border-dashed rounded p-3 text-center cursor-pointer transition-all ${
                          dragDocActive ? 'border-sky-500 bg-sky-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="siperamal-doc-input"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && setDocFile(e.target.files[0])}
                          className="hidden" 
                        />
                        {docFile ? (
                          <div className="flex flex-col items-center">
                            <FileText className="w-6 h-6 text-indigo-500 mb-1" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate w-full max-w-[180px]">{docFile.name}</span>
                            <span className="text-[9px] text-slate-400">{(docFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <FileCheck className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] font-medium text-slate-500">Pilih Berkas Laporan</span>
                            <span className="text-[9px] text-slate-400">Sumbu Drag (PDF, DOC, DOCX)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drag-and-drop uploader area for Photos (PNG/JPG) */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unggah Foto Kegiatan (Eviden Visual)</label>
                      <div 
                        onDragEnter={handleDragPhoto}
                        onDragOver={handleDragPhoto}
                        onDragLeave={handleDragPhoto}
                        onDrop={handleDropPhoto}
                        onClick={() => document.getElementById('siperamal-photo-input')?.click()}
                        className={`border-2 border-dashed rounded p-3 text-center cursor-pointer transition-all ${
                          dragPhotoActive ? 'border-sky-500 bg-sky-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="siperamal-photo-input"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])}
                          className="hidden" 
                        />
                        {photoFile ? (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 text-emerald-500 mb-1" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate w-full max-w-[180px]">{photoFile.name}</span>
                            <span className="text-[9px] text-slate-400">{(photoFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] font-medium text-slate-500">Pilih Foto Kegiatan</span>
                            <span className="text-[9px] text-slate-400">Sumbu Drag (JPG, PNG)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {uploadStatus && (
                    <div className="p-2 text-[10px] font-medium rounded border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {uploadStatus}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-450 text-white rounded text-xs font-bold flex items-center justify-center space-x-1 border border-sky-700 cursor-pointer shadow-xs"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sinkronisasi Google Drive...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Simpan & Kirim Laporan</span>
                        </>
                      )}
                    </button>
                    {!state.sheets_config.isConnected && (
                      <p className="text-[9px] text-slate-400 mt-1.5 leading-normal text-center bg-slate-50 dark:bg-slate-850 p-1 rounded">
                        ℹ️ Catatan: Berhubung integrasi Sheets belum dikoneksikan, berkas akan disimpan pada server lokal sementara (Local Sandbox).
                      </p>
                    )}
                  </div>

                </form>
              )}
            </div>
          </div>

          {/* RIGHT: Document List & Workflow Verifikasi */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm flex flex-col h-full">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                  <FileCheck className="w-4 h-4 text-emerald-500 mr-2" />
                  Alur Verifikasi Penyerahan Laporan Kegiatan
                </h3>
                
                {/* Visual filter options */}
                <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
                  <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center">
                    <Filter className="w-3 h-3 mr-1" /> VIEW STATUS:
                  </span>
                  {(['Semua', 'Menunggu Verifikasi', 'Disetujui', 'Perlu Perbaikan'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        statusFilter === f 
                          ? 'bg-indigo-650 text-white border-indigo-700' 
                          : 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f === 'Semua' ? 'Semua' : f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDetails.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400">
                  <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Laporan Kosong</p>
                  <p className="text-[10px] max-w-sm mt-1 leading-normal text-slate-450">
                    Tidak ditemukan laporan dengan status pencarian '{statusFilter}'. Ketua tim kerja dapat melayangkan dokumen di sebelah kiri.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredDetails.map((lap) => {
                    // Decide status badge color
                    let statColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900";
                    if (lap.verificationStatus === "Disetujui") {
                      statColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900";
                    } else if (lap.verificationStatus === "Perlu Perbaikan") {
                      statColor = "bg-red-50 text-red-705 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900";
                    }

                    const isVerifying = verifyingId === lap.id;

                    return (
                      <div key={lap.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-750 transition-all">
                        
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 flex-wrap gap-1">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-305 font-bold text-[9px] font-mono border border-indigo-200 dark:border-indigo-900/60 uppercase">
                                {lap.team}
                              </span>
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[9px] font-mono border border-slate-200/50 dark:border-slate-750">
                                {lap.year}
                              </span>
                              <span className={`inline-block px-1.5 py-0.5 rounded font-black text-[9px] font-mono border ${statColor} uppercase animate-pulse`}>
                                {lap.verificationStatus}
                              </span>
                            </div>
                            
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-normal">
                              {lap.kegiatan}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Program: <span className="font-semibold text-slate-500 dark:text-slate-300">{lap.program}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 italic">
                              Diajukan: {lap.submittedBy} pada {new Date(lap.submittedAt).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Action badges to check document and photo */}
                          <div className="flex flex-row sm:flex-col gap-1.5 mt-2 sm:mt-0">
                            <a 
                              href={lap.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded flex items-center space-x-1 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer text-[10px] font-bold text-indigo-700 dark:text-indigo-400"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Laporan</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>

                            <a 
                              href={lap.photoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded flex items-center space-x-1 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Foto</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>
                          </div>
                        </div>

                        {/* Verification feedback & Metadata */}
                        <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between text-[10px] bg-slate-50 dark:bg-slate-950/30 p-1.5 rounded gap-2">
                          <div className="flex items-start">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mr-1.5 mt-0.5 shrink-0" />
                            <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-mono">
                              <strong>Catatan Perencanaan:</strong> {lap.verificationNotes || "Tidak ada catatan."}
                            </p>
                          </div>
                          {lap.verifiedBy && (
                            <div className="text-[9px] text-slate-400 shrink-0 font-mono md:text-right bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded leading-relaxed">
                              Diverifikasi oleh: <strong className="text-slate-600 dark:text-slate-300">{lap.verifiedBy}</strong> (<span className="text-[8px]">{new Date(lap.verifiedAt || '').toLocaleDateString('id-ID')}</span>)
                            </div>
                          )}
                        </div>

                        {/* ACTION BUTTON FOR PLANNING TEAM */}
                        {isAdmin && !isVerifying && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => {
                                setVerifyingId(lap.id);
                                setVerificationStatusInput(lap.verificationStatus === 'Disetujui' ? 'Disetujui' : 'Disetujui');
                                setVerificationNotesInput(lap.verificationNotes || "");
                              }}
                              className="px-2 py-1 bg-slate-900 border border-slate-755 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Proses Verfifikasi</span>
                            </button>
                          </div>
                        )}

                        {/* INLINE VERIFICATION SLIDER CARD FOR PLANNING TEAM */}
                        {isAdmin && isVerifying && (
                          <div className="mt-3 p-3 bg-white dark:bg-slate-950 border border-indigo-250 dark:border-indigo-900 rounded space-y-3 transition-all relative">
                            <button 
                              onClick={() => setVerifyingId(null)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <h5 className="text-[11px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center">
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              Panel Keputusan Verifikasi Tim Perencanaan
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-450 mb-1">Pilih Status Persetujuan</label>
                                <div className="flex space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => setVerificationStatusInput('Disetujui')}
                                    className={`flex-1 py-1 px-2.5 rounded text-[10px] font-bold border ${
                                      verificationStatusInput === 'Disetujui' 
                                        ? 'bg-emerald-600 border-emerald-700 text-white' 
                                        : 'bg-white text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    Setujui Laporan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVerificationStatusInput('Perlu Perbaikan')}
                                    className={`flex-1 py-1 px-2.5 rounded text-[10px] font-bold border ${
                                      verificationStatusInput === 'Perlu Perbaikan' 
                                        ? 'bg-red-650 border-red-700 text-white' 
                                        : 'bg-white text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    Perlu Perbaikan
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-450 mb-1">Tambahkan Catatan / Catatan Perbaikan</label>
                                <textarea
                                  placeholder="Contoh: Berkas PDF lengkap, Foto Eviden valid, atau Sampaikan arahan perbaikan jika ditolak..."
                                  value={verificationNotesInput}
                                  onChange={(e) => setVerificationNotesInput(e.target.value)}
                                  className="w-full text-[10px] bg-slate-50 border border-slate-250 dark:bg-slate-900 rounded p-1.5 h-14 outline-hidden text-slate-750 dark:text-slate-300"
                                />
                              </div>

                            </div>

                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => setVerifyingId(null)}
                                className="px-2.5 py-1 text-[10px] font-semibold border border-slate-200/50 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleVerifySubmit(lap.id)}
                                disabled={submittingVerification}
                                className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-755 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                {submittingVerification ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Mengirim...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Simpan Keputusan</span>
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
