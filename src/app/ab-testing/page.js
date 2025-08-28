"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageLayout from "@/components/templates/PageLayout";
import Link from "next/link";
import { 
  Plus, 
  Play, 
  Pause, 
  BarChart3, 
  Users, 
  MessageSquare,
  Calendar,
  TrendingUp,
  Filter
} from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800", 
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function ABTestingPage() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchExperiments();
  }, [filter, pagination.page]);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter !== "all" && { status: filter })
      });

      const response = await fetch(`/api/ab-testing/experiments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }
    } catch (error) {
      console.error("Error fetching experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (experimentId, action) => {
    try {
      const response = await fetch(`/api/ab-testing/experiments/${experimentId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchExperiments(); // Refresh list
      }
    } catch (error) {
      console.error(`Error ${action} experiment:`, error);
    }
  };

  const filteredExperiments = experiments;

  return (
    <PageLayout 
      title="A/B Testing" 
      description="Create and manage A/B testing experiments for your messages"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Experiments</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <Button variant="primary" asChild>
          <Link href="/ab-testing/new">
            <Plus className="h-4 w-4 mr-2" />
            Create A/B Test
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tests</p>
                <p className="text-xl font-semibold">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-semibold">
                  {experiments.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Pause className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paused</p>
                <p className="text-xl font-semibold">
                  {experiments.filter(e => e.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-xl font-semibold">
                  {experiments.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExperiments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No A/B Tests Found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first A/B testing experiment.</p>
              <Button variant="primary" asChild>
                <Link href="/ab-testing/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create A/B Test
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredExperiments.map((experiment) => (
            <Card key={experiment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link href={`/ab-testing/${experiment.id}`}>
                        <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 cursor-pointer">
                          {experiment.name}
                        </h3>
                      </Link>
                      <Badge className={statusColors[experiment.status]}>
                        {experiment.status}
                      </Badge>
                    </div>
                    
                    {experiment.description && (
                      <p className="text-gray-600 mb-3">{experiment.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {experiment.stats?.totalRecipients || 0} recipients
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {experiment.variants?.length || 0} variants
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(experiment.createdAt).toLocaleDateString()}
                      </div>
                      {experiment.stats && (
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {experiment.stats.sent} sent, {experiment.stats.failed} failed
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {experiment.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeAction(experiment.id, 'start')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {experiment.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeAction(experiment.id, 'send_batch')}
                          title={`Send next batch of ${experiment.batchSize || 50} messages`}
                        >
                          Send Batch
                          <InfoTooltip
                            title="Send Batch"
                            description={`Sends the next batch of ${experiment.batchSize || 50} messages for this experiment. After sending, there will be a ${experiment.cooldownMinutes || 5} minute cooldown period.`}
                            position="top"
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeAction(experiment.id, 'pause')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      </>
                    )}
                    
                    {experiment.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeAction(experiment.id, 'resume')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    
                    <Link href={`/ab-testing/${experiment.id}`}>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Variants Preview */}
                {experiment.variants && experiment.variants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      {experiment.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            variant.name === 'A' ? 'bg-blue-500' : 
                            variant.name === 'B' ? 'bg-green-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            Variant {variant.name}: {variant.allocationPercentage}%
                            {variant.template && ` (${variant.template.name})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}