// src/components/organisms/ScheduleList/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Trash,
  Eye,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ScheduleList() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      setSchedules(await res.json());
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    setActionLoading((p) => ({ ...p, [`delete-${id}`]: true }));
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete schedule");
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      alert("Failed to delete schedule");
    } finally {
      setActionLoading((p) => ({ ...p, [`delete-${id}`]: false }));
    }
  };

  const getStatusBadgeVariant = (s) =>
    ({
      active: "success",
      paused: "warning",
      completed: "info",
      failed: "danger",
    }[s] ?? "default");

  const fmt = (d) => (d ? new Date(d).toLocaleString() : "N/A");

  const describe = (s) =>
    s.scheduleType === "once"
      ? `One‑time: ${fmt(s.scheduleConfig.date)}`
      : `Recurring: ${s.scheduleConfig.cronExpression}`;

  /* UI -------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
        <div>
          <h3 className="font-medium">Error loading schedules</h3>
          <p className="mt-1">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSchedules}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Scheduled Messages</h2>
          <p className="text-sm text-gray-500">
            Manage your automated message schedules
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/schedules/new")}
          leftIcon={<Plus className="h-4 w-4 mr-1" />}
        >
          New Schedule
        </Button>
      </div>

      {/* Empty state */}
      {schedules.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No schedules found</h3>
            <p className="text-gray-500 mb-4">
              Create your first schedule to automate message sending.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/schedules/new")}
            >
              Create Schedule
            </Button>
          </Card.Content>
        </Card>
      ) : (
        /* Schedule cards */
        <div className="grid gap-4">
          {schedules.map((s) => (
            <Card key={s.id}>
              <Card.Content>
                {/* Top row */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{s.name}</h3>
                      <Badge
                        variant={getStatusBadgeVariant(s.status)}
                        className="ml-2"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{describe(s)}</p>
                  </div>

                  {/* Actions: view / delete */}
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/schedules/${s.id}`)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                      disabled={actionLoading[`delete-${s.id}`]}
                      title="Delete Schedule"
                    >
                      {actionLoading[`delete-${s.id}`] ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Template
                    </span>
                    <span className="text-sm font-medium">#{s.templateId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Session</span>
                    <span className="text-sm font-medium">{s.sessionName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Next Run
                    </span>
                    <span className="text-sm font-medium">
                      {fmt(s.nextRun)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Last Run
                    </span>
                    <span className="text-sm font-medium">
                      {fmt(s.lastRun)}
                    </span>
                  </div>
                </div>

                {/* History */}
                {s.history?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Recent History</h4>
                    <div className="space-y-2">
                      {s.history.slice(0, 3).map((h, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          {h.failedCount === 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="text-gray-600">
                            {fmt(h.runAt)}: {h.successCount} successful,{" "}
                            {h.failedCount} failed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
