import React, { useState, useEffect } from "react";
import { AppState, User } from "./types";
import { INITIAL_APP_STATE } from "./db/initial_data";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { LoginPage } from "./components/LoginPage";
import { DashboardKpi } from "./components/DashboardKpi";
import { ChartsSection } from "./components/ChartsSection";
import { MonitoringProgram } from "./components/MonitoringProgram";
import { MonitoringPelaporan } from "./components/MonitoringPelaporan";
import { DashboardSakip } from "./components/DashboardSakip";
import { DashboardIkpa } from "./components/DashboardIkpa";
import { DashboardRisiko } from "./components/DashboardRisiko";
import { DashboardTindakLanjut } from "./components/DashboardTindakLanjut";
import { WarRoom } from "./components/WarRoom";
import { SettingsPanel } from "./components/SettingsPanel";
import { 
  Building2, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  Printer, 
  Download, 
  Bell,
  Search,
  Menu,
  ChevronDown,
  AlertOctagon,
  Clock,
  Sparkles,
  RefreshCw,
  Gauge
} from "lucide-react";

function SIPERAMAL_Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<Omit<User, 'password'> | null>({
    id: 'u1',
    username: 'admin',
    name: 'Admin Perencanaan BPMP',
    role: 'Admin Perencanaan',
    team: 'All'
  });

  // Core application state loaded from Express Server
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);

  // Active Menu Tabs:
  // 'dashboard' | 'program' | 'pelaporan' | 'sakip' | 'ikpa' | 'risiko' | 'tindak_lanjut' | 'war_room' | 'settings'
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Global search and notification system
  const [universalSearch, setUniversalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [reminderAlerts, setReminderAlerts] = useState<Array<{ id: string; type: string; title: string; desc: string }>>([]);

  const updateStateAndPersist = (newState: AppState) => {
    setState(newState);
    calculateReminders(newState);
    localStorage.setItem("siperamal-app-state", JSON.stringify(newState));
  };

  // Load state from API
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/data");
      
      let data;
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        data = await response.json();
        updateStateAndPersist(data);
      } else {
        const text = await response.text();
        throw new Error(`Status ${response.status}: ${text.substring(0, 150)}`);
      }
    } catch (err: any) {
      console.error("Fetch data error, loading local/fallback state:", err);
      // Fallback to local storage
      const localData = localStorage.getItem("siperamal-app-state");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setState(parsed);
          calculateReminders(parsed);
          setErrorVisible("Bekerja dalam Mode Lokal (Gagal sinkronisasi data dari Server, perubahan disimpan di browser).");
        } catch (e) {
          setState(INITIAL_APP_STATE);
          calculateReminders(INITIAL_APP_STATE);
          setErrorVisible("Gagal memuat data dari server. Menggunakan data bawaan (Mode Lokal).");
        }
      } else {
        setState(INITIAL_APP_STATE);
        calculateReminders(INITIAL_APP_STATE);
        setErrorVisible("Gagal memuat data dari server. Menggunakan data bawaan (Mode Lokal).");
      }
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on component mount
  useEffect(() => {
    // Check auto login from session
    const savedUser = localStorage.getItem("siperamal-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("siperamal-user");
      }
    }
    loadData();
  }, []);

  // Set up notifications & action-oriented reminder states
  const calculateReminders = (currentState: AppState) => {
    const alerts: typeof reminderAlerts = [];
    
    // 1. Overdue programs
    const lateCount = currentState.program_kegiatan.filter(x => x.status === "Terlambat").length;
    if (lateCount > 0) {
      alerts.push({
        id: "rem-late",
        type: "late",
        title: "Kepatuhan Jadwal",
        desc: `${lateCount} program kerja BPMP berstatus Terlambat!`,
      });
    }

    // 2. Report deficiencies
    const lowComplianceTeam = currentState.pelaporan.find(x => x.compliance < 80);
    if (lowComplianceTeam) {
      alerts.push({
        id: "rem-report",
        type: "report",
        title: "Kepatuhan Berkas Laporan",
        desc: `${lowComplianceTeam.team} memiliki kepatuhan berkas dibawah 80% (Kurang)!`,
      });
    }

    // 3. High risks
    const highRisks = currentState.risiko.filter(x => x.tingkat_risiko === "Tinggi" && x.status !== "Teratasi").length;
    if (highRisks > 0) {
      alerts.push({
        id: "rem-risk",
        type: "risk",
        title: "Manajemen Risiko",
        desc: `Ada ${highRisks} profil Risiko Tinggi yang butuh perhatian khusus mitigasi.`,
      });
    }

    setReminderAlerts(alerts);
  };

  // Handlers for data CRUD calling the express APIs with client-side fallback
  const handleAddRecord = async (module: string, record: any) => {
    try {
      const response = await fetch(`/api/data/${module}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record, username: user?.username || "System" }),
      });
      if (response.ok) {
        const resData = await response.json();
        updateStateAndPersist(resData.state);
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      console.warn("Server failed, adding locally:", err);
      if (!state) return;
      const newRecord = { ...record, id: `local-${Date.now()}` };
      const updatedModule = [...(state[module as keyof AppState] as any[]), newRecord];
      const updatedState = { ...state, [module]: updatedModule };
      updateStateAndPersist(updatedState);
    }
  };

  const handleUpdateRecord = async (module: string, id: string, record: any) => {
    try {
      const response = await fetch(`/api/data/${module}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record, username: user?.username || "System" }),
      });
      if (response.ok) {
        const resData = await response.json();
        updateStateAndPersist(resData.state);
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      console.warn("Server failed, updating locally:", err);
      if (!state) return;
      const updatedModule = (state[module as keyof AppState] as any[]).map((item) =>
        item.id === id ? { ...item, ...record } : item
      );
      const updatedState = { ...state, [module]: updatedModule };
      updateStateAndPersist(updatedState);
    }
  };

  const handleDeleteRecord = async (module: string, id: string) => {
    try {
      const response = await fetch(`/api/data/${module}/${id}?username=${user?.username || "System"}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const resData = await response.json();
        updateStateAndPersist(resData.state);
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      console.warn("Server failed, deleting locally:", err);
      if (!state) return;
      const updatedModule = (state[module as keyof AppState] as any[]).filter((item) => item.id !== id);
      const updatedState = { ...state, [module]: updatedModule };
      updateStateAndPersist(updatedState);
    }
  };

  const handleUpdateSheetsConfig = async (config: any) => {
    try {
      const response = await fetch("/api/sheets/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, username: user?.username || "System" }),
      });
      if (response.ok) {
        const resData = await response.json();
        setState(resData.state);
      }
    } catch (err) {
      alert("Gagal mengubah konfigurasi Sheets.");
    }
  };

  const handleTestSheetsConnection = async () => {
    try {
      const response = await fetch("/api/sheets/test");
      const data = await response.json();
      if (response.ok) {
        // Reload State after test since connected status might change on server
        await loadData();
        return data;
      }
    } catch (err) {
      return { success: false, message: "Koneksi terputus ke Endpoint Test." };
    }
  };

  const handleSyncSheets = async (direction: 'push' | 'pull') => {
    try {
      const response = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, username: user?.username || "System" }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setState(data.state);
        calculateReminders(data.state);
      }
      return data;
    } catch (err) {
      return { success: false, message: "Gagal memicu sinkronisasi." };
    }
  };

  const handleResetData = async () => {
    try {
      const response = await fetch("/api/data/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user?.username || "System" }),
      });
      if (response.ok) {
        const resData = await response.json();
        updateStateAndPersist(resData.state);
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      console.warn("Server failed, resetting locally:", err);
      updateStateAndPersist(INITIAL_APP_STATE);
    }
  };

  const handleLogin = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    localStorage.setItem("siperamal-user", JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser({
      id: 'u1',
      username: 'admin',
      name: 'Admin Perencanaan BPMP',
      role: 'Admin Perencanaan',
      team: 'All'
    });
    localStorage.removeItem("siperamal-user");
  };

  // Print trigger optimized with style overrides
  const handlePrint = () => {
    window.print();
  };

  // Combined CSV spreadsheet download link
  const handleExportExcel = () => {
    if (!state) return;
    
    // Build separate CSV rows for program_kegiatan Table
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== SIPERAMAL DATABASE EXPORT ===\n";
    csvContent += "Tahun,Triwulan,Tim Kerja,PIC Penilai,Program,Kegiatan,Target,Realisasi,Status\n";
    
    state.program_kegiatan.forEach((pk) => {
      const row = [
        String(pk.year),
        `"${pk.triwulan}"`,
        `"${pk.team}"`,
        `"${pk.pic}"`,
        `"${pk.program.replace(/"/g, '""')}"`,
        `"${pk.kegiatan.replace(/"/g, '""')}"`,
        String(pk.target),
        String(pk.realisasi),
        `"${pk.status}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `siperamal_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick reminder action trigger simulations
  const handleTriggerReminder = (alertItem: any) => {
    alert(`SIPERAMAL SIMULATION REMINDER SYSTEM:\n\nTelah mengirim notifikasi email & telegram otomatis kepada penanggungjawab terkait isu: \n- ${alertItem.title}: "${alertItem.desc}"`);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="font-mono text-xs">Memetakan data SIPERAMAL BPMP dari Server...</p>
      </div>
    );
  }

  // Navigation menu configurations
  const navTabs = [
    { id: "dashboard", label: "Dashboard Eksekutif" },
    { id: "program", label: "Monitoring Program" },
    { id: "pelaporan", label: "Evaluasi Pelaporan" },
    { id: "sakip", label: "Penilaian SAKIP" },
    { id: "ikpa", label: "Monitoring IKPA" },
    { id: "risiko", label: "Profil Risiko" },
    { id: "war_room", label: "War Room Kinerja" },
    { id: "settings", label: "Sistem & Pengaturan" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
        
        {errorVisible && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md print:hidden">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorVisible}</span>
            </div>
            <button 
              onClick={() => setErrorVisible(null)}
              className="text-slate-950 hover:bg-amber-600/30 px-2 py-1 rounded cursor-pointer font-sans text-[11px]"
            >
              Tutup
            </button>
          </div>
        )}
        
        {/* PRINT ONLY CORNER OVERRIDES */}
        <div className="hidden print:block p-8 space-y-4">
          <h1 className="text-3xl font-black text-blue-900">SIPERAMAL</h1>
          <p className="font-serif italic">Sistem Informasi Perencanaan, Evaluasi, dan Pengendalian Kinerja BPMP Provinsi Maluku Utara</p>
          <hr className="border-slate-800" />
        </div>

        {/* Executive Header Board */}
        <header className="bg-slate-900 text-white border-b-4 border-sky-500 sticky top-0 z-40 print:hidden transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1 flex-none shadow">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold font-sans tracking-tight leading-none text-white hover:opacity-90">
                    SIPERAMAL
                  </h1>
                </div>
                <p className="text-[10px] text-sky-300 font-medium tracking-widest uppercase mt-0.5">
                  SISTEM INFORMASI PERENCANAAN, EVALUASI, &amp; PENGENDALIAN
                </p>
              </div>
            </div>

            {/* Middle Quick Actions & Toggles */}
            <div className="flex items-center space-x-3">
              {/* Universal search input */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pencarian lintas modul..."
                  value={universalSearch}
                  onChange={(e) => setUniversalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:w-64 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 rounded text-xs transition-all font-sans"
                />
              </div>

              {/* Print current state */}
              <button
                onClick={handlePrint}
                className="p-1.5 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Print Halaman"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* CSV Export */}
              <button
                onClick={handleExportExcel}
                className="p-1.5 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Export Excel (CSV)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Notification & Alerts Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer relative"
                  title="Notifikasi Prioritas"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {reminderAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-slate-900 animate-pulse"></span>
                  )}
                </button>

                {/* Dropdown panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-700 rounded shadow-2xl p-3 space-y-2.5 z-50 text-xs text-white">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest block">SIstem Deteksi Dini</span>
                    <hr className="border-slate-800" />
                    {reminderAlerts.length === 0 ? (
                      <p className="text-slate-400 py-3 text-center">Seluruh program dan pelaporan terkendali penuh.</p>
                    ) : (
                      <div className="space-y-2">
                        {reminderAlerts.map(alt => (
                          <div key={alt.id} className="p-2.5 bg-slate-800 rounded border border-slate-750 relative">
                            <span className="font-bold text-rose-450 block font-sans">{alt.title}</span>
                            <p className="text-slate-400 mt-0.5 leading-normal text-[11px]">{alt.desc}</p>
                            <button
                              onClick={() => handleTriggerReminder(alt)}
                              className="mt-1 text-[10px] text-sky-400 font-bold hover:underline"
                            >
                              Kirim Pengingat Lanjutan
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dark / Light Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
              </button>

              {/* Profile Block & Logout */}
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-700">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] opacity-70 uppercase tracking-tighter text-white">BPMP Provinsi Maluku Utara</p>
                  <p className="text-xs font-semibold italic text-sky-450 leading-tight">"Monitoring Cepat, Evaluasi Tepat, Kinerja Meningkat"</p>
                </div>
                <div className="w-8 h-8 rounded bg-slate-700 border border-slate-600 flex items-center justify-center p-1 text-xs font-extrabold text-white">
                  ADM
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Outer Tabs / Dashboard Navigation */}
        <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-1 print:hidden">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex space-x-2 scrollbar-none">
            {navTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded font-sans transition-colors cursor-pointer ${
                    active 
                      ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-r-4 border-sky-600 shadow-xs" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 print:p-0 transition-all">
          
          {/* Universal Search Overlays (Conditional display) */}
          {universalSearch.trim() !== "" && (
            <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200/40 dark:border-blue-900/40 shadow-xs print:hidden space-y-3">
              <span className="text-[10px] font-bold text-blue-600 font-mono tracking-wider uppercase">Hasil Pencarian Universal untuk: "{universalSearch}"</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Search query in Program_Kegiatan list */}
                {state.program_kegiatan.filter(x => x.kegiatan.toLowerCase().includes(universalSearch.toLowerCase())).map(item => (
                  <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs shadow-xs">
                    <span className="font-mono text-[9px] text-blue-500 uppercase">{item.team}</span>
                    <p className="font-bold text-slate-850 dark:text-slate-100 mt-1">{item.kegiatan}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">Status: {item.status} (Cap. {item.realisasi}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Active View Routing */}
          {activeTab === "dashboard" && (
            <div className="space-y-4 animate-fade-in" id="siperamal-executive-view">
              
              {/* Ministry Banner style greetings */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg p-5 shadow border-b-4 border-sky-500 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative z-10 max-w-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-sky-450 font-mono tracking-widest bg-sky-400/10 border border-sky-400/20 px-2.5 py-0.5 rounded uppercase">
                    SIstem Informasi SIPERAMAL BPMP Malut
                  </span>
                  <h2 className="text-xl font-bold font-sans tracking-tight text-white leading-tight">
                    Portal Evaluasi dan Mutu Pendidikan Maluku Utara 2026
                  </h2>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    Halo, <strong>{user.name}</strong>. Anda masuk sebagai <strong className="text-sky-300">[{user.role}]</strong>. Gunakan portal ini untuk memantau kinerja secara tuntas.
                  </p>
                </div>

                <div className="relative z-10 p-3 bg-slate-850/60 rounded border border-slate-750 text-[11px] shrink-0 max-w-xs space-y-1">
                  <p className="text-slate-300 font-serif italic mb-1">"Monitoring Cepat, Evaluasi Tepat, Kinerja Meningkat."</p>
                  <p className="text-slate-450 text-[10px] leading-relaxed">Bila koneksi Google Sheets terputus, silakan lakukan reset di menu <strong>Sistem & Pengaturan</strong>.</p>
                </div>
              </div>

              {/* Dynamic KPI Deck */}
              <DashboardKpi state={state} />

              {/* Analytics Section */}
              <ChartsSection state={state} />

            </div>
          )}

          {activeTab === "program" && (
            <MonitoringProgram 
              state={state} 
              user={user} 
              onAdd={(record) => handleAddRecord("program_kegiatan", record)}
              onUpdate={(id, record) => handleUpdateRecord("program_kegiatan", id, record)}
              onDelete={(id) => handleDeleteRecord("program_kegiatan", id)}
            />
          )}

          {activeTab === "pelaporan" && (
            <MonitoringPelaporan 
              state={state} 
              user={user} 
              onUpdate={(id, record) => handleUpdateRecord("pelaporan", id, record)}
              onUpdateState={setState}
            />
          )}

          {activeTab === "sakip" && (
            <DashboardSakip 
              state={state} 
              user={user} 
              onAdd={(record) => handleAddRecord("sakip", record)}
              onUpdate={(id, record) => handleUpdateRecord("sakip", id, record)}
              onDelete={(id) => handleDeleteRecord("sakip", id)}
            />
          )}

          {activeTab === "ikpa" && (
            <DashboardIkpa 
              state={state} 
              user={user} 
              onAdd={(record) => handleAddRecord("ikpa", record)}
              onUpdate={(id, record) => handleUpdateRecord("ikpa", id, record)}
              onDelete={(id) => handleDeleteRecord("ikpa", id)}
            />
          )}

          {activeTab === "risiko" && (
            <DashboardRisiko 
              state={state} 
              user={user} 
              onAdd={(record) => handleAddRecord("risiko", record)}
              onUpdate={(id, record) => handleUpdateRecord("risiko", id, record)}
              onDelete={(id) => handleDeleteRecord("risiko", id)}
            />
          )}

          {activeTab === "war_room" && (
            <WarRoom state={state} />
          )}

          {activeTab === "settings" && (
            <SettingsPanel 
              state={state} 
              user={user} 
              onAddTeam={(record) => handleAddRecord("teams", record)}
              onDeleteTeam={(id) => handleDeleteRecord("teams", id)}
              onUpdateSheetsConfig={handleUpdateSheetsConfig}
              onTestSheetsConnection={handleTestSheetsConnection}
              onSyncSheets={handleSyncSheets}
              onResetData={handleResetData}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/80 py-5 text-center text-xs text-slate-400 print:hidden transition-colors">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium">
              © 2026 SIPERAMAL — Sistem Pengendalian Kinerja BPMP Provinsi Maluku Utara.
            </p>
            <p className="font-mono text-[9px] text-slate-500 mt-1">
              Didesain berdasar standar arsitektur kementerian modern penilai akuntabilitas.
            </p>
          </div>
        </footer>

      </div>
    );
}

export default function App() {
  return (
    <ThemeProvider>
      <SIPERAMAL_Dashboard />
    </ThemeProvider>
  );
}
