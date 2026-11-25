import { useState } from "react"
import { Link } from "react-router"
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Sun,
  Tags,
} from "lucide-react"
import { toast } from "sonner"

import { MemberAvatar } from "@/components/common/member-avatar"
import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { Loading } from "@/components/common/status"
import { MemberForm } from "@/components/members/member-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLastMember, useMembers } from "@/hooks/use-members"
import { usePeriod, useSaveSettings, useSettings } from "@/hooks/use-settings"
import { errorMessage } from "@/lib/error"
import { USER_GUIDE_FILE_NAME, USER_GUIDE_URL } from "@/lib/user-guide"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-context"
import { useTheme } from "@/providers/theme-context"
import type { Member } from "@/types"

const themeOptions = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Ikuti HP", icon: Monitor },
] as const

const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1)

export function SettingsPage() {
  const { session, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const settings = useSettings()
  const saveSettings = useSaveSettings()
  const period = usePeriod()
  const members = useMembers()
  const { memberId: deviceMemberId, setLastMember } = useLastMember()

  const [memberFormOpen, setMemberFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [formKey, setFormKey] = useState(0)

  const openMemberForm = (m: Member | null) => {
    setSelectedMember(m)
    setFormKey((k) => k + 1)
    setMemberFormOpen(true)
  }

  const changeStartDay = async (day: number) => {
    try {
      await saveSettings.mutateAsync({ period_start_day: day })
      toast.success("Tanggal awal periode disimpan")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const memberList = members.data ?? []

  return (
    <>
      <div className="space-y-5">
        {/* Family members */}
        <Card>
          <CardHeader>
            <CardTitle>Anggota keluarga</CardTitle>
            <CardDescription>
              Pilih profil yang memakai perangkat ini. Profil terpilih otomatis mengisi
              "Dicatat oleh" saat mencatat transaksi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.isPending ? (
              <Loading />
            ) : (
              memberList.map((m) => {
                const onThisDevice = m.id === deviceMemberId
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 pl-3",
                      onThisDevice && "bg-accent ring-1 ring-primary/30"
                    )}
                  >
                    <MemberAvatar name={m.name} color={m.color} />
                    <span className="flex-1 font-medium">{m.name}</span>
                    {onThisDevice ? (
                      <Badge>Perangkat ini</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setLastMember(m.id)}>
                        Pakai di sini
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openMemberForm(m)}>
                      Ubah
                    </Button>
                  </div>
                )
              })
            )}
            <Button variant="outline" className="w-full" onClick={() => openMemberForm(null)}>
              <Plus /> Tambah anggota
            </Button>
          </CardContent>
        </Card>

        {/* Categories */}
        <Link
          to="/pengaturan/kategori"
          className="surface flex items-center gap-3 p-5 transition-transform active:scale-[0.99]"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Tags className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">Kategori</span>
            <span className="block text-sm text-muted-foreground">
              Tambah, ubah, atau nonaktifkan kategori
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        {/* Period */}
        <Card>
          <CardHeader>
            <CardTitle>Periode bulanan</CardTitle>
            <CardDescription>
              Atur tanggal mulai periode, misalnya mengikuti tanggal gajian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select
              value={String(settings.data?.period_start_day ?? 1)}
              onValueChange={(v) => v && changeStartDay(Number(v))}
              disabled={settings.isPending || saveSettings.isPending}
            >
              <SelectTrigger className="w-full" aria-label="Tanggal awal periode">
                <SelectValue>{(v: string) => `Mulai tanggal ${v} setiap bulan`}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {dayOptions.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Tanggal {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Periode saat ini: {period.label}</p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Tampilan</CardTitle>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex h-18 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    theme === value
                      ? "bg-accent font-semibold text-accent-foreground ring-1 ring-primary/30"
                      : "bg-muted/60 hover:bg-muted"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Bantuan</CardTitle>
            <CardDescription>
              Buku panduan berisi cara memakai setiap fitur Lumbung, langkah demi langkah.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={USER_GUIDE_URL} download={USER_GUIDE_FILE_NAME} />}
            >
              <BookOpen /> Unduh panduan (PDF)
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Akun</CardTitle>
            <CardDescription>{session?.user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOut}>
              <LogOut /> Keluar
            </Button>
          </CardContent>
        </Card>
      </div>

      <ResponsiveSheet
        open={memberFormOpen}
        onOpenChange={setMemberFormOpen}
        title={selectedMember ? "Ubah profil" : "Tambah anggota"}
        description="Atur nama dan warna profil."
        width="md"
      >
        <MemberForm
          key={formKey}
          member={selectedMember}
          canDelete={memberList.length > 1}
          onDone={() => setMemberFormOpen(false)}
        />
      </ResponsiveSheet>
    </>
  )
}
