// src/components/molecules/RecipientSelector/index.js
"use client";

import React, { useState, useEffect } from "react";
import Button from "../../atoms/Button";

const RecipientSelector = ({ onSelectRecipients }) => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch affiliates on component mount
  useEffect(() => {
    const fetchAffiliates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sheets/affiliates");

        if (!response.ok) {
          throw new Error("Failed to fetch affiliates");
        }

        const data = await response.json();
        setAffiliates(data);
      } catch (err) {
        console.error("Error fetching affiliates:", err);
        setError(err.message || "Failed to load affiliates");
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliates();
  }, []);

  // Filter affiliates based on search term
  const filteredAffiliates = affiliates.filter(
    (aff) =>
      aff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.phone.includes(searchTerm)
  );

  // Toggle selection of an affiliate
  const toggleSelect = (affiliate) => {
    setSelectedAffiliates((prev) => {
      const isSelected = prev.some((a) => a.phone === affiliate.phone);

      if (isSelected) {
        return prev.filter((a) => a.phone !== affiliate.phone);
      } else {
        return [...prev, affiliate];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAffiliates.length === filteredAffiliates.length) {
      setSelectedAffiliates([]);
    } else {
      setSelectedAffiliates(filteredAffiliates);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelectRecipients(selectedAffiliates.map((a) => a.phone));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Select Recipients from Spreadsheet
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={selectedAffiliates.length === 0}
        >
          Select {selectedAffiliates.length} Recipients
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Search by name or phone number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-4">Loading affiliates...</div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">{error}</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2 px-4 py-2 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="select-all"
                className="mr-2"
                checked={
                  selectedAffiliates.length === filteredAffiliates.length &&
                  filteredAffiliates.length > 0
                }
                onChange={handleSelectAll}
              />
              <label htmlFor="select-all">
                Select All ({filteredAffiliates.length})
              </label>
            </div>
            <div className="text-sm text-gray-500">
              {selectedAffiliates.length} selected
            </div>
          </div>

          <div className="border border-gray-200 rounded-md max-h-80 overflow-y-auto">
            {filteredAffiliates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No affiliates found
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 w-12"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAffiliates.map((affiliate) => {
                    const isSelected = selectedAffiliates.some(
                      (a) => a.phone === affiliate.phone
                    );

                    return (
                      <tr
                        key={affiliate.phone}
                        className={`hover:bg-gray-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                        onClick={() => toggleSelect(affiliate)}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2">{affiliate.name}</td>
                        <td className="px-4 py-2">{affiliate.phone}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              affiliate.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {affiliate.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RecipientSelector;
