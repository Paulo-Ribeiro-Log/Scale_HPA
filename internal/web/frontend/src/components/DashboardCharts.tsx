import { Card } from "@/components/ui/card";
import { Activity, Database, Package, Users } from "lucide-react";

export const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
      <Card className="p-4 bg-gradient-card border-border/50 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">CPU Usage Over Time</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50 min-h-0">
          <p className="text-muted-foreground text-sm">Chart visualization will appear here</p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card border-border/50 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Memory Usage Over Time</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50 min-h-0">
          <p className="text-muted-foreground text-sm">Chart visualization will appear here</p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card border-border/50 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">HPAs by Namespace</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50 min-h-0">
          <p className="text-muted-foreground text-sm">Chart visualization will appear here</p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card border-border/50 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Replica Distribution</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50 min-h-0">
          <p className="text-muted-foreground text-sm">Chart visualization will appear here</p>
        </div>
      </Card>
    </div>
  );
};
