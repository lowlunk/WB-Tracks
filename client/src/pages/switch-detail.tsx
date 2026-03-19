import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch as SwitchToggle } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Cable, Plus, Trash2, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Switch, SwitchPort } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function SwitchDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [editPort, setEditPort] = useState<SwitchPort | null>(null);
  const [addPortOpen, setAddPortOpen] = useState(false);
  const [editSwitchOpen, setEditSwitchOpen] = useState(false);

  const { data: sw, isLoading: swLoading } = useQuery<Switch>({
    queryKey: ["/api/switches", params.id],
  });

  const { data: ports, isLoading: portsLoading } = useQuery<SwitchPort[]>({
    queryKey: ["/api/switches", params.id, "ports"],
  });

  const updateSwitchMutation = useMutation({
    mutationFn: async (data: Partial<Switch>) => {
      const res = await apiRequest("PATCH", `/api/switches/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/switches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEditSwitchOpen(false);
      toast({ title: "Switch updated" });
    },
  });

  const createPortMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/switch-ports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches", params.id, "ports"] });
      setAddPortOpen(false);
      toast({ title: "Port added" });
    },
  });

  const updatePortMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SwitchPort> }) => {
      const res = await apiRequest("PATCH", `/api/switch-ports/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches", params.id, "ports"] });
      setEditPort(null);
      toast({ title: "Port updated" });
    },
  });

  const deletePortMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/switch-ports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches", params.id, "ports"] });
      toast({ title: "Port removed" });
    },
  });

  if (swLoading || portsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-12 gap-2">
          {[...Array(24)].map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
        </div>
      </div>
    );
  }

  if (!sw) return <div className="p-6 text-muted-foreground">Switch not found</div>;

  const sortedPorts = [...(ports || [])].sort((a, b) => a.portNumber - b.portNumber);
  const nextPortNumber = sortedPorts.length > 0 ? Math.max(...sortedPorts.map(p => p.portNumber)) + 1 : 1;

  const portColor = (status: string) => {
    switch (status) {
      case "in_use": return "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300";
      case "available": return "bg-muted border-border text-muted-foreground";
      case "reserved": return "bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300";
      case "faulty": return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300";
      default: return "bg-muted border-border text-muted-foreground";
    }
  };

  const handlePortSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPort) return;
    const fd = new FormData(e.currentTarget);
    updatePortMutation.mutate({
      id: editPort.id,
      data: {
        label: fd.get("label") as string || null,
        status: fd.get("status") as string,
        vlan: fd.get("vlan") as string || null,
        speed: fd.get("speed") as string || null,
        connectedTo: fd.get("connectedTo") as string || null,
        notes: fd.get("notes") as string || null,
      },
    });
  };

  const handleAddPort = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPortMutation.mutate({
      switchId: params.id,
      portNumber: parseInt(fd.get("portNumber") as string),
      label: fd.get("label") as string || null,
      status: fd.get("status") as string || "available",
      vlan: fd.get("vlan") as string || null,
      speed: fd.get("speed") as string || null,
      connectedTo: fd.get("connectedTo") as string || null,
      notes: fd.get("notes") as string || null,
    });
  };

  const handleEditSwitch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateSwitchMutation.mutate({
      name: fd.get("name") as string,
      model: fd.get("model") as string || null,
      ipAddress: fd.get("ipAddress") as string || null,
      location: fd.get("location") as string || null,
      totalPorts: parseInt(fd.get("totalPorts") as string) || sw.totalPorts,
      manageable: fd.get("manageable") === "on",
      status: fd.get("status") as string,
      notes: fd.get("notes") as string || null,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/switches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Switches
        </Link>
      </div>

      <PageHeader
        title={sw.name}
        description={`${sw.model || "Unknown model"} — ${sw.location || "No location"} — ${sw.ipAddress || "No IP"}`}
        actions={
          <div className="flex items-center gap-2">
            <Dialog open={editSwitchOpen} onOpenChange={setEditSwitchOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-edit-switch">
                  <Pencil className="h-4 w-4 mr-1" /> Edit Switch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit {sw.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleEditSwitch} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="sw-name">Name</Label><Input id="sw-name" name="name" defaultValue={sw.name} required data-testid="input-edit-switch-name" /></div>
                    <div><Label htmlFor="sw-model">Model</Label><Input id="sw-model" name="model" defaultValue={sw.model || ""} data-testid="input-edit-switch-model" /></div>
                    <div><Label htmlFor="sw-ip">IP Address</Label><Input id="sw-ip" name="ipAddress" defaultValue={sw.ipAddress || ""} data-testid="input-edit-switch-ip" /></div>
                    <div><Label htmlFor="sw-loc">Location</Label><Input id="sw-loc" name="location" defaultValue={sw.location || ""} data-testid="input-edit-switch-location" /></div>
                    <div><Label htmlFor="sw-ports">Total Ports</Label><Input id="sw-ports" name="totalPorts" type="number" defaultValue={sw.totalPorts} data-testid="input-edit-switch-ports" /></div>
                    <div>
                      <Label htmlFor="sw-status">Status</Label>
                      <Select name="status" defaultValue={sw.status}>
                        <SelectTrigger data-testid="select-edit-switch-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SwitchToggle id="sw-mgmt" name="manageable" defaultChecked={sw.manageable} />
                    <Label htmlFor="sw-mgmt">Manageable</Label>
                  </div>
                  <div><Label htmlFor="sw-notes">Notes</Label><Textarea id="sw-notes" name="notes" className="resize-none" defaultValue={sw.notes || ""} data-testid="input-edit-switch-notes" /></div>
                  <Button type="submit" className="w-full" disabled={updateSwitchMutation.isPending} data-testid="button-save-switch">
                    {updateSwitchMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addPortOpen} onOpenChange={setAddPortOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-port">
                  <Plus className="h-4 w-4 mr-1" /> Add Port
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Port to {sw.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleAddPort} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="ap-num">Port Number</Label><Input id="ap-num" name="portNumber" type="number" defaultValue={nextPortNumber} required data-testid="input-add-port-number" /></div>
                    <div><Label htmlFor="ap-label">Label</Label><Input id="ap-label" name="label" placeholder="Uplink 1" data-testid="input-add-port-label" /></div>
                    <div>
                      <Label htmlFor="ap-status">Status</Label>
                      <Select name="status" defaultValue="available">
                        <SelectTrigger data-testid="select-add-port-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in_use">In Use</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="faulty">Faulty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label htmlFor="ap-vlan">VLAN</Label><Input id="ap-vlan" name="vlan" placeholder="VLAN 20" data-testid="input-add-port-vlan" /></div>
                    <div><Label htmlFor="ap-speed">Speed</Label><Input id="ap-speed" name="speed" placeholder="100Mbps" data-testid="input-add-port-speed" /></div>
                    <div><Label htmlFor="ap-conn">Connected To</Label><Input id="ap-conn" name="connectedTo" placeholder="Server 1" data-testid="input-add-port-connected" /></div>
                  </div>
                  <div><Label htmlFor="ap-notes">Notes</Label><Input id="ap-notes" name="notes" placeholder="Optional notes" data-testid="input-add-port-notes" /></div>
                  <Button type="submit" className="w-full" disabled={createPortMutation.isPending} data-testid="button-submit-add-port">
                    {createPortMutation.isPending ? "Adding..." : "Add Port"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={sw.status} />
        <span className="text-sm text-muted-foreground">{sortedPorts.length} / {sw.totalPorts} ports configured</span>
        {sw.manageable && <span className="text-xs text-primary font-medium">Managed</span>}
        {sw.notes && <span className="text-xs text-muted-foreground">Note: {sw.notes}</span>}
      </div>

      {/* Port Grid */}
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Port Map</h2>
      <Card>
        <CardContent className="p-4">
          {sortedPorts.length > 0 ? (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {sortedPorts.map((port) => (
                  <Tooltip key={port.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setEditPort(port)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-2 rounded-md border text-xs font-mono transition-all cursor-pointer hover:ring-2 hover:ring-primary/30",
                          portColor(port.status)
                        )}
                        data-testid={`button-port-${port.portNumber}`}
                      >
                        <Cable className="h-3 w-3 mb-0.5" />
                        <span className="tabular-nums">{port.portNumber}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium">Port {port.portNumber}{port.label ? ` — ${port.label}` : ""}</div>
                        <div>Status: {port.status}</div>
                        {port.vlan && <div>VLAN: {port.vlan}</div>}
                        {port.speed && <div>Speed: {port.speed}</div>}
                        {port.connectedTo && <div>Connected: {port.connectedTo}</div>}
                        {port.notes && <div>Note: {port.notes}</div>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/50" /> In Use
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-muted border border-border" /> Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/50" /> Reserved
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/50" /> Faulty
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Cable className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No ports configured yet</p>
              <p className="text-xs mt-1">Click "Add Port" to start mapping ports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Port detail table */}
      {sortedPorts.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mt-6 mb-3">Port Details</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Port</th>
                      <th className="p-3 font-medium">Label</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">VLAN</th>
                      <th className="p-3 font-medium">Speed</th>
                      <th className="p-3 font-medium">Connected To</th>
                      <th className="p-3 font-medium">Notes</th>
                      <th className="p-3 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPorts.map((port) => (
                      <tr
                        key={port.id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        data-testid={`row-port-${port.portNumber}`}
                      >
                        <td className="p-3 font-mono tabular-nums">{port.portNumber}</td>
                        <td className="p-3">{port.label || "—"}</td>
                        <td className="p-3"><StatusBadge status={port.status} /></td>
                        <td className="p-3 font-mono text-xs">{port.vlan || "—"}</td>
                        <td className="p-3 text-xs">{port.speed || "—"}</td>
                        <td className="p-3 text-xs">{port.connectedTo || "—"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{port.notes || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditPort(port)} data-testid={`button-edit-port-${port.portNumber}`}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deletePortMutation.mutate(port.id)} data-testid={`button-delete-port-${port.portNumber}`}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Port Dialog */}
      <Dialog open={!!editPort} onOpenChange={(o) => !o && setEditPort(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Port {editPort?.portNumber}</DialogTitle>
          </DialogHeader>
          {editPort && (
            <form onSubmit={handlePortSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" defaultValue={editPort.label || ""} data-testid="input-port-label" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editPort.status}>
                    <SelectTrigger data-testid="select-port-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="faulty">Faulty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vlan">VLAN</Label>
                  <Input id="vlan" name="vlan" defaultValue={editPort.vlan || ""} data-testid="input-port-vlan" />
                </div>
                <div>
                  <Label htmlFor="speed">Speed</Label>
                  <Input id="speed" name="speed" defaultValue={editPort.speed || ""} data-testid="input-port-speed" />
                </div>
              </div>
              <div>
                <Label htmlFor="connectedTo">Connected To</Label>
                <Input id="connectedTo" name="connectedTo" defaultValue={editPort.connectedTo || ""} data-testid="input-port-connected" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" defaultValue={editPort.notes || ""} data-testid="input-port-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={updatePortMutation.isPending} data-testid="button-save-port">
                {updatePortMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
