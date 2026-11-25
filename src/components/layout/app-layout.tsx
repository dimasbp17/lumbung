import { Link, NavLink, Outlet, useLocation } from "react-router"
import { Plus } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { TopBar } from "@/components/layout/top-bar"
import { MemberChoicePrompt } from "@/components/members/member-choice-prompt"
import { OfflineBanner } from "@/components/pwa/offline-banner"
import { Button } from "@/components/ui/button"
import { useLookups } from "@/hooks/use-lookups"
import { dockNav, mainNav, morePaths, planningNav, settingsNav, type NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { useTransactionForm } from "@/providers/transaction-form-context"

function isActivePath(pathname: string, item: NavItem): boolean {
  if (item.to === "/lainnya") return morePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function DockLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const active = isActivePath(pathname, item)
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
          active && "bg-accent"
        )}
      >
        <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
      </span>
      {item.label}
    </Link>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex h-11 items-center gap-3 rounded-xl px-4 text-[0.95rem] transition-colors",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <Icon className="size-5" />
      {item.label}
    </NavLink>
  )
}

export function AppLayout() {
  const { openForm } = useTransactionForm()
  // Load lookup data early so the form & transaction lists are ready right away.
  useLookups()

  return (
    <div className="min-h-svh md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 isolate hidden h-svh w-68 shrink-0 flex-col gap-6 overflow-hidden border-r border-sidebar-border bg-sidebar px-5 py-7 md:flex">
        {/* Ornaments: soft glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-20 size-64 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
          <div className="absolute top-1/2 -right-24 size-48 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-800/15" />
          <div className="absolute -bottom-20 -left-10 size-64 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-700/10" />
        </div>

        <div className="flex items-center gap-3 px-1">
          <Logo />
          <div className="leading-tight">
            <p className="text-lg font-bold">Lumbung</p>
            <p className="text-xs text-muted-foreground">Keuangan keluarga</p>
          </div>
        </div>
        <Button size="lg" onClick={() => openForm()} className="h-12 w-full rounded-xl shadow-soft">
          <Plus className="size-5" /> Catat transaksi
        </Button>
        {/* Scrolls on short screens */}
        <nav className="scrollbar-subtle -mx-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
          {mainNav.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
          <p className="mt-4 mb-1 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Perencanaan
          </p>
          {planningNav.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
          <div className="mt-4">
            <SidebarLink item={settingsNav[0]} />
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-5 pb-36 md:px-10 md:pt-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Floating navigation dock (mobile) with the add button in the middle */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-5 items-center rounded-3xl bg-card/90 px-1 shadow-elevated ring-1 ring-foreground/5 backdrop-blur-xl md:hidden"
      >
        <DockLink item={dockNav[0]} />
        <DockLink item={dockNav[1]} />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => openForm()}
            aria-label="Catat transaksi"
            className="-mt-7 flex size-15 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 text-white shadow-elevated ring-4 ring-background transition-transform outline-none active:scale-95 focus-visible:ring-ring"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </div>
        <DockLink item={dockNav[2]} />
        <DockLink item={dockNav[3]} />
      </nav>

      <MemberChoicePrompt />
    </div>
  )
}
