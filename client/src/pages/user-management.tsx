import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, Edit, Trash2, Shield, User, Building, Truck, Cog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface CreateUserData {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role: string;
  isActive: boolean;
}

interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

const roleIcons = {
  admin: Shield,
  manager: User,
  shipping: Truck,
  prod: Building,
  user: User,
};

const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipping: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  prod: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "user",
    isActive: true,
  });
  const [updateUserData, setUpdateUserData] = useState<UpdateUserData>({});

  // Redirect if not admin
  if (currentUser && currentUser.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Show loading while checking auth
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser && currentUser.role === 'admin', // Only fetch if user is admin
    retry: 1,
  });

  // Debug logging
  console.log("User Management - Current User:", currentUser);
  console.log("User Management - Users data:", users);
  console.log("User Management - Loading:", isLoading);
  console.log("User Management - Error:", error);

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      return await apiRequest("/api/admin/users", "POST", userData);
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "User has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreateDialog(false);
      setCreateUserData({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "user",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number; data: Partial<User> }) => {
      return await apiRequest(`/api/admin/users/${userData.id}`, "PUT", userData.data);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!createUserData.username || !createUserData.email || !createUserData.password) {
      toast({
        title: "Validation error",
        description: "Username, email, and password are required",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createUserData);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({ 
      id: editingUser.id, 
      data: updateUserData 
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUpdateUserData({
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      password: "", // Always start with empty password
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load users. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={createUserData.username}
                    onChange={(e) => setCreateUserData({ ...createUserData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={createUserData.firstName}
                    onChange={(e) => setCreateUserData({ ...createUserData, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={createUserData.lastName}
                    onChange={(e) => setCreateUserData({ ...createUserData, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createUserData.password}
                    onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={createUserData.role} onValueChange={(value) => setCreateUserData({ ...createUserData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="prod">Production</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {Array.isArray(users) && users.map((user: User) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                      <Badge className={`px-2 py-1 text-xs ${roleColors[user.role as keyof typeof roleColors] || roleColors.user}`}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      {editingUser && (
                        <div className="space-y-4">
                          <div>
                            <Label>Username</Label>
                            <Input
                              value={updateUserData.username || ""}
                              onChange={(e) => setUpdateUserData(prev => ({ ...prev, username: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={updateUserData.email || ""}
                              onChange={(e) => setUpdateUserData(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>First Name</Label>
                              <Input
                                value={updateUserData.firstName || ""}
                                onChange={(e) => setUpdateUserData(prev => ({ ...prev, firstName: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Last Name</Label>
                              <Input
                                value={updateUserData.lastName || ""}
                                onChange={(e) => setUpdateUserData(prev => ({ ...prev, lastName: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>New Password</Label>
                            <Input
                              type="password"
                              value={updateUserData.password || ""}
                              onChange={(e) => setUpdateUserData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Leave empty to keep current password"
                            />
                            <p className="text-sm text-gray-500 mt-1">Leave empty to keep current password</p>
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Select value={updateUserData.role} onValueChange={(value) => setUpdateUserData(prev => ({ ...prev, role: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="shipping">Shipping</SelectItem>
                                <SelectItem value="prod">Production</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="isActive"
                              checked={updateUserData.isActive || false}
                              onCheckedChange={(checked) => setUpdateUserData(prev => ({ ...prev, isActive: checked }))}
                            />
                            <Label htmlFor="isActive">Active User</Label>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingUser(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                              {updateUserMutation.isPending ? "Updating..." : "Update User"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Array.isArray(users) && users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first user account.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}