// src/components/molecules/BroadcastProgress/index.js
"use client";

import React from "react";
import Card from "../../../components/atoms/Card";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";

const BroadcastProgress = ({
  isBroadcasting,
  progress,
  results,
  error,
  onCancel,
  onRetry,
  onReset,
}) => {
  // Count successful and failed messages
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  // Calculate progress percentage
  const progressPercentage =
    progress.total > 0
      ? Math.floor((progress.current / progress.total) * 100)
      : 0;

  return (
    <Card className="h-full">
      <Card.Header className="flex justify-between items-center">
        <Card.Title>Broadcast Status</Card.Title>

        <div className="flex items-center space-x-2">
          {isBroadcasting && <Badge variant="warning">In Progress</Badge>}

          {!isBroadcasting && progress.current > 0 && (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
      </Card.Header>

      <Card.Content>
        {progress.total === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No broadcast in progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Progress: {progress.current} of {progress.total} (
                  {progressPercentage}%)
                </span>

                {isBroadcasting && (
                  <Button variant="warning" size="sm" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-lg font-semibold">{progress.total}</p>
              </div>

              <div className="bg-green-50 p-2 rounded-md">
                <p className="text-sm text-green-600">Successful</p>
                <p className="text-lg font-semibold text-green-700">
                  {successCount}
                </p>
              </div>

              <div className="bg-red-50 p-2 rounded-md">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-lg font-semibold text-red-700">
                  {failedCount}
                </p>
              </div>
            </div>

            {/* Error message if any */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Results</h4>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 text-sm ${
                        result.success ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{result.recipient}</span>

                        {result.success ? (
                          <Badge variant="success" size="sm">
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Failed
                          </Badge>
                        )}
                      </div>

                      {!result.success && result.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isBroadcasting && progress.current > 0 && (
              <div className="flex justify-between mt-4">
                {failedCount > 0 && (
                  <Button variant="warning" onClick={onRetry}>
                    Retry Failed ({failedCount})
                  </Button>
                )}

                <Button variant="secondary" onClick={onReset}>
                  Reset
                </Button>
              </div>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default BroadcastProgress;
