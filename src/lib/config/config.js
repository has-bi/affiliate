// src/lib/config.js

/**
 * Application configuration
 */
const config = {
  /**
   * API settings
   */
  api: {
    // WAHA API base URL
    wahaApiUrl: process.env.NEXT_PUBLIC_WAHA_API_URL,

    // Default session name
    defaultSession: process.env.NEXT_PUBLIC_WAHA_SESSION,

    // Endpoints
    endpoints: {
      sessions: "/api/sessions",
      session: (sessionName) => `/api/sessions/${sessionName}`,
      qr: (sessionName) => `/api/sessions/${sessionName}/qr`,
      messages: (sessionName, chatId) =>
        `/api/sessions/${sessionName}/chats/${chatId}/messages`,
    },
  },

  /**
   * UI settings
   */
  ui: {
    // Pagination settings
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
    },

    // Date format
    dateFormat: "YYYY-MM-DD HH:mm:ss",

    // Status colors
    statusColors: {
      CONNECTED: "success",
      WORKING: "success",
      AUTHENTICATED: "success",
      STARTING: "warning",
      CONNECTING: "warning",
      DISCONNECTED: "danger",
      FAILED: "danger",
    },
  },
};

export default config;
