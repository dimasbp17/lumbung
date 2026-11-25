import { Link } from "react-router"
import { ChevronRight } from "lucide-react"

import { planningNav, settingsNav, type NavItem } from "@/lib/navigation"

function MenuTile({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className="surface flex items-center gap-3 p-4 transition-transform outline-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{item.label}</span>
        {item.description && (
          <span className="block truncate text-sm text-muted-foreground">{item.description}</span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}

/** Menu of every feature that doesn't fit in the mobile dock. */
export function MorePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">Perencanaan</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {planningNav.map((item) => (
            <MenuTile key={item.to} item={item} />
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">Pengaturan</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {settingsNav.map((item) => (
            <MenuTile key={item.to} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
