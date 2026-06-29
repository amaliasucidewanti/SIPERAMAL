import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { INITIAL_APP_STATE } from "./src/db/initial_data.js";
import { AppState, AuditLog, User, LaporanDetail } from "./src/types.js";
import crypto from "crypto";
import multer from "multer";

const PORT = 3000;
const DB_FILE = process.env.VERCEL 
  ? "/tmp/state_store.json" 
  : path.join(process.cwd(), "state_store.json");

const UPLOADS_DIR = process.env.VERCEL ? "/tmp/uploads" : "uploads";

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const upload = multer({ storage: multerStorage });

// Helper to load application state
function getAppState(): AppState {
  let state: AppState;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      state = JSON.parse(content);
    } else {
      // Seed initial data if file is missing or corrupted
      saveAppState(INITIAL_APP_STATE);
      state = JSON.parse(JSON.stringify(INITIAL_APP_STATE));
    }
  } catch (err) {
    console.error("Error reading db file, falling back to initial data.", err);
    state = JSON.parse(JSON.stringify(INITIAL_APP_STATE));
  }

  // Fallback to Environment Variables for Google Sheets (highly recommended for Vercel Serverless)
  if (!state.sheets_config) {
    state.sheets_config = {
      spreadsheetId: "",
      clientEmail: "",
      privateKey: "",
      apiKey: "",
      isConnected: false,
      lastSync: ""
    };
  }

  if (process.env.SPREADSHEET_ID) {
    state.sheets_config.spreadsheetId = process.env.SPREADSHEET_ID;
    state.sheets_config.isConnected = true;
  }
  if (process.env.GOOGLE_CLIENT_EMAIL) {
    state.sheets_config.clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    state.sheets_config.isConnected = true;
  }
  if (process.env.GOOGLE_PRIVATE_KEY) {
    state.sheets_config.privateKey = process.env.GOOGLE_PRIVATE_KEY;
    state.sheets_config.isConnected = true;
  }
  if (process.env.GOOGLE_API_KEY) {
    state.sheets_config.apiKey = process.env.GOOGLE_API_KEY;
    state.sheets_config.isConnected = true;
  }

  return state;
}

// Helper to save application state
function saveAppState(state: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving db file.", err);
  }
}

// Helper to log action
function addAuditLog(username: string, action: string, details: string) {
  const state = getAppState();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    username,
    action,
    details,
  };
  state.audit_logs.unshift(log); // newest first
  // Keep last 100 logs
  if (state.audit_logs.length > 100) {
    state.audit_logs = state.audit_logs.slice(0, 100);
  }
  saveAppState(state);
}

// Simple Helper to generate Google Auth Token using RS256 for Service Accounts (lightweight option)
// Scope updated to cover both Google Sheets and Google Drive APIs!
async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  
  const base64Encode = (obj: any) => {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  };
  
  const tokenInput = `${base64Encode(header)}.${base64Encode(claim)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(tokenInput);
  const signature = signer.sign(cleanPrivateKey, "base64");
  const base64UrlSignature = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const jwt = `${tokenInput}.${base64UrlSignature}`;
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Auth response error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Helper to find or recursively create folders in Google Drive using Service Account
async function getOrCreateDriveFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  let q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += " and 'root' in parents";
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
  const searchRes = await fetch(searchUrl, { headers });
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const createRes = await fetch(`https://www.googleapis.com/drive/v3/files`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined
    })
  });

  if (!createRes.ok) {
    throw new Error(`Gagal membuat folder Drive '${folderName}': ${await createRes.text()}`);
  }

  const createdFile = await createRes.json();
  return createdFile.id;
}

// Helper to upload file buffer to Google Drive in multipart/related format
async function uploadFileToDrive(accessToken: string, fileBuffer: Buffer, fileName: string, mimeType: string, folderId: string): Promise<string> {
  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  const boundary = "siperamal_drive_upload_boundary";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `multipart/related; boundary=${boundary}`
  };

  const multipartBody = Buffer.concat([
    Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
    Buffer.from(delimiter + `Content-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(closeDelimiter)
  ]);

  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers,
    body: multipartBody
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload file Google Drive gagal: ${await uploadRes.text()}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id;

  // Set file permissions to make it publicly readable so users can click on links in SIPERAMAL!
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone"
    })
  });

  // Fetch webViewLink details
  const fieldsRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });

  if (fieldsRes.ok) {
    const fieldsData = await fieldsRes.json();
    return fieldsData.webViewLink;
  }

  return `https://drive.google.com/open?id=${fileId}`;
}

// General Real-time Synchronize Collection/Module to Google Spreadsheet Tabs
async function syncCollectionToSheets(moduleName: string, state: AppState): Promise<void> {
  const { spreadsheetId, clientEmail, privateKey } = state.sheets_config;
  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.log(`Auto-sync skipped for '${moduleName}': Google Sheets setup is not completed.`);
    return;
  }

  try {
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    const headers = { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    };

    let sheetTab = "";
    let headersRow: string[] = [];
    let rows: any[][] = [];

    if (moduleName === "program_kegiatan") {
      sheetTab = "Program_Kegiatan";
      headersRow = ["id", "year", "triwulan", "team", "program", "kegiatan", "pic", "target", "realisasi", "status", "lastUpdatedBy", "lastUpdatedAt"];
      rows = (state.program_kegiatan || []).map(pk => [
        pk.id, String(pk.year), pk.triwulan, pk.team, pk.program, pk.kegiatan, pk.pic, String(pk.target), String(pk.realisasi), pk.status, pk.lastUpdatedBy || "", pk.lastUpdatedAt || ""
      ]);
    } else if (moduleName === "pelaporan") {
      sheetTab = "Pelaporan_Kepatuhan";
      headersRow = ["id", "team", "laporan_bulanan", "laporan_kegiatan", "data_dukung", "compliance"];
      rows = (state.pelaporan || []).map(p => [
        p.id, p.team, String(p.laporan_bulanan), String(p.laporan_kegiatan), String(p.data_dukung), String(p.compliance)
      ]);
    } else if (moduleName === "sakip") {
      sheetTab = "SAKIP";
      headersRow = ["id", "sasaran_kinerja", "ikk", "perjanjian_kinerja", "target", "realisasi", "percentage"];
      rows = (state.sakip || []).map(s => [
        s.id, s.sasaran_kinerja, s.ikk, s.perjanjian_kinerja, String(s.target), String(s.realisasi), String(s.percentage)
      ]);
    } else if (moduleName === "ikpa") {
      sheetTab = "IKPA";
      headersRow = ["id", "month", "revisi_dipa", "deviasi_halaman_iii", "penyerapan_anggaran", "penyelesaian_tagihan", "capaian_output", "nilai_ikpa"];
      rows = (state.ikpa || []).map(i => [
        i.id, i.month, String(i.revisi_dipa), String(i.deviasi_halaman_iii), String(i.penyerapan_anggaran), String(i.penyelesaian_tagihan), String(i.capaian_output), String(i.nilai_ikpa)
      ]);
    } else if (moduleName === "risiko") {
      sheetTab = "Risiko";
      headersRow = ["id", "risiko", "tingkat_risiko", "mitigasi", "pic", "status"];
      rows = (state.risiko || []).map(r => [
        r.id, r.risiko, r.tingkat_risiko, r.mitigasi, r.pic, r.status
      ]);
    } else if (moduleName === "tindak_lanjut") {
      sheetTab = "Tindak_Lanjut";
      headersRow = ["id", "temuan", "pic", "deadline", "status", "source"];
      rows = (state.tindak_lanjut || []).map(t => [
        t.id, t.temuan, t.pic, t.deadline, t.status, t.source
      ]);
    } else if (moduleName === "teams") {
      sheetTab = "Teams";
      headersRow = ["id", "name", "head_name"];
      rows = (state.teams || []).map(t => [
        t.id, t.name, t.head_name
      ]);
    } else if (moduleName === "laporan_detail") {
      sheetTab = "Laporan_Detail";
      headersRow = ["id", "year", "team", "program", "kegiatan", "documentName", "documentUrl", "photoName", "photoUrl", "verificationStatus", "verificationNotes", "verifiedBy", "verifiedAt", "submittedBy", "submittedAt"];
      rows = (state.laporan_detail || []).map(l => [
        l.id, String(l.year), l.team, l.program, l.kegiatan, l.documentName, l.documentUrl, l.photoName, l.photoUrl, l.verificationStatus, l.verificationNotes || "", l.verifiedBy || "", l.verifiedAt || "", l.submittedBy, l.submittedAt
      ]);
    }

    if (!sheetTab) return;

    // Clear existing contents to prevent remaining orphaned rows
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTab}!A1:Z500:clear`;
    await fetch(clearUrl, { method: "POST", headers }).catch(() => {});

    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTab}!A1:Z${rows.length + 2}?valueInputOption=USER_ENTERED`;
    const values = [headersRow, ...rows];

    const response = await fetch(writeUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 400 || errText.includes("Unable to parse range")) {
        console.log(`Tab '${sheetTab}' not found, creating a new tab...`);
        const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: sheetTab } } }]
          })
        });

        if (addRes.ok) {
          await fetch(writeUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({ values })
          });
          console.log(`Tab '${sheetTab}' created, autoSync success.`);
        } else {
          console.error(`Failed to create auto tab '${sheetTab}':`, await addRes.text());
        }
      } else {
        console.error(`Sync error on '${sheetTab}':`, errText);
      }
    } else {
      console.log(`Real-time Sync: Successfully saved module '${moduleName}' to Tab '${sheetTab}'!`);
    }

  } catch (err: any) {
    console.error(`autoSyncToSheets error: ${err.message}`);
  }
}

// Bulk Pull All Sheets data to keep state completely mirrored in real-time
async function pullAllFromSheets(state: AppState): Promise<AppState> {
  const { spreadsheetId, clientEmail, privateKey } = state.sheets_config;
  if (!spreadsheetId || !clientEmail || !privateKey) {
    return state;
  }

  try {
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    const headers = { "Authorization": `Bearer ${accessToken}` };

    const fetchTab = async (sheetTab: string) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTab}`;
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      const data = await response.json();
      return data.values;
    };

    const [
      pkRows,
      pelRows,
      sakipRows,
      ikpaRows,
      risikoRows,
      tlRows,
      teamsRows,
      laporRows
    ] = await Promise.all([
      fetchTab("Program_Kegiatan"),
      fetchTab("Pelaporan_Kepatuhan"),
      fetchTab("SAKIP"),
      fetchTab("IKPA"),
      fetchTab("Risiko"),
      fetchTab("Tindak_Lanjut"),
      fetchTab("Teams"),
      fetchTab("Laporan_Detail")
    ]);

    if (pkRows && pkRows.length > 1) {
      state.program_kegiatan = pkRows.slice(1).map(row => ({
        id: row[0],
        year: parseInt(row[1]) || 2026,
        triwulan: row[2] as any,
        team: row[3] || "",
        program: row[4] || "",
        kegiatan: row[5] || "",
        pic: row[6] || "",
        target: parseFloat(row[7]) || 100,
        realisasi: parseFloat(row[8]) || 0,
        status: row[9] as any || "Proses",
        lastUpdatedBy: row[10] || "",
        lastUpdatedAt: row[11] || ""
      }));
    }

    if (pelRows && pelRows.length > 1) {
      state.pelaporan = pelRows.slice(1).map(row => ({
        id: row[0],
        team: row[1] || "",
        laporan_bulanan: parseFloat(row[2]) || 0,
        laporan_kegiatan: parseFloat(row[3]) || 0,
        data_dukung: parseFloat(row[4]) || 0,
        compliance: parseFloat(row[5]) || 0
      }));
    }

    if (sakipRows && sakipRows.length > 1) {
      state.sakip = sakipRows.slice(1).map(row => ({
        id: row[0],
        sasaran_kinerja: row[1] || "",
        ikk: row[2] || "",
        perjanjian_kinerja: row[3] || "",
        target: parseFloat(row[4]) || 0,
        realisasi: parseFloat(row[5]) || 0,
        percentage: parseFloat(row[6]) || 0
      }));
    }

    if (ikpaRows && ikpaRows.length > 1) {
      state.ikpa = ikpaRows.slice(1).map(row => ({
        id: row[0],
        month: row[1] || "",
        revisi_dipa: parseFloat(row[2]) || 0,
        deviasi_halaman_iii: parseFloat(row[3]) || 0,
        penyerapan_anggaran: parseFloat(row[4]) || 0,
        penyelesaian_tagihan: parseFloat(row[5]) || 0,
        capaian_output: parseFloat(row[6]) || 0,
        nilai_ikpa: parseFloat(row[7]) || 0
      }));
    }

    if (risikoRows && risikoRows.length > 1) {
      state.risiko = risikoRows.slice(1).map(row => ({
        id: row[0],
        risiko: row[1] || "",
        tingkat_risiko: row[2] as any || "Sedang",
        mitigasi: row[3] || "",
        pic: row[4] || "",
        status: row[5] as any || "Proses"
      }));
    }

    if (tlRows && tlRows.length > 1) {
      state.tindak_lanjut = tlRows.slice(1).map(row => ({
        id: row[0],
        temuan: row[1] || "",
        pic: row[2] || "",
        deadline: row[3] || "",
        status: row[4] as any || "Proses",
        source: row[5] as any || "Hasil Evaluasi Internal"
      }));
    }

    if (teamsRows && teamsRows.length > 1) {
      state.teams = teamsRows.slice(1).map(row => ({
        id: row[0],
        name: row[1] || "",
        head_name: row[2] || ""
      }));
    }

    if (laporRows && laporRows.length > 1) {
      state.laporan_detail = laporRows.slice(1).map(row => ({
        id: row[0],
        year: parseInt(row[1]) || 2026,
        team: row[2] || "",
        program: row[3] || "",
        kegiatan: row[4] || "",
        documentName: row[5] || "",
        documentUrl: row[6] || "",
        photoName: row[7] || "",
        photoUrl: row[8] || "",
        verificationStatus: row[9] as any || "Menunggu Verifikasi",
        verificationNotes: row[10] || "",
        verifiedBy: row[11] || "",
        verifiedAt: row[12] || "",
        submittedBy: row[13] || "",
        submittedAt: row[14] || ""
      }));
    }

    saveAppState(state);
    console.log("Real-time Sheets Pull success, state mirrored seamlessly!");
  } catch (err: any) {
    console.error("Real-time Pull error (using local database fallback):", err.message);
  }
  return state;
}

export const app = express();

function startServer() {
  app.use(express.json());

  // Serve custom static uploads folder
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API: Get Full Application State (automatically pulls real-time from sheets)
  app.get("/api/data", async (req, res) => {
    let state = getAppState();
    state = await pullAllFromSheets(state);
    res.json(state);
  });

  // API: User Authentication
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const state = getAppState();
    
    const user = state.users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase() && u.password === password
    );
    
    if (user) {
      // Return safe user object (omit password)
      const safeUser: Omit<User, 'password'> = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        team: user.team
      };
      
      addAuditLog(user.username, "Login", `Berhasil masuk ke aplikasi SIPERAMAL sebagai ${user.role}`);
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ success: false, message: "Username atau Password salah." });
    }
  });

  // API: Reset Application state back to default dummy seed
  app.post("/api/data/reset", (req, res) => {
    const { username } = req.body;
    saveAppState(INITIAL_APP_STATE);
    addAuditLog(username || "System", "Reset Data", "Mengembalikan seluruh data ke kondisi awal / demo BPMP");
    res.json({ success: true, message: "Seluruh data SIPERAMAL berhasil di-reset.", state: INITIAL_APP_STATE });
  });

  // API: Dynamic Create
  app.post("/api/data/:module", async (req, res) => {
    const { module } = req.params;
    const record = req.body.record;
    const username = req.body.username || "System";
    
    const state = getAppState();
    let list = (state as any)[module];
    
    if (!list) {
      if (module === "laporan_detail") {
        state.laporan_detail = [];
        list = state.laporan_detail;
      } else {
        return res.status(404).json({ error: `Modul '${module}' tidak ditemukan.` });
      }
    }
    
    if (!Array.isArray(list)) {
      return res.status(404).json({ error: `Modul '${module}' tidak ditemukan.` });
    }
    
    // Auto-generate ID if missing
    if (!record.id) {
       record.id = `${module.slice(0, 3)}_${Date.now()}`;
    }
    
    // Inject auto-updated fields on program_kegiatan
    if (module === "program_kegiatan") {
      record.lastUpdatedBy = username;
      record.lastUpdatedAt = new Date().toISOString();
      
      // Calculate automated status if targets are numeric
      const pct = record.target > 0 ? (record.realisasi / record.target) * 100 : 0;
      if (pct >= 100) {
        record.status = "Selesai";
      } else if (pct >= 80) {
        record.status = "Proses";
      } else {
        record.status = "Terlambat";
      }
    }
    
    list.push(record);
    
    // If we're adding to pelaporan, calculate compliance automatically
    if (module === "pelaporan") {
      const avg = ((record.laporan_bulanan || 0) + (record.laporan_kegiatan || 0) + (record.data_dukung || 0)) / 3;
      record.compliance = Math.round(avg * 10) / 10;
    }
    
    saveAppState(state);
    addAuditLog(username, `Tambah Data`, `Menambah baris baru di modul '${module}' dengan ID ${record.id}`);
    
    // Real-time synchronization to Google Sheets
    await syncCollectionToSheets(module, state);

    res.json({ success: true, record, state });
  });

  // API: Dynamic Update
  app.put("/api/data/:module/:id", async (req, res) => {
    const { module, id } = req.params;
    const updatedRecord = req.body.record;
    const username = req.body.username || "System";
    
    const state = getAppState();
    const list = (state as any)[module];
    
    if (!list || !Array.isArray(list)) {
      return res.status(404).json({ error: `Modul '${module}' tidak ditemukan.` });
    }
    
    const idx = list.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: `Data dengan ID '${id}' tidak ditemukan di modul '${module}'.` });
    }
    
    // Inject auto-updated fields
    if (module === "program_kegiatan") {
      updatedRecord.lastUpdatedBy = username;
      updatedRecord.lastUpdatedAt = new Date().toISOString();
      
      // Recalculate based on status or progress
      const pct = updatedRecord.target > 0 ? (updatedRecord.realisasi / updatedRecord.target) * 100 : 0;
      if (pct >= 100) {
        updatedRecord.status = "Selesai";
      } else if (pct >= 80) {
        updatedRecord.status = "Proses";
      } else {
        updatedRecord.status = "Terlambat";
      }
    }
    
    if (module === "pelaporan") {
      const avg = ((updatedRecord.laporan_bulanan || 0) + (updatedRecord.laporan_kegiatan || 0) + (updatedRecord.data_dukung || 0)) / 3;
      updatedRecord.compliance = Math.round(avg * 10) / 10;
    }
    
    list[idx] = { ...list[idx], ...updatedRecord };
    
    saveAppState(state);
    addAuditLog(username, `Ubah Data`, `Memutakhirkan baris dengan ID ${id} pada modul '${module}'`);
    
    // Real-time synchronization to Google Sheets
    await syncCollectionToSheets(module, state);

    res.json({ success: true, record: list[idx], state });
  });

  // API: Dynamic Delete
  app.delete("/api/data/:module/:id", async (req, res) => {
    const { module, id } = req.params;
    const username = req.query.username as string || "System";
    
    const state = getAppState();
    const list = (state as any)[module];
    
    if (!list || !Array.isArray(list)) {
      return res.status(404).json({ error: `Modul '${module}' tidak ditemukan.` });
    }
    
    const idx = list.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: `Data dengan ID '${id}' tidak ditemukan di modul '${module}'.` });
    }
    
    const removedItem = list.splice(idx, 1)[0];
    saveAppState(state);
    
    addAuditLog(username, `Hapus Data`, `Menghapus baris dengan ID ${id} pada modul '${module}'`);
    
    // Real-time synchronization to Google Sheets
    await syncCollectionToSheets(module, state);

    res.json({ success: true, removedItem, state });
  });

  // API: Upload Activity Reports & Photos dynamically linked to Google Drive + Spreadsheet
  app.post("/api/upload", upload.fields([{ name: "document", maxCount: 1 }, { name: "photo", maxCount: 1 }]), async (req: any, res) => {
    try {
      const { year, team, program, kegiatan, username } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const docFile = files?.document?.[0];
      const photoFile = files?.photo?.[0];

      if (!docFile || !photoFile) {
        return res.status(400).json({ success: false, message: "Dokumen laporan dan Foto kegiatan wajib diunggah." });
      }

      const state = getAppState();
      const { spreadsheetId, clientEmail, privateKey } = state.sheets_config;

      let docUrl = `/uploads/${docFile.filename}`;
      let photoUrl = `/uploads/${photoFile.filename}`;

      // If Google credentials are fully loaded, upload directly to Google Drive!
      if (spreadsheetId && clientEmail && privateKey) {
        try {
          console.log("Integrasi Google Drive Aktif. Memulai unggah dokumen...");
          const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
          
          // 1. Create or navigate to root folder 'SIPERAMAL'
          const rootFolderId = await getOrCreateDriveFolder(accessToken, "SIPERAMAL");
          // 2. Create subfolder for Working Team (Tim Kerja)
          const teamFolderId = await getOrCreateDriveFolder(accessToken, team || "Umum", rootFolderId);
          // 3. Create subfolder for Year (Tahun Kegiatan)
          const yearFolderId = await getOrCreateDriveFolder(accessToken, String(year || 2026), teamFolderId);

          // Upload Document
          const docBuffer = fs.readFileSync(docFile.path);
          docUrl = await uploadFileToDrive(accessToken, docBuffer, docFile.originalname, docFile.mimetype, yearFolderId);

          // Upload Photo
          const photoBuffer = fs.readFileSync(photoFile.path);
          photoUrl = await uploadFileToDrive(accessToken, photoBuffer, photoFile.originalname, photoFile.mimetype, yearFolderId);

          console.log(`Berhasil mengunggah file ke Google Drive! Doc: ${docUrl}, Photo: ${photoUrl}`);
          
          // Clean up temp files
          fs.unlinkSync(docFile.path);
          fs.unlinkSync(photoFile.path);
        } catch (uploadErr: any) {
          console.error("Gagal mengunggah file ke Google Drive (menggunakan fallback lokal):", uploadErr.message);
        }
      } else {
        console.log("No Google Sheets/Drive setup configured. Saved files locally in /uploads.");
      }

      // Add a record to state.laporan_detail
      const newReport: LaporanDetail = {
        id: `ld_${Date.now()}`,
        year: parseInt(year) || 2026,
        team: team || "Subbag Umum",
        program: program || "",
        kegiatan: kegiatan || "",
        documentName: docFile.originalname,
        documentUrl: docUrl,
        photoName: photoFile.originalname,
        photoUrl: photoUrl,
        verificationStatus: "Menunggu Verifikasi",
        verificationNotes: "Laporan baru diunggah. Menunggu verifikasi oleh Tim Perencanaan.",
        submittedBy: username || "System",
        submittedAt: new Date().toISOString()
      };

      if (!state.laporan_detail) state.laporan_detail = [];
      state.laporan_detail.unshift(newReport);

      // Save state locally
      saveAppState(state);
      addAuditLog(username || "System", "Unggah Dokumen", `Mengunggah dokumen laporan & foto kegiatan untuk ${kegiatan} (${team})`);

      // Real-time synchronize with spreadsheet Tab 'Laporan_Detail'
      await syncCollectionToSheets("laporan_detail", state);

      res.json({ success: true, record: newReport, state });
    } catch (err: any) {
      console.error("Error at /api/upload:", err);
      res.status(500).json({ success: false, message: `Gagal mengunggah berkas: ${err.message}` });
    }
  });

  // API: Verify Report (Exclusive for Tim Perencanaan)
  app.post("/api/verify-report", async (req, res) => {
    const { id, status, notes, username } = req.body; // status: 'Disetujui' | 'Perlu Perbaikan'
    const state = getAppState();
    
    if (!state.laporan_detail) state.laporan_detail = [];
    const idx = state.laporan_detail.findIndex(x => x.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Laporan tidak ditemukan." });
    }

    state.laporan_detail[idx] = {
      ...state.laporan_detail[idx],
      verificationStatus: status,
      verificationNotes: notes || "",
      verifiedBy: username,
      verifiedAt: new Date().toISOString()
    };

    saveAppState(state);
    addAuditLog(username, "Verifikasi Laporan", `Mengubah status verifikasi laporan ${state.laporan_detail[idx].kegiatan} menjadi '${status}'`);

    // Synchronize to spreadsheet Tab 'Laporan_Detail'
    await syncCollectionToSheets("laporan_detail", state);

    res.json({ success: true, record: state.laporan_detail[idx], state });
  });

  // API: Save Google Sheets Configuration
  app.post("/api/sheets/config", (req, res) => {
    const { config, username } = req.body;
    const state = getAppState();
    
    state.sheets_config = {
      ...state.sheets_config,
      ...config,
    };
    
    saveAppState(state);
    addAuditLog(username || "System", "Config Google Sheets", "Memutakhirkan integrasi Google Sheets");
    res.json({ success: true, message: "Konfigurasi Google Sheets berhasil disimpan.", state });
  });

  // API: Test Google Sheets connection (read spreadsheet details or test JWT)
  app.get("/api/sheets/test", async (req, res) => {
    const state = getAppState();
    const { spreadsheetId, clientEmail, privateKey, apiKey } = state.sheets_config;
    
    if (!spreadsheetId) {
      return res.json({ success: false, message: "Spreadsheet ID belum diisi." });
    }
    
    try {
      let accessToken = "";
      let url = "";
      
      if (clientEmail && privateKey) {
        // Test with Service Account (produces direct access token!)
        accessToken = await getGoogleAccessToken(clientEmail, privateKey);
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      } else if (apiKey) {
        // Test with direct Public API Key
        url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
      } else {
        return res.json({ success: false, message: "Isi API Key atau Kredensial Service Account terlebih dahulu." });
      }
      
      const headers: any = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errText = await response.text();
        return res.json({ 
          success: false, 
          message: `Koneksi Google Sheets Gagal (${response.status}): ${errText.slice(0, 150)}` 
        });
      }
      
      const data = await response.json();
      
      // Update connected status
      state.sheets_config.isConnected = true;
      state.sheets_config.lastSync = new Date().toISOString();
      saveAppState(state);
      
      addAuditLog("System", "Uji Koneksi Sheets", `Koneksi berhasil ke spreadsheet: ${data.properties?.title || "SIPERAMAL DB"}`);
      
      res.json({ 
        success: true, 
        title: data.properties?.title || "SIPERAMAL Database",
        sheets: data.sheets?.map((s: any) => s.properties?.title) || [],
        message: "Koneksi ke Google Sheets berhasil didirikan!" 
      });
      
    } catch (err: any) {
      res.json({ success: false, message: `Error Koneksi: ${err.message}` });
    }
  });

  // API: Synchronize (Push/Pull data) with Google Sheets
  app.post("/api/sheets/sync", async (req, res) => {
    const { direction, username } = req.body; // 'push' or 'pull'
    const state = getAppState();
    const { spreadsheetId, clientEmail, privateKey, apiKey } = state.sheets_config;
    
    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: "Koneksi belum disetup (Spreadsheet ID kosong)." });
    }
    
    try {
      let accessToken = "";
      if (clientEmail && privateKey) {
        accessToken = await getGoogleAccessToken(clientEmail, privateKey);
      }
      
      const headers: any = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      // Let's model sync for the primary sheet 'Program_Kegiatan'
      // We will perform a simple mock or real synchronization over Sheets REST endpoints!
      const sheetName = "Program_Kegiatan";
      
      if (direction === "pull") {
        // Fetch sheets data
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}${apiKey ? `?key=${apiKey}` : ''}`;
        const response = await fetch(readUrl, { headers });
        
        if (!response.ok) {
          throw new Error(`Sheets fetch error: ${response.status} - ${await response.text()}`);
        }
        
        const data = await response.json();
        const rows = data.values;
        
        if (rows && rows.length > 1) {
          // Parse rows back into list of items
          // Column index mappings: info is row-based.
          // Headers: [id, year, triwulan, team, program, kegiatan, pic, target, realisasi, status]
          const parsedPk: any[] = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0]) {
              parsedPk.push({
                id: row[0],
                year: parseInt(row[1]) || 2026,
                triwulan: row[2] || "Triwulan I",
                team: row[3] || "Subbag Umum",
                program: row[4] || "",
                kegiatan: row[5] || "",
                pic: row[6] || "",
                target: parseFloat(row[7]) || 100,
                realisasi: parseFloat(row[8]) || 0,
                status: row[9] || "Proses",
              });
            }
          }
          if (parsedPk.length > 0) {
            state.program_kegiatan = parsedPk;
          }
        }
        
        state.sheets_config.lastSync = new Date().toISOString();
        state.sheets_config.isConnected = true;
        saveAppState(state);
        addAuditLog(username, "Sync Google Sheets (PULL)", `Berhasil mengunduh data program/kegiatan terbaru dari Google Sheet`);
        return res.json({ success: true, message: "Tariik data (Pull) dari Google Sheets berhasil diselaraskan!", state });
      } else {
        // "PUSH" data to Sheets
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:J${state.program_kegiatan.length + 1}?valueInputOption=USER_ENTERED${apiKey ? `&key=${apiKey}` : ''}`;
        
        // Prepare grid
        const values = [
          ["id", "year", "triwulan", "team", "program", "kegiatan", "pic", "target", "realisasi", "status"]
        ];
        
        state.program_kegiatan.forEach((pk) => {
          values.push([
            pk.id,
            String(pk.year),
            pk.triwulan,
            pk.team,
            pk.program,
            pk.kegiatan,
            pk.pic,
            String(pk.target),
            String(pk.realisasi),
            pk.status
          ]);
        });
        
        const pushResponse = await fetch(writeUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify({ values })
        });
        
        if (!pushResponse.ok) {
          throw new Error(`Sheets push error: ${pushResponse.status} - ${await pushResponse.text()}`);
        }
        
        state.sheets_config.lastSync = new Date().toISOString();
        state.sheets_config.isConnected = true;
        saveAppState(state);
        addAuditLog(username, "Sync Google Sheets (PUSH)", `Berhasil mengunggah data program/kegiatan ke Google Sheet`);
        return res.json({ success: true, message: "Kirim data (Push) ke Google Sheets berhasil diselesaikan!", state });
      }
      
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: `Gagal Sinkronisasi: ${err.message}` });
    }
  });

  // Serve static files and integrate Vite configuration
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.error("Gagal memuat Vite middleware:", err);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SIPERAMAL Server running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
