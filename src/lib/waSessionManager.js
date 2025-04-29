// --- src/lib/waSessionManager.js ------------------------------------------------
// Multi‑session Baileys manager with QR code support
process.env.WS_NO_BUFFERUTIL = "true"; // skip bufferutil
process.env.WS_NO_DEFLATE = "true";

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";

const SESSIONS = new Map(); // name -> { sock, qr }

async function bootSession(name) {
  const { state, saveCreds } = await useMultiFileAuthState(`./auth/${name}`);

  let qrBase64 = null;
  let ready = false;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["WhatsApp Multi-Session", "Chrome", "1.0.0"],
  });

  /* connection & QR events */
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log(
        "Connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting: ",
        shouldReconnect
      );

      // reconnect if not logged out
      if (shouldReconnect) {
        // Remove from sessions and retry boot
        SESSIONS.delete(name);
        await bootSession(name);
      }
    } else if (connection === "open") {
      console.log(`Session ${name} opened connection`);
      ready = true;
    }

    // Process QR code if available
    if (qr) {
      try {
        qrBase64 = await qrcode.toDataURL(qr);
        console.log(`QR code generated for session ${name}`);
      } catch (err) {
        console.error("QR generation error:", err);
      }
    }
  });

  sock.ev.on("messages.upsert", async (event) => {
    for (const m of event.messages) {
      console.log(`[${name}] New message:`, JSON.stringify(m, undefined, 2));

      if (!m.key.fromMe) {
        console.log(`[${name}] Replying to ${m.key.remoteJid}`);
        await sock.sendMessage(m.key.remoteJid, { text: "Hello World" });
      }
    }
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  /* wait until QR produced OR creds already registered OR 20s timeout */
  await new Promise((resolve, reject) => {
    // Check if already authenticated
    if (state.creds.me) {
      ready = true;
      return resolve();
    }

    const timeout = setTimeout(() => reject(new Error("QR timeout")), 20000);

    const tick = setInterval(() => {
      if (ready || qrBase64) {
        clearTimeout(timeout);
        clearInterval(tick);
        resolve();
      }
    }, 200);
  });

  SESSIONS.set(name, { sock, qr: qrBase64 });
  return SESSIONS.get(name);
}

export async function createSession(name) {
  if (SESSIONS.has(name)) throw new Error("session-exists");
  return bootSession(name);
}

export const listSessions = () => Array.from(SESSIONS.keys());

export const getSession = (name) => SESSIONS.get(name) || null;

export const removeSession = async (name) => {
  const session = SESSIONS.get(name);
  if (!session) return false;

  try {
    await session.sock.logout();
  } catch (err) {
    console.error(`Error logging out session ${name}:`, err);
  }

  SESSIONS.delete(name);
  return true;
};
