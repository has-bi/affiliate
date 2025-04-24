// src/components/organisms/ScheduleList/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Edit,
  Trash,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";

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
      const response = await fetch("/api/schedules");
      if (!response.ok) throw new Error("Failed to fetch schedules");

      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (scheduleId, currentStatus) => {
    setActionLoading((prev) => ({ ...prev, [scheduleId]: true }));

    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update schedule status");

      await fetchSchedules();
    } catch (err) {
      console.error("Error toggling schedule status:", err);
      alert("Failed to update schedule status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [scheduleId]: false }));
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    setActionLoading((prev) => ({ ...prev, [`delete-${scheduleId}`]: true }));

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete schedule");

      await fetchSchedules();
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule");
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`delete-${scheduleId}`]: false,
      }));
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "paused":
        return "warning";
      case "completed":
        return "info";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getScheduleDescription = (schedule) => {
    if (schedule.scheduleType === "once") {
      return `One-time: ${formatDateTime(schedule.scheduleConfig.date)}`;
    } else {
      return `Recurring: ${schedule.scheduleConfig.cronExpression}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
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

      {schedules.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No schedules found
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first schedule to automate message sending
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
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <Card.Content>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {schedule.name}
                      </h3>
                      <Badge
                        variant={getStatusBadgeVariant(schedule.status)}
                        className="ml-2"
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {getScheduleDescription(schedule)}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/schedules/${schedule.id}`)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/schedules/${schedule.id}/edit`)
                      }
                      title="Edit Schedule"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {schedule.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(schedule.id, schedule.status)
                        }
                        disabled={actionLoading[schedule.id]}
                        title={
                          schedule.status === "active"
                            ? "Pause Schedule"
                            : "Activate Schedule"
                        }
                      >
                        {actionLoading[schedule.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : schedule.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={actionLoading[`delete-${schedule.id}`]}
                      title="Delete Schedule"
                    >
                      {actionLoading[`delete-${schedule.id}`] ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Template
                    </span>
                    <span className="text-sm font-medium">
                      #{schedule.templateId}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Session</span>
                    <span className="text-sm font-medium">
                      {schedule.sessionName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Next Run
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(schedule.nextRun)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Last Run
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(schedule.lastRun)}
                    </span>
                  </div>
                </div>

                {schedule.history && schedule.history.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Recent History
                    </h4>
                    <div className="space-y-2">
                      {schedule.history.slice(0, 3).map((entry, index) => (
                        <div key={index} className="flex items-center text-sm">
                          {entry.failedCount === 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="text-gray-600">
                            {formatDateTime(entry.runAt)}: {entry.successCount}{" "}
                            successful, {entry.failedCount} failed
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
