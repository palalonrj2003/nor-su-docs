import { statusLabels, statusStyles } from '@/lib/admin'
export function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[value] ?? 'bg-muted text-muted-foreground'}`}>{statusLabels[value] ?? value}</span>
}
