import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  QrCode,
  RotateCw,
  SmartphoneNfc,
} from "lucide-react";
import toast from "react-hot-toast";

// Component untuk mengecek dan mengelola session WAHA
const SessionChecker = () => {
  // WAHA API configuration
  const WAHA_API_BASE_URL = "https://wabot.youvit.co.id/api";
  const SESSION_NAME = "hasbi-test";

  // State untuk menyimpan status dan loading state
  const [sessionStatus, setSessionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fungsi untuk check session status - dengan detailed debugging
  const checkSession = async () => {
    setIsLoading(true);
    setError(null);
    setShowQr(false);
    setDebugInfo(null);

    // URL yang kita coba akses
    const apiUrl = `${WAHA_API_BASE_URL}/sessions/${SESSION_NAME}/status`;
    console.log(`🔍 Checking session status at: ${apiUrl}`);

    try {
      // Real API call ke WAHA endpoint
      const response = await fetch(apiUrl);

      const debug = {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      };

      console.log("📋 API Response Debug:", debug);
      setDebugInfo(debug);

      if (!response.ok) {
        console.log(`⚠️ API returned error status: ${response.status}`);
        setError(`API returned ${response.status}`);
        toast.error(`Error: API returned ${response.status}`);
        return; // Exit without throwing
      }

      const data = await response.json();
      console.log("✅ Session data:", data);

      setSessionStatus({
        active: data.accountStatus === "authenticated",
        status: data.accountStatus,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        profilePicture: data.profilePictureUrl,
        lastChecked: new Date().toLocaleString(),
      });

      if (data.accountStatus === "authenticated") {
        toast.success("WhatsApp connected!");
      }
    } catch (err) {
      console.log("❌ Session check error:", err.message);
      setError(`Gagal ngecek session: ${err.message}`);
      toast.error("Failed to check session status");
    } finally {
      setIsLoading(false);
    }
  };

  // Coba check langsung sessions info (tanpa status)
  const checkAllSessions = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    // URL yang kita coba akses
    const apiUrl = `${WAHA_API_BASE_URL}/sessions`;
    console.log(`🔍 Checking all sessions at: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl);

      const debug = {
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      };

      console.log("📋 API Response Debug:", debug);
      setDebugInfo(debug);

      if (!response.ok) {
        console.log(`⚠️ API returned error status: ${response.status}`);
        setError(`API returned ${response.status}`);
        toast.error(`Error: API returned ${response.status}`);
        return; // Exit without throwing
      }

      const data = await response.json();
      console.log("✅ All sessions data:", data);
      setDebugInfo({
        ...debug,
        data: data,
      });

      toast.success("Sessions info retrieved!");
    } catch (err) {
      console.log("❌ Sessions check error:", err.message);
      setError(`Gagal ngecek sessions: ${err.message}`);
      toast.error("Failed to check sessions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        WhatsApp Connection Status
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="h-10 w-10 text-green-500 animate-spin mb-4" />
          <p className="text-gray-600">Sedang ngecek session...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-red-500">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>

          {debugInfo && (
            <div className="mt-4 bg-gray-50 p-4 rounded-md text-xs text-gray-700 font-mono overflow-auto">
              <p className="font-semibold mb-2">Debug Info:</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <button
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              onClick={checkSession}
            >
              Try Again
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              onClick={checkAllSessions}
            >
              Check All Sessions
            </button>
          </div>
        </div>
      ) : sessionStatus ? (
        <div className="space-y-6">
          <div className="flex items-center">
            {sessionStatus.active ? (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="font-bold text-lg">WhatsApp Connected</p>
                  <p className="text-gray-500 text-sm">
                    Siap untuk kirim messages!
                  </p>
                </div>
              </div>
            ) : sessionStatus.status === "connecting" ? (
              <div className="flex items-center text-yellow-500">
                <RotateCw className="h-8 w-8 mr-3 animate-spin" />
                <div>
                  <p className="font-bold text-lg">Connecting...</p>
                  <p className="text-gray-500 text-sm">
                    WhatsApp sedang mencoba connect.
                  </p>
                </div>
              </div>
            ) : sessionStatus.status === "qrRead" ? (
              <div className="flex items-center text-blue-500">
                <SmartphoneNfc className="h-8 w-8 mr-3" />
                <div>
                  <p className="font-bold text-lg">QR Code Scanned</p>
                  <p className="text-gray-500 text-sm">
                    Tunggu proses otentikasi...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <AlertCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="font-bold text-lg">WhatsApp Disconnected</p>
                  <p className="text-gray-500 text-sm">
                    Kamu perlu login lagi ke WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-700 mb-2">Session Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Session Name</span>
                <span className="font-medium">{SESSION_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={
                    sessionStatus.active
                      ? "text-green-600 font-medium"
                      : sessionStatus.status === "connecting"
                      ? "text-yellow-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {sessionStatus.status ||
                    (sessionStatus.active ? "Active" : "Inactive")}
                </span>
              </div>
              {sessionStatus.displayName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">
                    {sessionStatus.displayName}
                  </span>
                </div>
              )}
              {sessionStatus.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">
                    {sessionStatus.phoneNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checked</span>
                <span className="font-medium">{sessionStatus.lastChecked}</span>
              </div>
            </div>
          </div>

          {debugInfo && (
            <div className="bg-gray-50 p-4 rounded-md text-xs text-gray-700 font-mono overflow-auto">
              <p className="font-semibold mb-2">Debug Info:</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {sessionStatus.profilePicture && (
            <div className="flex justify-center">
              <img
                src={sessionStatus.profilePicture}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-green-500"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Klik tombol di bawah untuk check WhatsApp connection
          </p>
          <div className="flex flex-col space-y-3">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              onClick={checkSession}
            >
              Check Session Status
            </button>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={checkAllSessions}
            >
              List All Sessions
            </button>
          </div>
        </div>
      )}

      {sessionStatus && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex space-x-3">
          <button
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center justify-center"
            onClick={checkSession}
            disabled={isLoading}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Refresh Status
          </button>

          <button
            className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition flex items-center justify-center"
            onClick={checkAllSessions}
            disabled={isLoading}
          >
            List All Sessions
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionChecker;
