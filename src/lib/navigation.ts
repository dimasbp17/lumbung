import {
  ArrowLeftRight,
  HandCoins,
  House,
  LayoutGrid,
  PiggyBank,
  Repeat,
  Settings,
  Tags,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Short explanation, shown on the "Lainnya" page */
  description?: string
}

/** Day-to-day pages. */
export const mainNav: NavItem[] = [
  { to: "/beranda", label: "Beranda", icon: House },
  { to: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { to: "/dompet", label: "Dompet", icon: Wallet },
]

/** Planning features (phase 2). */
export const planningNav: NavItem[] = [
  { to: "/anggaran", label: "Anggaran", icon: Target, description: "Batas belanja per kategori" },
  { to: "/tabungan", label: "Tabungan", icon: PiggyBank, description: "Tujuan dan setoran tabungan" },
  { to: "/tagihan", label: "Tagihan rutin", icon: Repeat, description: "Listrik, SPP, cicilan, gaji" },
  { to: "/utang", label: "Utang-piutang", icon: HandCoins, description: "Pinjaman dan cicilannya" },
]

export const settingsNav: NavItem[] = [
  { to: "/pengaturan", label: "Pengaturan", icon: Settings, description: "Profil, periode, tampilan" },
  { to: "/pengaturan/kategori", label: "Kategori", icon: Tags, description: "Atur kategori transaksi" },
]

/** The mobile dock: two links, the add button, two links. */
export const dockNav: NavItem[] = [
  mainNav[0],
  mainNav[1],
  mainNav[2],
  { to: "/lainnya", label: "Lainnya", icon: LayoutGrid },
]

/** Paths reached through the "Lainnya" page, so its dock tab stays highlighted there. */
export const morePaths = ["/lainnya", ...planningNav.map((n) => n.to), "/pengaturan"]
