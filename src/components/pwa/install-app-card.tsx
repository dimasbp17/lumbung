import { CheckCircle2, Download, Share, SquarePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInstallPrompt } from "@/lib/install-prompt"

/** Lets the user install Lumbung as an app, with manual steps for iPhone. */
export function InstallAppCard() {
  const { state, install } = useInstallPrompt()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aplikasi di HP</CardTitle>
        <CardDescription>
          Pasang Lumbung agar muncul di layar utama dan terbuka layar penuh seperti aplikasi biasa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === "installed" && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-5" /> Lumbung sudah terpasang di perangkat ini.
          </p>
        )}

        {state === "available" && (
          <Button
            onClick={async () => {
              if (await install()) toast.success("Lumbung dipasang")
            }}
          >
            <Download /> Pasang aplikasi
          </Button>
        )}

        {state === "ios" && (
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">1</span>
              <span>
                Buka Lumbung di <strong>Safari</strong>, lalu tekan tombol bagikan{" "}
                <Share className="inline size-4 align-text-bottom" />.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">2</span>
              <span>
                Pilih <strong>Tambah ke Layar Utama</strong>{" "}
                <SquarePlus className="inline size-4 align-text-bottom" />, lalu tekan <strong>Tambah</strong>.
              </span>
            </li>
          </ol>
        )}

        {state === "unsupported" && (
          <p className="text-sm text-muted-foreground">
            Buka Lumbung di <strong>Chrome</strong> (Android/komputer) atau <strong>Safari</strong> (iPhone), lalu
            pilih <em>Pasang aplikasi</em> / <em>Tambahkan ke layar utama</em> dari menu browser.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
