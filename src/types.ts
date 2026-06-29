export type RowStatus = 'Selesai' | 'Proses' | 'Terlambat';
export type RiskLevel = 'Tinggi' | 'Sedang' | 'Rendah';
export type FollowUpStatus = 'Selesai' | 'Proses' | 'Belum Ditindaklanjuti';
export type FollowUpSource = 'Hasil SPI' | 'Hasil Itjen' | 'Hasil Evaluasi Internal' | 'Rekomendasi Pimpinan';
export type UserRole = 'Admin Perencanaan' | 'Ketua Tim Kerja' | 'Viewer';

export interface ProgramKegiatan {
  id: string;
  year: number;
  triwulan: 'Triwulan I' | 'Triwulan II' | 'Triwulan III' | 'Triwulan IV';
  team: string; // Subbag Umum, PAUD, SD, SMP, SMA
  program: string;
  kegiatan: string;
  pic: string;
  target: number;
  realisasi: number;
  status: RowStatus;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface Pelaporan {
  id: string;
  team: string;
  laporan_bulanan: number; // 0-100%
  laporan_kegiatan: number; // 0-100%
  data_dukung: number; // 0-100%
  compliance: number; // calculated average
}

export interface SAKIPModel {
  id: string;
  sasaran_kinerja: string;
  ikk: string;
  perjanjian_kinerja: string;
  target: number;
  realisasi: number;
  percentage: number;
}

export interface IKPAModel {
  id: string;
  month: string;
  revisi_dipa: number;
  deviasi_halaman_iii: number;
  penyerapan_anggaran: number;
  penyelesaian_tagihan: number;
  capaian_output: number;
  nilai_ikpa: number;
}

export interface RisikoModel {
  id: string;
  risiko: string;
  tingkat_risiko: RiskLevel;
  mitigasi: string;
  pic: string;
  status: 'Teratasi' | 'Proses' | 'Belum';
}

export interface TindakLanjutModel {
  id: string;
  temuan: string;
  pic: string;
  deadline: string;
  status: FollowUpStatus;
  source: FollowUpSource;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  team: string; // 'All' for Admin/Viewer, or specific team
}

export interface Team {
  id: string;
  name: string;
  head_name: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  clientEmail: string;
  privateKey: string;
  isConnected: boolean;
  lastSync?: string;
}

export interface LaporanDetail {
  id: string;
  year: number;
  team: string;
  program: string;
  kegiatan: string;
  documentName: string;
  documentUrl: string;
  photoName: string;
  photoUrl: string;
  verificationStatus: 'Menunggu Verifikasi' | 'Disetujui' | 'Perlu Perbaikan';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface AppState {
  program_kegiatan: ProgramKegiatan[];
  pelaporan: Pelaporan[];
  sakip: SAKIPModel[];
  ikpa: IKPAModel[];
  risiko: RisikoModel[];
  tindak_lanjut: TindakLanjutModel[];
  users: User[];
  teams: Team[];
  audit_logs: AuditLog[];
  sheets_config: GoogleSheetsConfig;
  laporan_detail?: LaporanDetail[];
}
