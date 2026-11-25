import type { ReactNode } from "react"

interface PageHeaderProps {
  description?: string
  action?: ReactNode
}

/**
 * Description and main action of a page. The page title itself lives in the
 * TopBar, so it is not repeated here.
 */
export function PageHeader({ description, action }: PageHeaderProps) {
  if (!description && !action) return null
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      {description ? <p className="text-muted-foreground">{description}</p> : <span />}
      {action}
    </div>
  )
}
