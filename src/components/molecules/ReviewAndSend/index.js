import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Loader2 } from "lucide-react";

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
}) => {
  let recipients = [];
  let recipientsError = null;
  let previewHTML = "";
  let previewError = null;

  try {
    if (typeof getAllRecipients === "function") {
      recipients = getAllRecipients();
    } else {
      recipientsError = "getAllRecipients is not a function";
    }
  } catch (error) {
    recipientsError = error.message;
  }

  try {
    if (typeof getPreviewHTML === "function") {
      previewHTML = getPreviewHTML();
    } else {
      previewError = "getPreviewHTML is not a function";
    }
  } catch (error) {
    previewError = error.message;
  }

  const safeScheduleConfig = scheduleConfig || {
    type: "once",
    date: "",
    time: "09:00",
    cronExpression: "0 9 * * 1",
    startDate: "",
    endDate: "",
  };

  if (recipientsError || previewError) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-red-700">Error Details</h3>
        {recipientsError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <h4 className="font-medium">Recipients Error:</h4>
            <p>{recipientsError}</p>
          </div>
        )}
        {previewError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <h4 className="font-medium">Preview Error:</h4>
            <p>{previewError}</p>
          </div>
        )}
        <div className="p-4 bg-gray-100 rounded-md">
          <h4 className="font-medium mb-2">Debug Information:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(
              {
                selectedTemplate: selectedTemplate ? "exists" : "null",
                sessionName,
                getAllRecipients: typeof getAllRecipients,
                getPreviewHTML: typeof getPreviewHTML,
                scheduleConfig: safeScheduleConfig,
              },
              null,
              2
            )}
          </pre>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrevStep}
          disabled={isSubmitting}
        >
          Kembali
        </Button>
      </div>
    );
  }

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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

        {isScheduling && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            {/* Schedule Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Jadwal
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="once"
                    checked={safeScheduleConfig.type === "once"}
                    onChange={handleScheduleConfigChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Satu Kali</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="recurring"
                    checked={safeScheduleConfig.type === "recurring"}
                    onChange={handleScheduleConfigChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Berulang</span>
                </label>
              </div>
            </div>

            {/* Schedule Form */}
            {safeScheduleConfig.type === "once" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tanggal
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={safeScheduleConfig.date || ""}
                    onChange={handleScheduleConfigChange}
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
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={safeScheduleConfig.time || "09:00"}
                    onChange={handleScheduleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="cronExpression"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    id="cronExpression"
                    name="cronExpression"
                    value={safeScheduleConfig.cronExpression || "0 9 * * 1"}
                    onChange={handleScheduleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0 9 * * 1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: menit jam hari-bulan bulan hari-minggu (0 9 * * 1 =
                    Setiap Senin jam 9 pagi)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={safeScheduleConfig.startDate || ""}
                      onChange={handleScheduleConfigChange}
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
                      value={safeScheduleConfig.endDate || ""}
                      onChange={handleScheduleConfigChange}
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
            onClick={(e) => (isScheduling ? handleSchedule(e) : handleSend(e))}
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
