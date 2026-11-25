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

export function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.")
    if (password !== confirmPassword) return setError("Ulangi kata sandi tidak sama.")

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    setSubmitting(false)
    if (error) return setError(errorMessage(error))
    // With email confirmation on, there is no session yet → ask to check email.
    // Otherwise GuestRoute redirects to /beranda automatically.
    if (!data.session) setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <AuthLayout title="Cek email Anda">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="size-10 text-primary" />
          <p>
            Kami mengirim tautan konfirmasi ke <strong>{email}</strong>. Buka tautan
            tersebut, lalu masuk ke Lumbung.
          </p>
          <Button variant="outline" size="lg" className="w-full" nativeButton={false} render={<Link to="/masuk" />}>
            Ke halaman masuk
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Daftar akun keluarga"
      description="Satu akun untuk satu keluarga. Profil Suami dan Istri dibuat otomatis."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/masuk" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
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
        <Field label="Kata sandi (min. 6 karakter)" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field label="Ulangi kata sandi" htmlFor="confirm-password">
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11"
          />
        </Field>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Memproses…" : "Daftar"}
        </Button>
      </form>
    </AuthLayout>
  )
}
