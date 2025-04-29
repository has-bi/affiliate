// src/lib/baileysClient.js
// Singleton wrapper around @whiskeysockets/baileys
// -----------------------------------------------------------------------------
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";

class BaileysClient {
  /** @type {import("@whiskeysockets/baileys").WASocket | null} */
  sock = null;

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    this.sock = makeWASocket({ auth: state, printQRInTerminal: true });

    // Show QR once if not yet authenticated
    this.sock.ev.on(
      "connection.update",
      ({ connection, lastDisconnect, qr }) => {
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === "close") {
          const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
          if (reason !== DisconnectReason.loggedOut) {
            console.log("[Baileys] Reconnecting …");
            this.init();
          }
        }
      }
    );

    // Persist credentials on every update
    this.sock.ev.on("creds.update", saveCreds);

    console.log("[Baileys] client ready");
  }

  /**
   * Ensure socket exists & connected
   * @private
   */
  _assert() {
    if (!this.sock) throw new Error("Baileys client not initialised");
  }

  /**
   * Send plain‑text message
   * @param {string} chatId eg. "628123456789@s.whatsapp.net"
   * @param {string} text   message body
   */
  async sendText(chatId, text) {
    this._assert();
    await this.sock.presenceSubscribe(chatId);
    return this.sock.sendMessage(chatId, { text });
  }
}

// Export a ready‑to‑use singleton
const baileysClient = new BaileysClient();
baileysClient.init().catch(console.error);

export default baileysClient;
