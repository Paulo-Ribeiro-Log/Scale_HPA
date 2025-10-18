import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardCharts } from "@/components/DashboardCharts";
import { SplitView } from "@/components/SplitView";
import { HPAListItem } from "@/components/HPAListItem";
import { HPAEditor } from "@/components/HPAEditor";
import { ApplyAllModal } from "@/components/ApplyAllModal";
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
import type { HPA } from "@/lib/api/types";
import { useStaging } from "@/contexts/StagingContext";
import { toast } from "sonner";

interface IndexProps {
  onLogout?: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCluster, setSelectedCluster] = useState("");
  const [selectedHPA, setSelectedHPA] = useState<HPA | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hpasToApply, setHpasToApply] = useState<Array<{ key: string; current: HPA; original: HPA }>>([]);

  // Staging context
  const staging = useStaging();

  // API Hooks
  const { clusters, loading: clustersLoading } = useClusters();
  const { namespaces, loading: namespacesLoading } = useNamespaces(selectedCluster);
  const { hpas, loading: hpasLoading, refetch: refetchHPAs } = useHPAs(selectedCluster);
  const { nodePools, loading: nodePoolsLoading } = useNodePools(selectedCluster);

  // Auto-select first cluster (using context instead of name)
  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].context);
    }
  }, [clusters, selectedCluster]);

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
        return <DashboardCharts />;
      
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
                      id={`${hpa.cluster}-${hpa.namespace}-${hpa.name}`}
                      name={hpa.name}
                      namespace={hpa.namespace}
                      currentReplicas={hpa.current_replicas ?? 0}
                      minReplicas={hpa.min_replicas ?? 0}
                      maxReplicas={hpa.max_replicas ?? 1}
                      targetCPU={hpa.target_cpu ?? undefined}
                      targetMemory={hpa.target_memory ?? undefined}
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
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a cluster to view node pools
                </div>
              ),
            }}
            rightPanel={{
              title: "Node Pool Editor",
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a node pool to edit
                </div>
              ),
            }}
          />
        );
      
      case "cronjobs":
        return (
          <SplitView
            leftPanel={{
              title: "Available CronJobs",
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a cluster to view cronjobs
                </div>
              ),
            }}
            rightPanel={{
              title: "CronJob Details",
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a cronjob to view details
                </div>
              ),
            }}
          />
        );
      
      case "prometheus":
        return (
          <SplitView
            leftPanel={{
              title: "Prometheus Resources",
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a cluster to view Prometheus resources
                </div>
              ),
            }}
            rightPanel={{
              title: "Resource Editor",
              content: (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a resource to edit
                </div>
              ),
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header
        selectedCluster={selectedCluster}
        onClusterChange={setSelectedCluster}
        clusters={clusters.map((c) => c.context)}
        modifiedCount={staging.count}
        onApplyAll={() => {
          if (staging.count === 0) {
            toast.error("Nenhuma alteração pendente");
            return;
          }
          // Abrir modal com todas as alterações
          const allModified = staging.getAll().map(item => ({
            key: item.key,
            current: item.data.current,
            original: item.data.original,
          }));
          setHpasToApply(allModified);
          setShowApplyModal(true);
        }}
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

      <div className="flex-1 min-h-0 overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Modal de Confirmação */}
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
          staging.clear();
        }}
      />
    </div>
  );
};

export default Index;
