import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network, Building2, Wifi, Cpu, Server, Camera, HardDrive, Clock,
  AlertTriangle, CheckCircle2, WifiOff
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DashboardData {
  counts: Record<string, number>;
  statusBreakdown: { active: number; warning: number; offline: number };
  recentIssues: Array<{ type: string; name: string; status: string; notes: string | null }>;
}

const categoryIcons: Record<string, React.ElementType> = {
  switches: Network,
  offices: Building2,
  wifiAPs: Wifi,
  raspberryPis: Cpu,
  rackItems: Server,
  cameras: Camera,
  nvrs: HardDrive,
  punchClocks: Clock,
};

const categoryLabels: Record<string, string> = {
  switches: "Switches",
  offices: "Offices",
  wifiAPs: "WiFi APs",
  raspberryPis: "Raspberry Pis",
  rackItems: "Rack Items",
  cameras: "Cameras",
  nvrs: "NVRs",
  punchClocks: "Punch Clocks",
};

const COLORS = ["hsl(160, 60%, 40%)", "hsl(35, 85%, 52%)", "hsl(0, 72%, 50%)"];

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Dashboard" description="Infrastructure overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalAssets = data.statusBreakdown.active + data.statusBreakdown.warning + data.statusBreakdown.offline;
  const pieData = [
    { name: "Active", value: data.statusBreakdown.active },
    { name: "Warning", value: data.statusBreakdown.warning },
    { name: "Offline", value: data.statusBreakdown.offline },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Dashboard" description="Infrastructure overview for Woodbridge Foam" />

      {/* Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="text-active-count">{data.statusBreakdown.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="text-warning-count">{data.statusBreakdown.warning}</div>
              <div className="text-xs text-muted-foreground">Warning</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
              <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="text-offline-count">{data.statusBreakdown.offline}</div>
              <div className="text-xs text-muted-foreground">Offline</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset counts and chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Asset Inventory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.counts).filter(([k]) => k !== "portPlates").map(([key, count]) => {
              const Icon = categoryIcons[key] || Server;
              return (
                <Card key={key}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{categoryLabels[key] || key}</span>
                    </div>
                    <div className="text-lg font-semibold tabular-nums" data-testid={`text-count-${key}`}>{count}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Health Overview</h2>
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <div className="text-lg font-semibold tabular-nums">{totalAssets}</div>
                <div className="text-xs text-muted-foreground">Total Devices</div>
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Issues */}
      {data.recentIssues.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Attention Needed</h2>
          <div className="space-y-2">
            {data.recentIssues.map((issue, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{issue.name}</div>
                      <div className="text-xs text-muted-foreground">{issue.type}{issue.notes ? ` — ${issue.notes}` : ""}</div>
                    </div>
                  </div>
                  <StatusBadge status={issue.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
