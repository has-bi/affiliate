"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, AlertCircle, Check, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Contact Selector component for selecting contacts from affiliates
 */
export default function ContactSelector({ onSelectContacts }) {
  // State
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Load contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [pagination.page, searchTerm]);

  // Fetch contacts from affiliates API
  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the affiliates API with status=active query parameter
      const response = await fetch("/api/affiliates?status=active");

      if (!response.ok) {
        throw new Error("Failed to fetch affiliates");
      }

      const data = await response.json();

      // Handle different response formats from the affiliates API
      let affiliateArray = [];
      if (Array.isArray(data)) {
        affiliateArray = data;
      } else if (typeof data === "object") {
        // Handle object format (map of phone -> affiliate)
        affiliateArray = Object.values(data);
      }

      // Ensure each contact has a unique identifier
      const processedAffiliates = affiliateArray.map((affiliate, index) => ({
        ...affiliate,
        // Generate a unique ID to use as a React key
        _uniqueId: `contact-${index}-${Date.now()}`,
      }));

      // Filter out entries with duplicate phone numbers, keeping only the first occurrence
      const uniquePhoneNumbers = new Set();
      const uniqueAffiliates = processedAffiliates.filter((affiliate) => {
        if (!affiliate.phone) return false;

        // Normalize phone number for comparison
        const normalizedPhone = String(affiliate.phone).replace(/\D/g, "");

        if (uniquePhoneNumbers.has(normalizedPhone)) {
          return false; // Skip this duplicate
        }

        uniquePhoneNumbers.add(normalizedPhone);
        return true; // Keep this entry (first occurrence)
      });

      // Filter by search term if provided
      const filteredAffiliates = searchTerm
        ? uniqueAffiliates.filter(
            (affiliate) =>
              affiliate.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              affiliate.phone?.includes(searchTerm)
          )
        : uniqueAffiliates;

      setContacts(filteredAffiliates);

      // Update pagination info
      setPagination((prev) => ({
        ...prev,
        total: filteredAffiliates.length,
        totalPages: Math.ceil(filteredAffiliates.length / prev.limit),
      }));
    } catch (err) {
      console.error("Error fetching affiliates:", err);
      setError(err.message || "Failed to load affiliates");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle contact selection
  const toggleContactSelection = (contact) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.some((c) => c._uniqueId === contact._uniqueId);

      if (isSelected) {
        return prev.filter((c) => c._uniqueId !== contact._uniqueId);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts([...contacts]);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Reset pagination to first page
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({
        ...prev,
        page: prev.page - 1,
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  };

  // Confirm selection
  const handleConfirmSelection = () => {
    onSelectContacts(selectedContacts);
  };

  // Paginate contacts
  const paginatedContacts = contacts.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Pilih Kontak Penerima</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmSelection}
          disabled={selectedContacts.length === 0}
        >
          Pilih {selectedContacts.length} Kontak
        </Button>
      </div>

      {/* Search and refresh */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Cari berdasarkan nama atau nomor..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Button
          variant="secondary"
          onClick={fetchContacts}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Error loading affiliates</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Selection stats */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="select-all"
            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={
              selectedContacts.length === contacts.length && contacts.length > 0
            }
            onChange={handleSelectAll}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium text-gray-700"
          >
            Pilih Semua
          </label>
        </div>
        <div className="text-sm text-gray-500">
          {selectedContacts.length} dipilih dari {pagination.total} kontak
        </div>
      </div>

      {/* Contact list */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : paginatedContacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-1">Tidak ada kontak ditemukan</p>
          <p className="text-sm text-gray-400">
            {searchTerm
              ? "Coba kata kunci pencarian lain"
              : "Semua kontak sudah ditampilkan"}
          </p>
        </div>
      ) : (
        <div className="overflow-auto max-h-96 border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
                >
                  <span className="sr-only">Select</span>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nomor WhatsApp
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
              {paginatedContacts.map((contact) => {
                const isSelected = selectedContacts.some(
                  (c) => c._uniqueId === contact._uniqueId
                );
                return (
                  <tr
                    key={contact._uniqueId}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isSelected ? "bg-indigo-50" : ""
                    }`}
                    onClick={() => toggleContactSelection(contact)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={isSelected}
                        onChange={() => {}} // Handled by row click
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox directly
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {contact.platform || "-"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-3">
          <div className="text-sm text-gray-500">
            Halaman {pagination.page} dari {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevPage}
              disabled={pagination.page <= 1 || isLoading}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.totalPages || isLoading}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Selected contacts preview */}
      {selectedContacts.length > 0 && (
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Kontak Terpilih ({selectedContacts.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.slice(0, 10).map((contact, index) => (
              <div
                key={`selected-${contact._uniqueId || index}`}
                className="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm"
              >
                <span className="truncate max-w-[150px]">{contact.name}</span>
                <button
                  className="ml-1 text-indigo-500 hover:text-indigo-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleContactSelection(contact);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {selectedContacts.length > 10 && (
              <div className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">
                +{selectedContacts.length - 10} lainnya
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end pt-3">
        <Button
          variant="primary"
          onClick={handleConfirmSelection}
          disabled={selectedContacts.length === 0}
        >
          <Check className="h-4 w-4 mr-2" />
          Konfirmasi Pilihan
        </Button>
      </div>
    </div>
  );
}
