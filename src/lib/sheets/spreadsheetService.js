// src/lib/sheets/spreadsheetService.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// AUTH & DOCUMENT SETUP
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

// Sheet tab names
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

// UTILITY FUNCTIONS

// Normalize text values for consistency
export function norm(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// Format phone numbers for comparison/indexing
export function phoneKey(value = "") {
  // Handle different value types
  let str;

  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string, handling number types
  if (typeof value === "number") {
    // For numeric values, ensure we don't lose leading zeros by converting to a fixed string format
    str = value.toString();
    console.log(`Converting numeric phone ${value} to string: ${str}`);
  } else {
    str = String(value);
  }

  // Clean the number (remove non-digits)
  const cleaned = str.replace(/\D/g, "");

  // Handle empty after cleaning
  if (!cleaned) return "";

  // Ensure Indonesian format (starts with 62)
  if (cleaned.startsWith("0")) {
    return `62${cleaned.substring(1)}`;
  } else if (!cleaned.startsWith("62") && cleaned.length > 6) {
    return `62${cleaned}`;
  }

  return cleaned;
}

// Helper to safely access row data by header name
function getRowValue(row, headerName) {
  if (!row || !row._sheet) return null;

  // Get column index from header
  const headers = row._sheet.headerValues || [];
  const colIndex = headers.findIndex((h) => h === headerName);

  // If found, return the corresponding value from _rawData
  if (colIndex >= 0 && row._rawData && row._rawData[colIndex] !== undefined) {
    return row._rawData[colIndex];
  }

  return null;
}

// AFFILIATE MANAGEMENT
/**
 * Get all affiliates where Status is "contacted"
 * @returns {Promise<Object>} Map of { phone: { phone, name, ... } }
 */
export async function getActiveAffiliates() {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Find column indices
    const phoneColName = "Nomor WhatsApp (agar tim kami bisa menghubungi kamu)";
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === phoneColName
    );
    const statusColIndex = sheet.headerValues.findIndex((h) => h === "Status");

    // Return as array instead of map to preserve duplicates
    const activeAffiliates = [];
    let contactedCount = 0;

    rows.forEach((row, index) => {
      // Get status directly from _rawData
      const status = row._rawData[statusColIndex];

      // Only process rows with "contacted" status
      if (status === "contacted") {
        contactedCount++;

        // Get phone number directly
        const phoneValue = row._rawData[phoneColIndex];
        const phone = phoneKey(phoneValue);

        if (!phone) {
          console.log(
            `Row ${index}: Found 'contacted' row but phone is empty or invalid`
          );
          return;
        }

        // Add to active affiliates array
        activeAffiliates.push({
          phone,
          rowIndex: index,
          name: norm(row._rawData[sheet.headerValues.indexOf("Isi nama kamu")]),
          platform: norm(
            row._rawData[
              sheet.headerValues.indexOf(
                "Lebih aktif sebagai Affiliate di mana?"
              )
            ]
          ),
          instagramUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username Instagram")]
          ),
          tiktokUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username TikTok")]
          ),
          shopeeUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username Shopee")]
          ),
        });
      }
    });

    console.log(`Found ${contactedCount} rows with 'contacted' status`);
    console.log(
      `Created array with ${activeAffiliates.length} active affiliates`
    );

    return activeAffiliates;
  } catch (error) {
    console.error("[Sheets] Error getting active affiliates:", error);
    return [];
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
    await sheet.loadHeaderRow(); // Ensure headers are loaded
    const rows = await sheet.getRows();

    // Find phone column index
    const phoneColName = "Nomor WhatsApp (agar tim kami bisa menghubungi kamu)";
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === phoneColName
    );
    const statusColIndex = sheet.headerValues.findIndex((h) => h === "Status");

    let blankStatusCount = 0;
    const newAffiliates = [];

    rows.forEach((row, index) => {
      // Get status value directly from _rawData array
      const status = row._rawData[statusColIndex];

      // Check if status is empty/blank (not "contacted")
      const isEmpty = status === null || status === undefined || status === "";

      if (isEmpty) {
        blankStatusCount++;

        // Get phone number directly from _rawData and convert to string
        const phoneValue = row._rawData[phoneColIndex];
        // Handle phone number that might be numeric
        const phoneStr =
          phoneValue !== undefined && phoneValue !== null
            ? String(phoneValue)
            : "";

        const phone = phoneKey(phoneStr);

        if (!phone) {
          console.log(
            `Row ${index}: Found blank status row but phone is empty or invalid after conversion`
          );
          return;
        }

        // Add to new affiliates list
        newAffiliates.push({
          rowIndex: index,
          name: norm(row._rawData[sheet.headerValues.indexOf("Isi nama kamu")]),
          phone: phone,
          platform: norm(
            row._rawData[
              sheet.headerValues.indexOf(
                "Lebih aktif sebagai Affiliate di mana?"
              )
            ]
          ),
          instagramUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username Instagram")]
          ),
          tiktokUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username TikTok")]
          ),
          shopeeUsername: norm(
            row._rawData[sheet.headerValues.indexOf("Username Shopee")]
          ),
        });
      }
    });

    return newAffiliates;
  } catch (error) {
    console.error("[Sheets] Error getting new affiliates:", error);
    return [];
  }
}

/**
 * Update an affiliate's status by row index
 * @param {Object} params - Parameters including rowIndex and status
 * @returns {Promise<Object>} Result with success flag
 */
export async function updateAffiliateStatus(params) {
  try {
    const { rowIndex, status = "contacted" } = params;

    if (rowIndex === undefined) {
      return { success: false, error: "Row index is required" };
    }

    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    if (rowIndex < 0 || rowIndex >= rows.length) {
      return { success: false, error: "Invalid row index" };
    }

    // Find the index of the Status column
    const statusColIndex = sheet.headerValues.findIndex((h) => h === "Status");

    if (statusColIndex === -1) {
      return { success: false, error: "Status column not found" };
    }

    // Update the status
    rows[rowIndex]._rawData[statusColIndex] = status;
    await rows[rowIndex].save();

    return {
      success: true,
      message: `Status updated to '${status}' for row ${rowIndex}`,
    };
  } catch (error) {
    console.error("[Sheets] Error updating affiliate status:", error);
    return { success: false, error: error.message };
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
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Find the status column index
    const statusColIndex = sheet.headerValues.findIndex((h) => h === "Status");
    if (statusColIndex === -1) return false;

    // Find the phone column index
    const phoneColName = "Nomor WhatsApp (agar tim kami bisa menghubungi kamu)";
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === phoneColName
    );
    if (phoneColIndex === -1) return false;

    // Format the target phone for comparison
    const targetPhone = phoneKey(phone);
    if (!targetPhone) return false;

    // Find the row with matching phone number
    let foundRow = null;
    for (let i = 0; i < rows.length; i++) {
      const rowPhone = phoneKey(rows[i]._rawData[phoneColIndex]);
      if (rowPhone === targetPhone) {
        foundRow = rows[i];
        break;
      }
    }

    if (!foundRow) return false;

    // Update the status and save
    foundRow._rawData[statusColIndex] = status;
    await foundRow.save();

    return true;
  } catch (error) {
    console.error("[Sheets] Error updating affiliate status by phone:", error);
    return false;
  }
}

/**
 * Helper function to set up test data
 * @returns {Promise<Object>} Result with success flag
 */
export async function setupTestData() {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.FORM_RESPONSES];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    if (rows.length < 3) {
      return { success: false, message: "Not enough rows to set up test data" };
    }

    // Find Status column index
    const statusColIndex = sheet.headerValues.findIndex((h) => h === "Status");

    if (statusColIndex === -1) {
      return { success: false, error: "Status column not found" };
    }

    // Set first two rows to "contacted"
    rows[0]._rawData[statusColIndex] = "contacted";
    await rows[0].save();

    rows[1]._rawData[statusColIndex] = "contacted";
    await rows[1].save();

    // Set third row to blank
    rows[2]._rawData[statusColIndex] = "";
    await rows[2].save();

    return { success: true, message: "Test data set up successfully" };
  } catch (error) {
    console.error("[Sheets] Error setting up test data:", error);
    return { success: false, error: error.message };
  }
}

// TOP PERFORMER MANAGEMENT
/**
 * Get top performing affiliates by category
 * @param {string} category Performance category
 * @returns {Promise<Array>} Array of top performer objects
 */
export async function getTopPerformers(category) {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle[SHEETS.TOP_PERFORMERS];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Get relevant column indices
    const categoryColIndex = sheet.headerValues.findIndex(
      (h) => h === "kategori"
    );
    const statusColIndex = sheet.headerValues.findIndex(
      (h) => h === "status_notifikasi"
    );
    const nameColIndex = sheet.headerValues.findIndex(
      (h) => h === "nama_affiliate"
    );
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === "nomor_telepon"
    );
    const usernameColIndex = sheet.headerValues.findIndex(
      (h) => h === "username"
    );
    const rankingColIndex = sheet.headerValues.findIndex(
      (h) => h === "ranking"
    );
    const achievementColIndex = sheet.headerValues.findIndex(
      (h) => h === "achievement"
    );

    // Filter and map rows
    const performers = [];

    rows.forEach((row) => {
      const rowCategory = row._rawData[categoryColIndex];
      const notifStatus = row._rawData[statusColIndex];

      if (rowCategory === category && notifStatus !== "sent") {
        performers.push({
          name: norm(row._rawData[nameColIndex]),
          phone: phoneKey(row._rawData[phoneColIndex]),
          username: norm(row._rawData[usernameColIndex]),
          ranking: norm(row._rawData[rankingColIndex]),
          achievement: norm(row._rawData[achievementColIndex]),
        });
      }
    });

    return performers;
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
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Get column indices
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === "nomor_telepon"
    );
    const statusColIndex = sheet.headerValues.findIndex(
      (h) => h === "status_notifikasi"
    );

    if (phoneColIndex === -1 || statusColIndex === -1) return false;

    // Format the target phone for comparison
    const targetPhone = phoneKey(phone);
    if (!targetPhone) return false;

    // Find and update the matching row
    let found = false;
    for (let i = 0; i < rows.length; i++) {
      const rowPhone = phoneKey(rows[i]._rawData[phoneColIndex]);
      if (rowPhone === targetPhone) {
        rows[i]._rawData[statusColIndex] = status;
        await rows[i].save();
        found = true;
        break;
      }
    }

    return found;
  } catch (error) {
    console.error("[Sheets] Error updating top performer status:", error);
    return false;
  }
}

// ONBOARDING MANAGEMENT

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
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Get column indices
    const phoneColIndex = sheet.headerValues.findIndex(
      (h) => h === "nomor_telepon"
    );
    const statusColIndex = sheet.headerValues.findIndex(
      (h) => h === "status_welcome_message"
    );

    if (phoneColIndex === -1 || statusColIndex === -1) return false;

    // Format the target phone for comparison
    const targetPhone = phoneKey(phone);
    if (!targetPhone) return false;

    // Find and update the matching row
    let found = false;
    for (let i = 0; i < rows.length; i++) {
      const rowPhone = phoneKey(rows[i]._rawData[phoneColIndex]);
      if (rowPhone === targetPhone) {
        rows[i]._rawData[statusColIndex] = status;
        await rows[i].save();
        found = true;
        break;
      }
    }

    return found;
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
    await sheet.loadHeaderRow();

    // Create array matching the header order
    const rowData = [];
    sheet.headerValues.forEach((header) => {
      switch (header) {
        case "id_broadcast":
          rowData.push(`BC${Date.now()}`);
          break;
        case "tanggal":
          rowData.push(new Date().toISOString());
          break;
        case "jenis_broadcast":
          rowData.push(type);
          break;
        case "jumlah_penerima":
          rowData.push(String(recipients.length));
          break;
        case "sukses":
          rowData.push(String(success));
          break;
        case "gagal":
          rowData.push(String(failed));
          break;
        case "notes":
          rowData.push(notes);
          break;
        default:
          rowData.push(""); // Empty for unknown columns
      }
    });

    // Add the row
    await sheet.addRow(rowData);

    return true;
  } catch (error) {
    console.error("[Sheets] Error logging broadcast:", error);
    return false;
  }
}
