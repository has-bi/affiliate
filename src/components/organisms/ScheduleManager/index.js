// src/components/organisms/ScheduleManager/index.js
"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash,
  Play,
  Pause,
  Eye,
} from "lucide-react";
import Card from "../../atoms/Card";
import Button from "../../atoms/Button";
import Badge from "../../atoms/Badge";

const ScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/schedules");

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message || "Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      // Remove from local state
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule: " + err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule status");
      }

      const updatedSchedule = await response.json();

      // Update local state
      setSchedules(schedules.map((s) => (s.id === id ? updatedSchedule : s)));
    } catch (err) {
      console.error("Error updating schedule status:", err);
      alert("Failed to update schedule: " + err.message);
    }
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "info";
      case "failed":
        return "danger";
      case "paused":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <Card.Header className="flex justify-between items-center">
        <Card.Title>Scheduled Messages</Card.Title>
        <Button
          variant="primary"
          size="sm"
          onClick={() => (window.location.href = "/schedules/new")}
        >
          Create New Schedule
        </Button>
      </Card.Header>

      <Card.Content>
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-md">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No scheduled messages found</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => (window.location.href = "/schedules/new")}
            >
              Create Your First Schedule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Template: {schedule.templateId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {schedule.scheduleType === "once" ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-sm text-gray-900">
                            One Time
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-purple-500" />
                          <span className="text-sm text-gray-900">
                            Recurring
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(schedule.nextRun)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.recipients?.length || 0} recipients
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/schedules/${schedule.id}`)
                          }
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() =>
                            (window.location.href = `/schedules/${schedule.id}/edit`)
                          }
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Schedule"
                        >
                          <Edit className="h-5 w-5" />
                        </button>

                        {["active", "paused", "pending"].includes(
                          schedule.status
                        ) && (
                          <button
                            onClick={() =>
                              handleToggleStatus(schedule.id, schedule.status)
                            }
                            className={
                              schedule.status === "active"
                                ? "text-amber-600 hover:text-amber-900"
                                : "text-green-600 hover:text-green-900"
                            }
                            title={
                              schedule.status === "active"
                                ? "Pause Schedule"
                                : "Activate Schedule"
                            }
                          >
                            {schedule.status === "active" ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Schedule"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default ScheduleManager;
