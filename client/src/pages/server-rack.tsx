import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Plus, Server, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import type { RackItem } from "@shared/schema";
import { cn } from "@/lib/utils";

const TOTAL_RACK_UNITS = 42;

const typeColors: Record<string, string> = {
  "Switch": "bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300",
  "Patch Panel": "bg-blue-500/20 border-blue-500/40 text-blue-800 dark:text-blue-300",
  "Server": "bg-violet-500/20 border-violet-500/40 text-violet-800 dark:text-violet-300",
  "UPS": "bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-300",
  "NVR": "bg-rose-500/20 border-rose-500/40 text-rose-800 dark:text-rose-300",
  "Cable Management": "bg-slate-500/15 border-slate-500/30 text-slate-600 dark:text-slate-400",
  "PDU": "bg-orange-500/20 border-orange-500/40 text-orange-800 dark:text-orange-300",
  "Firewall": "bg-red-500/20 border-red-500/40 text-red-800 dark:text-red-300",
};

export default function ServerRackPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<RackItem | null>(null);

  const { data: items, isLoading } = useQuery<RackItem[]>({
    queryKey: ["/api/rack-items"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/rack-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rack-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setAddOpen(false);
      toast({ title: "Rack item added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/rack-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rack-items"] });
      setEditItem(null);
      toast({ title: "Rack item updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rack-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rack-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Rack item removed" });
    },
  });

  // Build the rack visual
  const occupiedUnits = new Map<number, RackItem>();
  items?.forEach((item) => {
    for (let u = item.rackPosition; u < item.rackPosition + item.rackUnits; u++) {
      occupiedUnits.set(u, item);
    }
  });

  const renderRackForm = (onSubmit: (data: Record<string, unknown>) => void, defaults?: RackItem, isPending?: boolean, label?: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: fd.get("name") as string,
          type: fd.get("type") as string,
          model: fd.get("model") as string || null,
          rackPosition: parseInt(fd.get("rackPosition") as string),
          rackUnits: parseInt(fd.get("rackUnits") as string) || 1,
          ipAddress: fd.get("ipAddress") as string || null,
          status: fd.get("status") as string,
          notes: fd.get("notes") as string || null,
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="name">Name</Label><Input id="name" name="name" placeholder="Core Switch 1" required defaultValue={defaults?.name || ""} data-testid="input-rack-name" /></div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={defaults?.type || "Server"}>
            <SelectTrigger data-testid="select-rack-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Server", "Switch", "Patch Panel", "UPS", "NVR", "Cable Management", "PDU", "Firewall"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="model">Model</Label><Input id="model" name="model" placeholder="Dell PowerEdge" defaultValue={defaults?.model || ""} data-testid="input-rack-model" /></div>
        <div><Label htmlFor="ipAddress">IP Address</Label><Input id="ipAddress" name="ipAddress" placeholder="10.0.5.1" defaultValue={defaults?.ipAddress || ""} data-testid="input-rack-ip" /></div>
        <div><Label htmlFor="rackPosition">Rack Position (U)</Label><Input id="rackPosition" name="rackPosition" type="number" min={1} max={TOTAL_RACK_UNITS} required defaultValue={defaults?.rackPosition || 1} data-testid="input-rack-pos" /></div>
        <div><Label htmlFor="rackUnits">Height (U)</Label><Input id="rackUnits" name="rackUnits" type="number" min={1} max={10} defaultValue={defaults?.rackUnits || 1} data-testid="input-rack-units" /></div>
        <div className="col-span-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaults?.status || "active"}>
            <SelectTrigger data-testid="select-rack-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" className="resize-none" defaultValue={defaults?.notes || ""} data-testid="input-rack-notes" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-rack">
        {isPending ? "Saving..." : label || "Save"}
      </Button>
    </form>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Server Rack" />
        <Skeleton className="h-96 w-full max-w-lg rounded-md" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Server Rack"
        description={`${items?.length || 0} items in a ${TOTAL_RACK_UNITS}U rack`}
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-rack-item">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Rack Item</DialogTitle></DialogHeader>
              {renderRackForm((data) => createMutation.mutate(data), undefined, createMutation.isPending, "Add Item")}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Rack */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Rack Diagram</h2>
            <div className="space-y-0.5">
              {Array.from({ length: TOTAL_RACK_UNITS }, (_, i) => i + 1).map((u) => {
                const item = occupiedUnits.get(u);
                const isStart = item && item.rackPosition === u;
                const isOccupied = !!item;

                if (isOccupied && !isStart) return null;

                const colorClass = item ? (typeColors[item.type] || "bg-muted border-border") : "";

                return (
                  <Tooltip key={u}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-2 border rounded-sm px-2 transition-colors cursor-pointer",
                          isOccupied
                            ? colorClass
                            : "border-dashed border-border/50 text-muted-foreground/40"
                        )}
                        style={{ height: item ? `${item.rackUnits * 28}px` : "28px" }}
                        onClick={() => item && setEditItem(item)}
                        data-testid={`rack-unit-${u}`}
                      >
                        <span className="text-[10px] font-mono tabular-nums w-5 text-center opacity-60">{u}</span>
                        {item ? (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Server className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs font-medium truncate">{item.name}</span>
                              <span className="text-[10px] opacity-60 hidden sm:inline">{item.type}</span>
                            </div>
                            {item.ipAddress && <span className="text-[10px] font-mono opacity-60 flex-shrink-0">{item.ipAddress}</span>}
                          </div>
                        ) : (
                          <span className="text-[10px]">Empty</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    {item && (
                      <TooltipContent>
                        <div className="text-xs space-y-0.5">
                          <div className="font-medium">{item.name}</div>
                          <div>{item.type} — {item.model || "Unknown model"}</div>
                          <div>Position: U{item.rackPosition} ({item.rackUnits}U)</div>
                          {item.ipAddress && <div>IP: {item.ipAddress}</div>}
                          {item.notes && <div>Note: {item.notes}</div>}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>

            {/* Type legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t text-[10px] text-muted-foreground">
              {Object.entries(typeColors).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className={cn("w-3 h-3 rounded-sm border", cls)} />
                  {type}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Item List */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Items</h2>
            <div className="space-y-2">
              {items?.sort((a, b) => a.rackPosition - b.rackPosition).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.type} — U{item.rackPosition} ({item.rackUnits}U){item.model ? ` — ${item.model}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={item.status} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditItem(item)} data-testid={`button-edit-rack-${item.id}`}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-rack-${item.id}`}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!items || items.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No rack items</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editItem?.name}</DialogTitle></DialogHeader>
          {editItem && renderRackForm(
            (data) => updateMutation.mutate({ id: editItem.id, data }),
            editItem,
            updateMutation.isPending,
            "Save Changes"
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
