interface ErrorLike {
  message?: string
  code?: string
  hint?: string
}

const authMessages: Record<string, string> = {
  "Invalid login credentials": "Email atau kata sandi salah.",
  "Email not confirmed":
    "Email belum dikonfirmasi. Silakan buka tautan konfirmasi di email Anda.",
  "User already registered": "Email ini sudah terdaftar. Silakan masuk.",
  "Password should be at least 6 characters.":
    "Kata sandi minimal 6 karakter.",
}

/** Turns a Supabase/Postgres error into a user-facing message in Indonesian. */
export function errorMessage(error: unknown): string {
  const e = (error ?? {}) as ErrorLike
  const message = e.message ?? ""

  if (authMessages[message]) return authMessages[message]
  if (/rate limit/i.test(message))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."

  // Raised by our own database functions; the message is already user-facing.
  if (e.hint === "user_message" || e.hint === "category_type_mismatch") return message

  switch (e.code) {
    case "23503":
      return "Data ini masih dipakai (oleh transaksi, tagihan, tabungan, atau utang) sehingga tidak bisa dihapus."
    case "23505":
      return "Data yang sama sudah ada."
    case "23514":
      return "Data yang diisi tidak valid. Periksa kembali isian Anda."
    case "23502":
      return "Ada isian wajib yang belum diisi."
    case "42501":
      return "Anda tidak memiliki akses ke data ini."
  }

  if (/failed to fetch|network/i.test(message))
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."

  return message || "Terjadi kesalahan. Silakan coba lagi."
}
