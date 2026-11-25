import { Link, useLocation, useNavigate } from "react-router"
import { ChevronDown, ChevronLeft, Globe, LogOut, Settings } from "lucide-react"

import { MemberAvatar } from "@/components/common/member-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLastMember, useMembers } from "@/hooks/use-members"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-context"

interface PageMeta {
  title: string
  /** Shows a back button to this path */
  back?: { to: string; label: string; mobileOnly?: boolean }
}

/** Planning pages are reached from "Lainnya" on phones; the sidebar covers desktop. */
const backToMore = { to: "/lainnya", label: "Lainnya", mobileOnly: true }

const pages: Record<string, PageMeta> = {
  "/beranda": { title: "Beranda" },
  "/transaksi": { title: "Transaksi" },
  "/dompet": { title: "Dompet" },
  "/anggaran": { title: "Anggaran", back: backToMore },
  "/tabungan": { title: "Tujuan tabungan", back: backToMore },
  "/tagihan": { title: "Tagihan rutin", back: backToMore },
  "/utang": { title: "Utang-piutang", back: backToMore },
  "/lainnya": { title: "Lainnya" },
  "/pengaturan": { title: "Pengaturan", back: backToMore },
  "/pengaturan/kategori": {
    title: "Kategori",
    back: { to: "/pengaturan", label: "Pengaturan" },
  },
}

function ProfileMenu() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { data: members = [] } = useMembers()
  const { memberId, setLastMember } = useLastMember()
  const member = members.find((m) => m.id === memberId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-11 gap-2 rounded-full px-1.5 sm:pr-3"
            aria-label="Menu profil"
          />
        }
      >
        <MemberAvatar name={member?.name ?? "?"} color={member?.color ?? "#64748b"} />
        <span className="hidden max-w-32 truncate font-medium sm:inline">{member?.name}</span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 text-sm text-foreground">
            <MemberAvatar name={member?.name ?? "?"} color={member?.color ?? "#64748b"} />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{member?.name ?? "Profil"}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {session?.user.email}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {members.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2">Profil di perangkat ini</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={memberId}
                onValueChange={(id) => {
                  if (typeof id === "string") setLastMember(id)
                }}
              >
                {members.map((m) => (
                  <DropdownMenuRadioItem key={m.id} value={m.id} className="h-10 gap-2.5 px-2">
                    <MemberAvatar name={m.name} color={m.color} size="sm" />
                    {m.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10 gap-2.5 px-2" onClick={() => navigate("/pengaturan")}>
          <Settings /> Pengaturan
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10 gap-2.5 px-2" onClick={() => navigate("/")}>
          <Globe /> Halaman depan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="h-10 gap-2.5 px-2" onClick={signOut}>
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Sticky bar at the top of every app page: page title on the left, profile menu on the right. */
export function TopBar() {
  const { pathname } = useLocation()
  const page = pages[pathname.replace(/\/+$/, "") || "/"]

  return (
    <header className="sticky top-0 z-20 border-b border-foreground/5 bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/65">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-3 px-4 md:px-10">
        <div className="flex min-w-0 items-center gap-1">
          {page?.back && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("-ml-2 shrink-0 rounded-full", page.back.mobileOnly && "md:hidden")}
              nativeButton={false}
              render={<Link to={page.back.to} aria-label={`Kembali ke ${page.back.label}`} />}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          <h1 className="truncate text-xl font-bold md:text-2xl">{page?.title ?? "Lumbung"}</h1>
        </div>
        <ProfileMenu />
      </div>
    </header>
  )
}
