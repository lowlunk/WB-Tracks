
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  const autoLoginMutation = useMutation({
    mutationFn: async (): Promise<User> => {
      const res = await fetch("/api/auto-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Auto-login failed");
      }
      
      const data = await res.json();
      return data.user;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/auth/user"], userData);
    },
  });

  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<User | null> => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          // Try auto-login once
          try {
            const userData = await autoLoginMutation.mutateAsync();
            return userData;
          } catch (autoLoginError) {
            console.log("Auto-login failed, user not authenticated");
            return null;
          }
        }
        
        if (!res.ok) {
          console.error(`Auth check failed: ${res.status}: ${res.statusText}`);
          return null;
        }
        
        const userData = await res.json();
        return userData;
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Logout failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  // Set initialized when auth check is complete
  useEffect(() => {
    if (!userLoading && !autoLoginMutation.isPending) {
      setIsInitialized(true);
    }
  }, [userLoading, autoLoginMutation.isPending]);

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | undefined,
    isLoading: !isInitialized,
    isAuthenticated: !!user,
    logout,
    error,
  };
}
