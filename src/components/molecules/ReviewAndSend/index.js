// Updated src/components/molecules/ReviewAndSend/index.js
import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import RepeatScheduler from "@/components/molecules/RepeatScheduler";

const Step4 = ({
  selectedTemplate,
  sessionName,
  getAllRecipients,
  getPreviewHTML,
  isScheduling,
  setIsScheduling,
  scheduleConfig,
  handleScheduleConfigChange,
  handleSend,
  handleSchedule,
  isSubmitting,
  handlePrevStep,
  selectedImage,
}) => {
  // Get recipients and preview HTML
  let recipients = [];
  try {
    recipients = getAllRecipients ? getAllRecipients() : [];
  } catch (err) {
    console.error("Error getting recipients:", err);
  }

  let previewHTML = "";
  try {
    previewHTML = getPreviewHTML ? getPreviewHTML() : "";
  } catch (err) {
    console.error("Error getting preview HTML:", err);
  }

  // Ensure we have a safe schedule config object
  const safeScheduleConfig = scheduleConfig || {
    type: "once",
    date: "",
    time: "09:00",
    cronExpression: "0 9 * * 1",
    startDate: "",
    endDate: "",
  };

  // Handle schedule type change
  const handleScheduleTypeChange = (e) => {
    handleScheduleConfigChange({
      target: {
        name: "type",
        value: e.target.value,
      },
    });
  };

  // Handle date or time change for one-time schedule
  const handleDateTimeChange = (e) => {
    handleScheduleConfigChange(e);
  };

  // Handle cron expression update from RepeatScheduler
  const handleCronExpressionChange = (cronExpression) => {
    handleScheduleConfigChange({
      target: {
        name: "cronExpression",
        value: cronExpression,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">
        Review & Kirim Pesan
      </h3>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="font-medium text-gray-700">Preview Pesan</h4>
        </div>
        <div className="p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Template</h5>
          <p>{selectedTemplate?.name || "No template selected"}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Session</h5>
          <p>{sessionName || "No session selected"}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recipients</h5>
          <p>{recipients.length} penerima</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Image</h5>
          <div className="flex items-center">
            {selectedImage ? (
              <div className="flex items-center text-green-600">
                <ImageIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Attached</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Text only</span>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {selectedImage && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            Image Preview
          </h5>
          <div className="flex items-start space-x-3">
            <img 
              src={selectedImage.url} 
              alt="Message attachment" 
              className="w-20 h-20 object-cover rounded border"
            />
            <div className="text-sm text-blue-700">
              <p><strong>Filename:</strong> {selectedImage.filename}</p>
              <p><strong>Size:</strong> {(selectedImage.size / 1024).toFixed(1)} KB</p>
              <p className="mt-1 text-blue-600">This image will be sent with the message text as caption.</p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling Options */}
      <div className="mt-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sendOption"
              checked={!isScheduling}
              onChange={() => setIsScheduling(false)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Kirim Sekarang</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sendOption"
              checked={isScheduling}
              onChange={() => setIsScheduling(true)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Jadwalkan Pengiriman</span>
          </label>
        </div>

        {/* Scheduling UI */}
        {isScheduling && (
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Jenis Jadwal
              </h4>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="once"
                    checked={safeScheduleConfig.type === "once"}
                    onChange={handleScheduleTypeChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Sekali</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="recurring"
                    checked={safeScheduleConfig.type === "recurring"}
                    onChange={handleScheduleTypeChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Berulang</span>
                </label>
              </div>
            </div>

            {/* One-time schedule UI */}
            {safeScheduleConfig.type === "once" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tanggal
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={safeScheduleConfig.date}
                    onChange={handleDateTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Waktu
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={safeScheduleConfig.time}
                    onChange={handleDateTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            )}

            {/* Recurring schedule UI */}
            {safeScheduleConfig.type === "recurring" && (
              <div className="space-y-4">
                {/* Integrate the RepeatScheduler component */}
                <RepeatScheduler
                  initialCron={safeScheduleConfig.cronExpression}
                  onChange={handleCronExpressionChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Mulai
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={safeScheduleConfig.startDate}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Selesai (Opsional)
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={safeScheduleConfig.endDate}
                      onChange={handleDateTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={
                        safeScheduleConfig.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevStep}
            disabled={isSubmitting}
          >
            Kembali
          </Button>

          <Button
            type="button"
            variant={isScheduling ? "primary" : "success"}
            onClick={isScheduling ? handleSchedule : handleSend}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isScheduling ? "Menjadwalkan..." : "Mengirim..."}
              </>
            ) : (
              <>
                {isScheduling ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Jadwalkan Pesan
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Sekarang
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step4;
