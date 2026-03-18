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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";

interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}

interface AssetCrudPageProps<T> {
  title: string;
  description?: string;
  apiPath: string;
  icon: React.ElementType;
  fields: FieldDef[];
  columns: { key: keyof T; label: string; mono?: boolean }[];
  renderSubtitle?: (item: T) => string;
}

export function AssetCrudPage<T extends { id: string; name: string; status: string; notes?: string | null }>({
  title,
  description,
  apiPath,
  icon: Icon,
  fields,
  columns,
  renderSubtitle,
}: AssetCrudPageProps<T>) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useQuery<T[]>({
    queryKey: [apiPath],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", apiPath, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setAddOpen(false);
      toast({ title: `${title.slice(0, -1)} added` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `${apiPath}/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEditItem(null);
      toast({ title: `${title.slice(0, -1)} updated` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${apiPath}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: `${title.slice(0, -1)} removed` });
    },
  });

  const filtered = items?.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const formFromFd = (fd: FormData) => {
    const result: Record<string, unknown> = {};
    fields.forEach((f) => {
      const val = fd.get(f.name) as string;
      if (f.type === "number") {
        result[f.name] = val ? parseInt(val) : null;
      } else {
        result[f.name] = val || null;
      }
    });
    return result;
  };

  const renderForm = (onSubmit: (data: Record<string, unknown>) => void, defaults?: T, isPending?: boolean, submitLabel?: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formFromFd(new FormData(e.currentTarget)));
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {fields.filter(f => f.type !== "textarea").map((f) => (
          <div key={f.name} className={f.type === "select" ? "" : ""}>
            <Label htmlFor={f.name}>{f.label}</Label>
            {f.type === "select" ? (
              <Select name={f.name} defaultValue={defaults ? String((defaults as Record<string, unknown>)[f.name] || "") : f.options?.[0]?.value || ""}>
                <SelectTrigger data-testid={`select-${f.name}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {f.options?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={f.name}
                name={f.name}
                type={f.type || "text"}
                placeholder={f.placeholder}
                defaultValue={defaults ? String((defaults as Record<string, unknown>)[f.name] || "") : ""}
                required={f.required}
                data-testid={`input-${f.name}`}
              />
            )}
          </div>
        ))}
      </div>
      {fields.filter(f => f.type === "textarea").map((f) => (
        <div key={f.name}>
          <Label htmlFor={f.name}>{f.label}</Label>
          <Textarea
            id={f.name}
            name={f.name}
            className="resize-none"
            placeholder={f.placeholder}
            defaultValue={defaults ? String((defaults as Record<string, unknown>)[f.name] || "") : ""}
            data-testid={`input-${f.name}`}
          />
        </div>
      ))}
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-form">
        {isPending ? "Saving..." : submitLabel || "Save"}
      </Button>
    </form>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title={title} />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={title}
        description={description || `${items?.length || 0} ${items?.length === 1 ? title.toLowerCase().replace(/s$/, '').replace(/ies$/, 'y') : title.toLowerCase()}`}
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid={`button-add-${title.toLowerCase()}`}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add {title.slice(0, -1)}</DialogTitle></DialogHeader>
              {renderForm((data) => createMutation.mutate(data), undefined, createMutation.isPending, `Add ${title.slice(0, -1)}`)}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4">
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-testid={`input-search-${title.toLowerCase()}`}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Name</th>
                  {columns.map((c) => (
                    <th key={String(c.key)} className="p-3 font-medium">{c.label}</th>
                  ))}
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    data-testid={`row-${item.id}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {renderSubtitle && <div className="text-xs text-muted-foreground">{renderSubtitle(item)}</div>}
                        </div>
                      </div>
                    </td>
                    {columns.map((c) => (
                      <td key={String(c.key)} className={`p-3 text-xs ${c.mono ? "font-mono" : ""}`}>
                        {String((item as Record<string, unknown>)[c.key as string] || "—")}
                      </td>
                    ))}
                    <td className="p-3"><StatusBadge status={item.status} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditItem(item)} data-testid={`button-edit-${item.id}`}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-${item.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No {title.toLowerCase()} found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editItem?.name}</DialogTitle></DialogHeader>
          {editItem && renderForm(
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
