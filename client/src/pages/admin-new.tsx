import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Database, 
  Users, 
  Activity, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Server,
  HardDrive,
  Clock,
  UserPlus,
  Trash2,
  RefreshCw,
  Edit,
  Shield,
  Download,
  Upload
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const { data: systemHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const { data: systemStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/system-stats'],
    refetchInterval: 60000,
    enabled: isAdmin,
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully",
      });
      refetchUsers();
      refetchStats();
      setShowCreateUser(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user'
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
      refetchUsers();
      refetchStats();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const maintenanceActions = {
    clearLogs: useMutation({
      mutationFn: () => apiRequest('/api/admin/maintenance/clear-logs', { method: 'POST' }),
      onSuccess: (data) => {
        toast({
          title: "Logs Cleared",
          description: `${data.deletedCount} old transaction logs cleared`,
        });
      },
    }),
    optimizeDb: useMutation({
      mutationFn: () => apiRequest('/api/admin/maintenance/optimize-db', { method: 'POST' }),
      onSuccess: () => {
        toast({
          title: "Database Optimized",
          description: "Database has been optimized successfully",
        });
        refetchHealth();
      },
    }),
    backupDb: useMutation({
      mutationFn: () => apiRequest('/api/admin/maintenance/backup-db', { method: 'POST' }),
      onSuccess: (data) => {
        toast({
          title: "Backup Created",
          description: `Backup contains ${data.components} components, ${data.users} users, and ${data.transactions} transactions`,
        });
      },
    }),
    resetPhotos: useMutation({
      mutationFn: () => apiRequest('/api/admin/maintenance/reset-photos', { method: 'POST' }),
      onSuccess: (data) => {
        toast({
          title: "Photos Reset",
          description: `${data.deletedCount} placeholder photos cleared`,
        });
      },
    }),
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
                You don't have permission to access the Admin section. Only administrators can view this page.
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>
            Real-time system statistics and health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemStats?.totalUsers || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemStats?.activeUsers || 0}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemStats?.totalComponents || 0}</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemStats?.totalTransactions || 0}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Monitor database connectivity and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <Badge variant={systemHealth?.database === 'healthy' ? 'default' : 'destructive'}>
                {systemHealth?.database === 'healthy' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Server</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
          </div>
          {systemHealth?.databaseError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Database Error: {systemHealth.databaseError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage system users and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Badge variant="outline">{systemStats?.adminUsers || 0} Admins</Badge>
              <Badge variant="outline">{systemStats?.managerUsers || 0} Managers</Badge>
              <Badge variant="outline">{systemStats?.regularUsers || 0} Users</Badge>
            </div>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the system</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createUserMutation.mutate(newUser)}
                    disabled={createUserMutation.isPending || !newUser.username || !newUser.email || !newUser.password}
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                    {!user.isActive && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Last login: {user.lastLoginFormatted}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Database optimization and system cleanup tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Database Operations</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => maintenanceActions.optimizeDb.mutate()}
                    disabled={maintenanceActions.optimizeDb.isPending}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {maintenanceActions.optimizeDb.isPending ? 'Optimizing...' : 'Optimize Database'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => maintenanceActions.backupDb.mutate()}
                    disabled={maintenanceActions.backupDb.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {maintenanceActions.backupDb.isPending ? 'Creating...' : 'Create Backup Info'}
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Data Cleanup</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => maintenanceActions.clearLogs.mutate()}
                    disabled={maintenanceActions.clearLogs.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {maintenanceActions.clearLogs.isPending ? 'Clearing...' : 'Clear Old Logs'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => maintenanceActions.resetPhotos.mutate()}
                    disabled={maintenanceActions.resetPhotos.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {maintenanceActions.resetPhotos.isPending ? 'Resetting...' : 'Reset Placeholder Photos'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">System Health</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      refetchHealth();
                      refetchStats();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                  <div className="p-2 bg-muted rounded text-sm">
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span className={systemHealth?.database === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                        {systemHealth?.database || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server:</span>
                      <span className="text-green-600">{systemHealth?.server || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Quick Stats</h4>
                <div className="p-2 bg-muted rounded text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Components:</span>
                    <span>{systemStats?.totalComponents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span>{systemStats?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Transactions:</span>
                    <span>{systemStats?.totalTransactions || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}