// src/components/molecules/NewAffiliatesList/index.js
"use client";

import React, { useState, useEffect } from "react";
import Button from "../../atoms/Button";
import Card from "../../atoms/Card";
import { MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

const NewAffiliatesList = () => {
  const [newAffiliates, setNewAffiliates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendingTo, setSendingTo] = useState(null);

  useEffect(() => {
    fetchNewAffiliates();
  }, []);

  const fetchNewAffiliates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sheets/new-affiliates");

      if (!response.ok) {
        throw new Error("Failed to fetch new affiliates");
      }

      const data = await response.json();
      setNewAffiliates(data);
    } catch (err) {
      console.error("Error fetching new affiliates:", err);
      setError(err.message || "Failed to load new affiliates");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcome = async (affiliate) => {
    if (!confirm(`Send welcome message to ${affiliate.name}?`)) {
      return;
    }

    try {
      setSendingTo(affiliate.phone);

      // Format phone number if needed
      const formattedPhone = affiliate.phone.toString().replace(/\D/g, "");

      // Generate welcome message
      const welcomeMessage = generateWelcomeMessage(affiliate);

      // Send welcome message
      const sendResponse = await fetch("/api/sendText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: formattedPhone,
          text: welcomeMessage,
          session: "default", // Replace with your session name or get from state
        }),
      });

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json();
        throw new Error(errorData.error || "Failed to send welcome message");
      }

      // Update affiliate status
      const updateResponse = await fetch("/api/sheets/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: affiliate.phone,
          status: "contacted",
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update affiliate status");
      }

      // Refresh the list
      fetchNewAffiliates();

      alert("Welcome message sent successfully!");
    } catch (err) {
      console.error("Error sending welcome message:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSendingTo(null);
    }
  };

  // Generate welcome message based on affiliate data
  const generateWelcomeMessage = (affiliate) => {
    return `✨**Welcome to Youvit Affiliate Club**✨
Hai Kak ${affiliate.name} ! 👋
Selamat datang di Youvit Affiliate Club! 🥳 Seneng banget Kakak udah join bareng kita. Sekarang saatnya siap-siap cuan bareng Youvit! 🚀
Nah, biar makin siap promosikan produk Youvit, yuk request Free Sample Kakak sekarang!
Klik link ini buat isi formnya:
🎁 **Pengajuan Sample** 🎁
bit.ly/sampleyouvitindo 
*sample akan diproses maksimal 7 hari
Kalau ada pertanyaan, langsung aja tanyadi grup atau hubungi Vita +62 851-7988-0454 Let's go, waktunya gaspol jualan bareng Youvit! 💪💚
Salam cuan,
Tim Youvit Affiliate`;
  };

  // Helper to get the appropriate username based on platform
  const getPlatformUsername = (affiliate) => {
    if (affiliate.platform === "TikTok") {
      return affiliate.tiktokUsername;
    } else if (affiliate.platform === "Shopee") {
      return affiliate.shopeeUsername;
    } else if (affiliate.platform === "Instagram") {
      return affiliate.instagramUsername;
    }
    return "";
  };

  return (
    <Card>
      <Card.Header className="flex justify-between items-center">
        <Card.Title>New Affiliates (Waiting for Welcome Message)</Card.Title>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchNewAffiliates}
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </Card.Header>
      <Card.Content>
        {loading && !sendingTo ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading new affiliates...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading affiliates</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        ) : newAffiliates.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No new affiliates waiting for welcome messages.</p>
            <p className="mt-1 text-sm">All affiliates have been contacted!</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newAffiliates.map((affiliate) => (
                  <tr
                    key={affiliate.rowIndex || affiliate.phone}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">{affiliate.name}</td>
                    <td className="px-4 py-2">{affiliate.platform}</td>
                    <td className="px-4 py-2">
                      {getPlatformUsername(affiliate) || "N/A"}
                    </td>
                    <td className="px-4 py-2">{affiliate.phone}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSendWelcome(affiliate)}
                        disabled={sendingTo === affiliate.phone}
                        className="flex items-center"
                      >
                        {sendingTo === affiliate.phone ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Send Welcome
                          </>
                        )}
                      </Button>
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

export default NewAffiliatesList;
