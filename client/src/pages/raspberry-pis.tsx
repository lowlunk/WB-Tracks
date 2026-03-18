import { AssetCrudPage } from "@/components/asset-crud-page";
import { Cpu } from "lucide-react";
import type { RaspberryPi } from "@shared/schema";

const fields = [
  { name: "name", label: "Name", placeholder: "Pi-Display-Lobby", required: true },
  { name: "model", label: "Model", placeholder: "Raspberry Pi 4B 4GB" },
  { name: "ipAddress", label: "IP Address", placeholder: "10.0.3.1" },
  { name: "macAddress", label: "MAC Address", placeholder: "DD:EE:FF:00:11:01" },
  { name: "location", label: "Location", placeholder: "Lobby" },
  { name: "purpose", label: "Purpose", placeholder: "Digital Signage" },
  { name: "osVersion", label: "OS Version", placeholder: "Raspberry Pi OS Bullseye" },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "warning", label: "Warning" },
    { value: "offline", label: "Offline" },
  ]},
  { name: "notes", label: "Notes", type: "textarea" as const },
];

const columns: { key: keyof RaspberryPi; label: string; mono?: boolean }[] = [
  { key: "model", label: "Model" },
  { key: "ipAddress", label: "IP Address", mono: true },
  { key: "location", label: "Location" },
  { key: "purpose", label: "Purpose" },
  { key: "osVersion", label: "OS" },
];

export default function RaspberryPisPage() {
  return (
    <AssetCrudPage<RaspberryPi>
      title="Raspberry Pis"
      apiPath="/api/raspberry-pis"
      icon={Cpu}
      fields={fields}
      columns={columns}
      renderSubtitle={(pi) => pi.purpose || "No purpose assigned"}
    />
  );
}
