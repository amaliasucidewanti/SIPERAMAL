import { AppState } from '../types';

export const INITIAL_APP_STATE: AppState = {
  teams: [
    { id: '1', name: 'Subbag Umum', head_name: 'Zulkifli Syah, S.P.' },
    { id: '2', name: 'PAUD', head_name: 'Sri Hariyati, S.Pd.' },
    { id: '3', name: 'SD', head_name: 'Hi. Riswan, M.Pd.' },
    { id: '4', name: 'SMP', head_name: 'Faisal Kamal, M.T.' },
    { id: '5', name: 'SMA', head_name: 'Dra. Wa Ode Sitti' },
  ],
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'Admin Perencanaan BPMP', role: 'Admin Perencanaan', team: 'All' },
    { id: 'u2', username: 'ketua_umum', password: 'umum123', name: 'Zulkifli Syah (Umum)', role: 'Ketua Tim Kerja', team: 'Subbag Umum' },
    { id: 'u3', username: 'ketua_paud', password: 'paud123', name: 'Sri Hariyati (PAUD)', role: 'Ketua Tim Kerja', team: 'PAUD' },
    { id: 'u4', username: 'ketua_sd', password: 'sd123', name: 'Hi. Riswan (SD)', role: 'Ketua Tim Kerja', team: 'SD' },
    { id: 'u5', username: 'viewer_bpmp', password: 'viewer123', name: 'Kepala BPMP Malut', role: 'Viewer', team: 'All' }
  ],
  program_kegiatan: [
    {
      id: "pk1",
      year: 2026,
      triwulan: "Triwulan II",
      team: "Subbag Umum",
      program: "Manajemen Administrasi dan Sarana BPMP",
      kegiatan: "Pemeliharaan Gedung Kantor dan Sarpras Penjaminan Mutu",
      pic: "Zulkifli Syah, S.P.",
      target: 100,
      realisasi: 95,
      status: "Selesai"
    },
    {
      id: "pk2",
      year: 2026,
      triwulan: "Triwulan II",
      team: "PAUD",
      program: "Perluasan Dan Penjaminan Mutu PAUD",
      kegiatan: "Pendampingan Implementasi PBD dan Transisi PAUD-SD yang Menyenangkan",
      pic: "Sri Hariyati, S.Pd.",
      target: 100,
      realisasi: 85,
      status: "Proses"
    },
    {
      id: "pk3",
      year: 2026,
      triwulan: "Triwulan I",
      team: "SD",
      program: "Peningkatan Mutu Pendidikan Dasar",
      kegiatan: "Bimtek Aplikasi Rapor Pendidikan dan Perencanaan Berbasis Data (PBD) Jenjang SD",
      pic: "Hi. Riswan, M.Pd.",
      target: 100,
      realisasi: 100,
      status: "Selesai"
    },
    {
      id: "pk4",
      year: 2026,
      triwulan: "Triwulan II",
      team: "SMP",
      program: "Peningkatan Mutu Sekolah Menengah Pertama",
      kegiatan: "Monitoring dan Evaluasi Implementasi Kurikulum Merdeka (IKM) pada SMP",
      pic: "Faisal Kamal, M.T.",
      target: 100,
      realisasi: 72,
      status: "Terlambat"
    },
    {
      id: "pk5",
      year: 2026,
      triwulan: "Triwulan II",
      team: "SMA",
      program: "Pengembangan Mutu Sekolah Menengah Atas",
      kegiatan: "Pendampingan Program Sekolah Penggerak (PSP) Jenjang SMA Kab/Kota",
      pic: "Dra. Wa Ode Sitti",
      target: 100,
      realisasi: 90,
      status: "Proses"
    },
    {
      id: "pk6",
      year: 2026,
      triwulan: "Triwulan II",
      team: "SD",
      program: "Akselerasi Kinerja Kualitas Pendidikan",
      kegiatan: "Sosialisasi Program Literasi dan Numerasi pada Sekolah Sasaran Maluku Utara",
      pic: "Hi. Riswan, M.Pd.",
      target: 100,
      realisasi: 100,
      status: "Selesai"
    },
    {
      id: "pk7",
      year: 2026,
      triwulan: "Triwulan II",
      team: "Subbag Umum",
      program: "Optimalisasi Layanan Penjaminan Mutu",
      kegiatan: "Peningkatan Kualitas SDM dan Pelayanan Terpadu Satu Pintu (PTSP) BPMP",
      pic: "Zulkifli Syah, S.P.",
      target: 100,
      realisasi: 40,
      status: "Terlambat"
    }
  ],
  pelaporan: [
    { id: 'pl1', team: 'Subbag Umum', laporan_bulanan: 100, laporan_kegiatan: 90, data_dukung: 95, compliance: 95 },
    { id: 'pl2', team: 'PAUD', laporan_bulanan: 100, laporan_kegiatan: 80, data_dukung: 80, compliance: 86.7 },
    { id: 'pl3', team: 'SD', laporan_bulanan: 100, laporan_kegiatan: 100, data_dukung: 100, compliance: 100 },
    { id: 'pl4', team: 'SMP', laporan_bulanan: 80, laporan_kegiatan: 75, data_dukung: 70, compliance: 75 },
    { id: 'pl5', team: 'SMA', laporan_bulanan: 90, laporan_kegiatan: 85, data_dukung: 80, compliance: 85 }
  ],
  sakip: [
    {
      id: "sk1",
      sasaran_kinerja: "Meningkatnya mutu penjaminan pendidikan dasar dan menengah",
      ikk: "Persentase sekolah pelaksana PSP yang melembagakan kepemimpinan instruksional",
      perjanjian_kinerja: "85% dari total sasaran",
      target: 85,
      realisasi: 82,
      percentage: 96.47
    },
    {
      id: "sk2",
      sasaran_kinerja: "Meningkatnya kesiapan satuan pendidikan dalam mengimplementasikan Kurikulum Merdeka",
      ikk: "Persentase satuan pendidikan dasar dan menengah yang mandiri melakukan Perencanaan Berbasis Data",
      perjanjian_kinerja: "90% sekolah melakukan PBD",
      target: 90,
      realisasi: 88,
      percentage: 97.77
    },
    {
      id: "sk3",
      sasaran_kinerja: "Meningkatnya tata kelola dan budaya pelayanan BPMP Maluku Utara",
      ikk: "Indeks Kepuasan Masyarakat terhadap Layanan Penjaminan Mutu BPMP",
      perjanjian_kinerja: "Predikat Sangat Memuaskan (nilai 92.5)",
      target: 92.5,
      realisasi: 91.8,
      percentage: 99.24
    },
    {
      id: "sk4",
      sasaran_kinerja: "Optimalisasi penjaminan mutu Pendidikan Anak Usia Dini (PAUD)",
      ikk: "Persentase Satuan PAUD terakreditasi minimal B di Maluku Utara",
      perjanjian_kinerja: "75% PAUD terakreditasi B",
      target: 75,
      realisasi: 64,
      percentage: 85.33
    }
  ],
  ikpa: [
    { id: "ik1", month: "Januari", revisi_dipa: 100, deviasi_halaman_iii: 95, penyerapan_anggaran: 8.5, penyelesaian_tagihan: 100, capaian_output: 92, nilai_ikpa: 93.1 },
    { id: "ik2", month: "Februari", revisi_dipa: 100, deviasi_halaman_iii: 92, penyerapan_anggaran: 15.2, penyelesaian_tagihan: 98, capaian_output: 94, nilai_ikpa: 92.8 },
    { id: "ik3", month: "Maret", revisi_dipa: 95, deviasi_halaman_iii: 88, penyerapan_anggaran: 24.8, penyelesaian_tagihan: 100, capaian_output: 95, nilai_ikpa: 92.4 },
    { id: "ik4", month: "April", revisi_dipa: 95, deviasi_halaman_iii: 82, penyerapan_anggaran: 32.1, penyelesaian_tagihan: 100, capaian_output: 95, nilai_ikpa: 91.8 },
    { id: "ik5", month: "Mei", revisi_dipa: 92, deviasi_halaman_iii: 85, penyerapan_anggaran: 44.5, penyelesaian_tagihan: 95, capaian_output: 96, nilai_ikpa: 92.2 },
    { id: "ik6", month: "Juni", revisi_dipa: 92, deviasi_halaman_iii: 81, penyerapan_anggaran: 55.4, penyelesaian_tagihan: 98, capaian_output: 98, nilai_ikpa: 93.4 }
  ],
  risiko: [
    {
      id: "r1",
      risiko: "Tingkat partisipasi instansi dinas pendidikan kab/kota dalam program IKM rendah",
      tingkat_risiko: "Tinggi",
      mitigasi: "Audiensi langsung Kepala BPMP dengan jajaran Kepala Dinas Kabupaten dan Walikota, serta perancangan nota kesepahaman (MOU)",
      pic: "Sri Hariyati, S.Pd.",
      status: "Proses"
    },
    {
      id: "r2",
      risiko: "Deviasi target halaman III DIPA yang melebihi batas toleransi kementerian",
      tingkat_risiko: "Tinggi",
      mitigasi: "Melaksanakan review bulanan perencanaan anggaran bersama seluruh ketua tim kerja untuk melaraskan rencana aksi dan pencairan",
      pic: "Zulkifli Syah, S.P.",
      status: "Proses"
    },
    {
      id: "r3",
      risiko: "Keterlambat penyerahan laporan pertanggungjawaban kegiatan oleh narasumber eksternal",
      tingkat_risiko: "Sedang",
      mitigasi: "Menyediakan asisten administrasi khusus di setiap kegiatan untuk memitigasi kelengkapan berkas saat kegiatan berakhir",
      pic: "Faisal Kamal, M.T.",
      status: "Teratasi"
    },
    {
      id: "r4",
      risiko: "Infrastruktur internet kurang stabil pada lokasi pendampingan daerah 3T Maluku Utara",
      tingkat_risiko: "Sedang",
      mitigasi: "Penyediaan materi pendampingan offline yang dapat diunduh di flashdisk sebelum keberangkatan tim",
      pic: "Hi. Riswan, M.Pd.",
      status: "Teratasi"
    }
  ],
  tindak_lanjut: [
    {
      id: "tl1",
      temuan: "Keterlambatan pembukuan kas bendahara pengeluaran terkait SPBy belanja operasional",
      pic: "Zulkifli Syah, S.P.",
      deadline: "2026-07-15",
      status: "Proses",
      source: "Hasil SPI"
    },
    {
      id: "tl2",
      temuan: "Evaluasi beban kerja ganda pelaksana penjaminan mutu yang menurunkan konsentrasi kinerja",
      pic: "Sri Hariyati, S.Pd.",
      deadline: "2026-08-30",
      status: "Belum Ditindaklanjuti",
      source: "Hasil Itjen"
    },
    {
      id: "tl3",
      temuan: "Analisis kepuasan layanan bimbingan teknis menunjukkan penurunan skor pada aspek konsumsi",
      pic: "Hi. Riswan, M.Pd.",
      deadline: "2026-06-30",
      status: "Selesai",
      source: "Hasil Evaluasi Internal"
    },
    {
      id: "tl4",
      temuan: "Rekomendasi percepatan integrasi data dukung penilai sekolah bersertifikat di kabupaten terpencil",
      pic: "Faisal Kamal, M.T.",
      deadline: "2026-07-10",
      status: "Proses",
      source: "Rekomendasi Pimpinan"
    }
  ],
  audit_logs: [
    { id: "log1", timestamp: "2026-06-22T08:30:00Z", username: "admin", action: "Pendidikan & Seeding", details: "Berdasar data awal, melakukan inisialisasi master data BPMP Provinsi Maluku Utara" },
    { id: "log2", timestamp: "2026-06-22T10:15:00Z", username: "ketua_umum", action: "Update Kegiatan", details: "Melakukan pemutakhiran realisasi fisik Pemeliharaan Gedung Kantor menjadi 95%" }
  ],
  sheets_config: {
    spreadsheetId: "",
    apiKey: "",
    clientEmail: "",
    privateKey: "",
    isConnected: false
  },
  laporan_detail: [
    {
      id: "ld1",
      year: 2026,
      team: "Subbag Umum",
      program: "Manajemen Administrasi dan Sarana BPMP",
      kegiatan: "Pemeliharaan Gedung Kantor dan Sarpras Penjaminan Mutu",
      documentName: "laporan_pemeliharaan_gedung_2026.pdf",
      documentUrl: "https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      photoName: "foto_kegiatan_pemeliharaan.jpg",
      photoUrl: "https://picsum.photos/seed/siperamal1/800/600",
      verificationStatus: "Menunggu Verifikasi",
      verificationNotes: "Menunggu verifikasi oleh Tim Perencanaan",
      submittedBy: "ketua_umum",
      submittedAt: "2026-06-22T09:30:00Z"
    },
    {
      id: "ld2",
      year: 2026,
      team: "SD",
      program: "Peningkatan Mutu Pendidikan Dasar",
      kegiatan: "Bimtek Aplikasi Rapor Pendidikan dan Perencanaan Berbasis Data (PBD) Jenjang SD",
      documentName: "laporan_bimtek_pbd_sd.docx",
      documentUrl: "https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      photoName: "foto_bimtek_sd.png",
      photoUrl: "https://picsum.photos/seed/siperamal2/800/600",
      verificationStatus: "Disetujui",
      verificationNotes: "Dokumen lengkap dan sesuai dengan target fisik 100%",
      verifiedBy: "admin",
      verifiedAt: "2026-06-22T11:00:00Z",
      submittedBy: "ketua_sd",
      submittedAt: "2026-06-22T10:00:00Z"
    }
  ]
};
