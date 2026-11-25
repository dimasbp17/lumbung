import { Route, Routes } from "react-router"

import { AppLayout } from "@/components/layout/app-layout"
import { GuestRoute, ProtectedRoute } from "@/components/layout/routes"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { ResetPasswordPage } from "@/pages/auth/reset-password"
import { SignInPage } from "@/pages/auth/sign-in"
import { SignUpPage } from "@/pages/auth/sign-up"
import { BudgetsPage } from "@/pages/budgets"
import { CategoriesPage } from "@/pages/categories"
import { DebtsPage } from "@/pages/debts"
import { HomePage } from "@/pages/home"
import { LandingPage } from "@/pages/landing"
import { LogoAnimationPage } from "@/pages/logo-animation"
import { MorePage } from "@/pages/more"
import { NotFoundPage } from "@/pages/not-found"
import { RecurringPage } from "@/pages/recurring"
import { SavingsPage } from "@/pages/savings"
import { SettingsPage } from "@/pages/settings"
import { TransactionsPage } from "@/pages/transactions"
import { WalletsPage } from "@/pages/wallets"
import { TransactionFormProvider } from "@/providers/transaction-form-provider"

// URL paths stay in Indonesian because users see them.
export default function App() {
  return (
    <Routes>
      {/* Open to everyone; buttons adapt when the user is signed in. */}
      <Route index element={<LandingPage />} />
      <Route path="lumbung/animasi" element={<LogoAnimationPage />} />
      <Route element={<GuestRoute />}>
        <Route path="masuk" element={<SignInPage />} />
        <Route path="daftar" element={<SignUpPage />} />
        <Route path="lupa-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <TransactionFormProvider>
              <AppLayout />
            </TransactionFormProvider>
          }
        >
          <Route path="beranda" element={<HomePage />} />
          <Route path="transaksi" element={<TransactionsPage />} />
          <Route path="dompet" element={<WalletsPage />} />
          <Route path="anggaran" element={<BudgetsPage />} />
          <Route path="tabungan" element={<SavingsPage />} />
          <Route path="tagihan" element={<RecurringPage />} />
          <Route path="utang" element={<DebtsPage />} />
          <Route path="lainnya" element={<MorePage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="pengaturan/kategori" element={<CategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
