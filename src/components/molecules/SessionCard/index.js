// components/molecules/SessionCard/index.js
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import config from "../../../lib/config/config";

const getStatusVariant = (status) => {
  const upperStatus = status?.toUpperCase();
  return config.ui.statusColors[upperStatus] || "default";
};

const SessionCard = ({
  session,
  onDelete,
  onRefresh,
  onConnect,
  isLoading = false,
}) => {
  const { name, status, me, engine } = session;

  // Determine the actual status to display from either session.status or engine.state
  const displayStatus = status || engine?.state || "UNKNOWN";
  const statusVariant = getStatusVariant(displayStatus);

  return (
    <Card className="h-full">
      <Card.Header className="flex items-center justify-between">
        <div>
          <Card.Title>{name}</Card.Title>
          <Badge variant={statusVariant} className="mt-1">
            {displayStatus}
          </Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRefresh(name)}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </Card.Header>

      <Card.Content>
        <div className="space-y-3">
          {me && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Account Info
              </h4>
              <p className="text-sm mt-1">{me.pushName || "Unknown"}</p>
              <p className="text-xs text-gray-500 mt-0.5">{me.id || "No ID"}</p>
            </div>
          )}

          {engine && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Engine</h4>
              <p className="text-sm mt-1">{engine.engine || "Unknown"}</p>
              {engine.WWebVersion && (
                <p className="text-xs text-gray-500 mt-0.5">
                  v{engine.WWebVersion}
                </p>
              )}
            </div>
          )}
        </div>
      </Card.Content>

      <Card.Footer className="flex justify-between">
        {displayStatus !== "CONNECTED" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConnect(name)}
            isLoading={isLoading}
          >
            Connect
          </Button>
        )}

        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(name)}
          isLoading={isLoading}
        >
          Delete
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default SessionCard;
