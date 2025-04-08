// src/components/api-tester.js
import React, { useState } from "react";
import { Loader, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import createWahaClient from "@/lib/wahaClient";

// Initialize WAHA API client
const wahaClient = createWahaClient();

const ApiTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);

  // List of endpoints to test
  const endpoints = [
    {
      name: "Test Connection",
      method: "test",
      fn: () => wahaClient.util.testConnection(),
    },
    {
      name: "Get All Sessions",
      method: "GET",
      fn: () => wahaClient.session.getAll(),
    },
    {
      name: "Get Session Status",
      method: "GET",
      fn: () => wahaClient.session.getStatus(),
    },
    {
      name: "Send Text Message (Test)",
      method: "POST",
      fn: () =>
        wahaClient.message.sendText(
          "6281234567890",
          "This is a test message from API tester"
        ),
    },
  ];

  // Run a single endpoint test
  const testEndpoint = async (endpoint, index) => {
    setIsLoading(true);
    setExpandedEndpoint(index);

    try {
      const startTime = performance.now();
      const result = await endpoint.fn();
      const endTime = performance.now();

      // Update results
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          success: true,
          data: result,
          time: Math.round(endTime - startTime),
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (error) {
      // Update results with error
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Run all endpoint tests
  const testAllEndpoints = async () => {
    setIsLoading(true);
    setTestResults({});

    for (let i = 0; i < endpoints.length; i++) {
      try {
        const startTime = performance.now();
        const result = await endpoints[i].fn();
        const endTime = performance.now();

        // Update results
        setTestResults((prev) => ({
          ...prev,
          [i]: {
            success: true,
            data: result,
            time: Math.round(endTime - startTime),
            timestamp: new Date().toISOString(),
          },
        }));
      } catch (error) {
        // Update results with error
        setTestResults((prev) => ({
          ...prev,
          [i]: {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          WAHA API Tester
        </h2>

        <button
          onClick={testAllEndpoints}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Test All Endpoints</span>
        </button>
      </div>

      <div className="space-y-3">
        {endpoints.map((endpoint, index) => (
          <div
            key={index}
            className={`border rounded-md overflow-hidden ${
              testResults && testResults[index]
                ? testResults[index].success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-md">
                  {endpoint.method}
                </span>
                <span className="font-medium">{endpoint.name}</span>

                {testResults && testResults[index] && (
                  <div className="flex items-center">
                    {testResults[index].success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}

                    {testResults[index].time && (
                      <span className="ml-2 text-xs text-gray-500">
                        {testResults[index].time}ms
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {testResults && testResults[index] && (
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() =>
                      setExpandedEndpoint(
                        expandedEndpoint === index ? null : index
                      )
                    }
                  >
                    {expandedEndpoint === index
                      ? "Hide Details"
                      : "Show Details"}
                  </button>
                )}

                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                  onClick={() => testEndpoint(endpoint, index)}
                  disabled={isLoading}
                >
                  {isLoading && expandedEndpoint === index ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </button>
              </div>
            </div>

            {expandedEndpoint === index &&
              testResults &&
              testResults[index] && (
                <div className="border-t border-gray-200 p-4">
                  <div className="mb-2 text-sm text-gray-500">
                    {testResults[index].timestamp}
                  </div>

                  <div className="bg-white p-3 rounded-md border border-gray-200 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {testResults[index].success
                        ? JSON.stringify(testResults[index].data, null, 2)
                        : testResults[index].error}
                    </pre>
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTester;
