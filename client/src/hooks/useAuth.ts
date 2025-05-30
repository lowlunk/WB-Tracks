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

  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null; // Return null for unauthenticated instead of throwing
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/logout", "POST"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  useEffect(() => {
    if (!userLoading) {
      setIsInitialized(true);
    }
  }, [userLoading]);

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | undefined,
    isLoading: !isInitialized || userLoading,
    isAuthenticated: !!user && !error,
    logout,
    error,
  };
}