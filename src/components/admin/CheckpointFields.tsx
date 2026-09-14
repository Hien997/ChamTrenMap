import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TCheckpoint } from "./CheckpointFormTypes";

interface Props {
  checkpoint: TCheckpoint;
}

export function CheckpointFields({ checkpoint }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-1">
        <Label>Latitude</Label>
        <Input name="latitude" type="number" step="0.000001" defaultValue={checkpoint.latitude} required />
      </div>
      <div className="space-y-1">
        <Label>Longitude</Label>
        <Input name="longitude" type="number" step="0.000001" defaultValue={checkpoint.longitude} required />
      </div>
      <div className="space-y-1">
        <Label>Radius (m)</Label>
        <Input name="radiusMeters" type="number" defaultValue={checkpoint.radiusMeters} required />
      </div>
      <div className="space-y-1">
        <Label>Visit (min)</Label>
        <Input name="estimatedVisitMinutes" type="number" defaultValue={checkpoint.estimatedVisitMinutes} required />
      </div>
      <div className="space-y-1">
        <Label>Sort Order</Label>
        <Input name="sortOrderHint" type="number" defaultValue={checkpoint.sortOrderHint} required />
      </div>
      <div className="space-y-1">
        <Label>Price</Label>
        <Input name="priceVnd" type="number" defaultValue={checkpoint.priceVnd ?? ""} placeholder="Empty = free" />
      </div>
      <div className="space-y-1">
        <Label>Price Kind</Label>
        <Select name="priceKind" defaultValue={checkpoint.priceKind}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TICKET">Ticket</SelectItem>
            <SelectItem value="FOOD">Food</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}