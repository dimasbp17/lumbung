import { AuthLayout } from "@/components/layout/auth-layout"

/** Shown when VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set. */
export function NotConfiguredPage() {
  return (
    <AuthLayout title="Supabase belum diatur">
      <div className="space-y-3 text-sm">
        <p>
          Salin <code className="rounded bg-muted px-1">.env.example</code> menjadi{" "}
          <code className="rounded bg-muted px-1">.env</code>, lalu isi:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
          VITE_SUPABASE_URL=...{"\n"}VITE_SUPABASE_PUBLISHABLE_KEY=...
        </pre>
        <p>
          Setelah itu <strong>hentikan</strong> server (Ctrl+C) lalu jalankan ulang{" "}
          <code className="rounded bg-muted px-1">pnpm dev</code> — perubahan .env tidak terbaca
          tanpa restart.
        </p>
      </div>
    </AuthLayout>
  )
}
