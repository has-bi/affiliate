/* eslint-env node */
import { EventEmitter } from "node:events";

class SessionRegistry extends EventEmitter {
  /** Map<sessionId, { sock, qr, status }> */
  #sessions = new Map();

  /**
   * Get existing record or undefined.
   * @param {string} id
   */
  get(id) {
    return this.#sessions.get(id);
  }

  /**
   * Create a new blank record, caller will fill it.
   * Throws if id already taken.
   * @param {string} id
   */
  create(id) {
    if (this.#sessions.has(id))
      throw new Error(`Session "${id}" already exists`);
    const rec = { sock: null, qr: null, status: "initialising" };
    this.#sessions.set(id, rec);
    return rec;
  }

  /**
   * Attach a Baileys socket to a record and wire QR / status updates.
   * @param {string} id
   * @param {import('baileys').WASocket} sock
   */
  bindSocket(id, sock) {
    const rec = this.#sessions.get(id);
    if (!rec) throw new Error(`Unknown session "${id}"`);
    rec.sock = sock;

    sock.ev.on("connection.update", ({ connection, qr }) => {
      rec.status = connection ?? rec.status;
      if (qr) rec.qr = qr;
      this.emit("update", id, rec); // optional: realtime hooks
    });

    sock.ev.on("creds.update", () => this.emit("creds", id));
  }
}

// Singleton export
export const sessionRegistry = new SessionRegistry();
