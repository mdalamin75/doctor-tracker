"use client";
import * as D from "@radix-ui/react-dialog";
import * as A from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const overlay = "dialog-overlay fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]";
const content =
  "dialog-content fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl focus:outline-none";

export function Dialog({ open, onOpenChange, title, description, children, className }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlay} />
        <D.Content className={cn(content, "max-w-lg", className)}>
          <div className="mb-5 pr-8">
            <D.Title className="font-display text-2xl font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          {children}
          <D.Close className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Accessible "are you sure?" dialog for destructive actions. */
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Delete", onConfirm }) {
  return (
    <A.Root>
      <A.Trigger asChild>{trigger}</A.Trigger>
      <A.Portal>
        <A.Overlay className={overlay} />
        <A.Content className={cn(content, "max-w-md")}>
          <A.Title className="font-display text-xl font-semibold">{title}</A.Title>
          <A.Description className="mt-2 text-sm text-muted-foreground">{description}</A.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel asChild><Button variant="outline">Cancel</Button></A.Cancel>
            <A.Action asChild><Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button></A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
