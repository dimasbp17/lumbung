import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { MailCheck } from "lucide-react"

import { Field } from "@/components/common/field"
import { ErrorMessage } from "@/components/common/status"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/error"
import { supabase } from "@/lib/supabase"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)
    if (error) return setError(errorMessage(error))
    setSent(true)
  }

  const backLink = (
    <Link to="/masuk" className="font-medium text-primary underline-offset-4 hover:underline">
      Kembali ke halaman masuk
    </Link>
  )

  if (sent) {
    return (
      <AuthLayout title="Cek email Anda" footer={backLink}>
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="size-10 text-primary" />
          <p>
            Jika <strong>{email}</strong> terdaftar, kami telah mengirim tautan untuk
            membuat kata sandi baru.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Lupa kata sandi"
      description="Masukkan email akun keluarga. Kami akan mengirim tautan untuk membuat kata sandi baru."
      footer={backLink}
    >
      <form onSubmit={submit} className="grid gap-4">
        {error && <ErrorMessage message={error} />}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </Field>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim tautan"}
        </Button>
      </form>
    </AuthLayout>
  )
}
