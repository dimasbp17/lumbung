import { Check } from "lucide-react"

import { colorOptions } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Warna">
      {colorOptions.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-foreground"
            )}
            style={{ backgroundColor: color }}
          >
            {selected && <Check className="size-4" />}
          </button>
        )
      })}
    </div>
  )
}
