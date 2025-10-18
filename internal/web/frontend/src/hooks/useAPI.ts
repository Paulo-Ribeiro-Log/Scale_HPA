// Custom React hook for API operations

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import type {
  Cluster,
  Namespace,
  HPA,
  NodePool,
  CronJob,
  PrometheusResource,
} from "@/lib/api/types";

export function useClusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getClusters();
      setClusters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clusters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  return { clusters, loading, error, refetch: fetchClusters };
}

export function useNamespaces(cluster?: string) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNamespaces = async () => {
    if (!cluster) {
      setNamespaces([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getNamespaces(cluster);
      setNamespaces(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch namespaces"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, [cluster]);

  return { namespaces, loading, error, refetch: fetchNamespaces };
}

export function useHPAs(cluster?: string, namespace?: string) {
  const [hpas, setHPAs] = useState<HPA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHPAs = async () => {
    if (!cluster) {
      setHPAs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getHPAs(cluster, namespace);
      setHPAs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch HPAs");
    } finally {
      setLoading(false);
    }
  };

  const updateHPA = async (
    hpaCluster: string,
    hpaNamespace: string,
    hpaName: string,
    updates: Partial<HPA>
  ) => {
    try {
      await apiClient.updateHPA(hpaCluster, hpaNamespace, hpaName, updates);
      await fetchHPAs(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchHPAs();
  }, [cluster, namespace]);

  return { hpas, loading, error, refetch: fetchHPAs, updateHPA };
}

export function useNodePools(cluster?: string) {
  const [nodePools, setNodePools] = useState<NodePool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNodePools = async () => {
    if (!cluster) {
      setNodePools([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getNodePools(cluster);
      setNodePools(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch node pools"
      );
    } finally {
      setLoading(false);
    }
  };

  const applySequential = async (pools: NodePool[]) => {
    try {
      return await apiClient.applyNodePoolsSequential(pools);
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchNodePools();
  }, [cluster]);

  return {
    nodePools,
    loading,
    error,
    refetch: fetchNodePools,
    applySequential,
  };
}

export function useCronJobs(cluster?: string, namespace?: string) {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCronJobs = async () => {
    if (!cluster) {
      setCronJobs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCronJobs(cluster, namespace);
      setCronJobs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cronjobs"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCronJob = async (
    jobCluster: string,
    jobNamespace: string,
    jobName: string,
    updates: Partial<CronJob>
  ) => {
    try {
      await apiClient.updateCronJob(jobCluster, jobNamespace, jobName, updates);
      await fetchCronJobs(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchCronJobs();
  }, [cluster, namespace]);

  return { cronJobs, loading, error, refetch: fetchCronJobs, updateCronJob };
}

export function usePrometheus(cluster?: string, namespace?: string) {
  const [resources, setResources] = useState<PrometheusResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    if (!cluster) {
      setResources([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPrometheusResources(cluster, namespace);
      setResources(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch Prometheus resources"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateResource = async (
    resCluster: string,
    resNamespace: string,
    resType: string,
    resName: string,
    updates: Partial<PrometheusResource>
  ) => {
    try {
      await apiClient.updatePrometheusResource(
        resCluster,
        resNamespace,
        resType,
        resName,
        updates
      );
      await fetchResources(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchResources();
  }, [cluster, namespace]);

  return {
    resources,
    loading,
    error,
    refetch: fetchResources,
    updateResource,
  };
}
