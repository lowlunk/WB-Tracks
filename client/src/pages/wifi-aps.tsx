import { AssetCrudPage } from "@/components/asset-crud-page";
import { Wifi } from "lucide-react";
import type { WifiAP } from "@shared/schema";

const fields = [
  { name: "name", label: "Name", placeholder: "AP-Lobby", required: true },
  { name: "model", label: "Model", placeholder: "Ubiquiti U6-Pro" },
  { name: "macAddress", label: "MAC Address", placeholder: "AA:BB:CC:DD:EE:FF" },
  { name: "ipAddress", label: "IP Address", placeholder: "10.0.2.1" },
  { name: "location", label: "Location", placeholder: "Lobby Ceiling" },
  { name: "ssid", label: "SSID", placeholder: "WB-Corp" },
  { name: "band", label: "Band", placeholder: "2.4/5 GHz" },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "warning", label: "Warning" },
    { value: "offline", label: "Offline" },
  ]},
  { name: "notes", label: "Notes", type: "textarea" as const },
];

const columns: { key: keyof WifiAP; label: string; mono?: boolean }[] = [
  { key: "model", label: "Model" },
  { key: "ipAddress", label: "IP Address", mono: true },
  { key: "location", label: "Location" },
  { key: "ssid", label: "SSID" },
  { key: "band", label: "Band" },
];

export default function WifiAPsPage() {
  return (
    <AssetCrudPage<WifiAP>
      title="WiFi APs"
      apiPath="/api/wifi-aps"
      icon={Wifi}
      fields={fields}
      columns={columns}
      renderSubtitle={(ap) => [ap.macAddress, ap.location].filter(Boolean).join(" — ")}
    />
  );
}
