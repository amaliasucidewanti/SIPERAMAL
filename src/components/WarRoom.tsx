import React from "react";
import { AppState } from "../types";
import { 
  Trophy, 
  Flame, 
  ShieldAlert, 
  Clock, 
  Layers, 
  DollarSign, 
  CheckSquare, 
  Compass, 
  Sparkle, 
  Radio, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface WarRoomProps {
  state: AppState;
}

export function WarRoom({ state }: WarRoomProps) {
  // Calculations
  const sortedTeambye = [...state.pelaporan].sort((a,b) => b.compliance - a.compliance);
  const topPerformer = sortedTeambye[0];

  const priorityPrograms = state.program_kegiatan.slice(0, 3);
  const delayedPrograms = state.program_kegiatan.filter(x => x.status === "Terlambat");
  const highRisks = state.risiko.filter(x => x.tingkat_risiko === "Tinggi");

  const latestIkpa = state.ikpa[state.ikpa.length - 1];
  const realisasiAnggaran = latestIkpa ? latestIkpa.penyerapan_anggaran : 0;
  const nilaiIkpa = latestIkpa ? latestIkpa.nilai_ikpa : 0;

  const avgCompliance = state.pelaporan.length > 0
    ? state.pelaporan.reduce((acc, p) => acc + p.compliance, 0) / state.pelaporan.length
    : 0;
  const compliancePelaporan = Math.round(avgCompliance * 10) / 10;

  return (
    <div className="space-y-6" id="siperamal-war-room-view">
      
      {/* Dynamic Cockpit Status header */}
      <div className="bg-slate-900 text-white rounded p-3 border border-blue-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded bg-emerald-450 bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-350 uppercase">WAR ROOM KINERJA - STATUS LIVE BPMP MALUT</span>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-mono">Diperbaharui otomatis: 1 detik yang lalu</span>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="war-room-grid">
        
        {/* Left Column blocks */}
        <div className="space-y-4 lg:col-span-2">
          
          {/* Top Performer & Core metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Top Performer */}
            {topPerformer && (
              <div className="bg-gradient-to-br from-indigo-950 to-blue-950 text-white p-4 rounded-lg border border-indigo-500/10 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-indigo-500/10 group-hover:text-yellow-500/20 transition-colors">
                  <Trophy className="w-16 h-16" />
                </div>
                <div className="relative z-10 space-y-2">
                  <span className="text-[9px] font-bold text-yellow-400 font-mono uppercase tracking-wider block">PRESTASI INTERNAL</span>
                  <h4 className="text-xs font-bold text-slate-300 font-sans uppercase">Top Performer Tim Kerja</h4>
                  <p className="text-lg font-black text-white">{topPerformer.team}</p>
                  <div className="pt-1 flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-yellow-500 font-mono">{topPerformer.compliance}%</span>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Compliance</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Gauges */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-2 text-center items-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block font-mono">RELIABILTIAS</span>
                <span className="text-base font-black font-mono text-emerald-500 mt-0.5 block">{compliancePelaporan}%</span>
                <span className="text-[9px] text-slate-405 dark:text-slate-500 block">Laporan OK</span>
              </div>
              <div className="border-x border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 block font-mono">DIPA BELANJA</span>
                <span className="text-base font-black font-mono text-blue-500 mt-0.5 block">{realisasiAnggaran}%</span>
                <span className="text-[9px] text-slate-405 dark:text-slate-500 block">Anggaran</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block font-mono">IKPA SCORE</span>
                <span className="text-base font-black font-mono text-violet-500 mt-0.5 block">{nilaiIkpa}</span>
                <span className="text-[9px] text-slate-405 dark:text-slate-500 block">Sgt Baik</span>
              </div>
            </div>

          </div>

          {/* Program Prioritas List */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-3">
              <span className="text-[9px] font-black text-blue-600 dark:text-sky-400 tracking-widest uppercase block">PROG UTAMA</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 uppercase tracking-wide">Program Prioritas Instansi BPMP</h4>
            </div>

            <div className="space-y-3">
              {priorityPrograms.map(p => {
                const pct = p.target > 0 ? (p.realisasi / p.target) * 100 : 0;
                let barColor = "bg-rose-500";
                if (p.status === "Selesai") barColor = "bg-emerald-500";
                else if (p.status === "Proses") barColor = "bg-amber-500";

                return (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-850/40 rounded-md border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-md">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono">{p.team}</span>
                      <h5 className="font-bold text-xs text-slate-805 dark:text-slate-200 leading-normal">{p.program}</h5>
                      <p className="text-slate-450 dark:text-slate-500 text-[10px] line-clamp-1">{p.kegiatan}</p>
                    </div>
                    <div className="min-w-36 flex flex-col justify-center space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500">Fisik:</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{p.realisasi}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column Alerts */}
        <div className="space-y-4">
          
          {/* Overdue/Late tasks box */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-rose-650 dark:text-rose-400 mb-3 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-sans">Keterlambatan Kegiatan ({delayedPrograms.length})</span>
            </div>

            {delayedPrograms.length === 0 ? (
              <div className="p-3.5 rounded border border-dashed border-emerald-500/20 text-center text-xs text-emerald-600 bg-emerald-500/5">
                <CheckSquare className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                Seluruh program berjalan sesuai target waktu!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {delayedPrograms.map(p => (
                  <div key={p.id} className="p-2.5 bg-rose-500/[0.03] rounded border border-rose-100 dark:border-rose-900/30 text-[11px]">
                    <div className="flex justify-between items-start font-semibold">
                      <span className="font-bold text-rose-650 dark:text-rose-400 font-mono leading-tight">{p.team}</span>
                      <span className="text-[9px] text-slate-450 font-bold whitespace-nowrap">Cap. {p.realisasi}%</span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-250 mt-1 line-clamp-2 leading-relaxed">{p.kegiatan}</p>
                    <span className="text-[9px] mt-1.5 block text-slate-400">PIC: {p.pic}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Risks alerts box */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-amber-650 dark:text-amber-400 mb-3 bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-sans">Risiko Tingkat Tinggi ({highRisks.length})</span>
            </div>

            {highRisks.length === 0 ? (
              <div className="p-3.5 rounded border border-dashed border-slate-100 text-center text-xs text-slate-400">
                Tidak ada risiko gawat yang belum dimitigasi.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {highRisks.map(r => (
                  <div key={r.id} className="p-2.5 bg-amber-500/[0.03] rounded border border-amber-100 dark:border-amber-900/30 text-[11px]">
                    <p className="font-bold text-slate-800 dark:text-slate-250 leading-normal">{r.risiko}</p>
                    <div className="mt-1.5 text-[10px] text-slate-505 dark:text-slate-400 leading-relaxed bg-slate-101 dark:bg-slate-850 p-1.5 rounded border border-slate-150 dark:border-slate-800">
                      <strong>Mitigasi:</strong> {r.mitigasi}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
