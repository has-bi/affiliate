// src/components/molecules/ReviewAndSend/Step4.js
import React from "react";
import Button from "@/components/atoms/Button";
import { Send, Calendar } from "lucide-react";

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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">
        Review & Kirim Pesan
      </h3>

      {/* Preview Box */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="font-medium text-gray-700">Preview Pesan</h4>
        </div>
        <div className="p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Template</h5>
          <p>{selectedTemplate?.name}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Session</h5>
          <p>{sessionName}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recipients</h5>
          <p>{getAllRecipients().length} penerima</p>
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
                    checked={scheduleConfig.type === "once"}
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
                    checked={scheduleConfig.type === "recurring"}
                    onChange={handleScheduleConfigChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Berulang</span>
                </label>
              </div>
            </div>

            {scheduleConfig.type === "once" ? (
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
                    value={scheduleConfig.date}
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
                    value={scheduleConfig.time}
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
                    value={scheduleConfig.cronExpression}
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
                      value={scheduleConfig.startDate}
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
                      value={scheduleConfig.endDate}
                      onChange={handleScheduleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={
                        scheduleConfig.startDate ||
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

          {isScheduling ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleSchedule}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <Calendar className="h-4 w-4 mr-1" />}
            >
              {isSubmitting ? "Menjadwalkan..." : "Jadwalkan Pesan"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              onClick={handleSend}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <Send className="h-4 w-4 mr-1" />}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Sekarang"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step4;
