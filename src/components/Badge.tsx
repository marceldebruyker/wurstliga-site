import { clsx } from 'clsx';
export default function Badge({ children, tone='zinc' }: { children: any, tone?: 'green'|'red'|'zinc' }){
  const map:any = { green: 'bg-green-500/15 text-green-300', red: 'bg-red-500/15 text-red-300', zinc: 'bg-zinc-700/40 text-zinc-200'}
  return <span className={clsx('px-2 py-0.5 rounded-lg text-xs', map[tone])}>{children}</span>
}