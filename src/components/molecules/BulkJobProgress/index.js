// src/components/molecules/BulkJobProgress/index.js
"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause,
  Users,
  MessageSquare
} from "lucide-react";

export default function BulkJobProgress({ 
  activeJob, 
  onCancel, 
  onClose,
  onRefresh 
}) {
  if (!activeJob) {
    return null;
  }

  const progress = activeJob.progress || {};
  const progressPercentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Pause className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'Not started';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000); // seconds
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  const getEstimatedRemaining = () => {
    if (activeJob.status !== 'running' || !progress.processed || progress.processed === 0) {
      return null;
    }
    
    const remaining = progress.total - progress.processed;
    if (remaining <= 0) return null;
    
    // Estimate based on 8 second delay + processing time
    const avgTimePerMessage = 8.5; // seconds
    const remainingMinutes = Math.ceil((remaining * avgTimePerMessage) / 60);
    
    return remainingMinutes;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Bulk Message Job
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`flex items-center gap-1 ${getStatusColor(activeJob.status)}`}>
              {getStatusIcon(activeJob.status)}
              {activeJob.status?.toUpperCase()}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          <div className="text-xs text-gray-500 text-center">
            {progress.processed || 0} of {progress.total || 0} messages processed
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold">{progress.successful || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="font-semibold">{progress.failed || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>

        {/* Batch Progress */}
        {progress.totalBatches > 1 && (
          <div className="text-center text-sm text-gray-600">
            Batch {progress.currentBatch || 0} of {progress.totalBatches}
          </div>
        )}

        {/* Timing Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{new Date(activeJob.createdAt).toLocaleTimeString()}</span>
          </div>
          
          {activeJob.startedAt && (
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{formatDuration(activeJob.startedAt, activeJob.completedAt)}</span>
            </div>
          )}
          
          {getEstimatedRemaining() && (
            <div className="flex justify-between">
              <span>Est. remaining:</span>
              <span>~{getEstimatedRemaining()} min</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {activeJob.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <div className="text-sm text-red-600 mt-1">
              {activeJob.error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {activeJob.status === 'pending' && onCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel(activeJob.id)}
              className="flex-1"
            >
              Cancel Job
            </Button>
          )}
          
          {onRefresh && (activeJob.status === 'running' || activeJob.status === 'pending') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="flex-1"
            >
              Refresh
            </Button>
          )}
          
          {(activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') && (
            <div className="text-center text-sm text-gray-500 flex-1">
              Job {activeJob.status} at {new Date(activeJob.completedAt || activeJob.createdAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Success/Failure Details - Show only when completed */}
        {(activeJob.status === 'completed' || activeJob.status === 'failed') && activeJob.results && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">Results Summary:</div>
            <div className="text-xs text-gray-600">
              <div>✅ Successful: {activeJob.results.success?.length || 0}</div>
              <div>❌ Failed: {activeJob.results.failures?.length || 0}</div>
            </div>
            
            {activeJob.results.failures && activeJob.results.failures.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                  Show failed numbers ({activeJob.results.failures.length})
                </summary>
                <div className="mt-2 space-y-1 pl-4">
                  {activeJob.results.failures.slice(0, 10).map((failure, index) => (
                    <div key={index} className="text-red-600">
                      {failure.recipient}: {failure.error}
                    </div>
                  ))}
                  {activeJob.results.failures.length > 10 && (
                    <div className="text-gray-500">
                      ... and {activeJob.results.failures.length - 10} more
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}