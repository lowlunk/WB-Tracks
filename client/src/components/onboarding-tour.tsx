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
    title: "🎯 Welcome to WB-Tracks",
    description: "Let's take a quick tour! WB-Tracks helps you track components between your main storage and production lines. Think of it as your digital inventory assistant that knows where everything is and when it's running low.",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "play",
    duration: 4000
  },
  {
    id: "purpose",
    title: "🏭 Why WB-Tracks?",
    description: "Perfect for manufacturing environments where you need to move components from main storage to production lines, track what's consumed, and always know your stock levels in real-time.",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye",
    duration: 3500
  },
  {
    id: "dashboard-intro",
    title: "📊 Your Command Center",
    description: "This dashboard shows everything at a glance: total components, inventory levels, and recent activity. It's your starting point for daily operations.",
    element: "[data-tour='dashboard-stats']",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye",
    duration: 3000
  },
  {
    id: "navigation-basics",
    title: "🧭 Easy Navigation",
    description: "Use these tabs at the bottom to move around. Dashboard (home), Main Inventory (storage), Line Inventory (production), All Inventory (everything), and Admin (settings).",
    element: "nav",
    position: "top",
    type: "observe",
    category: "basic",
    icon: "hand",
    action: "Notice the five main sections",
    duration: 3000
  },
  {
    id: "quick-actions-intro",
    title: "⚡ Quick Actions",
    description: "These floating buttons give you instant access to your most common tasks. Hover over them to see what each one does!",
    element: "[data-tour='quick-actions']",
    position: "left",
    type: "hover",
    category: "basic",
    icon: "zap",
    action: "Hover over each button to see its function",
    interactive: true
  },
  {
    id: "scanning-power",
    title: "📱 Barcode Magic",
    description: "The camera icon opens a barcode scanner. Point your device's camera at any barcode to instantly find components, add stock, or process transfers. It's like having superpowers!",
    element: "[data-tour='scan-button']",
    position: "bottom",
    type: "click",
    category: "basic",
    icon: "target",
    action: "Click to see the barcode scanner in action",
    interactive: true
  },
  {
    id: "main-inventory-concept",
    title: "🏪 Main Inventory = Your Warehouse",
    description: "Main Inventory is your central storage area. This is where you keep the bulk of your components before they're needed on production lines.",
    element: "[data-tour='main-inventory']",
    position: "top",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Click to explore your main storage area"
  },
  {
    id: "line-inventory-concept",
    title: "🔧 Line Inventory = Production Floor",
    description: "Line Inventory shows what's currently on your production lines. When workers need components, you transfer them from Main to Line inventory.",
    element: "[data-tour='line-inventory']",
    position: "top",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Click to see your production line stock"
  },
  {
    id: "transfer-workflow",
    title: "🔄 Moving Components Around",
    description: "Transfers move components between locations. Use the transfer button to move items from Main to Line inventory when production needs them.",
    element: "[data-tour='transfer-button']",
    position: "left",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Click to practice transferring components",
    interactive: true
  },
  {
    id: "consumption-tracking",
    title: "📉 Tracking What Gets Used",
    description: "Consumption is different from transfers. When components are actually used in production (consumed), track it here. This helps you understand usage patterns.",
    element: "[data-tour='consume-button']",
    position: "left",
    type: "click",
    category: "basic",
    icon: "zap",
    action: "Click to learn about consumption tracking"
  },
  {
    id: "adding-components",
    title: "➕ Adding New Components",
    description: "When you get new components or need to add existing ones to the system, use the plus button. You can even take photos and generate barcodes!",
    element: "[data-tour='add-component']",
    position: "left",
    type: "click",
    category: "basic",
    icon: "hand",
    action: "Try adding a new component to see how it works",
    interactive: true
  },
  {
    id: "search-and-filter",
    title: "🔍 Finding Components Fast",
    description: "Use the search box to quickly find any component. You can search by part number, description, or any other detail. Much faster than scrolling through lists!",
    element: "[data-tour='search']",
    position: "bottom",
    type: "input",
    category: "basic",
    icon: "target",
    action: "Try searching for a component",
    interactive: true
  },
  {
    id: "notifications-system",
    title: "🔔 Stay Informed",
    description: "The notification bell alerts you to important events like low stock levels, completed transfers, and system updates. Never miss critical inventory issues!",
    element: "[data-tour='notifications']",
    position: "bottom",
    type: "click",
    category: "basic",
    icon: "target",
    action: "Click the bell to see your notifications",
    interactive: true
  },
  {
    id: "admin-features",
    title: "⚙️ Administrative Control",
    description: "Admin section lets you manage users, set up facilities, configure the system, and access advanced features. This is where you customize WB-Tracks for your operation.",
    element: "[data-tour='admin-tab']",
    position: "top",
    type: "click",
    category: "admin",
    icon: "hand",
    action: "Explore admin features (admin users only)"
  },
  {
    id: "daily-workflow",
    title: "📅 Your Daily Workflow",
    description: "Here's a typical day: Check dashboard for alerts → Scan barcodes to find components → Transfer items to production lines → Track consumption → Add new inventory as needed. Simple!",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye",
    duration: 4000
  },
  {
    id: "mobile-friendly",
    title: "📱 Works Everywhere",
    description: "WB-Tracks works great on phones, tablets, and computers. Use your phone to scan barcodes on the production floor, then check reports on your computer. Same data, everywhere!",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "eye",
    duration: 3000
  },
  {
    id: "completion",
    title: "🚀 You're Ready!",
    description: "That's it! You now know the basics of WB-Tracks. Start by exploring the Main Inventory, try scanning a barcode, and don't forget to check notifications regularly. Happy tracking! 🎉",
    element: "body",
    position: "bottom",
    type: "observe",
    category: "basic",
    icon: "checkCircle",
    duration: 3000
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
    
    // Add a small celebration for completed interactions
    if (currentStepData.interactive && isInteracting) {
      const confetti = document.createElement('div');
      confetti.innerHTML = '🎉';
      confetti.style.position = 'fixed';
      confetti.style.left = '50%';
      confetti.style.top = '50%';
      confetti.style.fontSize = '2rem';
      confetti.style.zIndex = '9999';
      confetti.style.animation = 'fadeOut 1s ease-out forwards';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 1000);
    }
    
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsInteracting(false);
    } else {
      localStorage.setItem('wb-tracks-tour-completed', 'true');
      localStorage.setItem('wb-tracks-tour-completion-date', new Date().toISOString());
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
    const tooltipWidth = Math.min(400, viewportWidth * 0.9); // Responsive width
    const tooltipHeight = 300; // Increased to account for actual content height
    const margin = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let actualPosition = currentStepData.position;

    // Calculate initial position based on preferred position
    switch (currentStepData.position) {
      case 'top':
        top = rect.top - tooltipHeight - margin;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + margin;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + margin;
        break;
    }

    // Check if tooltip would go outside viewport and adjust position
    const wouldOverflowTop = top < margin;
    const wouldOverflowBottom = top + tooltipHeight > viewportHeight - margin;
    const wouldOverflowLeft = left < margin;
    const wouldOverflowRight = left + tooltipWidth > viewportWidth - margin;

    // Try alternative positions if current position doesn't fit
    if (wouldOverflowTop || wouldOverflowBottom || wouldOverflowLeft || wouldOverflowRight) {
      // Try bottom position
      if (currentStepData.position !== 'bottom' && rect.bottom + margin + tooltipHeight <= viewportHeight - margin) {
        top = rect.bottom + margin;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        actualPosition = 'bottom';
      }
      // Try top position
      else if (currentStepData.position !== 'top' && rect.top - margin - tooltipHeight >= margin) {
        top = rect.top - tooltipHeight - margin;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        actualPosition = 'top';
      }
      // Try right position
      else if (currentStepData.position !== 'right' && rect.right + margin + tooltipWidth <= viewportWidth - margin) {
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + margin;
        actualPosition = 'right';
      }
      // Try left position
      else if (currentStepData.position !== 'left' && rect.left - margin - tooltipWidth >= margin) {
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - margin;
        actualPosition = 'left';
      }
      // Fallback: center on screen if no position works
      else {
        top = viewportHeight / 2 - tooltipHeight / 2;
        left = viewportWidth / 2 - tooltipWidth / 2;
        actualPosition = 'center';
      }
    }

    // Final boundary enforcement to absolutely ensure tooltip stays in viewport
    top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin));
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));

    return { 
      top: `${top}px`, 
      left: `${left}px`,
      position: actualPosition
    };
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
              className="absolute w-96 max-w-[90vw] bg-white dark:bg-gray-800 shadow-2xl z-52 border-0 overflow-hidden"
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
                  className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                  {currentStepData.description}
                </motion.p>

                {/* Progress indicator for observe steps */}
                {currentStepData.type === 'observe' && currentStepData.duration && !isPaused && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: currentStepData.duration / 1000, ease: 'linear' }}
                    className="h-1 bg-blue-500 rounded-full mt-2"
                  />
                )}
                
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