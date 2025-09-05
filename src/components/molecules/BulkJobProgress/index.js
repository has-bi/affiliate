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
    <Card className="card-modern w-full animate-scaleIn">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            Bulk Message Job
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium ${getStatusColor(activeJob.status)}`}>
              {getStatusIcon(activeJob.status)}
              {activeJob.status?.toUpperCase()}
            </Badge>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-red-50 hover:text-red-600 w-8 h-8 p-0 rounded-full"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-700">Progress</span>
            <span className="text-primary-600">{progressPercentage}%</span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="w-full h-3 bg-gray-200 rounded-full overflow-hidden" />
          </div>
          <div className="text-sm text-gray-600 text-center font-medium">
            {progress.processed || 0} of {progress.total || 0} messages processed
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xl font-bold">{progress.successful || 0}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Successful</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200/50">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
              <XCircle className="w-5 h-5" />
              <span className="text-xl font-bold">{progress.failed || 0}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Failed</div>
          </div>
        </div>

        {/* Batch Progress */}
        {progress.totalBatches > 1 && (
          <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200/50">
            <div className="text-sm font-medium text-indigo-700">
              Batch {progress.currentBatch || 0} of {progress.totalBatches}
            </div>
          </div>
        )}

        {/* Timing Information */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">Created:</span>
            <span className="text-gray-800">{new Date(activeJob.createdAt).toLocaleTimeString()}</span>
          </div>
          
          {activeJob.startedAt && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Duration:</span>
              <span className="text-gray-800 font-mono">{formatDuration(activeJob.startedAt, activeJob.completedAt)}</span>
            </div>
          )}
          
          {getEstimatedRemaining() && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Est. remaining:</span>
              <span className="text-amber-600 font-medium">~{getEstimatedRemaining()} min</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {activeJob.error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3 text-red-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error Occurred</span>
            </div>
            <div className="text-sm text-red-700 leading-relaxed">
              {activeJob.error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {activeJob.status === 'pending' && onCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel(activeJob.id)}
              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
            >
              Cancel Job
            </Button>
          )}
          
          {onRefresh && (activeJob.status === 'running' || activeJob.status === 'pending') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="flex-1 btn-secondary"
            >
              Refresh
            </Button>
          )}
          
          {(activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') && (
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200 flex-1">
              <div className="text-sm font-medium text-gray-700">
                Job {activeJob.status}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(activeJob.completedAt || activeJob.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Success/Failure Details - Show only when completed */}
        {(activeJob.status === 'completed' || activeJob.status === 'failed') && activeJob.results && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-lg font-semibold text-gray-900">Results Summary</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Successful: {activeJob.results.success?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Failed: {activeJob.results.failures?.length || 0}</span>
              </div>
            </div>
            
            {activeJob.results.failures && activeJob.results.failures.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium p-2 bg-red-50 rounded-lg border border-red-200">
                  Show failed numbers ({activeJob.results.failures.length})
                </summary>
                <div className="mt-3 space-y-2 bg-white rounded-lg p-3 border border-red-200 max-h-48 overflow-y-auto">
                  {activeJob.results.failures.slice(0, 10).map((failure, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded text-red-700 text-sm">
                      <div className="font-mono text-xs">{failure.recipient}</div>
                      <div className="text-xs text-red-600 mt-1">{failure.error}</div>
                    </div>
                  ))}
                  {activeJob.results.failures.length > 10 && (
                    <div className="text-gray-500 text-center py-2 italic">
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