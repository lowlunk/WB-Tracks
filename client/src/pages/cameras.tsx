import { AssetCrudPage } from "@/components/asset-crud-page";
import { Camera } from "lucide-react";
import type { Camera as CameraType } from "@shared/schema";

const fields = [
  { name: "name", label: "Name", placeholder: "CAM-Entrance", required: true },
  { name: "model", label: "Model", placeholder: "Hikvision DS-2CD2143" },
  { name: "ipAddress", label: "IP Address", placeholder: "10.0.6.1" },
  { name: "location", label: "Location", placeholder: "Main Entrance" },
  { name: "type", label: "Type", type: "select" as const, options: [
    { value: "Dome", label: "Dome" },
    { value: "Bullet", label: "Bullet" },
    { value: "PTZ", label: "PTZ" },
    { value: "Turret", label: "Turret" },
  ]},
  { name: "resolution", label: "Resolution", placeholder: "4MP" },
  { name: "connectedNvrId", label: "NVR ID", placeholder: "nvr-1" },
  { name: "nvrChannel", label: "NVR Channel", type: "number" as const, placeholder: "1" },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "warning", label: "Warning" },
    { value: "offline", label: "Offline" },
  ]},
  { name: "notes", label: "Notes", type: "textarea" as const },
];

const columns: { key: keyof CameraType; label: string; mono?: boolean }[] = [
  { key: "model", label: "Model" },
  { key: "ipAddress", label: "IP Address", mono: true },
  { key: "location", label: "Location" },
  { key: "type", label: "Type" },
  { key: "resolution", label: "Resolution" },
];

export default function CamerasPage() {
  return (
    <AssetCrudPage<CameraType>
      title="Cameras"
      apiPath="/api/cameras"
      icon={Camera}
      fields={fields}
      columns={columns}
      renderSubtitle={(cam) => [cam.type, cam.location].filter(Boolean).join(" — ")}
    />
  );
}
