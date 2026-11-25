import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Period } from "@/lib/period"

interface PeriodNavigatorProps {
  period: Period
  offset: number
  onOffsetChange: (offset: number) => void
}

export function PeriodNavigator({ period, offset, onOffsetChange }: PeriodNavigatorProps) {
  return (
    <div className="surface flex items-center justify-between gap-2 p-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOffsetChange(offset - 1)}
        aria-label="Periode sebelumnya"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <div className="flex flex-col items-center">
        <span className="font-semibold">{period.label}</span>
        {offset !== 0 && (
          <button
            type="button"
            onClick={() => onOffsetChange(0)}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Kembali ke periode ini
          </button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOffsetChange(offset + 1)}
        disabled={offset >= 0}
        aria-label="Periode berikutnya"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  )
}
