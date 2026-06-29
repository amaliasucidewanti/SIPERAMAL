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
    { id: 'u2', username: 'perencanaan', password: 'perencanaan123', name: 'Tim Perencanaan BPMP', role: 'Admin Perencanaan', team: 'All' },
    { id: 'u3', username: 'admin_umum', password: 'umum123', name: 'Admin Tim Kerja Subbag Umum', role: 'Ketua Tim Kerja', team: 'Subbag Umum' },
    { id: 'u4', username: 'admin_paud', password: 'paud123', name: 'Admin Tim Kerja PAUD', role: 'Ketua Tim Kerja', team: 'PAUD' },
    { id: 'u5', username: 'admin_sd', password: 'sd123', name: 'Admin Tim Kerja SD', role: 'Ketua Tim Kerja', team: 'SD' },
    { id: 'u6', username: 'admin_smp', password: 'smp123', name: 'Admin Tim Kerja SMP', role: 'Ketua Tim Kerja', team: 'SMP' },
    { id: 'u7', username: 'admin_sma', password: 'sma123', name: 'Admin Tim Kerja SMA', role: 'Ketua Tim Kerja', team: 'SMA' },
    { id: 'u8', username: 'kepala_bpmp', password: 'bpmp123', name: 'Kepala BPMP Maluku Utara', role: 'Viewer', team: 'All' }
  ],
  program_kegiatan: [],
  pelaporan: [
    { id: 'pl1', team: 'Subbag Umum', laporan_bulanan: 0, laporan_kegiatan: 0, data_dukung: 0, compliance: 0 },
    { id: 'pl2', team: 'PAUD', laporan_bulanan: 0, laporan_kegiatan: 0, data_dukung: 0, compliance: 0 },
    { id: 'pl3', team: 'SD', laporan_bulanan: 0, laporan_kegiatan: 0, data_dukung: 0, compliance: 0 },
    { id: 'pl4', team: 'SMP', laporan_bulanan: 0, laporan_kegiatan: 0, data_dukung: 0, compliance: 0 },
    { id: 'pl5', team: 'SMA', laporan_bulanan: 0, laporan_kegiatan: 0, data_dukung: 0, compliance: 0 }
  ],
  sakip: [],
  ikpa: [],
  risiko: [],
  tindak_lanjut: [],
  audit_logs: [],
  sheets_config: {
    spreadsheetId: "",
    apiKey: "",
    clientEmail: "",
    privateKey: "",
    isConnected: false
  },
  laporan_detail: []
};

