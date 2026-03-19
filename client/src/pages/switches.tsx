import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch as SwitchToggle } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Network, MapPin, Globe, Trash2, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Switch } from "@shared/schema";

export default function SwitchesPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editSwitch, setEditSwitch] = useState<Switch | null>(null);
  const [search, setSearch] = useState("");

  const { data: switches, isLoading } = useQuery<Switch[]>({
    queryKey: ["/api/switches"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Switch>) => {
      const res = await apiRequest("POST", "/api/switches", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      toast({ title: "Switch added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Switch> }) => {
      const res = await apiRequest("PATCH", `/api/switches/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEditSwitch(null);
      toast({ title: "Switch updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/switches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/switches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Switch removed" });
    },
  });

  const filtered = switches?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      model: fd.get("model") as string || null,
      ipAddress: fd.get("ipAddress") as string || null,
      location: fd.get("location") as string || null,
      totalPorts: parseInt(fd.get("totalPorts") as string) || 24,
      manageable: fd.get("manageable") === "on",
      status: fd.get("status") as string || "active",
      notes: fd.get("notes") as string || null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Switches" />
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Switches"
        description={`${switches?.length || 0} network switches`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-switch">
                <Plus className="h-4 w-4 mr-1" /> Add Switch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Switch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Core Switch 1" required data-testid="input-switch-name" />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" placeholder="Cisco SG350-28" data-testid="input-switch-model" />
                  </div>
                  <div>
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input id="ipAddress" name="ipAddress" placeholder="10.0.1.1" data-testid="input-switch-ip" />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Server Room" data-testid="input-switch-location" />
                  </div>
                  <div>
                    <Label htmlFor="totalPorts">Total Ports</Label>
                    <Input id="totalPorts" name="totalPorts" type="number" defaultValue={24} data-testid="input-switch-ports" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger data-testid="select-switch-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SwitchToggle id="manageable" name="manageable" />
                  <Label htmlFor="manageable">Manageable</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" className="resize-none" data-testid="input-switch-notes" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-switch">
                  {createMutation.isPending ? "Adding..." : "Add Switch"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search switches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-switches"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((sw) => (
          <Card key={sw.id} className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <Link href={`/switches/${sw.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-md bg-muted">
                    <Network className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" data-testid={`text-switch-name-${sw.id}`}>{sw.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5 flex-wrap">
                      {sw.model && <span>{sw.model}</span>}
                      {sw.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{sw.location}</span>}
                      {sw.ipAddress && <span className="flex items-center gap-0.5 font-mono text-xs"><Globe className="h-3 w-3" />{sw.ipAddress}</span>}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">{sw.totalPorts} ports</span>
                  {sw.manageable && <span className="text-xs text-primary font-medium">Managed</span>}
                  <StatusBadge status={sw.status} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.preventDefault(); setEditSwitch(sw); }}
                    data-testid={`button-edit-switch-${sw.id}`}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.preventDefault(); deleteMutation.mutate(sw.id); }}
                    data-testid={`button-delete-switch-${sw.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No switches found</p>
          </div>
        )}
      </div>
      {/* Edit Switch Dialog */}
      <Dialog open={!!editSwitch} onOpenChange={(o) => !o && setEditSwitch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editSwitch?.name}</DialogTitle></DialogHeader>
          {editSwitch && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editSwitch.id,
                  data: {
                    name: fd.get("name") as string,
                    model: fd.get("model") as string || null,
                    ipAddress: fd.get("ipAddress") as string || null,
                    location: fd.get("location") as string || null,
                    totalPorts: parseInt(fd.get("totalPorts") as string) || 24,
                    manageable: fd.get("manageable") === "on",
                    status: fd.get("status") as string || "active",
                    notes: fd.get("notes") as string || null,
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="e-name">Name</Label><Input id="e-name" name="name" defaultValue={editSwitch.name} required /></div>
                <div><Label htmlFor="e-model">Model</Label><Input id="e-model" name="model" defaultValue={editSwitch.model || ""} /></div>
                <div><Label htmlFor="e-ip">IP Address</Label><Input id="e-ip" name="ipAddress" defaultValue={editSwitch.ipAddress || ""} /></div>
                <div><Label htmlFor="e-loc">Location</Label><Input id="e-loc" name="location" defaultValue={editSwitch.location || ""} /></div>
                <div><Label htmlFor="e-ports">Total Ports</Label><Input id="e-ports" name="totalPorts" type="number" defaultValue={editSwitch.totalPorts} /></div>
                <div>
                  <Label htmlFor="e-status">Status</Label>
                  <Select name="status" defaultValue={editSwitch.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SwitchToggle id="e-manageable" name="manageable" defaultChecked={editSwitch.manageable} />
                <Label htmlFor="e-manageable">Manageable</Label>
              </div>
              <div><Label htmlFor="e-notes">Notes</Label><Textarea id="e-notes" name="notes" className="resize-none" defaultValue={editSwitch.notes || ""} /></div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
