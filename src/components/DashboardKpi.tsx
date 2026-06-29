import React from "react";
import { AppState } from "../types";
import { 
  Building2, 
  CheckCircle, 
  TrendingUp, 
  HelpCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Clock 
} from "lucide-react";

interface DashboardKpiProps {
  state: AppState;
}

export function DashboardKpi({ state }: DashboardKpiProps) {
  const program_kegiatan = state.program_kegiatan || [];
  const ikpa = state.ikpa || [];
  const pelaporan = state.pelaporan || [];
  const risiko = state.risiko || [];
  const tindak_lanjut = state.tindak_lanjut || [];

  // 1. Capaian Kinerja percentage (average of SAKIP percentage or calculation of programs)
  const avgProgramKinerja = program_kegiatan.length > 0
    ? program_kegiatan.reduce((acc, pk) => acc + (pk.target > 0 ? (pk.realisasi / pk.target) * 150 : 0), 0) / program_kegiatan.length
    : 85;
  // Limit targetKinerja to 100% maximum fallback/calc
  const calculatedPercent = program_kegiatan.length > 0
    ? program_kegiatan.reduce((acc, pk) => acc + (pk.target > 0 ? (pk.realisasi / pk.target) * 100 : 0), 0) / program_kegiatan.length
    : 85;
  const targetKinerja = Math.round(calculatedPercent * 10) / 10;

  // 2. Realisasi anggaran from latest month in IKPA
  const latestIkpa = ikpa[ikpa.length - 1];
  const realisasiAnggaran = latestIkpa ? latestIkpa.penyerapan_anggaran : 55.4;

  // 3. Nilai IKPA
  const nilaiIkpa = latestIkpa ? latestIkpa.nilai_ikpa : 93.4;

  // 4. Kepatuhan Pelaporan (average compliance of all teams)
  const avgCompliance = pelaporan.length > 0
    ? pelaporan.reduce((acc, p) => acc + p.compliance, 0) / pelaporan.length
    : 88.5;
  const compliancePelaporan = Math.round(avgCompliance * 10) / 10;

  // 5. count of programs
  const totalPrograms = program_kegiatan.length;
  const ongoingPrograms = program_kegiatan.filter(x => x.status === 'Proses').length;
  const finishedPrograms = program_kegiatan.filter(x => x.status === 'Selesai').length;

  // 6. count of high risks
  const highRisks = risiko.filter(x => x.tingkat_risiko === 'Tinggi').length;

  // 7. count of pending follow-ups (tidak selesai)
  const pendingFollowups = tindak_lanjut.filter(x => x.status !== 'Selesai').length;

  const cards = [
    {
      id: "kpi-kinerja",
      title: "Capaian Kinerja",
      value: `${targetKinerja}%`,
      sub: "Berdasarkan rincian target fisik",
      trend: "+1.2% bulan lalu",
      icon: TrendingUp,
      color: "from-blue-600 to-sky-500",
      text: "text-blue-600 dark:text-sky-400",
      bgLight: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      id: "kpi-anggaran",
      title: "Realisasi Anggaran DIPA",
      value: `${realisasiAnggaran}%`,
      sub: `Posisi update bulan ${latestIkpa?.month || 'Juni'}`,
      trend: "Sesuai target s.d triwulan II",
      icon: Building2,
      color: "from-emerald-600 to-teal-500",
      text: "text-emerald-600 dark:text-teal-400",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      id: "kpi-ikpa",
      title: "Nilai IKPA BPMP",
      value: String(nilaiIkpa),
      sub: "Kualitas Tata Kelola Belanja",
      trend: "Sangat Baik (Kemenkeu)",
      icon: Layers,
      color: "from-indigo-600 to-violet-500",
      text: "text-indigo-600 dark:text-violet-400",
      bgLight: "bg-indigo-50 dark:bg-indigo-950/20"
    },
    {
      id: "kpi-pelaporan",
      title: "Kepatuhan Pelaporan",
      value: `${compliancePelaporan}%`,
      sub: "Akumulasi laporan rutin bulanan",
      trend: "Dari 5 Tim Kerja aktif",
      icon: CheckCircle,
      color: "from-teal-600 to-cyan-500",
      text: "text-teal-600 dark:text-cyan-400",
      bgLight: "bg-teal-50 dark:bg-teal-950/20"
    },
    {
      id: "kpi-berjalan",
      title: "Program Berjalan",
      value: String(ongoingPrograms),
      sub: `Dari total ${totalPrograms} program direncanakan`,
      trend: "Sedang dalam eksekusi",
      icon: Clock,
      color: "from-amber-600 to-yellow-500",
      text: "text-amber-600 dark:text-yellow-400",
      bgLight: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      id: "kpi-selesai",
      title: "Program Selesai",
      value: String(finishedPrograms),
      sub: "Tercapai 100% target fisik",
      trend: `Rasio: ${Math.round((finishedPrograms / (totalPrograms || 1)) * 100)}% dari rincian rencana`,
      icon: CheckCircle,
      color: "from-green-600 to-emerald-500",
      text: "text-green-600 dark:text-emerald-400",
      bgLight: "bg-green-50 dark:bg-green-950/20"
    },
    {
      id: "kpi-risiko",
      title: "Risiko Tingkat Tinggi",
      value: String(highRisks),
      sub: "Sangat Rentan Berdampak",
      trend: highRisks > 0 ? "Butuh perhatian pimpinan" : "Risiko terkendali sepenuhnya",
      icon: ShieldAlert,
      color: "from-rose-600 to-red-500",
      text: "text-rose-600 dark:text-red-400",
      bgLight: highRisks > 0 ? "bg-rose-50 dark:bg-rose-950/20 animate-pulse" : "bg-rose-50 dark:bg-rose-950/20"
    },
    {
      id: "kpi-tindak-lanjut",
      title: "Temuan Menunggu",
      value: String(pendingFollowups),
      sub: "Belum tuntas ditindaklanjuti",
      trend: "Itjen, SPI & Evaluasi Internal",
      icon: AlertTriangle,
      color: "from-orange-600 to-amber-500",
      text: "text-orange-600 dark:text-amber-400",
      bgLight: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="siperamal-kpi-deck">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const widthPercent = card.value.includes("%") 
          ? parseFloat(card.value) 
          : parseFloat(card.value) > 0 ? Math.min(100, parseFloat(card.value) * 10) : 80;
          
        return (
          <div 
            key={card.id}
            id={card.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {card.title}
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </span>
                <span className={`text-[10px] font-bold ${card.text}`}>
                  {card.trend.split(" s.d ")[0].split(" (")[0]}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 mt-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${card.color}`} 
                  style={{ width: `${isNaN(widthPercent) ? 80 : Math.min(100, Math.max(5, widthPercent))}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
              <p className="font-semibold text-slate-600 dark:text-slate-350 truncate">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
