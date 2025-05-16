// src/components/organisms/OnboardingAffiliatesList/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  RefreshCw,
  AlertCircle,
  UserPlus,
  X,
  MessageSquare,
} from "lucide-react";
import { useAffiliates } from "@/hooks/useAffiliates";

// Import formatPhoneNumber utility function directly
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.substring(1)}`;
  }
  if (!cleaned.includes("@c.us")) {
    cleaned = `${cleaned}@c.us`;
  }
  return cleaned;
};

const OnboardingAffiliatesList = () => {
  const {
    newAffiliates,
    isLoading,
    error,
    fetchNewAffiliates,
    updateAffiliateStatus,
    sendWelcomeMessage,
  } = useAffiliates();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [processingAffiliate, setProcessingAffiliate] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Initial load
  useEffect(() => {
    fetchNewAffiliates();
    fetchSessions();
  }, [fetchNewAffiliates]);

  // Fetch WhatsApp sessions
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);

        // Set default session if available
        if (data.sessions && data.sessions.length > 0) {
          setSessionName(data.sessions[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Filter affiliates when search term or affiliates change
  useEffect(() => {
    if (!newAffiliates) return;

    const filtered = newAffiliates.filter((affiliate) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (affiliate.name &&
          affiliate.name.toLowerCase().includes(searchLower)) ||
        (affiliate.phone && affiliate.phone.includes(searchTerm))
      );
    });

    setFilteredAffiliates(filtered);
  }, [searchTerm, newAffiliates]);

  const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;

  // Hardcoded welcome message template
const getWelcomeMessage = (name) => {
  return `✨Welcome to Youvit Affiliate Club✨ Hai Kak ${name}👋

Selamat datang di Youvit Affiliate Club! 🥳 Seneng banget kakak udah join bareng kita. Sekarang saatnya siap-siap cuan bareng Youvit! 🚀

Jangan lupa join grupnya ya https://bit.ly/YouvitAffiliatesClub 
Sampel akan diproses setelah kakak join grupnya☺️🥰

Salam cuan, 
Tim Youvit Affiliate`;
};

   // Handle accept affiliate - simplified version
  const handleAccept = async (affiliate) => {
    if (!sessionName) {
      alert("Please select a WhatsApp session first");
      return;
    }

    setProcessingAffiliate(affiliate);

    try {
      const formattedChatId = formatPhoneNumber(affiliate.phone);
      const processedMessage = getWelcomeMessage(affiliate.name || "");

      const requestBody = {
        chatId: formattedChatId,
        text: processedMessage,
        session: sessionName,
      };

      console.log(`Sending welcome message to ${formattedChatId}`);
      
      const response = await fetch(`${wahaApiUrl}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || responseData.message || "Failed to send message");
      }

      console.log(`✅ Message sent successfully`);

      await updateAffiliateStatus({
        rowIndex: affiliate.rowIndex,
        status: "contacted",
      });

      await fetchNewAffiliates();
      
    } catch (error) {
      console.error("Error accepting affiliate:", error);
      alert("Failed to process affiliate: " + (error.message || "Unknown error"));
    } finally {
      setProcessingAffiliate(null);
    }
  };

  // Handle reject affiliate action
  const handleReject = async (affiliate) => {
    if (!confirm(`Are you sure you want to reject ${affiliate.name}?`)) {
      return;
    }

    setProcessingAffiliate(affiliate);

    try {
      // Update affiliate status to "rejected"
      await updateAffiliateStatus({
        rowIndex: affiliate.rowIndex,
        status: "rejected",
      });

      // Refresh the list
      await fetchNewAffiliates();
    } catch (error) {
      console.error("Error rejecting affiliate:", error);
      alert(
        "Failed to reject affiliate: " + (error.message || "Unknown error")
      );
    } finally {
      setProcessingAffiliate(null);
    }
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">
              Onboarding Affiliates ({filteredAffiliates.length})
            </h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchNewAffiliates}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Session Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select WhatsApp Session <span className="text-red-500">*</span>
          </label>
          <select
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingSessions || processingAffiliate !== null}
          >
            <option value="">Select a session</option>
            {sessions.map((session) => (
              <option key={session.name} value={session.name}>
                {session.name} {session.status ? `(${session.status})` : ""}
              </option>
            ))}
          </select>
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
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">No new affiliates found</p>
            <p className="text-sm text-gray-400">
              {searchTerm
                ? "Try adjusting your search term"
                : "All affiliates have been processed"}
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(affiliate)}
                          disabled={
                            !sessionName || processingAffiliate === affiliate
                          }
                          className="flex items-center"
                        >
                          {processingAffiliate === affiliate ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Accept & Send
                            </>
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(affiliate)}
                          disabled={processingAffiliate === affiliate}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
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

export default OnboardingAffiliatesList;
