import React from "react";
import { AppState } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface ChartsSectionProps {
  state: AppState;
}

export function ChartsSection({ state }: ChartsSectionProps) {
  const program_kegiatan = state.program_kegiatan || [];
  const ikpa = state.ikpa || [];
  const pelaporan = state.pelaporan || [];

  // 1. Line Chart Data (from state.ikpa)
  const lineData = ikpa.map(x => ({
    name: x.month.substring(0, 3) + " " + String(new Date().getFullYear()),
    "Nilai IKPA": x.nilai_ikpa,
    "Penyerapan": x.penyerapan_anggaran,
    "Deviasi Hal III": x.deviasi_halaman_iii
  }));

  // 2. Pie Chart Data (Status Kegiatan: Selesai, Proses, Terlambat)
  const statusCounts = program_kegiatan.reduce(
    (acc, pk) => {
      if (pk.status === "Selesai") acc.selesai += 1;
      else if (pk.status === "Proses") acc.proses += 1;
      else if (pk.status === "Terlambat") acc.terlambat += 1;
      return acc;
    },
    { selesai: 0, proses: 0, terlambat: 0 }
  );

  const pieData = [
    { name: "Selesai (Hijau)", value: statusCounts.selesai, color: "#10b981" },
    { name: "Proses (Kuning)", value: statusCounts.proses, color: "#eab308" },
    { name: "Terlambat (Merah)", value: statusCounts.terlambat, color: "#ef4444" },
  ].filter(x => x.value > 0);

  // Fallback if no counts
  const pieDataFinal = pieData.length > 0 ? pieData : [
    { name: "Selesai", value: 3, color: "#10b981" },
    { name: "Proses", value: 2, color: "#eab308" },
    { name: "Terlambat", value: 1, color: "#ef4444" }
  ];

  // 3. Bar Chart Data (Kepatuhan Tim Kerja dari Pelaporan)
  const barData = pelaporan.map(p => ({
    name: p.team,
    "Laporan Bulanan": p.laporan_bulanan,
    "Laporan Kegiatan": p.laporan_kegiatan,
    "Data Dukung": p.data_dukung,
    "Kepatuhan Rata-rata": p.compliance
  }));

  // Custom Tooltip component for ministry aesthetics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950 text-white p-2.5 rounded border border-slate-700/50 shadow-2xl text-xs font-sans">
          <p className="font-bold border-b border-slate-700/80 pb-1 mb-1">{label || "Statistik"}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="flex items-center space-x-2 py-0.5" style={{ color: entry.color }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span>{entry.name}: <span className="font-mono font-bold">{entry.value}%</span></span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="siperamal-analytics-grid">
      
      {/* Box 1: Line Chart (IKPA) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-all">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono tracking-widest uppercase block mb-0.5">METRIK BULANAN</span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              Tren Anggaran & Tata Kelola IKPA BPMP
            </h4>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded font-mono font-semibold">
            s.d {ikpa[ikpa.length - 1]?.month || "Desember"} 2026
          </span>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 105]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Nilai IKPA" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Penyerapan" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="Deviasi Hal III" stroke="#ec4899" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Box 2: Pie Chart (Status Kegiatan) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-all">
        <div className="mb-3">
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono tracking-widest uppercase block mb-0.5">RINCIAN KERJA</span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            Status Program & Kegiatan
          </h4>
        </div>

        <div className="h-[200px] w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieDataFinal}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieDataFinal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Kegiatan`, 'Jumlah']} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">
              {program_kegiatan.length}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Total Rencana
            </span>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded">
            <span className="block font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {statusCounts.selesai}
            </span>
            <span className="text-slate-500 block">Selesai</span>
          </div>
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded">
            <span className="block font-black text-amber-600 dark:text-amber-400 text-sm">
              {statusCounts.proses}
            </span>
            <span className="text-slate-500 block">Proses</span>
          </div>
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 rounded">
            <span className="block font-black text-rose-600 dark:text-rose-400 text-sm">
              {statusCounts.terlambat}
            </span>
            <span className="text-slate-500 block">Terlambat</span>
          </div>
        </div>
      </div>

      {/* Box 3: Bar Chart (Kepatuhan Tim Kerja) */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono tracking-widest uppercase block mb-0.5">PERFORMA UNIT</span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              Rasio Kepatuhan Administrasi Tim Kerja BPMP
            </h4>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0 text-[11px] text-slate-400">
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 inline-block"></span>Bulanan</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mr-1.5 inline-block"></span>Kegiatan</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>Dukung</span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 105]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Laporan Bulanan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Laporan Kegiatan" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Data Dukung" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
