"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";

/**
 * Confirmation for destructive admin actions.
 *
 * Guideline: destructive actions need a confirmation modal or undo window —
 * never immediate. This replaces the bare `window.confirm` used on the list
 * pages with a real modal that can be dismissed with Escape or by clicking
 * the backdrop.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrashIcon aria-hidden className="size-4 text-destructive" />
            Delete
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{title}&quot;? This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
