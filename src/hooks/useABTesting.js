import { useState, useEffect } from "react";

export const useABTesting = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperiments = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/ab-testing/experiments?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch experiments");
      }
      
      const data = await response.json();
      setExperiments(data.experiments || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async (experimentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ab-testing/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(experimentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create experiment");
      }
      
      const experiment = await response.json();
      setExperiments(prev => [experiment, ...prev]);
      return experiment;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExperiment = async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update experiment");
      }
      
      const updatedExperiment = await response.json();
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? updatedExperiment : exp)
      );
      return updatedExperiment;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExperiment = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete experiment");
      }
      
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (id, action) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} experiment`);
      }
      
      const result = await response.json();
      
      // Update the experiment in local state if we have the updated experiment data
      if (result.experiment) {
        setExperiments(prev => 
          prev.map(exp => exp.id === id ? { ...exp, ...result.experiment } : exp)
        );
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    experiments,
    loading,
    error,
    fetchExperiments,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    executeAction,
    clearError
  };
};

export const useABTestingDetail = (id) => {
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperiment = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Experiment not found");
        }
        throw new Error("Failed to fetch experiment");
      }
      
      const data = await response.json();
      setExperiment(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} experiment`);
      }
      
      const result = await response.json();
      
      // Update the experiment with the new data
      if (result.experiment) {
        setExperiment(prev => ({ ...prev, ...result.experiment }));
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshExperiment = () => {
    return fetchExperiment();
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    fetchExperiment();
  }, [id]);

  return {
    experiment,
    loading,
    error,
    executeAction,
    refreshExperiment,
    clearError
  };
};