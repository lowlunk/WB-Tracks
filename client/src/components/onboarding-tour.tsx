import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TourStep {
  id: string;
  title: string;
  description: string;
  element: string;
  position: "top" | "bottom" | "left" | "right";
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to WB-Tracks",
    description: "Your complete inventory management solution for tracking components between main inventory and production line locations.",
    element: "body",
    position: "bottom"
  },
  {
    id: "header",
    title: "Navigation Header",
    description: "Quick access to notifications, barcode scanning, and user settings. The notification bell shows low stock alerts and activity updates.",
    element: "header",
    position: "bottom"
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "See real-time inventory statistics, recent activity, and system alerts. Monitor total components and stock levels across all locations.",
    element: "[data-tour='dashboard-stats']",
    position: "bottom"
  },
  {
    id: "navigation",
    title: "Bottom Navigation",
    description: "Switch between Dashboard, Main Inventory, Line Inventory, All Inventory, and Admin sections using these tabs.",
    element: "nav",
    position: "top"
  },
  {
    id: "main-inventory",
    title: "Main Inventory",
    description: "View and manage components in your main storage area. Add new inventory, transfer items, and track stock levels.",
    element: "[data-tour='main-inventory']",
    position: "top",
    action: "Click Main Inventory tab to explore"
  },
  {
    id: "line-inventory",
    title: "Line Inventory",
    description: "Monitor components at your production line. Track consumption, request transfers from main inventory, and manage line stock.",
    element: "[data-tour='line-inventory']",
    position: "top",
    action: "Click Line Inventory tab to see production stock"
  },
  {
    id: "barcode-scanning",
    title: "Barcode Scanning",
    description: "Use the scan button in the header to quickly find components, add inventory, or process transfers using barcode/QR codes.",
    element: "[data-tour='scan-button']",
    position: "bottom"
  },
  {
    id: "component-management",
    title: "Component Management",
    description: "Add new components, edit details, upload photos, and print barcode labels. Each component has a unique number and tracking history.",
    element: "[data-tour='add-component']",
    position: "left"
  },
  {
    id: "transfers",
    title: "Inventory Transfers",
    description: "Move components between locations with full tracking. Transfer from main to line inventory or between different facilities.",
    element: "[data-tour='transfer-button']",
    position: "left"
  },
  {
    id: "admin",
    title: "Admin Features",
    description: "Manage users, facilities, and system settings. Control access permissions and configure inventory thresholds for alerts.",
    element: "[data-tour='admin-tab']",
    position: "top",
    action: "Available for admin users only"
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.element) as HTMLElement;
      setHighlightElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Skip admin step if user is not admin
  const filteredSteps = tourSteps.filter(step => 
    step.id !== 'admin' || user?.role === 'admin'
  );

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
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

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight Box */}
      {highlightElement && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-lg pointer-events-none z-51 transition-all duration-300"
          style={getHighlightStyle()}
        />
      )}

      {/* Tour Tooltip */}
      <Card 
        className="absolute w-96 bg-white dark:bg-gray-800 shadow-2xl z-52 transition-all duration-300"
        style={getTooltipPosition()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Step {currentStep + 1} of {filteredSteps.length}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
              💡 {currentStepData.action}
            </div>
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
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finish
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

          {/* Progress indicator */}
          <div className="mt-4 flex gap-1">
            {filteredSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full flex-1 transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}