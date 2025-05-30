import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Database, Download, Upload, Settings as SettingsIcon, LogOut, FileText, BarChart3, Bell, AlertTriangle, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FacilityManagement from "@/components/facility-management";
import { apiRequest } from "@/lib/queryClient";


export default function Settings() {
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Data export mutations
  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/export/csv?type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      return response.blob();
    },
    onSuccess: (blob, type) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${type} data exported successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const exportPowerBIMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/export/dashboard-data');
      if (!response.ok) {
        throw new Error('Failed to export dashboard data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `wb_tracks_powerbi_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Power BI Export Successful",
        description: "Dashboard data exported for Power BI integration",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Power BI data",
        variant: "destructive",
      });
    },
  });
  
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    darkMode: document.documentElement.classList.contains('dark'),
    autoBackup: true,
    lowStockThreshold: 5,
  });

  // Apply dark mode changes to the document
  useEffect(() => {
    if (userSettings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [userSettings.darkMode]);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setUserSettings(prev => ({ ...prev, darkMode: true }));
    }
  }, []);

  // Test low inventory functionality
  const testLowInventoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/test-low-inventory', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Test Low Inventory Alert",
        description: "Low stock alert test completed successfully. Check your notifications.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test low inventory alert",
        variant: "destructive",
      });
    },
  });

  // Test activity notification functionality
  const testActivityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/test-activity', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Test Activity Alert",
        description: "Activity alert test completed successfully. Check your notifications.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test activity alert",
        variant: "destructive",
      });
    },
  });

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/export/components", {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wb-tracks-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
      <div className="flex items-center mb-6">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Profile
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userSettings.firstName}
                      onChange={(e) => handleSettingChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userSettings.lastName}
                      onChange={(e) => handleSettingChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => handleSettingChange("email", e.target.value)}
                  />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize your WB-Tracks experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive alerts for low stock and system updates
                  </p>
                </div>
                <Switch
                  checked={userSettings.notifications}
                  onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-gray-500">
                    Switch to dark theme
                  </p>
                </div>
                <Switch
                  checked={userSettings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-gray-500">
                    Automatically backup data daily
                  </p>
                </div>
                <Switch
                  checked={userSettings.autoBackup}
                  onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={userSettings.lowStockThreshold}
                  onChange={(e) => handleSettingChange("lowStockThreshold", parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-sm text-gray-500">
                  Alert when stock falls below this number
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export and manage your inventory data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => exportDataMutation.mutate('inventory')}
                  disabled={exportDataMutation.isPending}
                  className="flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportDataMutation.isPending ? 'Exporting...' : 'Export to CSV'}
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center"
                  disabled
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Power BI Integration
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Export your inventory data for use in Power BI dashboards and TV displays.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPowerBIMutation.mutate()}
                  disabled={exportPowerBIMutation.isPending}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {exportPowerBIMutation.isPending ? 'Exporting...' : 'Export for Power BI'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Application Version</span>
                <span className="text-sm text-gray-500">WB-Tracks v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Login</span>
                <span className="text-sm text-gray-500">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Created</span>
                <span className="text-sm text-gray-500">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Facility Management */}
          <FacilityManagement />

          {/* Logout Section */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full md:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Configuration */}
          <Card className="wb-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure when and how you receive notifications
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Low Stock Alerts */}
              <div className="space-y-4">
                <h4 className="font-medium">Low Stock Alerts</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Enable Low Stock Notifications</label>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts when inventory levels are low
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Low Stock Threshold</label>
                      <Input
                        type="number"
                        placeholder="5"
                        className="wb-input"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when quantity falls below this number
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Critical Stock Threshold</label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="wb-input"
                      />
                      <p className="text-xs text-muted-foreground">
                        Critical alert when quantity reaches this level
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium">Activity Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Inventory Transfers</label>
                      <p className="text-xs text-muted-foreground">
                        Notify when items are transferred between locations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Production Consumption</label>
                      <p className="text-xs text-muted-foreground">
                        Notify when items are consumed for production
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">New Components Added</label>
                      <p className="text-xs text-muted-foreground">
                        Notify when new components are added to inventory
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Timing */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Check Frequency</label>
                    <Select defaultValue="30">
                      <SelectTrigger className="wb-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 seconds</SelectItem>
                        <SelectItem value="30">Every 30 seconds</SelectItem>
                        <SelectItem value="60">Every minute</SelectItem>
                        <SelectItem value="300">Every 5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiet Hours</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        defaultValue="22:00"
                        className="wb-input flex-1"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        defaultValue="06:00"
                        className="wb-input flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reduce notifications during these hours
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium">Test Notifications</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="wb-btn-secondary"
                    onClick={() => testLowInventoryMutation.mutate()}
                    disabled={testLowInventoryMutation.isPending}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {testLowInventoryMutation.isPending ? 'Testing...' : 'Test Low Stock Alert'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="wb-btn-secondary"
                    onClick={() => testActivityMutation.mutate()}
                    disabled={testActivityMutation.isPending}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {testActivityMutation.isPending ? 'Testing...' : 'Test Activity Alert'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}