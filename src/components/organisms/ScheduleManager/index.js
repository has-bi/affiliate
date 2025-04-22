"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Edit,
  Trash,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { useSchedule } from "@/hooks/useSchedule";

/**
 * Component for managing scheduled messages
 */
const ScheduleManager = () => {
  const router = useRouter();
  const { schedules, isLoading, error, deleteSchedule, toggleScheduleStatus } =
    useSchedule();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  // View schedule details
  const handleViewSchedule = (id) => {
    router.push(`/schedules/${id}`);
  };

  // Edit a schedule
  const handleEditSchedule = (id) => {
    router.push(`/schedules/${id}/edit`);
  };

  // Create new schedule
  const handleCreateSchedule = () => {
    router.push("/schedules/new");
  };

  return (
    <Card>
      <Card.Header className="flex justify-between items-center">
        <Card.Title>Scheduled Messages</Card.Title>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateSchedule}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
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
            <Button variant="primary" size="sm" onClick={handleCreateSchedule}>
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
                          onClick={() => handleViewSchedule(schedule.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleEditSchedule(schedule.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Schedule"
                        >
                          <Edit className="h-5 w-5" />
                        </button>

                        {["active", "paused", "pending"].includes(
                          schedule.status
                        ) && (
                          <button
                            onClick={() => toggleScheduleStatus(schedule.id)}
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
                          onClick={() => deleteSchedule(schedule.id)}
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
