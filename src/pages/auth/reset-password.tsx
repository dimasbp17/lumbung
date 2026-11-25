import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { Field } from "@/components/common/field"
import { ErrorMessage, SplashScreen } from "@/components/common/status"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/error"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/providers/auth-context"

export function ResetPasswordPage() {
  const { session, isLoading, finishRecovery } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) return <SplashScreen />

  if (!session) {
    return (
      <AuthLayout
        title="Tautan tidak berlaku"
        description="Tautan reset kata sandi sudah kedaluwarsa atau sudah dipakai."
      >
        <Button size="lg" className="w-full" nativeButton={false} render={<Link to="/lupa-password" />}>
          Minta tautan baru
        </Button>
      </AuthLayout>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.")
    if (password !== confirmPassword) return setError("Ulangi kata sandi tidak sama.")
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) return setError(errorMessage(error))
    finishRecovery()
    toast.success("Kata sandi berhasil diganti")
    navigate("/beranda", { replace: true })
  }

  return (
    <AuthLayout title="Buat kata sandi baru">
      <form onSubmit={submit} className="grid gap-4">
        {error && <ErrorMessage message={error} />}
        <Field label="Kata sandi baru (min. 6 karakter)" htmlFor="password">
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
        <Field label="Ulangi kata sandi baru" htmlFor="confirm-password">
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
          {submitting ? "Menyimpan…" : "Simpan kata sandi"}
        </Button>
      </form>
    </AuthLayout>
  )
}
