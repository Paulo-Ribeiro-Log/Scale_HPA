import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardCharts } from "@/components/DashboardCharts";
import { SplitView } from "@/components/SplitView";
import { HPAListItem } from "@/components/HPAListItem";
import { HPAEditor } from "@/components/HPAEditor";
import { ApplyAllModal } from "@/components/ApplyAllModal";
import { NodePoolListItem } from "@/components/NodePoolListItem";
import { NodePoolEditor } from "@/components/NodePoolEditor";
import { NodePoolApplyModal } from "@/components/NodePoolApplyModal";
import { SaveSessionModal } from "@/components/SaveSessionModal";
import { LoadSessionModal } from "@/components/LoadSessionModal";
import { CronJobsPage } from "./CronJobsPage";
import { PrometheusPage } from "./PrometheusPage";
import {
  LayoutDashboard,
  Scale,
  Server,
  Clock,
  Activity,
  Layers,
  Package,
  Database
} from "lucide-react";
import { useClusters, useNamespaces, useHPAs, useNodePools } from "@/hooks/useAPI";
import type { HPA, NodePool } from "@/lib/api/types";
import { useStaging } from "@/contexts/StagingContext";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface IndexProps {
  onLogout?: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCluster, setSelectedCluster] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [selectedHPA, setSelectedHPA] = useState<HPA | null>(null);
  const [selectedNodePool, setSelectedNodePool] = useState<NodePool | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hpasToApply, setHpasToApply] = useState<Array<{ key: string; current: HPA; original: HPA }>>([]);
  const [showNodePoolApplyModal, setShowNodePoolApplyModal] = useState(false);
  const [nodePoolsToApply, setNodePoolsToApply] = useState<Array<{ key: string; current: NodePool; original: NodePool }>>([]);
  const [showSaveSessionModal, setShowSaveSessionModal] = useState(false);
  const [showLoadSessionModal, setShowLoadSessionModal] = useState(false);
  const [isContextSwitching, setIsContextSwitching] = useState(false);

  // Staging context
  const staging = useStaging();

  // API Hooks
  const { clusters, loading: clustersLoading } = useClusters();
  const { namespaces, loading: namespacesLoading } = useNamespaces(selectedCluster);
  const { hpas, loading: hpasLoading, refetch: refetchHPAs } = useHPAs(selectedCluster, selectedNamespace);
  const { nodePools, loading: nodePoolsLoading } = useNodePools(selectedCluster);

  // Auto-select first cluster (using context instead of name)
  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].context);
    }
  }, [clusters, selectedCluster]);

  // 🔧 FIX: Handler para mudança de cluster com switch de contexto
  const handleClusterChange = async (newCluster: string) => {
    if (newCluster === selectedCluster) return;

    console.log(`[ClusterSwitch] Switching from ${selectedCluster} to ${newCluster}`);
    setIsContextSwitching(true);

    try {
      // 1. Chamar endpoint de switch context no backend
      await apiClient.switchContext(newCluster);
      console.log(`[ClusterSwitch] Context switched successfully to ${newCluster}`);
      
      // 2. Atualizar estado do frontend
      setSelectedCluster(newCluster);
      setSelectedNamespace(""); // Reset namespace selection
      setSelectedHPA(null); // Reset HPA selection  
      setSelectedNodePool(null); // Reset NodePool selection
      
      // 3. Mostrar toast de sucesso
      toast.success(`Contexto alterado para: ${newCluster}`);
      
    } catch (error) {
      console.error(`[ClusterSwitch] Error switching context:`, error);
      toast.error(`Erro ao alterar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Não alterar o cluster selecionado se houve erro
      return;
    } finally {
      setIsContextSwitching(false);
    }
  };

  // Auto-select first namespace for CronJobs and Prometheus
  useEffect(() => {
    if (namespaces.length > 0 && !selectedNamespace) {
      // Filter out system namespaces and pick first non-system one
      const nonSystemNamespaces = namespaces.filter(ns => !ns.isSystem);
      if (nonSystemNamespaces.length > 0) {
        setSelectedNamespace(nonSystemNamespaces[0].name);
      } else if (namespaces.length > 0) {
        setSelectedNamespace(namespaces[0].name);
      }
    }
  }, [namespaces, selectedNamespace]);

  // Calculate stats
  const stats = {
    clusters: clusters.length,
    namespaces: namespaces.length,
    hpas: hpas.length,
    nodePools: nodePools.length,
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hpas", label: "HPAs", icon: Scale },
    { id: "nodepools", label: "Node Pools", icon: Server },
    { id: "cronjobs", label: "CronJobs", icon: Clock },
    { id: "prometheus", label: "Prometheus", icon: Activity },
  ];

  // Handler para aplicar HPA individual (via "Aplicar Agora")
  const handleApplySingle = (current: HPA, original: HPA) => {
    const key = `${current.cluster}/${current.namespace}/${current.name}`;
    setHpasToApply([{ key, current, original }]);
    setShowApplyModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardCharts selectedCluster={selectedCluster} />;
      
      case "hpas":
        return (
          <SplitView
            leftPanel={{
              title: "Available HPAs",
              content: hpasLoading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Loading HPAs...
                </div>
              ) : hpas.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  {selectedCluster
                    ? "No HPAs found in this cluster"
                    : "Select a cluster to view HPAs"}
                </div>
              ) : (
                <div className="space-y-2">
                  {hpas.map((hpa) => (
                    <HPAListItem
                      key={`${hpa.cluster}-${hpa.namespace}-${hpa.name}`}
                      name={hpa.name}
                      namespace={hpa.namespace}
                      currentReplicas={hpa.current_replicas ?? 0}
                      minReplicas={hpa.min_replicas ?? 0}
                      maxReplicas={hpa.max_replicas ?? 1}
                      isSelected={
                        selectedHPA?.name === hpa.name &&
                        selectedHPA?.namespace === hpa.namespace
                      }
                      onClick={() => setSelectedHPA(hpa)}
                    />
                  ))}
                </div>
              ),
            }}
            rightPanel={{
              title: "HPA Editor",
              content: (
                <HPAEditor
                  hpa={selectedHPA}
                  onApply={handleApplySingle}
                  onApplied={() => {
                    // Refresh apenas os HPAs sem recarregar a página
                    refetchHPAs();
                  }}
                />
              ),
            }}
          />
        );
      
      case "nodepools":
        return (
          <SplitView
            leftPanel={{
              title: "Available Node Pools",
              content: nodePoolsLoading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Loading Node Pools...
                </div>
              ) : nodePools.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  {selectedCluster
                    ? "No node pools found in this cluster"
                    : "Select a cluster to view node pools"}
                </div>
              ) : (
                <div className="space-y-2">
                  {nodePools.map((pool) => (
                    <NodePoolListItem
                      key={`${pool.cluster_name}-${pool.name}`}
                      nodePool={pool}
                      isSelected={
                        selectedNodePool?.name === pool.name &&
                        selectedNodePool?.cluster_name === pool.cluster_name
                      }
                      onClick={() => setSelectedNodePool(pool)}
                    />
                  ))}
                </div>
              ),
            }}
            rightPanel={{
              title: "Node Pool Editor",
              content: <NodePoolEditor nodePool={selectedNodePool} />,
            }}
          />
        );
      
      case "cronjobs":
        return (
          <div className="flex-1 overflow-auto p-4">
            <CronJobsPage 
              selectedCluster={selectedCluster}
            />
          </div>
        );
      
      case "prometheus":
        return (
          <div className="flex-1 overflow-auto p-4">
            <PrometheusPage 
              selectedCluster={selectedCluster} 
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header
        selectedCluster={selectedCluster}
        onClusterChange={handleClusterChange}
        clusters={clusters.map((c) => c.context)}
        modifiedCount={staging.getChangesCount().total}
        onApplyAll={() => {
          const changesCount = staging.getChangesCount();
          const totalChanges = changesCount.total;

          if (totalChanges === 0) {
            toast.error("Nenhuma alteração pendente");
            return;
          }

          // HPAs
          if (changesCount.hpas > 0) {
            const modifiedHPAs = staging.stagedHPAs
              .filter(hpa => hpa.isModified)
              .map(hpa => ({
                key: `${hpa.cluster}/${hpa.namespace}/${hpa.name}`,
                current: hpa,
                original: { ...hpa, ...hpa.originalValues } as HPA,
              }));
            setHpasToApply(modifiedHPAs);
            setShowApplyModal(true);
          }

          // Node Pools
          if (changesCount.nodePools > 0) {
            const modifiedNodePools = staging.stagedNodePools
              .filter(np => np.isModified)
              .map(np => ({
                key: `${np.cluster_name}/${np.name}`,
                current: np,
                original: { ...np, ...np.originalValues } as NodePool,
              }));
            setNodePoolsToApply(modifiedNodePools);
            setShowNodePoolApplyModal(true);
          }
        }}
        onSaveSession={() => setShowSaveSessionModal(true)}
        onLoadSession={() => setShowLoadSessionModal(true)}
        userInfo="admin@k8s.local"
        onLogout={onLogout || (() => console.log("Logout"))}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-3 flex-shrink-0">
        <StatsCard
          icon={Layers}
          value={clustersLoading ? "..." : String(stats.clusters)}
          label="Clusters"
        />
        <StatsCard
          icon={Package}
          value={namespacesLoading ? "..." : String(stats.namespaces)}
          label="Namespaces"
        />
        <StatsCard
          icon={Scale}
          value={hpasLoading ? "..." : String(stats.hpas)}
          label="HPAs"
        />
        <StatsCard
          icon={Database}
          value={nodePoolsLoading ? "..." : String(stats.nodePools)}
          label="Node Pools"
        />
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 min-h-0 overflow-auto">
        {renderTabContent()}
      </div>

      {/* Modal de Confirmação - HPAs */}
      <ApplyAllModal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
        modifiedHPAs={hpasToApply}
        onApplied={() => {
          // Refresh apenas os HPAs sem recarregar a página
          refetchHPAs();
        }}
        onClear={() => {
          // Limpar staging area
          staging.clearStaging();
        }}
      />

      {/* Modal de Confirmação - Node Pools */}
      <NodePoolApplyModal
        open={showNodePoolApplyModal}
        onOpenChange={setShowNodePoolApplyModal}
        modifiedNodePools={nodePoolsToApply}
        onApplied={() => {
          // Refresh node pools após aplicação
          window.location.reload();
        }}
        onClear={() => {
          // Limpar staging area
          staging.clearStaging();
        }}
      />

      {/* Modal de Salvar Sessão */}
      <SaveSessionModal
        open={showSaveSessionModal}
        onOpenChange={setShowSaveSessionModal}
        onSuccess={() => {
          // Opcional: mostrar toast de sucesso
          console.log("Sessão salva com sucesso!");
        }}
      />

      {/* Modal de Carregar Sessão */}
      <LoadSessionModal
        open={showLoadSessionModal}
        onOpenChange={setShowLoadSessionModal}
        onSessionLoaded={() => {
          // Opcional: mostrar toast de sessão carregada
          console.log("Sessão carregada com sucesso!");
        }}
      />
    </div>
  );
};

export default Index;
