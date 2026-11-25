import { useEffect } from "react"

import { MemberAvatar } from "@/components/common/member-avatar"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useLastMember, useMembers } from "@/hooks/use-members"

/**
 * Asks who is using this device when no profile has been chosen here yet,
 * instead of silently picking the first member.
 */
export function MemberChoicePrompt() {
  const { data: members = [] } = useMembers()
  const { hasChoice, setLastMember } = useLastMember()

  // With a single member there is nothing to ask: remember it directly.
  const onlyMemberId = members.length === 1 ? members[0].id : null
  useEffect(() => {
    if (!hasChoice && onlyMemberId) setLastMember(onlyMemberId)
  }, [hasChoice, onlyMemberId, setLastMember])

  const open = !hasChoice && members.length > 1

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Siapa yang memakai perangkat ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Transaksi baru akan dicatat atas nama profil ini. Bisa diganti kapan saja lewat menu
            profil di kanan atas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          {members.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              className="h-12 justify-start gap-3 rounded-xl px-3 text-base"
              onClick={() => setLastMember(m.id)}
            >
              <MemberAvatar name={m.name} color={m.color} />
              <span className="truncate">{m.name}</span>
            </Button>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
