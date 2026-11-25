import { iconMap } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  color: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div
      className="grid grid-cols-7 gap-1.5 sm:grid-cols-9"
      role="radiogroup"
      aria-label="Ikon"
    >
      {Object.entries(iconMap).map(([name, Icon]) => {
        const selected = name === value
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            onClick={() => onChange(name)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border border-transparent text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-current"
            )}
            style={selected ? { color, backgroundColor: `${color}1a` } : undefined}
          >
            <Icon className="size-5" />
          </button>
        )
      })}
    </div>
  )
}
