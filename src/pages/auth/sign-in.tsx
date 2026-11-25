import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"

import { Field } from "@/components/common/field"
import { ErrorMessage } from "@/components/common/status"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/error"
import { supabase } from "@/lib/supabase"

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSubmitting(false)
    if (error) return setError(errorMessage(error))
    const from = (location.state as { from?: string } | null)?.from ?? "/beranda"
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title="Masuk"
      description="Gunakan akun keluarga yang sama untuk suami dan istri."
      footer={
        <>
          Belum punya akun?{" "}
          <Link to="/daftar" className="font-medium text-primary underline-offset-4 hover:underline">
            Daftar
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
        <Field label="Kata sandi" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </Field>
        <Link
          to="/lupa-password"
          className="-mt-1 justify-self-end text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Lupa kata sandi?
        </Link>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Memproses…" : "Masuk"}
        </Button>
      </form>
    </AuthLayout>
  )
}
