import seal from '@/assets/norsu-seal.png.asset.json'
export function Brand({ large = false }: { large?: boolean }) {
  return <div className="flex items-center gap-3"><img src={seal.url} alt="Negros Oriental State University seal" className={large ? 'h-16 w-16 object-contain' : 'h-10 w-10 object-contain'} /><div><div className={large ? 'text-2xl font-bold text-primary' : 'text-lg font-bold text-primary'}>Balay NORSU</div><div className="text-xs text-muted-foreground">NORSU BSC Dormitory</div></div></div>
}