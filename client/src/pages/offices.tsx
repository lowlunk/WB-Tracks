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
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Trash2, ChevronDown, Cable, Pencil } from "lucide-react";
import { useState } from "react";
import type { Office, PortPlate } from "@shared/schema";

export default function OfficesPage() {
  const { toast } = useToast();
  const [addOfficeOpen, setAddOfficeOpen] = useState(false);
  const [addPlateOpen, setAddPlateOpen] = useState<string | null>(null);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [editPlate, setEditPlate] = useState<PortPlate | null>(null);
  const [search, setSearch] = useState("");
  const [expandedOffices, setExpandedOffices] = useState<Set<string>>(new Set());

  const { data: offices, isLoading: officesLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: plates } = useQuery<PortPlate[]>({
    queryKey: ["/api/port-plates"],
  });

  const createOfficeMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/offices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setAddOfficeOpen(false);
      toast({ title: "Office added" });
    },
  });

  const updateOfficeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/offices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      setEditOffice(null);
      toast({ title: "Office updated" });
    },
  });

  const deleteOfficeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/offices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Office removed" });
    },
  });

  const createPlateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/port-plates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/port-plates"] });
      setAddPlateOpen(null);
      toast({ title: "Port plate added" });
    },
  });

  const updatePlateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/port-plates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/port-plates"] });
      setEditPlate(null);
      toast({ title: "Port plate updated" });
    },
  });

  const deletePlateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/port-plates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/port-plates"] });
      toast({ title: "Port plate removed" });
    },
  });

  const filtered = offices?.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.occupant || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.department || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const toggleExpand = (id: string) => {
    setExpandedOffices(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getOfficePlates = (officeId: string) => plates?.filter(p => p.officeId === officeId) || [];

  if (officesLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Offices" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Offices"
        description={`${offices?.length || 0} offices and rooms`}
        actions={
          <Dialog open={addOfficeOpen} onOpenChange={setAddOfficeOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-office">
                <Plus className="h-4 w-4 mr-1" /> Add Office
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Office</DialogTitle></DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createOfficeMutation.mutate({
                    name: fd.get("name") as string,
                    building: fd.get("building") as string || null,
                    floor: fd.get("floor") as string || null,
                    occupant: fd.get("occupant") as string || null,
                    department: fd.get("department") as string || null,
                    notes: fd.get("notes") as string || null,
                  });
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="name">Name</Label><Input id="name" name="name" placeholder="Office 101" required data-testid="input-office-name" /></div>
                  <div><Label htmlFor="building">Building</Label><Input id="building" name="building" placeholder="Main" data-testid="input-office-building" /></div>
                  <div><Label htmlFor="floor">Floor</Label><Input id="floor" name="floor" placeholder="1" data-testid="input-office-floor" /></div>
                  <div><Label htmlFor="occupant">Occupant</Label><Input id="occupant" name="occupant" placeholder="John Smith" data-testid="input-office-occupant" /></div>
                  <div className="col-span-2"><Label htmlFor="department">Department</Label><Input id="department" name="department" placeholder="Engineering" data-testid="input-office-dept" /></div>
                </div>
                <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" className="resize-none" data-testid="input-office-notes" /></div>
                <Button type="submit" className="w-full" disabled={createOfficeMutation.isPending} data-testid="button-submit-office">
                  {createOfficeMutation.isPending ? "Adding..." : "Add Office"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search offices, occupants, departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-offices"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((office) => {
          const officePlates = getOfficePlates(office.id);
          const isExpanded = expandedOffices.has(office.id);

          return (
            <Collapsible key={office.id} open={isExpanded} onOpenChange={() => toggleExpand(office.id)}>
              <Card>
                <CardContent className="p-0">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{office.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                          {office.building && <span>{office.building}</span>}
                          {office.floor && <span>Floor {office.floor}</span>}
                          {office.occupant && <span>{office.occupant}</span>}
                          {office.department && <Badge variant="secondary" className="text-xs no-default-hover-elevate no-default-active-elevate">{office.department}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {officePlates.length > 0 && (
                        <span className="text-xs text-muted-foreground">{officePlates.length} plate{officePlates.length !== 1 ? "s" : ""}</span>
                      )}
                      <div role="button" tabIndex={0} className="p-1 rounded-md hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setEditOffice(office); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditOffice(office); }}} data-testid={`button-edit-office-${office.id}`}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div role="button" tabIndex={0} className="p-1 rounded-md hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); deleteOfficeMutation.mutate(office.id); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); deleteOfficeMutation.mutate(office.id); }}} data-testid={`button-delete-office-${office.id}`}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t">
                      <div className="flex items-center justify-between mt-3 mb-2">
                        <h3 className="text-xs font-medium text-muted-foreground">Port Plates</h3>
                        <Dialog open={addPlateOpen === office.id} onOpenChange={(o) => setAddPlateOpen(o ? office.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" data-testid={`button-add-plate-${office.id}`}>
                              <Plus className="h-3 w-3 mr-1" /> Add Plate
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Add Port Plate to {office.name}</DialogTitle></DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                createPlateMutation.mutate({
                                  officeId: office.id,
                                  plateLabel: fd.get("plateLabel") as string,
                                  portCount: parseInt(fd.get("portCount") as string) || 2,
                                  connectedSwitchId: fd.get("connectedSwitchId") as string || null,
                                  connectedPorts: fd.get("connectedPorts") as string || null,
                                  status: "active",
                                  notes: fd.get("notes") as string || null,
                                });
                              }}
                              className="space-y-3"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label htmlFor="plateLabel">Plate Label</Label><Input id="plateLabel" name="plateLabel" placeholder="PP-101A" required data-testid="input-plate-label" /></div>
                                <div><Label htmlFor="portCount">Port Count</Label><Input id="portCount" name="portCount" type="number" defaultValue={2} data-testid="input-plate-ports" /></div>
                                <div><Label htmlFor="connectedSwitchId">Connected Switch ID</Label><Input id="connectedSwitchId" name="connectedSwitchId" placeholder="sw-1" data-testid="input-plate-switch" /></div>
                                <div><Label htmlFor="connectedPorts">Connected Ports</Label><Input id="connectedPorts" name="connectedPorts" placeholder="1,2" data-testid="input-plate-connected" /></div>
                              </div>
                              <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" className="resize-none" data-testid="input-plate-notes" /></div>
                              <Button type="submit" className="w-full" disabled={createPlateMutation.isPending} data-testid="button-submit-plate">
                                {createPlateMutation.isPending ? "Adding..." : "Add Port Plate"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {officePlates.length > 0 ? (
                        <div className="space-y-2">
                          {officePlates.map((plate) => (
                            <div key={plate.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <Cable className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <div className="text-xs">
                                  <span className="font-medium font-mono">{plate.plateLabel}</span>
                                  <span className="text-muted-foreground ml-2">{plate.portCount} ports</span>
                                  {plate.connectedPorts && <span className="text-muted-foreground ml-2">Ports: {plate.connectedPorts}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={plate.status} />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditPlate(plate)} data-testid={`button-edit-plate-${plate.id}`}>
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deletePlateMutation.mutate(plate.id)} data-testid={`button-delete-plate-${plate.id}`}>
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-4">No port plates configured</div>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No offices found</p>
          </div>
        )}
      </div>

      {/* Edit Port Plate Dialog */}
      <Dialog open={!!editPlate} onOpenChange={(o) => !o && setEditPlate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editPlate?.plateLabel}</DialogTitle></DialogHeader>
          {editPlate && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updatePlateMutation.mutate({
                  id: editPlate.id,
                  data: {
                    plateLabel: fd.get("plateLabel") as string,
                    portCount: parseInt(fd.get("portCount") as string) || 2,
                    connectedSwitchId: fd.get("connectedSwitchId") as string || null,
                    connectedPorts: fd.get("connectedPorts") as string || null,
                    status: fd.get("status") as string,
                    notes: fd.get("notes") as string || null,
                  },
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="ep-label">Plate Label</Label><Input id="ep-label" name="plateLabel" defaultValue={editPlate.plateLabel} required /></div>
                <div><Label htmlFor="ep-count">Port Count</Label><Input id="ep-count" name="portCount" type="number" defaultValue={editPlate.portCount} /></div>
                <div><Label htmlFor="ep-switch">Connected Switch ID</Label><Input id="ep-switch" name="connectedSwitchId" defaultValue={editPlate.connectedSwitchId || ""} /></div>
                <div><Label htmlFor="ep-ports">Connected Ports</Label><Input id="ep-ports" name="connectedPorts" defaultValue={editPlate.connectedPorts || ""} /></div>
                <div className="col-span-2">
                  <Label htmlFor="ep-status">Status</Label>
                  <Select name="status" defaultValue={editPlate.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label htmlFor="ep-notes">Notes</Label><Textarea id="ep-notes" name="notes" className="resize-none" defaultValue={editPlate.notes || ""} /></div>
              <Button type="submit" className="w-full" disabled={updatePlateMutation.isPending}>
                {updatePlateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Office Dialog */}
      <Dialog open={!!editOffice} onOpenChange={(o) => !o && setEditOffice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editOffice?.name}</DialogTitle></DialogHeader>
          {editOffice && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateOfficeMutation.mutate({
                  id: editOffice.id,
                  data: {
                    name: fd.get("name") as string,
                    building: fd.get("building") as string || null,
                    floor: fd.get("floor") as string || null,
                    occupant: fd.get("occupant") as string || null,
                    department: fd.get("department") as string || null,
                    notes: fd.get("notes") as string || null,
                  },
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="e-name">Name</Label><Input id="e-name" name="name" defaultValue={editOffice.name} required /></div>
                <div><Label htmlFor="e-building">Building</Label><Input id="e-building" name="building" defaultValue={editOffice.building || ""} /></div>
                <div><Label htmlFor="e-floor">Floor</Label><Input id="e-floor" name="floor" defaultValue={editOffice.floor || ""} /></div>
                <div><Label htmlFor="e-occupant">Occupant</Label><Input id="e-occupant" name="occupant" defaultValue={editOffice.occupant || ""} /></div>
                <div className="col-span-2"><Label htmlFor="e-dept">Department</Label><Input id="e-dept" name="department" defaultValue={editOffice.department || ""} /></div>
              </div>
              <div><Label htmlFor="e-notes">Notes</Label><Textarea id="e-notes" name="notes" className="resize-none" defaultValue={editOffice.notes || ""} /></div>
              <Button type="submit" className="w-full" disabled={updateOfficeMutation.isPending}>
                {updateOfficeMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
