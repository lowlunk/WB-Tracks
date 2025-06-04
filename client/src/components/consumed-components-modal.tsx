import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Calendar, MapPin, User, X } from "lucide-react";
import { format } from "date-fns";

interface ConsumedComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumedTransactions: any[];
  isLoading: boolean;
}

export default function ConsumedComponentsModal({ 
  isOpen, 
  onClose, 
  consumedTransactions, 
  isLoading 
}: ConsumedComponentsModalProps) {
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consumed Components</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Consumed Components ({consumedTransactions.length})</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {consumedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg mb-2">No Consumed Components</p>
            <p className="text-sm">No components have been consumed in production yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Components that have been consumed during production processes
            </div>
            
            <div className="space-y-3">
              {consumedTransactions.map((transaction: any) => (
                <Card key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {transaction.component?.componentNumber}
                            </h3>
                            <Badge variant="destructive" className="text-xs">
                              CONSUMED
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {transaction.component?.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Package className="h-3 w-3" />
                              <span>Qty: {transaction.quantity}</span>
                            </div>
                            
                            {transaction.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{transaction.location.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          </div>
                          
                          {transaction.notes && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                              <strong>Notes:</strong> {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          -{transaction.quantity}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          items consumed
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Total consumed transactions: {consumedTransactions.length}</span>
                <span>
                  Total items consumed: {consumedTransactions.reduce((sum: number, t: any) => sum + t.quantity, 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}