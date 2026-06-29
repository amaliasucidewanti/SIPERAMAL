import React, { useState } from "react";
import { LogIn, Key, User as UserIcon, AlertCircle, TrendingUp, BarChart3, HelpCircle } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Silakan isi semua kolom login.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || "Gagal masuk. Silakan coba kembali.");
      }
    } catch (err) {
      setError("Koneksi gagal ke server SIPERAMAL. Pastikan server aktif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300">
        
        {/* Left Panel: Hero and Branding */}
        <div className="w-full md:w-1/2 p-8 md:p-10 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decor circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl"></div>
          
          <div className="relative z-10 flex items-center space-x-3 mb-10 md:mb-0">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-400 rounded flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-200">
              SIPERAMAL
            </span>
          </div>

          <div className="my-8 md:my-auto text-left relative z-10">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gradient-to-r from-blue-500/30 to-sky-400/30 text-sky-300 rounded border border-sky-400/20 tracking-wider">
              BPMP PROVINSI MALUKU UTARA
            </span>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mt-3 text-slate-100 font-sans leading-snug">
              Sistem Informasi Perencanaan, Evaluasi, dan Pengendalian Kinerja
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-mono leading-relaxed max-w-sm">
              Mewujudkan kemudahan kendali mutu pendidikan nasional di Maluku Utara secara terukur, transparan, dan akuntabel.
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-8 md:mt-0 relative z-10">
            <p className="text-[9px] text-sky-400/90 font-bold tracking-wider uppercase">Tagline Utama</p>
            <p className="text-sm italic text-slate-200 mt-0.5 font-medium font-sans">
              "Monitoring Cepat, Evaluasi Tepat, Kinerja Meningkat."
            </p>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
          <div className="my-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wide">
                Selamat Datang Kembali
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Silakan login dengan ID penugasan Anda untuk melanjutkan ke Portal Eksekutif SIPERAMAL.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-start space-x-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Pengguna (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan nama pengguna"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-850 dark:text-slate-250 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-850 dark:text-slate-250 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick login guidance box */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <h4 className="font-semibold text-slate-700 dark:text-slate-400 flex items-center mb-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
              Mode Demo Simulasi (Hak Akses Penugasan)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-500 dark:text-slate-400 leading-tight">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Admin Perencanaan</span>
                User: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">admin</code><br />
                Pass: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">admin123</code>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Ketua Tim Kerja</span>
                User: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">ketua_umum</code><br />
                Pass: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">umum123</code>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Viewer / Kepala</span>
                User: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">viewer_bpmp</code><br />
                Pass: <code className="text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">viewer123</code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
