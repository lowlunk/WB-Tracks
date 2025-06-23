import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Database, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Zap,
  Settings,
  Calendar,
  History,
  Target,
  Gauge,
  HardDrive,
  Timer,
  Shield
} from "lucide-react";

interface DatabaseStats {
  tableStats: TableStat[];
  indexStats: IndexStat[];
  queryPerformance: QueryPerformanceStat[];
  connectionStats: ConnectionStat;
  diskUsage: DiskUsageStat;
  cacheHitRatio: number;
  deadlocks: number;
  slowQueries: SlowQuery[];
}

interface OptimizationRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  table?: string;
  index?: string;
  description: string;
  expectedBenefit: string;
  estimatedTime: string;
  sqlCommand?: string;
  risk: 'low' | 'medium' | 'high';
}

interface OptimizationResult {
  type: string;
  success: boolean;
  duration: number;
  beforeStats?: any;
  afterStats?: any;
  error?: string;
  improvements: string[];
}

export default function DatabaseOptimizer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const { data: databaseStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/database/analysis'],
    refetchInterval: 60000,
    enabled: isAdmin,
  });

  const { data: recommendations, refetch: refetchRecommendations } = useQuery({
    queryKey: ['/api/admin/database/recommendations'],
    refetchInterval: 300000, // 5 minutes
    enabled: isAdmin,
  });

  const { data: healthScore, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/database/health-score'],
    refetchInterval: 60000,
    enabled: isAdmin,
  });

  const { data: optimizationHistory } = useQuery({
    queryKey: ['/api/admin/database/optimization-history'],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const { data: scheduledOptimizations } = useQuery({
    queryKey: ['/api/admin/database/scheduled-optimizations'],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const executeOptimizationMutation = useMutation({
    mutationFn: async (recommendation: OptimizationRecommendation) => {
      return await apiRequest('/api/admin/database/optimize', {
        method: 'POST',
        body: JSON.stringify({ recommendation }),
      });
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Optimization Completed" : "Optimization Failed",
        description: result.success 
          ? `${result.improvements.join(', ')} (${result.duration}ms)`
          : result.error || "Unknown error occurred",
        variant: result.success ? "default" : "destructive",
      });
      refetchStats();
      refetchRecommendations();
      refetchHealth();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/optimization-history'] });
      setShowExecuteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to execute optimization",
        variant: "destructive",
      });
    },
  });

  const scheduleOptimizationMutation = useMutation({
    mutationFn: async ({ recommendation, scheduleTime }: { recommendation: OptimizationRecommendation, scheduleTime: string }) => {
      return await apiRequest('/api/admin/database/schedule-optimization', {
        method: 'POST',
        body: JSON.stringify({ recommendation, scheduleTime }),
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Optimization Scheduled",
        description: `Optimization scheduled for ${new Date(result.scheduledFor).toLocaleString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/scheduled-optimizations'] });
      setShowScheduleDialog(false);
      setScheduleTime('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule optimization",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-16">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the Database Optimizer. Only administrators can view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Optimizer</h1>
          <p className="text-muted-foreground">Automated performance monitoring and optimization</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Health Score: <span className={getHealthScoreColor(healthScore?.score || 0)}>
              {healthScore?.score || 0}/100
            </span>
          </Badge>
          <Button
            variant="outline"
            onClick={() => {
              refetchStats();
              refetchRecommendations();
              refetchHealth();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Database Health Score
              </CardTitle>
              <CardDescription>
                Overall database performance and optimization status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={healthScore?.score || 0} className="h-3" />
                </div>
                <div className={`text-2xl font-bold ${getHealthScoreColor(healthScore?.score || 0)}`}>
                  {healthScore?.score || 0}/100
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {recommendations?.filter(r => r.priority === 'low').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {recommendations?.filter(r => r.priority === 'medium').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {recommendations?.filter(r => ['high', 'critical'].includes(r.priority)).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Cache Hit Ratio</p>
                    <p className="text-2xl font-bold">{((databaseStats?.cacheHitRatio || 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Active Connections</p>
                    <p className="text-2xl font-bold">{databaseStats?.connectionStats?.active || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Slow Queries</p>
                    <p className="text-2xl font-bold">{databaseStats?.slowQueries?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Total Size</p>
                    <p className="text-2xl font-bold">{databaseStats?.diskUsage?.totalSize || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
            <Badge variant="outline">
              {recommendations?.length || 0} recommendations
            </Badge>
          </div>

          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityColor(rec.priority)}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {rec.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {rec.table && (
                            <Badge variant="secondary">
                              Table: {rec.table}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-2">{rec.description}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Expected Benefit:</strong> {rec.expectedBenefit}</p>
                          <p><strong>Estimated Time:</strong> {rec.estimatedTime}</p>
                          <p><strong>Risk Level:</strong> <span className={getRiskColor(rec.risk)}>{rec.risk}</span></p>
                          {rec.sqlCommand && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                              {rec.sqlCommand}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setShowExecuteDialog(true);
                          }}
                          disabled={executeOptimizationMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setShowScheduleDialog(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Optimized!</h3>
                <p className="text-muted-foreground">
                  No optimization recommendations at this time. Your database is performing well.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scheduled Optimizations</h3>
            <Badge variant="outline">
              {scheduledOptimizations?.length || 0} scheduled
            </Badge>
          </div>

          {scheduledOptimizations && scheduledOptimizations.length > 0 ? (
            <div className="space-y-4">
              {scheduledOptimizations.map((scheduled, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Optimization #{scheduled.id}</span>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          // Cancel scheduled optimization
                          apiRequest(`/api/admin/database/scheduled-optimization/${scheduled.id}`, {
                            method: 'DELETE'
                          }).then(() => {
                            toast({
                              title: "Optimization Cancelled",
                              description: "Scheduled optimization has been cancelled"
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/admin/database/scheduled-optimizations'] });
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Optimizations</h3>
                <p className="text-muted-foreground">
                  You can schedule optimizations from the Recommendations tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Optimization History</h3>
            <Badge variant="outline">
              {optimizationHistory?.length || 0} executions
            </Badge>
          </div>

          {optimizationHistory && optimizationHistory.length > 0 ? (
            <div className="space-y-4">
              {optimizationHistory.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "SUCCESS" : "FAILED"}
                          </Badge>
                          <Badge variant="outline">
                            {result.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Duration:</strong> {result.duration}ms</p>
                          {result.success && result.improvements.length > 0 && (
                            <div className="mt-2">
                              <strong>Improvements:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {result.improvements.map((improvement, i) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.error && (
                            <p className="text-red-600 mt-2"><strong>Error:</strong> {result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Optimization History</h3>
                <p className="text-muted-foreground">
                  Optimization history will appear here after you execute optimizations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Table Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {databaseStats?.tableStats?.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{table.tableName}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.rowCount} rows • {table.size}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {table.needsVacuum && (
                          <Badge variant="destructive" className="text-xs">Vacuum</Badge>
                        )}
                        {table.needsReindex && (
                          <Badge variant="secondary" className="text-xs">Reindex</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Query Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Query Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {databaseStats?.queryPerformance?.map((query, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="font-mono text-xs mb-2 truncate">
                        {query.query}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Calls: {query.calls} • Avg: {query.meanTime}ms</div>
                        <div>Hit Ratio: {(query.hitRatio * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Execute Optimization Dialog */}
      <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Optimization</DialogTitle>
            <DialogDescription>
              Are you sure you want to execute this optimization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Risk Level:</strong> {selectedRecommendation.risk}
                  <br />
                  <strong>Estimated Time:</strong> {selectedRecommendation.estimatedTime}
                </AlertDescription>
              </Alert>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium mb-2">{selectedRecommendation.description}</p>
                <p className="text-xs text-muted-foreground">{selectedRecommendation.expectedBenefit}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRecommendation && executeOptimizationMutation.mutate(selectedRecommendation)}
              disabled={executeOptimizationMutation.isPending}
            >
              {executeOptimizationMutation.isPending ? 'Executing...' : 'Execute Optimization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Optimization Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Optimization</DialogTitle>
            <DialogDescription>
              Schedule this optimization to run at a specific time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduleTime">Schedule Time</Label>
              <Input
                id="scheduleTime"
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {selectedRecommendation && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium mb-2">{selectedRecommendation.description}</p>
                <p className="text-xs text-muted-foreground">{selectedRecommendation.expectedBenefit}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRecommendation && scheduleOptimizationMutation.mutate({
                recommendation: selectedRecommendation,
                scheduleTime
              })}
              disabled={scheduleOptimizationMutation.isPending || !scheduleTime}
            >
              {scheduleOptimizationMutation.isPending ? 'Scheduling...' : 'Schedule Optimization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}