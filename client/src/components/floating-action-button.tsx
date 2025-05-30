import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  Plus, 
  ArrowRightLeft,
  X,
  Printer
} from "lucide-react";

interface FloatingActionButtonProps {
  onScan: () => void;
  onTransfer: () => void;
  onAddItem?: () => void;
  onPrintLabel?: () => void;
}

export default function FloatingActionButton({ 
  onScan, 
  onTransfer, 
  onAddItem,
  onPrintLabel
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 wb-no-print">
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div className="relative">
        {/* Expandable Menu */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 mb-2 wb-fade-in">
            <div className="flex flex-col space-y-3">
              {/* Scan Action */}
              <Button
                onClick={() => handleAction(onScan)}
                className="flex items-center space-x-3 bg-[hsl(var(--wb-surface))] hover:bg-gray-50 dark:hover:bg-gray-800 text-[hsl(var(--wb-on-surface))] px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 wb-touch-target"
              >
                <QrCode className="h-5 w-5 text-[hsl(var(--wb-primary))]" />
                <span className="text-sm font-medium">Scan Barcode</span>
              </Button>

              {/* Transfer Action */}
              <Button
                onClick={() => handleAction(onTransfer)}
                className="flex items-center space-x-3 bg-[hsl(var(--wb-surface))] hover:bg-gray-50 dark:hover:bg-gray-800 text-[hsl(var(--wb-on-surface))] px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 wb-touch-target"
              >
                <ArrowRightLeft className="h-5 w-5 text-[hsl(var(--wb-secondary))]" />
                <span className="text-sm font-medium">Transfer Items</span>
              </Button>

              {/* Add Item Action (if provided) */}
              {onAddItem && (
                <Button
                  onClick={() => handleAction(onAddItem)}
                  className="flex items-center space-x-3 bg-[hsl(var(--wb-surface))] hover:bg-gray-50 dark:hover:bg-gray-800 text-[hsl(var(--wb-on-surface))] px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 wb-touch-target"
                >
                  <Plus className="h-5 w-5 text-[hsl(var(--wb-accent))]" />
                  <span className="text-sm font-medium">Add New Item</span>
                </Button>
              )}

              {/* Print Label Action (if provided) */}
              {onPrintLabel && (
                <Button
                  onClick={() => handleAction(onPrintLabel)}
                  className="flex items-center space-x-3 bg-[hsl(var(--wb-surface))] hover:bg-gray-50 dark:hover:bg-gray-800 text-[hsl(var(--wb-on-surface))] px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 wb-touch-target"
                >
                  <Printer className="h-5 w-5 text-[hsl(var(--wb-accent))]" />
                  <span className="text-sm font-medium">Print Label</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          onClick={toggleExpanded}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-110 wb-touch-target ${
            isExpanded 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'wb-btn-primary'
          }`}
        >
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
