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

// Helper function to initialize sheets
export const initSheets = async () => {
  await doc.loadInfo();
  return doc;
};

// User sheet operations
export const getUsersSheet = async () => {
  await initSheets();
  return doc.sheetsByTitle["Users"] || doc.sheetsByIndex[0];
};

export const getUsers = async () => {
  const sheet = await getUsersSheet();
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    id: row.id || "",
    name: row.name || "",
    phone: row.phone || "",
    status: row.status || "pending",
    lastMessage: row.lastMessage,
    lastMessageDate: row.lastMessageDate,
  }));
};

export const getUsersByStatus = async (status) => {
  const users = await getUsers();
  return users.filter((user) => user.status === status);
};

// Templates sheet operations
export const getTemplatesSheet = async () => {
  await initSheets();
  return doc.sheetsByTitle["Templates"] || doc.sheetsByIndex[1];
};

export const getTemplates = async () => {
  const sheet = await getTemplatesSheet();
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    id: row.id || "",
    name: row.name || "",
    content: row.content || "",
    variables: row.variables ? row.variables.split(",") : [],
    category: row.category || "general",
  }));
};
