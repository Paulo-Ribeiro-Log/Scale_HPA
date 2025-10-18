// API Types - matching Go backend structures

export interface Cluster {
  name: string;
  context: string;
  status: "online" | "offline";
  region?: string;
  resourceGroup?: string;
  subscription?: string;
}

export interface Namespace {
  name: string;
  cluster: string;
  hpaCount?: number;
  isSystem?: boolean;
}

export interface HPA {
  name: string;
  namespace: string;
  cluster: string;
  min_replicas: number | null;
  max_replicas: number;
  current_replicas: number;
  desired_replicas?: number;
  target_cpu?: number | null;
  target_memory?: number | null;
  last_scale_time?: string;
  conditions?: HPACondition[];
  perform_rollout?: boolean;
  perform_daemonset_rollout?: boolean;
  perform_statefulset_rollout?: boolean;

  // Deployment information
  deployment_name?: string;

  // Target values (editable)
  target_cpu_request?: string;
  target_cpu_limit?: string;
  target_memory_request?: string;
  target_memory_limit?: string;

  // Original values from deployment (from original_values object)
  original_values?: {
    min_replicas?: number;
    max_replicas?: number;
    target_cpu?: number;
    target_memory?: number;
    cpu_request?: string;
    cpu_limit?: string;
    memory_request?: string;
    memory_limit?: string;
    deployment_name?: string;
    perform_rollout?: boolean;
    perform_daemonset_rollout?: boolean;
    perform_statefulset_rollout?: boolean;
  };

  resources_modified?: boolean;
}

export interface HPACondition {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

export interface NodePool {
  name: string;
  cluster: string;
  resourceGroup: string;
  count: number;
  minCount?: number;
  maxCount?: number;
  vmSize: string;
  osType: string;
  mode: string;
  autoscalingEnabled: boolean;
  status: string;
  originalValues?: {
    count: number;
    minCount?: number;
    maxCount?: number;
    autoscalingEnabled: boolean;
  };
}

export interface CronJob {
  name: string;
  namespace: string;
  cluster: string;
  schedule: string;
  suspend: boolean;
  lastScheduleTime?: string;
  active: number;
  status: "active" | "suspended" | "failed" | "running";
}

export interface PrometheusResource {
  name: string;
  namespace: string;
  cluster: string;
  type: "Deployment" | "StatefulSet" | "DaemonSet";
  cpuRequest?: string;
  cpuLimit?: string;
  memoryRequest?: string;
  memoryLimit?: string;
  currentCPU?: string;
  currentMemory?: string;
  replicas?: number;
}

export interface ValidationStatus {
  vpnConnected: boolean;
  azureCliAvailable: boolean;
  kubectlAvailable: boolean;
  message: string;
  lastCheck: string;
}

export interface APIError {
  error: string;
  details?: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
