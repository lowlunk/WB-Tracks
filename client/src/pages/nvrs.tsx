import { AssetCrudPage } from "@/components/asset-crud-page";
import { HardDrive } from "lucide-react";
import type { Nvr } from "@shared/schema";

const fields = [
  { name: "name", label: "Name", placeholder: "NVR-Main", required: true },
  { name: "model", label: "Model", placeholder: "Hikvision DS-7616NI" },
  { name: "ipAddress", label: "IP Address", placeholder: "10.0.4.1" },
  { name: "location", label: "Location", placeholder: "Server Room" },
  { name: "totalChannels", label: "Total Channels", type: "number" as const, placeholder: "16" },
  { name: "storageCapacity", label: "Storage", placeholder: "8TB" },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "warning", label: "Warning" },
    { value: "offline", label: "Offline" },
  ]},
  { name: "notes", label: "Notes", type: "textarea" as const },
];

const columns: { key: keyof Nvr; label: string; mono?: boolean }[] = [
  { key: "model", label: "Model" },
  { key: "ipAddress", label: "IP Address", mono: true },
  { key: "location", label: "Location" },
  { key: "totalChannels", label: "Channels" },
  { key: "storageCapacity", label: "Storage" },
];

export default function NvrsPage() {
  return (
    <AssetCrudPage<Nvr>
      title="NVRs"
      apiPath="/api/nvrs"
      icon={HardDrive}
      fields={fields}
      columns={columns}
      renderSubtitle={(nvr) => `${nvr.totalChannels} channels — ${nvr.storageCapacity || "Unknown storage"}`}
    />
  );
}
