import { AssetCrudPage } from "@/components/asset-crud-page";
import { Clock } from "lucide-react";
import type { PunchClock } from "@shared/schema";

const fields = [
  { name: "name", label: "Name", placeholder: "Clock-MainEntrance", required: true },
  { name: "model", label: "Model", placeholder: "uAttend BN6500" },
  { name: "serialNumber", label: "Serial Number", placeholder: "BN6500-001" },
  { name: "ipAddress", label: "IP Address", placeholder: "10.0.7.1" },
  { name: "location", label: "Location", placeholder: "Main Entrance" },
  { name: "connectionType", label: "Connection", type: "select" as const, options: [
    { value: "Ethernet", label: "Ethernet" },
    { value: "WiFi", label: "WiFi" },
    { value: "Cellular", label: "Cellular" },
  ]},
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "warning", label: "Warning" },
    { value: "offline", label: "Offline" },
  ]},
  { name: "notes", label: "Notes", type: "textarea" as const },
];

const columns: { key: keyof PunchClock; label: string; mono?: boolean }[] = [
  { key: "model", label: "Model" },
  { key: "serialNumber", label: "Serial #" },
  { key: "ipAddress", label: "IP Address", mono: true },
  { key: "location", label: "Location" },
  { key: "connectionType", label: "Connection" },
];

export default function PunchClocksPage() {
  return (
    <AssetCrudPage<PunchClock>
      title="Punch Clocks"
      apiPath="/api/punch-clocks"
      icon={Clock}
      fields={fields}
      columns={columns}
      renderSubtitle={(pc) => [pc.connectionType, pc.location].filter(Boolean).join(" — ")}
    />
  );
}
