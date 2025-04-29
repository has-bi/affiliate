// src/lib/spreadsheetService.js
// Consolidated and de‑duplicated helper for all Google‑Sheets operations
// covering Affiliates, Top‑Performers, Onboarding and Broadcast logs.
// -----------------------------------------------------------------------------
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// -----------------------------------------------------------------------------
// GOOGLE SHEETS AUTH & DOC BOOTSTRAP
// -----------------------------------------------------------------------------
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const jwt = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

export const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEETS_DOCUMENT_ID || "",
  jwt
);

// Titles – change here if sheet tabs ever get renamed -------------------------
const SHEETS = {
  FORM_RESPONSES: "Form Responses 1",
  TOP_PERFORMERS: "Top Performers",
  ONBOARDING: "Affiliate Onboarding",
  BROADCAST_LOG: "Broadcast Log",
};

export async function initSheets() {
  await doc.loadInfo();
  return doc;
}

// -----------------------------------------------------------------------------
// SMALL UTILITIES
// -----------------------------------------------------------------------------
const norm = (v = "") => v.toString().trim();
const phoneKey = (v = "") => norm(v).replace(/\D/g, "");

// -----------------------------------------------------------------------------
// AFFILIATE LIFE‑CYCLE HELPERS
// -----------------------------------------------------------------------------
/** Map of { phone: { phone, name, … } } for rows whose Status === "contacted" */
export async function getActiveAffiliates() {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
  const rows = await sheet.getRows();

  const map = {};
  rows.forEach((r) => {
    if (norm(r.Status).toLowerCase() !== "contacted") return;

    const phone = phoneKey(
      r["Nomor WhatsApp (agar tim kami bisa menghubungi kamu)"]
    );
    if (!phone) return;

    map[phone] = {
      phone,
      name: norm(r["Isi nama kamu"]),
      city: norm(r["Domisili kamu"]),
      raw: r, // original row reference (optional)
    };
  });
  return map;
}

/** Array of *row objects* whose Status is blank → “new affiliates” */
export async function getNewAffiliates() {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
  const rows = await sheet.getRows();
  return rows.filter((r) => !norm(r.Status));
}

/** Low‑level mutator – works on the Row instance itself */
export async function setAffiliateStatus(row, status = "contacted") {
  row.Status = status;
  await row.save();
  return true;
}

/** Convenience wrapper: update Status by *row index* (0‑based) */
export async function updateAffiliateStatusByIndex(
  index,
  status = "contacted"
) {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
  const rows = await sheet.getRows();

  if (index < 0 || index >= rows.length) return false;
  rows[index].Status = status;
  await rows[index].save();
  return true;
}

/** Convenience wrapper: update Status by phone */
export async function updateAffiliateStatusByPhone(
  phone,
  status = "contacted"
) {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
  const rows = await sheet.getRows();

  const target = rows.find(
    (r) =>
      phoneKey(r["Nomor WhatsApp (agar tim kami bisa menghubungi kamu)"]) ===
      phoneKey(phone)
  );
  if (!target) return false;
  target.Status = status;
  await target.save();
  return true;
}

// -----------------------------------------------------------------------------
// TOP‑PERFORMER UTILITIES
// -----------------------------------------------------------------------------
export async function getTopPerformers(category) {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.TOP_PERFORMERS];
  const rows = await sheet.getRows();

  return rows
    .filter((r) => r.kategori === category && r.status_notifikasi !== "sent")
    .map((r) => ({
      name: norm(r.nama_affiliate),
      phone: phoneKey(r.nomor_telepon),
      username: norm(r.username),
      ranking: norm(r.ranking),
      achievement: norm(r.achievement),
    }));
}

// -----------------------------------------------------------------------------
// ONBOARDING UTILITIES
// -----------------------------------------------------------------------------
export async function updateWelcomeStatus(phone, status = "sent") {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.ONBOARDING];
  const rows = await sheet.getRows();

  const target = rows.find(
    (r) => phoneKey(r.nomor_telepon) === phoneKey(phone)
  );
  if (!target) return false;

  target.status_welcome_message = status;
  await target.save();
  return true;
}

// -----------------------------------------------------------------------------
// BROADCAST LOGGING
// -----------------------------------------------------------------------------
export async function logBroadcast({
  type,
  recipients = [],
  success = 0,
  failed = 0,
  notes = "Auto‑logged by system",
}) {
  await initSheets();
  const sheet = doc.sheetsByTitle[SHEETS.BROADCAST_LOG];

  await sheet.addRow({
    id_broadcast: `BC${Date.now()}`,
    tanggal: new Date().toISOString(),
    jenis_broadcast: type,
    jumlah_penerima: recipients.length,
    sukses: success,
    gagal: failed,
    notes,
  });
}
