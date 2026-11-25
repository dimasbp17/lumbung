import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { QueryClientProvider } from "@tanstack/react-query"

import App from "@/App"
import { PwaUpdatePrompt } from "@/components/pwa/pwa-update-prompt"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/query-client"
import { migrateLegacyStorageKeys } from "@/lib/storage"
import { isSupabaseConfigured } from "@/lib/supabase"
import { NotConfiguredPage } from "@/pages/not-configured"
import { AuthProvider } from "@/providers/auth-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import "@/index.css"

migrateLegacyStorageKeys()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {isSupabaseConfigured ? (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      ) : (
        <NotConfiguredPage />
      )}
      <Toaster position="top-center" richColors />
      <PwaUpdatePrompt />
    </ThemeProvider>
  </StrictMode>
)
