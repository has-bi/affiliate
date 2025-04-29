// src/lib/sheets/spreadsheetService.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// -----------------------------------------------------------------------------
// AUTH & DOCUMENT SETUP
// -----------------------------------------------------------------------------
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Create JWT client for authentication
const jwt = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

// Initialize document with auth client
export const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEETS_DOCUMENT_ID || "",
  jwt
);

// Sheet tab names - keep them in one place for easy updates
const SHEETS = {
  FORM_RESPONSES: "Form Responses 1",
  TOP_PERFORMERS: "Top Performers",
  ONBOARDING: "Affiliate Onboarding",
  BROADCAST_LOG: "Broadcast Log",
};

// Initialize sheets handler
export async function initSheets() {
  try {
    await doc.loadInfo();
    console.log("[Sheets] Successfully initialized Google Sheets");
    return doc;
  } catch (error) {
    console.error("[Sheets] Failed to initialize Google Sheets:", error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

// Normalize text values for consistency
const norm = (v = "") => v.toString().trim();

// Format phone numbers for comparison/indexing
const phoneKey = (v = "") => norm(v).replace(/\D/g, "");

// -----------------------------------------------------------------------------
// AFFILIATE MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Get all affiliates where Status is "contacted"
 * @returns {Promise<Object>} Map of { phone: { phone, name, ... } }
 */
export async function getActiveAffiliates() {
  try {
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
        platform: norm(r["Dari Platform mana kamu berasal?"]) || "",
        raw: r, // original row reference (optional)
      };
    });
    return map;
  } catch (error) {
    console.error("[Sheets] Error getting active affiliates:", error);
    return {};
  }
}

/**
 * Get new affiliates (Status is blank)
 * @returns {Promise<Array>} Array of affiliate objects
 */
export async function getNewAffiliates() {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
    const rows = await sheet.getRows();

    const newAffiliates = rows
      .filter((r) => !norm(r.Status))
      .map((r, index) => ({
        rowIndex: index,
        name: norm(r["Isi nama kamu"]),
        phone: phoneKey(
          r["Nomor WhatsApp (agar tim kami bisa menghubungi kamu)"]
        ),
        platform: norm(r["Dari Platform mana kamu berasal?"]) || "",
        city: norm(r["Domisili kamu"]) || "",
        tiktokUsername:
          norm(r["Username Tiktok kamu? Contoh : @youvit_id"]) || "",
        instagramUsername:
          norm(r["Username Instagram kamu? Contoh : @youvit_id"]) || "",
        shopeeUsername:
          norm(r["Username Shopee kamu? Contoh : youvitofficial"]) || "",
      }));

    return newAffiliates;
  } catch (error) {
    console.error("[Sheets] Error getting new affiliates:", error);
    return [];
  }
}

/**
 * Update an affiliate's status by row
 * @param {Object} row Sheet row object
 * @param {string} status New status value
 * @returns {Promise<boolean>} Success status
 */
export async function setAffiliateStatus(row, status = "contacted") {
  try {
    row.Status = status;
    await row.save();
    return true;
  } catch (error) {
    console.error("[Sheets] Error setting affiliate status:", error);
    return false;
  }
}

/**
 * Update an affiliate's status by row index
 * @param {number} index Row index (0-based)
 * @param {string} status New status value
 * @returns {Promise<boolean>} Success status
 */
export async function updateAffiliateStatusByIndex(
  index,
  status = "contacted"
) {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
    const rows = await sheet.getRows();

    if (index < 0 || index >= rows.length) return false;
    rows[index].Status = status;
    await rows[index].save();
    return true;
  } catch (error) {
    console.error("[Sheets] Error updating affiliate status by index:", error);
    return false;
  }
}

/**
 * Update an affiliate's status by phone number
 * @param {string} phone Phone number
 * @param {string} status New status value
 * @returns {Promise<boolean>} Success status
 */
export async function updateAffiliateStatusByPhone(
  phone,
  status = "contacted"
) {
  try {
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
  } catch (error) {
    console.error("[Sheets] Error updating affiliate status by phone:", error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// TOP PERFORMER MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Get top performing affiliates by category
 * @param {string} category Performance category
 * @returns {Promise<Array>} Array of top performer objects
 */
export async function getTopPerformers(category) {
  try {
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
  } catch (error) {
    console.error("[Sheets] Error getting top performers:", error);
    return [];
  }
}

/**
 * Update notification status for top performers
 * @param {string} phone Phone number
 * @param {string} status Notification status
 * @returns {Promise<boolean>} Success status
 */
export async function updateTopPerformerStatus(phone, status = "sent") {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.TOP_PERFORMERS];
    const rows = await sheet.getRows();

    const target = rows.find(
      (r) => phoneKey(r.nomor_telepon) === phoneKey(phone)
    );

    if (!target) return false;
    target.status_notifikasi = status;
    await target.save();
    return true;
  } catch (error) {
    console.error("[Sheets] Error updating top performer status:", error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// ONBOARDING MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Update welcome message status
 * @param {string} phone Phone number
 * @param {string} status Welcome message status
 * @returns {Promise<boolean>} Success status
 */
export async function updateWelcomeStatus(phone, status = "sent") {
  try {
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
  } catch (error) {
    console.error("[Sheets] Error updating welcome status:", error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// BROADCAST LOGGING
// -----------------------------------------------------------------------------

/**
 * Log broadcast event
 * @param {Object} data Broadcast data
 * @returns {Promise<boolean>} Success status
 */
export async function logBroadcast({
  type,
  recipients = [],
  success = 0,
  failed = 0,
  notes = "Auto‑logged by system",
}) {
  try {
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

    return true;
  } catch (error) {
    console.error("[Sheets] Error logging broadcast:", error);
    return false;
  }
}
