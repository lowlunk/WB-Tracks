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
import { Shield, Users, UserPlus, Edit2, Trash2, Crown, Settings, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useUserRole } from "@/hooks/useUserRole";
import type { User, UserGroup, InsertUserGroup } from "@shared/schema";

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  password?: string;
}

interface GroupFormData {
  name: string;
  description: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  "inventory.read",
  "inventory.write",
  "components.read",
  "components.write",
  "facilities.read",
  "facilities.write",
  "users.read",
  "users.write",
  "admin.access",
];

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useUserRole();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isAssignGroupDialogOpen, setIsAssignGroupDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  // Show loading state while checking user role
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--wb-primary))]"></div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
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
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
    isActive: true,
  });
  const [groupFormData, setGroupFormData] = useState<GroupFormData>({
    name: "",
    description: "",
    permissions: [],
  });

  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/admin/groups"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      resetUserForm();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserFormData> }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      resetUserForm();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: InsertUserGroup) => {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      setIsGroupDialogOpen(false);
      resetGroupForm();
      toast({
        title: "Success",
        description: "User group created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user group",
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUserGroup> }) => {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      resetGroupForm();
      toast({
        title: "Success",
        description: "User group updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user group",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const resetUserForm = () => {
    setUserFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
      isActive: true,
    });
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: "",
      description: "",
      permissions: [],
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      isActive: user.isActive,
    });
    setIsUserDialogOpen(true);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || "",
      permissions: group.permissions || [],
    });
    setIsGroupDialogOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userFormData });
    } else {
      // Creating new user
      if (!userFormData.username || !userFormData.email || !userFormData.password) {
        toast({
          title: "Error",
          description: "Username, email, and password are required",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(userFormData);
    }
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const groupData: InsertUserGroup = {
      name: groupFormData.name.trim(),
      description: groupFormData.description.trim() || undefined,
      permissions: groupFormData.permissions,
    };

    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupData });
    } else {
      createGroupMutation.mutate(groupData);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleAssignToGroup = (user: User) => {
    setAssigningUser(user);
    setIsAssignGroupDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setGroupFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4" />;
      case "manager":
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="groups">Group Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {users.length} {users.length === 1 ? 'user' : 'users'} registered
                </p>
                <Dialog open={isUserDialogOpen && !editingUser} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingUser(null); resetUserForm(); }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newUsername">Username *</Label>
                          <Input
                            id="newUsername"
                            value={userFormData.username}
                            onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                            placeholder="johndoe"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="newEmail">Email *</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            placeholder="john.doe@company.com"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newFirstName">First Name</Label>
                          <Input
                            id="newFirstName"
                            value={userFormData.firstName}
                            onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newLastName">Last Name</Label>
                          <Input
                            id="newLastName"
                            value={userFormData.lastName}
                            onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newRole">Role</Label>
                          <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
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
                        <div>
                          <Label htmlFor="newStatus">Status</Label>
                          <Select value={userFormData.isActive ? "active" : "inactive"} onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === "active" })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword">Initial Password *</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={userFormData.password || ""}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          placeholder="Enter initial password"
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          Create User
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || "Not provided"}</TableCell>
                        <TableCell>
                          {user.firstName || user.lastName 
                            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                            : "Not provided"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignToGroup(user)}
                            >
                              <Users className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Group Management
              </CardTitle>
              <CardDescription>
                Create and manage user groups with specific permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {groups.length} {groups.length === 1 ? 'group' : 'groups'} configured
                </p>
                <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingGroup(null); resetGroupForm(); }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingGroup ? 'Edit Group' : 'Create New Group'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGroupSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="groupName">Group Name *</Label>
                          <Input
                            id="groupName"
                            value={groupFormData.name}
                            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                            placeholder="Warehouse Staff"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="groupDescription">Description</Label>
                          <Input
                            id="groupDescription"
                            value={groupFormData.description}
                            onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                            placeholder="Staff with warehouse access"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {AVAILABLE_PERMISSIONS.map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={permission}
                                checked={groupFormData.permissions.includes(permission)}
                                onChange={() => togglePermission(permission)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={permission} className="text-sm">
                                {permission}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                        >
                          {editingGroup ? 'Update' : 'Create'} Group
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {groupsLoading ? (
                <div className="text-center py-4">Loading groups...</div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No user groups configured</p>
                  <p className="text-sm">Create your first group to organize users</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group: UserGroup) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.description || "No description"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {group.permissions?.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {group.permissions && group.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={group.isActive ? "default" : "secondary"}>
                            {group.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditGroup(group)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Edit Dialog */}
      <Dialog open={isUserDialogOpen && editingUser !== null} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
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
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={userFormData.isActive ? "active" : "inactive"} onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === "active" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                Update User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign User to Group Dialog */}
      <Dialog open={isAssignGroupDialogOpen} onOpenChange={setIsAssignGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Groups: {assigningUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which groups this user should be assigned to:
            </p>
            {groupsLoading ? (
              <div className="text-center py-4">Loading groups...</div>
            ) : groups && groups.length > 0 ? (
              <div className="space-y-2">
                {groups.map((group: UserGroup) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`group-${group.id}`}
                      // For now, we'll show all groups as unchecked
                      // In a full implementation, we'd check current user group memberships
                    />
                    <Label htmlFor={`group-${group.id}`} className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">{group.name}</span>
                      {group.description && (
                        <span className="text-sm text-muted-foreground">
                          - {group.description}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No groups available</p>
                <p className="text-sm">Create groups first to assign users</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAssignGroupDialogOpen(false);
                  setAssigningUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  // For now, just close the dialog
                  // In a full implementation, we'd save the group assignments
                  toast({
                    title: "Feature Coming Soon",
                    description: "User group assignment functionality will be implemented in the next update",
                  });
                  setIsAssignGroupDialogOpen(false);
                  setAssigningUser(null);
                }}
              >
                Save Assignments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}