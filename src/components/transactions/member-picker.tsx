import { MemberAvatar } from "@/components/common/member-avatar"
import { cn } from "@/lib/utils"
import type { Member } from "@/types"

interface MemberPickerProps {
  members: Member[]
  value: string | null
  onChange: (id: string) => void
}

export function MemberPicker({ members, value, onChange }: MemberPickerProps) {
  return (
    <div role="radiogroup" aria-label="Dicatat oleh" className="flex flex-wrap gap-2">
      {members.map((m) => {
        const selected = m.id === value
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex h-12 items-center gap-2 rounded-full border-2 pr-4 pl-1.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "font-semibold" : "border-transparent bg-muted/60"
            )}
            style={selected ? { borderColor: m.color } : undefined}
          >
            <MemberAvatar name={m.name} color={m.color} size="md" className="size-8" />
            {m.name}
          </button>
        )
      })}
    </div>
  )
}
