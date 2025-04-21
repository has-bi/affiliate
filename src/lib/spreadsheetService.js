// src/lib/spreadsheetService.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// Initialize auth
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const jwt = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

// Initialize the sheet
const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEETS_DOCUMENT_ID || "",
  jwt
);

const getRowDataByHeaderOrIndex = async (sheet, rows) => {
  // Try to get the headers
  let headers = [];
  try {
    headers = await sheet.headerValues;
    console.log("Retrieved headers:", headers);
  } catch (error) {
    console.error("Error getting headers:", error);
  }

  return rows.map((row) => {
    const rowData = {};

    // If we have headers, use them to build an object
    if (headers.length > 0) {
      headers.forEach((header, index) => {
        rowData[header] = row._rawData[index];
      });
    } else {
      // Otherwise, use a simpler naming convention
      row._rawData.forEach((value, index) => {
        rowData[`column${index}`] = value;
      });
    }

    return {
      ...rowData,
      _rowIndex: rows.indexOf(row),
    };
  });
};

// Helper function to initialize sheets
export async function initSheets() {
  await doc.loadInfo();
  return doc;
}

export const getNewAffiliates = async () => {
  try {
    await initSheets();
    const sheet = doc.sheetsByTitle["Form Responses 1"];

    await sheet.loadCells();

    // Get headers manually from the first row
    const headerValues = [];
    for (let col = 0; col < sheet.columnCount; col++) {
      const cellValue = sheet.getCell(0, col).value;
      if (cellValue) {
        headerValues.push(cellValue);
      } else {
        break; // Stop at first empty cell
      }
    }

    console.log("Header values:", headerValues);

    // Find the indices of key columns
    const timestampIndex = headerValues.findIndex((h) => h === "Timestamp");
    const statusIndex = headerValues.findIndex((h) => h === "Status");
    const nameIndex = headerValues.findIndex((h) => h === "Isi nama kamu");
    const phoneIndex = headerValues.findIndex((h) =>
      h.includes("Nomor WhatsApp")
    );

    console.log("Column indices:", {
      timestampIndex,
      statusIndex,
      nameIndex,
      phoneIndex,
    });

    // Now get all rows
    const rows = await sheet.getRows();

    // Filter rows with empty status
    const newAffiliates = rows
      .filter((row) => {
        return !row._rawData[statusIndex] || row._rawData[statusIndex] === "";
      })
      .map((row) => ({
        timestamp: row._rawData[timestampIndex] || "",
        name: row._rawData[nameIndex] || "",
        phone: row._rawData[phoneIndex]?.toString() || "",
        // Add other fields as needed
        rowIndex: rows.indexOf(row),
      }));

    return newAffiliates;
  } catch (error) {
    console.error("Error fetching new affiliates:", error);
    throw error;
  }
};

// Update onboarding message status
export async function updateAffiliateStatus(rowIndex, status = "contacted") {
  await initSheets();
  const sheet = doc.sheetsByTitle["Form Responses 1"];
  const rows = await sheet.getRows();

  if (rowIndex >= 0 && rowIndex < rows.length) {
    rows[rowIndex].Status = status;
    await rows[rowIndex].save();
    return true;
  }
  return false;
}

// Alternative version to find by phone number
export async function updateAffiliateStatusByPhone(
  phoneNumber,
  status = "contacted"
) {
  await initSheets();
  const sheet = doc.sheetsByTitle["Form Responses 1"];
  const rows = await sheet.getRows();

  const rowIndex = rows.findIndex(
    (row) =>
      row[
        "Nomor WhatsApp (agar tim kami bisa menghubungi kamu)"
      ]?.toString() === phoneNumber.toString()
  );

  if (rowIndex !== -1) {
    rows[rowIndex].Status = status;
    await rows[rowIndex].save();
    return true;
  }
  return false;
}

// Get top performers (livestream or video)
export async function getTopPerformers(category) {
  await initSheets();
  const sheet = doc.sheetsByTitle["Top Performers"];
  const rows = await sheet.getRows();

  return rows
    .filter(
      (row) => row.kategori === category && row.status_notifikasi !== "sent"
    )
    .map((row) => ({
      name: row.nama_affiliate || "",
      phone: row.nomor_telepon || "",
      username: row.username || "",
      ranking: row.ranking || "",
      achievement: row.achievement || "",
    }));
}

// Update welcome message status
export async function updateWelcomeStatus(phoneNumber, status = "sent") {
  await initSheets();
  const sheet = doc.sheetsByTitle["Affiliate Onboarding"];
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.nomor_telepon === phoneNumber);
  if (row) {
    row.status_welcome_message = status;
    await row.save();
    return true;
  }
  return false;
}

// Log broadcast result
export async function logBroadcast(type, recipients, success, failed) {
  await initSheets();
  const sheet = doc.sheetsByTitle["Broadcast Log"];

  await sheet.addRow({
    id_broadcast: `BC${Date.now()}`,
    tanggal: new Date().toISOString(),
    jenis_broadcast: type,
    jumlah_penerima: recipients.length,
    sukses: success,
    gagal: failed,
    notes: `Auto-logged by system`,
  });
}
