"use client"
import type { Idea } from '@/lib/supabase'

export function StatsRow({ ideas }: { ideas: Idea[] }) {
  const total = ideas.length
  const ready = ideas.filter(i => i.status === 'ready').length
  const entered = ideas.filter(i => ['entered','win','loss'].includes(i.status)).length
  const wins = ideas.filter(i => i.status === 'win').length
  const closed = ideas.filter(i => ['win','loss'].includes(i.status)).length
  const winRate = closed > 0 ? Math.round((wins / closed) * 100) : null

  const stats = [
    { label: 'Total Ideas', value: total, sub: "from Jeff's posts", color: 'text-white' },
    { label: 'Ready to Trade', value: ready, sub: 'criteria met now', color: 'text-success' },
    { label: 'Trades Entered', value: entered, sub: 'executed', color: 'text-primary' },
    { label: 'Win Rate', value: winRate != null ? winRate + '%' : '—', sub: 'closed trades', color: winRate && winRate >= 50 ? 'text-success' : 'text-danger' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-muted uppercase tracking-widest mb-1">{s.label}</div>
          <div className={`text-3xl font-bold mono ${s.color}`}>{s.value}</div>
          <div className="text-xs text-muted mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
