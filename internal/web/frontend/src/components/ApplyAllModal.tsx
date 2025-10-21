import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import type { HPA } from "@/lib/api/types";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface ApplyAllModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modifiedHPAs: Array<{ key: string; current: HPA; original: HPA }>;
  onApplied: () => void;
  onClear: () => void;
}

type HPAStatus = 'idle' | 'applying' | 'success' | 'error' | 'warning';

interface HPAApplyState {
  status: HPAStatus;
  message?: string;
}

export const ApplyAllModal = ({
  open,
  onOpenChange,
  modifiedHPAs,
  onApplied,
  onClear,
}: ApplyAllModalProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const [applyingIndividual, setApplyingIndividual] = useState<string | null>(null);
  const [hpaStates, setHpaStates] = useState<Record<string, HPAApplyState>>({});

  const handleApplyIndividual = async (key: string, current: HPA) => {
    setApplyingIndividual(key);
    setHpaStates(prev => ({ ...prev, [key]: { status: 'applying' } }));
    
    try {
      await apiClient.updateHPA(
        current.cluster,
        current.namespace,
        current.name,
        current
      );

      setHpaStates(prev => ({ ...prev, [key]: { status: 'success', message: 'Aplicado com sucesso' } }));
      toast.success(`✅ HPA ${current.name} aplicado com sucesso`);
      onApplied();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setHpaStates(prev => ({ ...prev, [key]: { status: 'error', message: errorMessage } }));
      toast.error(`❌ Erro ao aplicar ${current.name}`);
    } finally {
      setApplyingIndividual(null);
    }
  };

  const handleApplyAll = async () => {
    setIsApplying(true);

    for (const { key, current } of modifiedHPAs) {
      setHpaStates(prev => ({ ...prev, [key]: { status: 'applying' } }));
      
      try {
        await apiClient.updateHPA(
          current.cluster,
          current.namespace,
          current.name,
          current
        );
        
        setHpaStates(prev => ({ ...prev, [key]: { status: 'success', message: 'Aplicado com sucesso' } }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        setHpaStates(prev => ({ ...prev, [key]: { status: 'error', message: errorMessage } }));
      }
    }

    setIsApplying(false);
    onApplied();
    
    const successCount = Object.values(hpaStates).filter(s => s.status === 'success').length;
    const errorCount = Object.values(hpaStates).filter(s => s.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success(`✅ ${successCount} HPA(s) aplicado(s) com sucesso`);
    } else {
      toast.error(`⚠️ ${errorCount} erro(s) ao aplicar HPAs`);
    }
  };

  const handleClose = () => {
    if (!isApplying && !applyingIndividual) {
      onOpenChange(false);
      setHpaStates({});
    }
  };

  const renderStatusIcon = (status: HPAStatus) => {
    switch (status) {
      case 'applying':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const renderChange = (label: string, before: any, after: any) => {
    const normalizedBefore = before ?? null;
    const normalizedAfter = after ?? null;

    if (normalizedBefore === normalizedAfter) return null;

    if ((normalizedBefore === null || normalizedBefore === "") &&
        (normalizedAfter === null || normalizedAfter === "")) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="text-muted-foreground min-w-[140px]">{label}:</span>
        <span className="text-red-500 line-through">{before ?? "—"}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-green-500 font-medium">{after ?? "—"}</span>
      </div>
    );
  };

  const renderHPAChanges = (current: HPA, original: HPA) => {
    const changes = [];

    changes.push(renderChange("Min Replicas", original.min_replicas, current.min_replicas));
    changes.push(renderChange("Max Replicas", original.max_replicas, current.max_replicas));
    changes.push(renderChange("Target CPU (%)", original.target_cpu, current.target_cpu));
    changes.push(renderChange("Target Memory (%)", original.target_memory, current.target_memory));
    changes.push(renderChange("CPU Request", original.target_cpu_request, current.target_cpu_request));
    changes.push(renderChange("CPU Limit", original.target_cpu_limit, current.target_cpu_limit));
    changes.push(renderChange("Memory Request", original.target_memory_request, current.target_memory_request));
    changes.push(renderChange("Memory Limit", original.target_memory_limit, current.target_memory_limit));

    // Rollout options
    if (current.perform_rollout && !original.perform_rollout) {
      changes.push(
        <div key="rollout-deployment" className="flex items-center gap-2 text-sm py-1">
          <span className="text-muted-foreground min-w-[140px]">Rollout Deployment:</span>
          <span className="text-primary font-medium">✓ Ativado</span>
        </div>
      );
    }
    if (current.perform_daemonset_rollout && !original.perform_daemonset_rollout) {
      changes.push(
        <div key="rollout-daemonset" className="flex items-center gap-2 text-sm py-1">
          <span className="text-muted-foreground min-w-[140px]">Rollout DaemonSet:</span>
          <span className="text-primary font-medium">✓ Ativado</span>
        </div>
      );
    }
    if (current.perform_statefulset_rollout && !original.perform_statefulset_rollout) {
      changes.push(
        <div key="rollout-statefulset" className="flex items-center gap-2 text-sm py-1">
          <span className="text-muted-foreground min-w-[140px]">Rollout StatefulSet:</span>
          <span className="text-primary font-medium">✓ Ativado</span>
        </div>
      );
    }

    return changes.filter((c) => c !== null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Confirmar Alterações</DialogTitle>
          <DialogDescription>
            {modifiedHPAs.length} HPA{modifiedHPAs.length > 1 ? "s" : ""} será{modifiedHPAs.length > 1 ? "ão" : ""} modificado{modifiedHPAs.length > 1 ? "s" : ""} no cluster
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {modifiedHPAs.map(({ key, current, original }) => {
              const changes = renderHPAChanges(current, original);
              if (changes.length === 0) return null;

              const hpaState = hpaStates[key];
              const hasBeenApplied = hpaState && (hpaState.status === 'success' || hpaState.status === 'error' || hpaState.status === 'warning');
              
              return (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">{current.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {current.namespace}
                        </span>
                      </div>
                      {hpaState && (
                        <div className="flex items-center gap-1.5">
                          {renderStatusIcon(hpaState.status)}
                          {hpaState.message && hpaState.status !== 'applying' && (
                            <span className="text-xs text-muted-foreground">
                              {hpaState.message}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyIndividual(key, current)}
                      disabled={isApplying || applyingIndividual !== null}
                      className="shrink-0"
                    >
                      {applyingIndividual === key ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {hasBeenApplied ? 'Re-aplicar' : 'Aplicar'}
                        </>
                      )}
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-1">{changes}</div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isApplying || applyingIndividual !== null}>
            {isApplying || applyingIndividual !== null ? "Aguarde..." : "Fechar"}
          </Button>
          <Button
            onClick={handleApplyAll}
            disabled={isApplying || applyingIndividual !== null}
            className="bg-success hover:bg-success/90"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aplicando todos...
              </>
            ) : (
              `✅ Aplicar Todos (${modifiedHPAs.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
