import type { ReactNode } from "react"
import { X } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResponsiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Description for screen readers; visible when `showDescription` is set */
  description: string
  showDescription?: boolean
  width?: "md" | "lg"
  children: ReactNode
}

/**
 * Responsive dialog: on phones it is a bottom sheet so it is easy to reach
 * with a thumb; on wide screens it is a centered modal.
 *
 * The header (title + close button) stays put; only the body scrolls, so the
 * scrollbar lives inside the body and does not clip the rounded corners.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  showDescription,
  width = "lg",
  children,
}: ResponsiveSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[min(92svh,860px)] flex-col gap-0 overflow-hidden rounded-3xl p-0 shadow-elevated ring-foreground/5",
          width === "lg" ? "sm:max-w-lg" : "sm:max-w-md",
          // Bottom sheet on phones
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[92svh] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none",
          "max-sm:duration-200 max-sm:data-open:zoom-in-100 max-sm:data-open:slide-in-from-bottom-1/2 max-sm:data-closed:zoom-out-100 max-sm:data-closed:slide-out-to-bottom-1/2"
        )}
      >
        {/* Header: does not scroll */}
        <div className="shrink-0 px-5 pt-3 pb-3 sm:px-6 sm:pt-5">
          <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/25 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <DialogDescription className={showDescription ? undefined : "sr-only"}>
                {description}
              </DialogDescription>
            </div>
            <DialogClose
              render={<Button variant="ghost" size="icon" className="-mt-1 -mr-2 shrink-0 rounded-full" />}
            >
              <X className="size-5" />
              <span className="sr-only">Tutup</span>
            </DialogClose>
          </div>
        </div>

        {/* Body: the scrolling area */}
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
