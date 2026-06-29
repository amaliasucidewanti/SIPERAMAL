import React, { useState } from "react";
import { AppState, Team, GoogleSheetsConfig, User } from "../types";
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Database, 
  History, 
  RefreshCw, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  CloudRain, 
  Download, 
  Upload,
  UserPlus
} from "lucide-react";

interface SettingsPanelProps {
  state: AppState;
  user: Omit<User, 'password'>;
  onAddTeam: (record: any) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  onUpdateSheetsConfig: (config: any) => Promise<void>;
  onTestSheetsConnection: () => Promise<any>;
  onSyncSheets: (direction: 'push' | 'pull') => Promise<any>;
  onResetData: () => Promise<void>;
}

export function SettingsPanel({
  state,
  user,
  onAddTeam,
  onDeleteTeam,
  onUpdateSheetsConfig,
  onTestSheetsConnection,
  onSyncSheets,
  onResetData,
}: SettingsPanelProps) {
  // Team addition form
  const [teamName, setTeamName] = useState("");
  const [teamHead, setTeamHead] = useState("");

  // Google Sheets configuration fields
  const [spreadsheetId, setSpreadsheetId] = useState(state.sheets_config.spreadsheetId || "");
  const [apiKey, setApiKey] = useState(state.sheets_config.apiKey || "");
  const [clientEmail, setClientEmail] = useState(state.sheets_config.clientEmail || "");
  const [privateKey, setPrivateKey] = useState(state.sheets_config.privateKey || "");

  // Dynamic statuses
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sheets?: string[] } | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<'push' | 'pull' | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const isAdmin = user.role === "Admin Perencanaan";

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!teamName || !teamHead) return;

    await onAddTeam({ name: teamName, head_name: teamHead });
    setTeamName("");
    setTeamHead("");
  };

  const handleSaveConfig = async () => {
    if (!isAdmin) return;
    await onUpdateSheetsConfig({
      spreadsheetId,
      apiKey,
      clientEmail,
      privateKey,
    });
    alert("Konfigurasi Google Sheets berhasil disimpan ke server.");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // First save the values so the backend tests the updated credentials
      await onUpdateSheetsConfig({ spreadsheetId, apiKey, clientEmail, privateKey });
      
      const res = await onTestSheetsConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: `Koneksi gagal: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async (direction: 'push' | 'pull') => {
    setSyncing(direction);
    setSyncStatus(null);
    try {
      const res = await onSyncSheets(direction);
      if (res.success) {
        setSyncStatus(`Sinkronisasi (${direction.toUpperCase()}) Berhasil: ${res.message}`);
      } else {
        setSyncStatus(`Sinkronisasi Gagal: ${res.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`Sinkronisasi Gagal: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleResetData = async () => {
    if (window.confirm("Buka konfirmasi: tindakan ini akan me-reset seluruh data kustom Anda kembali ke data mula standar/demo BPMP Maluku Utara. Data audit log dsb akan dihapus. Anda yakin?")) {
      await onResetData();
      alert("Seluruh data berhasil di-reset!");
      // reload values
      setSpreadsheetId("");
      setApiKey("");
      setClientEmail("");
      setPrivateKey("");
    }
  };

  return (
    <div className="space-y-6" id="siperamal-settings-view">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left column: Teams master and Demo Reset */}
        <div className="space-y-6">
          
          {/* Master Tim Kerja */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center mb-3">
              <Plus className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
              Master Penugasan Tim Kerja BPMP
            </h3>

            {isAdmin ? (
              <form onSubmit={handleAddTeam} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 border-b border-slate-105 dark:border-slate-800 pb-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Nama Bidang Kerja</label>
                  <input 
                    type="text" required placeholder="Contoh: SMA atau Guru" value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-850 p-1.5 rounded text-xs bg-slate-50 dark:bg-slate-850" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Kepala Tim Kerja (PIC)</label>
                  <div className="flex space-x-1.5">
                    <input 
                      type="text" required placeholder="Nama Lengkap" value={teamHead}
                      onChange={(e) => setTeamHead(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-850 p-1.5 rounded text-xs bg-slate-50 dark:bg-slate-850" 
                    />
                    <button 
                      type="submit"
                      className="px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2 rounded mb-3 text-center leading-normal">
                Hak akses Ketua Tim Kerja terlarang memperbarui MASTER data unit kerja.
              </p>
            )}

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto">
              {state.teams.map((t) => (
                <li key={t.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100">{t.name}</strong>
                    <span className="text-slate-400 block mt-0.5">Ketua: {t.head_name}</span>
                  </div>
                  {isAdmin && state.teams.length > 2 && (
                    <button
                      onClick={() => onDeleteTeam(t.id)}
                      className="p-1 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-slate-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Reset button module */}
          <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-lg p-3.5 shadow-xs">
            <h3 className="text-rose-600 dark:text-rose-450 font-bold text-[11px] uppercase tracking-wider">Menu Kembalikan Sistem (Reset System)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
              Kembalikan database internal ke rujukan orisinil BPMP (untuk presentasi demo). Tindakan ini permanen.
            </p>
            {isAdmin ? (
              <button
                onClick={handleResetData}
                className="mt-2.5 py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Simulasi Reset ke Data Mula</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 block mt-1.5 italic">Pengesahan Admin Perencanaan bersyarat untuk me-reset.</span>
            )}
          </div>

        </div>

        {/* Right column: Google Sheets API Connection */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center mb-1">
              <Database className="w-4 h-4 text-emerald-500 mr-2" />
              Integrasi Google Sheets API Database
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal mb-3">
              Posisikan URL Spreadsheet di bawah ini. Aplikasi mendukung credential <strong>Service Account</strong> untuk update data langsung.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-0.5">SPREADSHEET ID</label>
                <input 
                  type="text" placeholder="Contoh: 1X2xYz3..." value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2 rounded text-xs bg-slate-50 dark:bg-slate-850 mb-0.5" 
                />
                <span className="text-[9px] text-slate-400">ID dapat dilihat di URL google sheet anda.</span>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-0.5">GOOGLE SPREADSHEETS API KEY (PUBLIC READ)</label>
                <input 
                  type="password" placeholder="AIzaSy..." value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2 rounded text-xs bg-slate-50 dark:bg-slate-850" 
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                <span className="text-[9px] font-bold text-indigo-500 uppercase block tracking-wider">Kredensial Service Account (Mutasi / WRITE)</span>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">CLIENT EMAIL</label>
                  <input 
                    type="text" placeholder="siperamal@project.iam.gserviceaccount.com" value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full border border-slate-200 dark:border-slate-800 p-2 rounded text-xs bg-slate-50 dark:bg-slate-850" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">PRIVATE KEY</label>
                  <textarea 
                    rows={2} placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..." value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full border border-slate-200 dark:border-slate-800 p-2 rounded text-xs bg-slate-50 dark:bg-slate-850/50 font-mono" 
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <button
                    type="button" onClick={handleSaveConfig}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-255 rounded text-xs font-bold cursor-pointer"
                  >
                    Simpan Konfig
                  </button>
                  <button
                    type="button" onClick={handleTestConnection}
                    disabled={testing}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{testing ? "Menguji..." : "Uji Sambungan"}</span>
                  </button>
                </div>
              )}

              {/* Connection outputs */}
              {testResult && (
                <div className={`p-2.5 rounded border text-[10px] ${testResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450"}`}>
                  <p className="font-bold flex items-center">
                    {testResult.success ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                    {testResult.message}
                  </p>
                  {testResult.sheets && (
                    <p className="mt-1">
                      Lembar Sheets terdeteksi: <strong>{testResult.sheets.join(", ")}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Sync Actions Panel */}
              {state.sheets_config.isConnected && isAdmin && (
                <div className="p-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-lg space-y-2">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-mono">Dashboard Sinkronisasi Aktif</span>
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    Koneksi terjalin ke spreadsheet. Lakukan integrasi satu arah di bawah:
                  </p>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleSync("pull")}
                      disabled={syncing !== null}
                      className="px-3 py-1.5 bg-emerald-605 hover:bg-emerald-700 bg-emerald-600 text-white font-bold rounded text-xs flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Download className="w-3 h-3" />
                      <span>{syncing === "pull" ? "Menarik..." : "Tarik (Pull) Program"}</span>
                    </button>
                    <button
                      onClick={() => handleSync("push")}
                      disabled={syncing !== null}
                      className="px-3 py-1.5 bg-blue-605 hover:bg-blue-700 bg-blue-600 text-white font-bold rounded text-xs flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{syncing === "push" ? "Mengunggah..." : "Kirim (Push) Program"}</span>
                    </button>
                  </div>

                  {syncStatus && (
                    <p className="text-[10px] font-mono font-bold text-slate-650 bg-slate-100 p-2 rounded leading-normal">
                      {syncStatus}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Audit Log stream dashboard segment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center mb-1 font-sans">
          <History className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          SIPERAMAL Digital Audit Logs (Aktivitas Pengguna)
        </h4>
        <p className="text-[11px] text-slate-400 leading-normal mb-3">
          Catatan riwayat mutasi data instansi yang tercatat di server SIPERAMAL guna melokalisir tindakan mencurigakan.
        </p>

        <div className="max-h-56 overflow-y-auto font-mono text-[10px] border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-md p-3 divide-y divide-slate-100 dark:divide-slate-850 space-y-2">
          {state.audit_logs.map((log) => (
            <div key={log.id} className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="space-y-0.5 max-w-xl">
                <span className="font-bold text-blue-600 dark:text-sky-400">[{log.username.toUpperCase()}]</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 ml-1.5">{log.action}:</span>
                <span className="text-slate-500 dark:text-slate-400 ml-1 block sm:inline leading-relaxed">{log.details}</span>
              </div>
              <span className="text-slate-400 text-[9px] shrink-0 font-sans">{new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
