// src/components/molecules/RecipientSelector/Step3.js
import React from "react";
import { Button } from "@/components/ui/button";
import ContactSelector from "@/components/molecules/ContactSelector";
import { Users, PlusCircle, X } from "lucide-react";

const Step3 = ({
  showContactSelector,
  setShowContactSelector,
  selectedContacts,
  setSelectedContacts,
  handleContactsSelected,
  manualRecipients,
  setManualRecipients,
  parseManualRecipients,
  isSubmitting,
  handlePrevStep,
  handleNextStep,
  getAllRecipients,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700">Pilih Penerima</h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowContactSelector(true)}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Pilih dari Daftar Kontak
        </Button>

        <span className="text-center text-gray-500 hidden sm:inline">atau</span>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowContactSelector(false)}
          className="flex-1"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Tambahkan Nomor Manual
        </Button>
      </div>

      {/* Display Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Kontak Terpilih ({selectedContacts.length})
          </h4>
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id || contact.phone}
                  className="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm"
                >
                  <span className="truncate max-w-[150px]">{contact.name}</span>
                  <button
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    onClick={() => {
                      setSelectedContacts((prev) =>
                        prev.filter((c) => c.phone !== contact.phone)
                      );
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Recipients Input */}
      {!showContactSelector && (
        <div className="mt-4">
          <label
            htmlFor="manualRecipients"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nomor Penerima Manual (satu per baris atau pisahkan dengan koma)
          </label>
          <textarea
            id="manualRecipients"
            value={manualRecipients}
            onChange={(e) => setManualRecipients(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Contoh:
08123456789
08987654321
atau: 08123456789, 08987654321"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Jumlah nomor manual: {parseManualRecipients().length}
          </p>
        </div>
      )}

      {/* Contact Selector Dialog */}
      {showContactSelector && (
        <div className="mt-4 border border-gray-200 rounded-md p-4 bg-white">
          <ContactSelector onSelectContacts={handleContactsSelected} />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={getAllRecipients().length === 0}
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};

export default Step3;
