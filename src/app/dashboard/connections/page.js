"use client";

// src/app/dashboard/connections/page.js
// Client component page to manage WA sessions
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ConnectionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrBase, setQrBase] = useState(null);
  const [newName, setNewName] = useState("");
  const pollRef = useRef(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const json = await res.json();
      setSessions(json.sessions || []);
    } catch (e) {
      toast.error("Gagal memuat sesi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    return () => clearInterval(pollRef.current);
  }, []);

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
      setQrBase(qr);

      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/connections/${newName.trim()}/qr`);
        const j = await r.json();
        if (j.qr === null) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          toast.success("Koneksi berhasil!");
          setModalOpen(false);
          setQrBase(null);
          setNewName("");
          fetchList();
        } else if (j.qr) setQrBase(j.qr);
      }, 3000);
    } catch (e) {
      toast.error(e.error || "Gagal membuat koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (name) => {
    if (!confirm(`Hapus koneksi ${name}?`)) return;
    try {
      const res = await fetch(`/api/connections/${name}`, { method: "DELETE" });
      if (!res.ok) throw await res.json();
      toast.success("Koneksi dihapus");
      fetchList();
    } catch (e) {
      toast.error(e.error || "Gagal menghapus koneksi");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Koneksi WhatsApp</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchList} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Koneksi
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {sessions.map((s) => (
          <Card key={s}>
            <CardContent className="p-4 flex justify-between items-center">
              <span>{s}</span>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleRemove(s)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && !loading && (
          <p className="text-gray-500">Belum ada koneksi.</p>
        )}
      </div>

      {/* modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Koneksi Baru</DialogTitle>
          </DialogHeader>

          {qrBase ? (
            <div className="flex flex-col items-center gap-4">
              <img src={qrBase} alt="QR" className="w-56 h-56" />
              <p className="text-sm text-gray-600 text-center">
                Scan QR dengan WhatsApp
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
                className="w-full"
                onClick={handleCreate}
                disabled={!newName.trim() || loading}
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
