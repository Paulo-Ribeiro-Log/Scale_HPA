// API Client - connects to Go backend

import type {
  Cluster,
  Namespace,
  HPA,
  NodePool,
  CronJob,
  PrometheusResource,
  ValidationStatus,
  APIError,
  APIResponse,
} from "./types";

const API_BASE_URL = "/api/v1";

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem("auth_token") || null;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Clusters
  async getClusters(): Promise<Cluster[]> {
    const response = await this.request<APIResponse<Cluster[]>>("/clusters");
    return response.data || [];
  }

  async testCluster(clusterName: string): Promise<{ online: boolean }> {
    return this.request(`/clusters/${encodeURIComponent(clusterName)}/test`);
  }

  // Namespaces
  async getNamespaces(cluster?: string): Promise<Namespace[]> {
    const query = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    const response = await this.request<APIResponse<Namespace[]>>(
      `/namespaces${query}`
    );
    return response.data || [];
  }

  // HPAs
  async getHPAs(cluster?: string, namespace?: string): Promise<HPA[]> {
    const params = new URLSearchParams();
    if (cluster) params.append("cluster", cluster);
    if (namespace) params.append("namespace", namespace);
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await this.request<APIResponse<HPA[]>>(`/hpas${query}`);
    return response.data || [];
  }

  async getHPA(
    cluster: string,
    namespace: string,
    name: string
  ): Promise<HPA> {
    return this.request(
      `/hpas/${encodeURIComponent(cluster)}/${encodeURIComponent(
        namespace
      )}/${encodeURIComponent(name)}`
    );
  }

  async updateHPA(
    cluster: string,
    namespace: string,
    name: string,
    hpa: Partial<HPA>
  ): Promise<HPA> {
    return this.request(
      `/hpas/${encodeURIComponent(cluster)}/${encodeURIComponent(
        namespace
      )}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: JSON.stringify(hpa),
      }
    );
  }

  // Node Pools
  async getNodePools(cluster?: string): Promise<NodePool[]> {
    const query = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    const response = await this.request<APIResponse<NodePool[]>>(
      `/nodepools${query}`
    );
    return response.data || [];
  }

  async applyNodePoolsSequential(
    nodePools: NodePool[]
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/nodepools/apply-sequential", {
      method: "POST",
      body: JSON.stringify({ nodePools }),
    });
  }

  // CronJobs
  async getCronJobs(cluster?: string, namespace?: string): Promise<CronJob[]> {
    const params = new URLSearchParams();
    if (cluster) params.append("cluster", cluster);
    if (namespace) params.append("namespace", namespace);
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await this.request<APIResponse<CronJob[]>>(
      `/cronjobs${query}`
    );
    return response.data || [];
  }

  async updateCronJob(
    cluster: string,
    namespace: string,
    name: string,
    cronJob: Partial<CronJob>
  ): Promise<CronJob> {
    return this.request(
      `/cronjobs/${encodeURIComponent(cluster)}/${encodeURIComponent(
        namespace
      )}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: JSON.stringify(cronJob),
      }
    );
  }

  // Prometheus Stack
  async getPrometheusResources(
    cluster?: string,
    namespace?: string
  ): Promise<PrometheusResource[]> {
    const params = new URLSearchParams();
    if (cluster) params.append("cluster", cluster);
    if (namespace) params.append("namespace", namespace);
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await this.request<APIResponse<PrometheusResource[]>>(
      `/prometheus${query}`
    );
    return response.data || [];
  }

  async updatePrometheusResource(
    cluster: string,
    namespace: string,
    type: string,
    name: string,
    resource: Partial<PrometheusResource>
  ): Promise<PrometheusResource> {
    return this.request(
      `/prometheus/${encodeURIComponent(cluster)}/${encodeURIComponent(
        namespace
      )}/${encodeURIComponent(type)}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: JSON.stringify(resource),
      }
    );
  }

  // Validation (VPN + Azure CLI)
  async validateEnvironment(): Promise<ValidationStatus> {
    return this.request("/validate");
  }
}

// Singleton instance
export const apiClient = new APIClient();

// Export for convenience
export default apiClient;
