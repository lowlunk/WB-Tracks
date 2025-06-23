import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, Users, UserPlus, Edit2, Trash2, Crown, Settings, AlertTriangle, 
  Database, Activity, BarChart3, Download, RefreshCw, Server, HardDrive,
  Clock, FileText, TrendingUp, Package, Building2, MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useUserRole } from "@/hooks/useUserRole";
import type { User, UserGroup, InsertUserGroup } from "@shared/schema";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalComponents: number;
  totalInventoryItems: number;
  totalTransactions: number;
  lowStockAlerts: number;
  dbSize: string;
  uptime: string;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  userId: number;
  username: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export default function EnhancedAdminDashboard() {
  const { user, isAdmin, isLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // System Statistics
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/system-stats"],
    refetchInterval: 30000,
  });

  // Activity Logs
  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/activity-logs"],
    refetchInterval: 10000,
  });

  // Database Health
  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ["/api/admin/database-health"],
    refetchInterval: 60000,
  });

  // Export Data Mutation
  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/export/${type}`);
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    },
    onSuccess: (blob, type) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Completed",
        description: `${type} data exported successfully`,
      });
    },
  });

  // System Maintenance Actions
  const maintenanceMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await fetch(`/api/admin/maintenance/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Maintenance action failed');
      return response.json();
    },
    onSuccess: (result, action) => {
      toast({
        title: "Maintenance Completed",
        description: `${action} completed successfully`,
      });
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database-health"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-16">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the Admin section. Only administrators can view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatUptime = (uptime: string) => {
    const days = Math.floor(parseInt(uptime) / (24 * 60 * 60));
    const hours = Math.floor((parseInt(uptime) % (24 * 60 * 60)) / (60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">System Administration</h1>
        </div>
        <Badge variant="outline" className="text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Administrator Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold">{systemStats?.totalUsers || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {systemStats?.activeUsers || 0} active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Components</p>
                    <p className="text-2xl font-bold">{systemStats?.totalComponents || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {systemStats?.totalInventoryItems || 0} inventory items
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Transactions</p>
                    <p className="text-2xl font-bold">{systemStats?.totalTransactions || 0}</p>
                    <p className="text-xs text-muted-foreground">Total recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Alerts</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {systemStats?.lowStockAlerts || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Low stock items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Connection</span>
                  <Badge variant={dbHealth?.connected ? "default" : "destructive"}>
                    {dbHealth?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Uptime</span>
                  <span className="text-sm font-medium">
                    {systemStats?.uptime ? formatUptime(systemStats.uptime) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Size</span>
                  <span className="text-sm font-medium">{systemStats?.dbSize || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => exportDataMutation.mutate('inventory')}
                  disabled={exportDataMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Inventory Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => exportDataMutation.mutate('transactions')}
                  disabled={exportDataMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Transaction Log
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => maintenanceMutation.mutate('cleanup-sessions')}
                  disabled={maintenanceMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup Old Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dbLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Status</span>
                      <Badge variant={dbHealth?.connected ? "default" : "destructive"}>
                        {dbHealth?.connected ? "Healthy" : "Error"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">{dbHealth?.responseTime || "N/A"}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="text-sm font-medium">{dbHealth?.activeConnections || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Database Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => maintenanceMutation.mutate('analyze-tables')}
                  disabled={maintenanceMutation.isPending}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze Tables
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => maintenanceMutation.mutate('vacuum-database')}
                  disabled={maintenanceMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vacuum Database
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => maintenanceMutation.mutate('backup-database')}
                  disabled={maintenanceMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                System activity and user actions log
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activityLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  ) : (
                    activityLogs.map((log: ActivityLog) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Activity className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.action}</p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}