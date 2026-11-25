import { useCallback, useSyncExternalStore } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { STORAGE_KEYS } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import type { Member } from "@/types"

const QUERY_KEY = ["members"] as const

export function useMembers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, color, created_at")
        .order("created_at")
        .order("name")
      if (error) throw error
      return data
    },
  })
}

export function useSaveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (member: Pick<Member, "name" | "color"> & { id?: string }) => {
      const { id, ...values } = member
      const { error } = id
        ? await supabase.from("members").update(values).eq("id", id)
        : await supabase.from("members").insert(values)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

// ---------------------------------------------------------------------------
// Last used member — stored per device (localStorage)
// ---------------------------------------------------------------------------
const listeners = new Set<() => void>()

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.lastMember)
  } catch {
    return null
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener("storage", cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", cb)
  }
}

/**
 * The member last selected on this device. If that member has been deleted,
 * falls back to the first member.
 */
export function useLastMember() {
  const { data: members = [] } = useMembers()
  const stored = useSyncExternalStore(subscribe, readStored, () => null)

  const memberId =
    members.find((m) => m.id === stored)?.id ?? members[0]?.id ?? null

  const setLastMember = useCallback((id: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.lastMember, id)
    } catch {
      // ignore: private mode / storage blocked
    }
    listeners.forEach((cb) => cb())
  }, [])

  return { memberId, setLastMember }
}
