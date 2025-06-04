import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const autoLoginMutation = useMutation({
    mutationFn: async () => {
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
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (res.status === 401) {
          // If not authenticated, try auto-login once
          if (!autoLoginAttempted) {
            setAutoLoginAttempted(true);
            try {
              await autoLoginMutation.mutateAsync();
              // After successful auto-login, refetch user data
              const retryRes = await fetch("/api/auth/user", {
                credentials: "include",
                headers: {
                  'Cache-Control': 'no-cache',
                },
              });
              if (retryRes.ok) {
                return await retryRes.json();
              }
            } catch (autoLoginError) {
              console.log("Auto-login failed, user needs to login manually");
            }
          }
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/logout", "POST"),
    onSuccess: () => {
      queryClient.clear();
      setAutoLoginAttempted(false);
      // Just refresh the page instead of redirecting to login
      window.location.reload();
    },
  });

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
    isLoading: !isInitialized || userLoading || autoLoginMutation.isPending,
    isAuthenticated: !!user && user !== null,
    logout,
    error,
  };
}