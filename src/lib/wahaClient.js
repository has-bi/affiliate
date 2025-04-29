// lib/wahaClient.js  – compatibility shim
import baileysClient from "./baileysClient";
import { formatPhoneNumber } from "./utils";

class WahaShim {
  async sendText(chatIdOrNumber, text) {
    const chatId = chatIdOrNumber.includes("@")
      ? chatIdOrNumber
      : `${formatPhoneNumber(chatIdOrNumber)}@s.whatsapp.net`;
    return baileysClient.sendText(chatId, text);
  }
}

const wahaClient = new WahaShim();
export default wahaClient;
