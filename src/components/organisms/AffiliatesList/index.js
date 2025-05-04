// src/components/organisms/AffiliatesList/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, AlertCircle, Users } from "lucide-react";
import { useAffiliates } from "@/hooks/useAffiliates";
import { formatPhoneNumber } from "@/lib/utils";

const AffiliatesList = ({ status = "active" }) => {
  const { activeAffiliates, isLoading, error, fetchActiveAffiliates } =
    useAffiliates();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);

  // Initial load
  useEffect(() => {
    fetchActiveAffiliates();
  }, [fetchActiveAffiliates]);

  // Filter affiliates when search term or affiliates change
  useEffect(() => {
    if (!activeAffiliates) return;

    const filtered = activeAffiliates.filter((affiliate) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (affiliate.name &&
          affiliate.name.toLowerCase().includes(searchLower)) ||
        (affiliate.phone && affiliate.phone.includes(searchTerm))
      );
    });

    setFilteredAffiliates(filtered);
  }, [searchTerm, activeAffiliates]);

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">
              Active Affiliates ({filteredAffiliates.length})
            </h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchActiveAffiliates}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search affiliates..."
            />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start mb-4">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Error loading affiliates</h3>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading affiliates...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredAffiliates.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-md">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">No affiliates found</p>
            <p className="text-sm text-gray-400">
              {searchTerm
                ? "Try adjusting your search term"
                : "No active affiliates available"}
            </p>
          </div>
        )}

        {/* Affiliates list */}
        {!isLoading && filteredAffiliates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Phone
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Platform
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate, index) => (
                  <tr
                    key={affiliate.phone || index}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {affiliate.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatPhoneNumber(affiliate.phone) || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {affiliate.platform || "N/A"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AffiliatesList;
