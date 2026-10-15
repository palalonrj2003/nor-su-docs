import type { ReactNode } from 'react'
export function PageTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium text-muted-foreground">BALAY NORSU / DORMITORY</p><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div>{actions}</div>
}
