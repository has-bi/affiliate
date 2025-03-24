import axios from "axios";

// Client configuration
const wahaApi = axios.create({
  baseURL: process.env.WAHA_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
});

// Session management
export const getSessionStatus = async (sessionName = "default") => {
  const response = await wahaApi.get(`/sessions/${sessionName}/status`);
  return response.data;
};

export const startSession = async (sessionName = "default") => {
  const response = await wahaApi.post("/sessions/start", { name: sessionName });
  return response.data;
};

export const getQrCode = async (sessionName = "default") => {
  const response = await wahaApi.get(`/sessions/${sessionName}/qr`, {
    responseType: "text",
  });
  return response.data;
};

export const stopSession = async (sessionName = "default") => {
  const response = await wahaApi.post(`/sessions/${sessionName}/stop`);
  return response.data;
};

// Messaging
export const sendMessage = async (sessionName = "default", phone, message) => {
  const response = await wahaApi.post(`/sessions/${sessionName}/messages`, {
    phone,
    message,
  });
  return response.data;
};

export const sendTemplateMessage = async (
  sessionName = "default",
  phone,
  templateContent,
  variables
) => {
  // Replace template variables
  let finalMessage = templateContent;
  Object.entries(variables).forEach(([key, value]) => {
    finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return sendMessage(sessionName, phone, finalMessage);
};
