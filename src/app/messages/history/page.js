// app/messages/history/page.js
"use client";

import React, { useState, useEffect } from "react";
import {
  History as HistoryIcon,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import Card from "@/components/ui/card";
import PageLayout from "@/components/templates/PageLayout";
import Badge from "@/components/ui/badge";

export default function MessageHistoryPage() {
  const [messageHistory, setMessageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Fetch message history - for now we'll use dummy data
    // You'll need to create an API endpoint for this
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // Mock data for now
        const mockHistory = [
          {
            id: 1,
            templateName: "Monthly Update",
            recipients: 125,
            sentAt: "2025-04-23T10:30:00Z",
            status: "completed",
            successCount: 120,
            failureCount: 5,
          },
          {
            id: 2,
            templateName: "Welcome Message",
            recipients: 45,
            sentAt: "2025-04-22T15:45:00Z",
            status: "completed",
            successCount: 45,
            failureCount: 0,
          },
          {
            id: 3,
            templateName: "Product Launch",
            recipients: 200,
            sentAt: "2025-04-21T09:00:00Z",
            status: "failed",
            successCount: 0,
            failureCount: 200,
          },
        ];
        setMessageHistory(mockHistory);
      } catch (error) {
        console.error("Error fetching message history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter history based on search and status
  const filteredHistory = messageHistory.filter((item) => {
    const matchesSearch = item.templateName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <PageLayout
      title="Message History"
      description="View all sent messages and delivery reports"
    >
      {/* Search and Filter */}
      <Card className="mb-6">
        <Card.Content>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* History Table */}
      <Card>
        <Card.Content>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No message history found</p>
              <p className="text-sm text-gray-400">
                {searchTerm
                  ? "Try adjusting your search term"
                  : "Your sent messages will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success/Failed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.templateName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.recipients}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 mr-3">
                            {item.successCount}
                          </span>
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">
                            {item.failureCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Successful
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messageHistory.reduce(
                    (acc, item) => acc + item.successCount,
                    0
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Failed
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messageHistory.reduce(
                    (acc, item) => acc + item.failureCount,
                    0
                  )}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Messages Today
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    messageHistory.filter((item) => {
                      const sentDate = new Date(item.sentAt);
                      const today = new Date();
                      return sentDate.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </PageLayout>
  );
}
