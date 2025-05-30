import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const [showTour, setShowTour] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${user.id}`);
      
      if (!hasCompletedOnboarding) {
        // Show tour after a brief delay for better UX
        const timer = setTimeout(() => {
          setShowTour(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  const startTour = () => {
    setShowTour(true);
  };

  const completeTour = () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, "true");
    }
  };

  const skipTour = () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, "true");
    }
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding-completed-${user.id}`);
    }
  };

  return {
    showTour,
    startTour,
    completeTour,
    skipTour,
    resetOnboarding,
  };
}