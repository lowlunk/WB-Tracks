import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package,
  Edit,
  ArrowRightLeft,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer
} from "lucide-react";
import BarcodeLabelPrinter from "@/components/barcode-label-printer";
import ComponentDetailModal from "@/components/component-detail-modal";
import ComponentEditModal from "@/components/component-edit-modal";
import ComponentIcon from "@/components/component-icon";
import type { Component } from "@shared/schema";

interface ComponentWithStock extends Component {
  mainStock?: number;
  lineStock?: number;
}

interface ComponentTableProps {
  components: ComponentWithStock[];
  isLoading: boolean;
  showLocationFilter?: boolean;
  onEdit: (component: ComponentWithStock) => void;
  onTransfer: (component: ComponentWithStock) => void;
  onViewDetails: (component: ComponentWithStock) => void;
}

export default function ComponentTable({
  components,
  isLoading,
  showLocationFilter = true,
  onEdit,
  onTransfer,
  onViewDetails,
}: ComponentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [locationFilter, setLocationFilter] = useState("");

  const [printingComponent, setPrintingComponent] = useState<Component | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [detailComponent, setDetailComponent] = useState<Component | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editComponent, setEditComponent] = useState<Component | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const itemsPerPage = 10;

  const handleEditClick = (component: Component) => {
    setEditComponent(component);
    setIsEditModalOpen(true);
  };

  const handlePrintClick = (component: Component) => {
    setPrintingComponent(component);
    setIsPrintModalOpen(true);
  };

  const handleComponentClick = (component: Component) => {
    setDetailComponent(component);
    setIsDetailModalOpen(true);
  };



  const filteredComponents = components.filter((component) => {
    const comp = component as ComponentWithStock;
    if (!locationFilter || locationFilter === "all") return true;
    if (locationFilter === "main") return (comp.mainStock || 0) > 0;
    if (locationFilter === "line") return (comp.lineStock || 0) > 0;
    return true;
  });

  const totalPages = Math.ceil(filteredComponents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComponents = filteredComponents.slice(startIndex, startIndex + itemsPerPage);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { variant: "secondary", color: "gray" };
    if (stock <= 5) return { variant: "destructive", color: "red" };
    return { variant: "default", color: "green" };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 wb-skeleton" />
        ))}
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No components found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your search criteria or add new components.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showLocationFilter && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by location:</span>
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="main">Main Inventory</SelectItem>
              <SelectItem value="line">Line Inventory</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden wb-chrome-mobile-fix">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <Table className="min-w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="font-semibold">Component</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold">Plate Number</TableHead>
              {showLocationFilter && (
                <>
                  <TableHead className="font-semibold">Main Stock</TableHead>
                  <TableHead className="font-semibold">Line Stock</TableHead>
                </>
              )}
              {!showLocationFilter && (
                <TableHead className="font-semibold">Quantity</TableHead>
              )}
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedComponents.map((component) => {
              const comp = component as ComponentWithStock;
              return (
              <TableRow 
                key={comp.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <ComponentIcon componentId={component.id} size="md" />
                    <div>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-medium text-[hsl(var(--wb-on-surface))] hover:text-blue-600 hover:underline"
                        onClick={() => handleComponentClick(component)}
                      >
                        {component.componentNumber}
                      </Button>
                      <div className="text-xs text-gray-500">
                        Click to view details
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-[hsl(var(--wb-on-surface))] max-w-md">
                    {component.description}
                  </div>
                </TableCell>
                 <TableCell>
                  <div className="text-sm text-[hsl(var(--wb-on-surface))] max-w-md">
                    {component.plateNumber || ''}
                  </div>
                </TableCell>
                {showLocationFilter && (
                  <>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {component.mainStock || 0}
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (component.mainStock || 0) > 20 ? 'bg-green-500' :
                              (component.mainStock || 0) > 5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((component.mainStock || 0) / 50) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {component.lineStock || 0}
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (component.lineStock || 0) > 10 ? 'bg-blue-500' :
                              (component.lineStock || 0) > 2 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((component.lineStock || 0) / 20) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </>
                )}
                {!showLocationFilter && (
                  <TableCell>
                    <Badge
                      variant={getStockStatus(component.mainStock || component.lineStock || 0).variant as any}
                      className="wb-badge-success"
                    >
                      {component.mainStock || component.lineStock || 0}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (component && onEdit) {
                          onEdit(component);
                        }
                      }}
                      className="wb-focus-visible"
                      title="Edit Component"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onTransfer(component)}
                      className="wb-focus-visible"
                      title="Transfer Component"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintClick(component)}
                      className="wb-focus-visible"
                      title="Print Label"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleComponentClick(component)}
                      className="wb-focus-visible"
                      title="View Details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(startIndex + itemsPerPage, filteredComponents.length)}
            </span>{" "}
            of <span className="font-medium">{filteredComponents.length}</span> components
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="wb-focus-visible"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {(() => {
                const maxVisiblePages = 5;
                const halfVisible = Math.floor(maxVisiblePages / 2);
                let startPage = Math.max(1, currentPage - halfVisible);
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Adjust start page if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                const pages = [];
                
                // Add first page and ellipsis if needed
                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className={`wb-focus-visible ${
                        currentPage === 1 ? "wb-btn-primary" : ""
                      }`}
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                }
                
                // Add visible page range
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className={`wb-focus-visible ${
                        currentPage === i ? "wb-btn-primary" : ""
                      }`}
                    >
                      {i}
                    </Button>
                  );
                }
                
                // Add ellipsis and last page if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className={`wb-focus-visible ${
                        currentPage === totalPages ? "wb-btn-primary" : ""
                      }`}
                    >
                      {totalPages}
                    </Button>
                  );
                }
                
                return pages;
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="wb-focus-visible"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}



      {/* Barcode Label Printer */}
      <BarcodeLabelPrinter
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintingComponent(null);
        }}
        component={printingComponent || undefined}
        onPrint={(labelData) => {
          console.log("Printing label:", labelData);
        }}
      />

      {/* Component Detail Modal */}
      {detailComponent && (
        <ComponentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailComponent(null);
          }}
          componentId={detailComponent.id}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setEditComponent(detailComponent);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {/* Component Edit Modal */}
      {editComponent && (
        <ComponentEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditComponent(null);
          }}
          componentId={editComponent.id}
        />
      )}
    </div>
  );
}