import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HPAListItemProps {
  name: string;
  namespace: string;
  currentReplicas: number;
  minReplicas: number;
  maxReplicas: number;
  isSelected: boolean;
  isModified?: boolean;
  onClick: () => void;
}

export const HPAListItem = ({
  name,
  namespace,
  currentReplicas,
  minReplicas,
  maxReplicas,
  isSelected,
  isModified,
  onClick,
}: HPAListItemProps) => {
  return (
    <Card
      className={`
        p-3 mb-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${
          isSelected
            ? "border-2 border-primary bg-accent shadow-md"
            : "border border-border/50 hover:border-primary/50"
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-foreground">{name}</h4>
          <p className="text-xs text-muted-foreground">{namespace}</p>
        </div>
        {isModified && (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30 text-xs py-0">
            Modified
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Current: <span className="font-medium text-foreground">{currentReplicas}</span></span>
        <span>Min: <span className="font-medium text-foreground">{minReplicas}</span></span>
        <span>Max: <span className="font-medium text-foreground">{maxReplicas}</span></span>
      </div>
    </Card>
  );
};
