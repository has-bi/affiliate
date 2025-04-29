import React, { useEffect, useState, useRef } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConnectionSelector({ value, onChange, onNext }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [qrData, setQrData] = useState(null);

  const pollRef = useRef(null);

  /* fetch list */
  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const json = await res.json();
      setSessions(json.sessions || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat koneksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  /* create connection */
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw await res.json();
      const { qr } = await res.json();
      setQrData(qr);

      // start polling until paired
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/connections/${newName.trim()}/qr`);
        const j = await r.json();
        if (j.qr === null) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          toast.success("Koneksi berhasil dibuat");
          setShowModal(false);
          setNewName("");
          setQrData(null);
          loadSessions();
        } else if (j.qr) {
          setQrData(j.qr);
        }
      }, 3000);
    } catch (err) {
      toast.error(err.error || "Gagal membuat koneksi");
    } finally {
      setLoading(false);
    }
  };

  /* cleanup */
  useEffect(() => () => clearInterval(pollRef.current), []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pilih Koneksi WhatsApp</h3>
      <div className="flex gap-4 items-center">
        <select
          className="border rounded-md p-2 flex-1"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            -- pilih koneksi --
          </option>
          {sessions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={loadSessions} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" />
        </Button>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Next button only enabled if a session picked */}
      <div className="text-right mt-4">
        <Button onClick={onNext} disabled={!value}>
          Lanjutkan
        </Button>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Koneksi Baru</DialogTitle>
          </DialogHeader>

          {qrData ? (
            <div className="flex flex-col items-center gap-4">
              <img src={qrData} alt="QR Code" className="w-48 h-48" />
              <p className="text-sm text-gray-600 text-center">
                Scan QR dengan WhatsApp di ponsel Anda
              </p>
            </div>
          ) : (
            <>
              <Input
                placeholder="Nama koneksi (mis. marketing)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button
                onClick={handleCreate}
                disabled={loading || !newName.trim()}
              >
                {loading ? "Membuat…" : "Buat & Tampilkan QR"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
