import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ArrowRight, ArrowLeft, Play, CheckCircle, MousePointer, Eye, Hand, Zap, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  id: string;
  title: string;
  description: string;
  element: string;
  position: "top" | "bottom" | "left" | "right";
  action?: string;
  interactive?: boolean;
  type?: "click" | "hover" | "observe" | "input";
  category?: "basic" | "advanced" | "admin";
  icon?: string;
  duration?: number;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to WB-Tracks",
    description: "Your complete inventory management solution for tracking components between main inventory and production line locations.",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "play",
    duration: 3000
  },
  {
    id: "header",
    title: "Navigation Header",
    description: "Quick access to notifications, barcode scanning, and user settings. The notification bell shows low stock alerts and activity updates.",
    element: "header",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye",
    interactive: true
  },
  {
    id: "notifications",
    title: "Smart Notifications",
    description: "Real-time alerts for low stock, transfers, and system updates. Click the bell to see notification history and configure preferences.",
    element: "[data-tour='notifications']",
    position: "bottom",
    type: "click",
    category: "basic",
    icon: "target",
    action: "Try clicking the notification bell",
    interactive: true
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "See real-time inventory statistics, recent activity, and system alerts. Monitor total components and stock levels across all locations.",
    element: "[data-tour='dashboard-stats']",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye"
  },
  {
    id: "quick-actions",
    title: "Quick Action Center",
    description: "Access frequently used features instantly: scan barcodes, transfer items, consume inventory, and add new components.",
    element: "[data-tour='quick-actions']",
    position: "left",
    type: "hover",
    category: "basic",
    icon: "zap",
    action: "Hover over the action buttons to see their functions",
    interactive: true
  },
  {
    id: "navigation",
    title: "Bottom Navigation",
    description: "Switch between Dashboard, Main Inventory, Line Inventory, All Inventory, and Admin sections using these tabs.",
    element: "nav",
    position: "top",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Try clicking different navigation tabs"
  },
  {
    id: "barcode-scanning",
    title: "Barcode Scanning Power",
    description: "Use camera-based scanning to quickly find components, add inventory, or process transfers. Supports multiple barcode formats and QR codes.",
    element: "[data-tour='scan-button']",
    position: "bottom",
    type: "click",
    category: "advanced",
    icon: "target",
    action: "Click to test barcode scanning",
    interactive: true
  },
  {
    id: "main-inventory",
    title: "Main Inventory Hub",
    description: "Central storage management with search, filtering, and bulk operations. View stock levels, component details, and transaction history.",
    element: "[data-tour='main-inventory']",
    position: "top",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Navigate to Main Inventory to explore features"
  },
  {
    id: "line-inventory",
    title: "Production Line Control",
    description: "Real-time production inventory tracking with consumption logging, transfer requests, and low stock alerts for line operations.",
    element: "[data-tour='line-inventory']",
    position: "top",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Switch to Line Inventory to see production stock"
  },
  {
    id: "component-management",
    title: "Component Lifecycle",
    description: "Complete component management: create, edit, photo uploads, barcode generation, and detailed tracking with full audit trails.",
    element: "[data-tour='add-component']",
    position: "left",
    type: "click",
    category: "advanced",
    icon: "hand",
    action: "Try adding a new component",
    interactive: true
  },
  {
    id: "transfers",
    title: "Smart Transfers",
    description: "Seamless inventory movement between locations with real-time updates, automatic stock adjustments, and complete transaction logging.",
    element: "[data-tour='transfer-button']",
    position: "left",
    type: "click",
    category: "advanced",
    icon: "hand",
    action: "Practice transferring inventory",
    interactive: true
  },
  {
    id: "consume-tracking",
    title: "Production Consumption",
    description: "Track production usage separately from transfers. Monitor what's consumed, by whom, and for which projects with detailed reporting.",
    element: "[data-tour='consume-button']",
    position: "left",
    type: "click",
    category: "advanced",
    icon: "zap",
    action: "Learn about consumption tracking"
  },
  {
    id: "search-and-filter",
    title: "Advanced Search",
    description: "Powerful search capabilities across components, locations, and transactions. Use filters to find exactly what you need quickly.",
    element: "[data-tour='search']",
    position: "bottom",
    type: "input",
    category: "advanced",
    icon: "target",
    action: "Try searching for a component",
    interactive: true
  },
  {
    id: "admin",
    title: "Administrative Control",
    description: "Complete system administration: user management, facility setup, permissions, and system configuration for enterprise deployment.",
    element: "[data-tour='admin-tab']",
    position: "top",
    type: "click",
    category: "admin",
    icon: "hand",
    action: "Explore admin features (admin users only)"
  },
  {
    id: "completion",
    title: "Ready to Start!",
    description: "You're all set to use WB-Tracks effectively. Remember: scan for speed, transfer for flow, and monitor for control. Happy tracking!",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "checkCircle",
    duration: 2000
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "basic" | "advanced" | "complete";
}

export default function OnboardingTour({ isOpen, onClose, mode = "complete" }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());
  const [tourProgress, setTourProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Filter steps based on mode and user role
  const filteredSteps = tourSteps.filter(step => {
    if (step.category === 'admin' && user?.role !== 'admin') return false;
    if (mode === 'basic' && step.category === 'advanced') return false;
    return true;
  });

  useEffect(() => {
    if (isOpen && currentStep < filteredSteps.length) {
      const step = filteredSteps[currentStep];
      const element = document.querySelector(step.element) as HTMLElement;
      setHighlightElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add interactive highlighting effects
        if (step.interactive) {
          element.style.transition = 'all 0.3s ease';
          element.style.transform = 'scale(1.02)';
          element.style.zIndex = '1000';
        }
      }

      // Auto-advance for observe steps with duration
      if (step.type === 'observe' && step.duration && !isPaused) {
        timeoutRef.current = setTimeout(() => {
          handleNext();
        }, step.duration);
      }

      // Update progress
      setTourProgress((currentStep / filteredSteps.length) * 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, isOpen, isPaused]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset any element transformations
      document.querySelectorAll('[style*="transform"]').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.transform = '';
          el.style.zIndex = '';
        }
      });
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsInteracting(false);
    } else {
      localStorage.setItem('wb-tracks-tour-completed', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsInteracting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('wb-tracks-tour-skipped', 'true');
    onClose();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleInteractionComplete = (stepId: string) => {
    setCompletedInteractions(prev => {
      const newSet = new Set(prev);
      newSet.add(stepId);
      return newSet;
    });
    setIsInteracting(true);
  };

  const getStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'play': return <Play className="h-4 w-4" />;
      case 'eye': return <Eye className="h-4 w-4" />;
      case 'hand': return <Hand className="h-4 w-4" />;
      case 'target': return <Target className="h-4 w-4" />;
      case 'zap': return <Zap className="h-4 w-4" />;
      case 'checkCircle': return <CheckCircle className="h-4 w-4" />;
      default: return <MousePointer className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTooltipPosition = () => {
    if (!highlightElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = highlightElement.getBoundingClientRect();
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'top':
        top = rect.top - tooltipHeight - 20;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - 20;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + 20;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

    return { top: `${top}px`, left: `${left}px` };
  };

  const getHighlightStyle = () => {
    if (!highlightElement) return {};

    const rect = highlightElement.getBoundingClientRect();
    return {
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
    };
  };

  if (!currentStepData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Animated Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          {/* Interactive Highlight Box with Pulse Animation */}
          {highlightElement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: currentStepData.interactive ? 
                  "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)" : 
                  "0 0 0 2px rgba(59, 130, 246, 0.5)"
              }}
              className={`absolute border-2 border-blue-500 bg-blue-500/10 rounded-lg pointer-events-none z-51 transition-all duration-300 ${
                currentStepData.interactive ? 'animate-pulse' : ''
              }`}
              style={getHighlightStyle()}
            >
              {/* Floating Action Indicator */}
              {currentStepData.interactive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {getStepIcon(currentStepData.icon)}
                    <span className="capitalize">{currentStepData.type}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Enhanced Tour Tooltip with Animations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card 
              className="absolute w-96 bg-white dark:bg-gray-800 shadow-2xl z-52 border-0 overflow-hidden"
              style={getTooltipPosition()}
            >
              {/* Progress Bar at Top */}
              <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${tourProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                />
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: currentStepData.type === 'observe' ? 360 : 0 }}
                      transition={{ duration: 2, repeat: currentStepData.type === 'observe' ? Infinity : 0 }}
                      className={`p-2 rounded-full ${getCategoryColor(currentStepData.category)}`}
                    >
                      {getStepIcon(currentStepData.icon)}
                    </motion.div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {currentStepData.title}
                        <Badge variant="outline" className="text-xs">
                          {currentStepData.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Step {currentStep + 1} of {filteredSteps.length}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {currentStepData.duration && (
                      <Button variant="ghost" size="sm" onClick={handlePause}>
                        <motion.div animate={{ scale: isPaused ? 1.1 : 1 }}>
                          {isPaused ? <Play className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </motion.div>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleSkip}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  {currentStepData.description}
                </motion.p>
                
                {currentStepData.action && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        {currentStepData.action}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Elements Status */}
                {currentStepData.interactive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-gray-500"
                  >
                    {isInteracting ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-green-600"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Interaction detected!</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1"
                      >
                        <MousePointer className="h-3 w-3" />
                        <span>Try the suggested action</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button variant="outline" size="sm" onClick={handlePrevious}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSkip}>
                      Skip Tour
                    </Button>
                    <Button size="sm" onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {isLastStep ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{Math.round(tourProgress)}%</span>
                  </div>
                  <Progress value={tourProgress} className="h-2" />
                  <div className="flex gap-1">
                    {filteredSteps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: 1, 
                          scale: index === currentStep ? 1.2 : 1,
                          backgroundColor: index <= currentStep ? '#3B82F6' : '#E5E7EB'
                        }}
                        className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                          index <= currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Tour Mode Indicator */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Badge variant="secondary" className="text-xs">
                    {mode} mode
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {filteredSteps.filter(s => s.category === 'basic').length} basic • 
                    {filteredSteps.filter(s => s.category === 'advanced').length} advanced
                    {user?.role === 'admin' && ` • ${filteredSteps.filter(s => s.category === 'admin').length} admin`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}