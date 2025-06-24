import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const [showTour, setShowTour] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Walkthrough disabled per user preference
    // if (isAuthenticated && user) {
    //   const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${user.id}`);
    //   const hasSkippedOnboarding = localStorage.getItem(`onboarding-skipped-${user.id}`);
    //   
    //   if (!hasCompletedOnboarding && !hasSkippedOnboarding) {
    //     const timer = setTimeout(() => {
    //       setShowTour(true);
    //     }, 1500);
    //     
    //     return () => clearTimeout(timer);
    //   }
    // }
  }, [isAuthenticated, user]);

  const startTour = () => {
    setShowTour(true);
  };

  const completeTour = () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, "true");
      localStorage.setItem(`onboarding-completion-date-${user.id}`, new Date().toISOString());
    }
  };

  const skipTour = () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`onboarding-skipped-${user.id}`, "true");
      localStorage.setItem(`onboarding-skip-date-${user.id}`, new Date().toISOString());
    }
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding-completed-${user.id}`);
      localStorage.removeItem(`onboarding-skipped-${user.id}`);
      localStorage.removeItem(`onboarding-completion-date-${user.id}`);
      localStorage.removeItem(`onboarding-skip-date-${user.id}`);
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