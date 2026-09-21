"use client";

import { Clock3Icon, MapPinIcon, UtensilsCrossedIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatVnd } from "@/lib/format";
import { haversineMeters } from "@/lib/geo";
import { useUserLocation } from "@/hooks/useUserLocation";

type QuickStatsCardProps = {
  checkpoint: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string | null;
  priceVnd?: number | null;
};

export function QuickStatsCard({
  checkpoint,
  openingHours,
  priceVnd,
}: QuickStatsCardProps) {
  const { position } = useUserLocation();

  const distanceMeters = position
    ? haversineMeters(
        { latitude: position.latitude, longitude: position.longitude },
        { latitude: checkpoint.latitude, longitude: checkpoint.longitude },
      )
    : null;

  const distanceLabel = formatDistance(distanceMeters);

  return (
    <Card>
      <CardContent className="grid grid-cols-3 gap-4 p-4">
        <Stat
          icon={<MapPinIcon aria-hidden className="size-4 text-primary" />}
          label="Khoảng cách"
          value={distanceLabel}
        />
        <Stat
          icon={<Clock3Icon aria-hidden className="size-4 text-primary" />}
          label="Giờ mở cửa"
          value={openingHours ?? "—"}
        />
        <Stat
          icon={<UtensilsCrossedIcon aria-hidden className="size-4 text-primary" />}
          label="Tầm giá"
          value={priceVnd != null ? formatVnd(priceVnd) : "—"}
        />
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function formatDistance(meters: number | null): string {
  if (meters === null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
