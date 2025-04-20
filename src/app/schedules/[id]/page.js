"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/organisms/Header";
import Card from "../../../components/atoms/Card";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Edit,
  Trash,
  RefreshCw,
} from "lucide-react";

export default function ScheduleDetailsPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchScheduleDetails();
  }, []);

  const fetchScheduleDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch schedule details");
      }

      const data = await response.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error fetching schedule details:", err);
      setError(err.message || "Failed to load schedule details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
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

      router.push("/schedules");
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule: " + err.message);
    }
  };

  const handleToggleStatus = async () => {
    if (!schedule) return;

    const newStatus = schedule.status === "active" ? "paused" : "active";

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
      setSchedule(updatedSchedule);
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9">
                Schedule Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage scheduled message
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                variant="secondary"
                onClick={() => router.push("/schedules")}
                className="mr-2"
              >
                Back to List
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading schedule details...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Error loading schedule</h3>
                  <p className="mt-1">{error}</p>
                  <button
                    className="mt-2 text-red-700 hover:text-red-800 font-medium"
                    onClick={fetchScheduleDetails}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : !schedule ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">Schedule not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Card */}
              <Card>
                <Card.Content className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {schedule.name}
                      </h2>
                      <div className="flex items-center mt-1">
                        <Badge variant={getStatusVariant(schedule.status)}>
                          {schedule.status}
                        </Badge>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-500">
                          Template: {schedule.templateId}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant={
                          schedule.status === "active" ? "warning" : "success"
                        }
                        onClick={handleToggleStatus}
                        disabled={["completed", "failed"].includes(
                          schedule.status
                        )}
                      >
                        {schedule.status === "active" ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => router.push(`/schedules/${id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="danger" onClick={handleDeleteSchedule}>
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="block text-xs text-gray-500 uppercase">
                        Schedule Type
                      </span>
                      <span className="block font-medium mt-1">
                        {schedule.scheduleType === "once"
                          ? "One Time"
                          : "Recurring"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="block text-xs text-gray-500 uppercase">
                        Next Run
                      </span>
                      <span className="block font-medium mt-1">
                        {formatDate(schedule.nextRun)}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="block text-xs text-gray-500 uppercase">
                        Last Run
                      </span>
                      <span className="block font-medium mt-1">
                        {formatDate(schedule.lastRun) || "Never"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="block text-xs text-gray-500 uppercase">
                        WhatsApp Session
                      </span>
                      <span className="block font-medium mt-1">
                        {schedule.sessionName}
                      </span>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === "details"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("details")}
                    >
                      Details
                    </button>
                    <button
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === "history"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("history")}
                    >
                      History
                    </button>
                    <button
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === "recipients"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("recipients")}
                    >
                      Recipients
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "details" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">
                          Schedule Configuration
                        </h3>
                        <div className="mt-3 bg-gray-50 p-4 rounded-md">
                          {schedule.scheduleType === "once" ? (
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                              <span>
                                One-time on{" "}
                                {formatDate(schedule.scheduleConfig.date)}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center">
                                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                                <span>
                                  Recurring:{" "}
                                  {schedule.scheduleConfig.cronExpression}
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                Start Date:{" "}
                                {formatDate(schedule.scheduleConfig.startDate)}
                                {schedule.scheduleConfig.endDate && (
                                  <span>
                                    {" "}
                                    • End Date:{" "}
                                    {formatDate(
                                      schedule.scheduleConfig.endDate
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">
                          Template Parameters
                        </h3>
                        <div className="mt-3 bg-gray-50 p-4 rounded-md">
                          {schedule.paramValues &&
                          Object.keys(schedule.paramValues).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(schedule.paramValues).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <span className="block text-sm font-medium">
                                      {key}
                                    </span>
                                    <span className="block text-gray-500 mt-1">
                                      {value}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">No parameters</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div>
                      <h3 className="text-lg font-medium">Execution History</h3>

                      {!schedule.history || schedule.history.length === 0 ? (
                        <div className="mt-3 bg-gray-50 p-4 rounded-md text-center">
                          <p className="text-gray-500">
                            No execution history available yet
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 border border-gray-200 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Failed
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {[...schedule.history]
                                .reverse()
                                .map((entry, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(entry.runAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {entry.failed === 0 ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          Success
                                        </span>
                                      ) : entry.success === 0 ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                          Failed
                                        </span>
                                      ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                          Partial
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {entry.success}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {entry.failed}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "recipients" && (
                    <div>
                      <h3 className="text-lg font-medium">
                        Message Recipients
                      </h3>

                      {!schedule.recipients ||
                      schedule.recipients.length === 0 ? (
                        <div className="mt-3 bg-gray-50 p-4 rounded-md text-center">
                          <p className="text-gray-500">
                            No recipients specified
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 border border-gray-200 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Phone Number
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {schedule.recipients.map((recipient, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {recipient}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
