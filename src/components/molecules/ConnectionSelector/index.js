// src/components/molecules/ConnectionSelector/index.js
import React, { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConnectionSelector({ onNext }) {
  const [sessionStatus, setSessionStatus] = useState({ isConnected: false });
  const [loading, setLoading] = useState(false);
  const defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi";

  /* Check session status */
  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const json = await res.json();
      const session = json.sessions?.[0] || {
        name: defaultSession,
        isConnected: false,
      };
      setSessionStatus(session);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memeriksa status koneksi");
      setSessionStatus({ name: defaultSession, isConnected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Status Koneksi WhatsApp</h3>

      {/* Connection status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center gap-2">
          {sessionStatus.isConnected ? (
            <>
              <Wifi className="h-6 w-6 text-green-500" />
              <div>
                <div className="font-medium">{defaultSession}</div>
                <div className="text-sm text-green-600">
                  Terhubung ({sessionStatus.status})
                </div>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="h-6 w-6 text-red-500" />
              <div>
                <div className="font-medium">{defaultSession}</div>
                <div className="text-sm text-red-600">
                  Tidak terhubung ({sessionStatus.status})
                </div>
              </div>
            </>
          )}
        </div>

        <Button variant="outline" onClick={checkSession} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Show error if one exists */}
      {sessionStatus.error && (
        <div className="flex items-start gap-2 p-3 text-red-600 bg-red-50 rounded-md border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Connection Error</p>
            <p>{sessionStatus.error}</p>
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="p-3 bg-gray-100 rounded-md text-xs font-mono">
          <strong>Debug Info:</strong>
          <pre>{JSON.stringify(sessionStatus, null, 2)}</pre>
        </div>
      )}

      {/* Action button */}
      <div className="text-right mt-4">
        {sessionStatus.isConnected ? (
          <Button onClick={onNext}>Lanjutkan</Button>
        ) : (
          <div className="text-red-600 text-sm">
            WhatsApp tidak terhubung. Hubungi administrator untuk mengaktifkan
            koneksi.
          </div>
        )}
      </div>
    </div>
  );
}
