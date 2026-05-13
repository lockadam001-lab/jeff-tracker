"use client"
import type { Idea, TradeStatus } from '@/lib/supabase'
import { useState } from 'react'

const FILTERS: { label: string; value: 'all' | TradeStatus }[] = [
  { label: 'All', value: 'all' },
  { label: '👀 Watching', value: 'watching' },
  { label: '✅ Ready', value: 'ready' },
  { label: '📈 Entered', value: 'entered' },
  { label: '🏆 Win', value: 'win' },
  { label: '❌ Loss', value: 'loss' },
  { label: '⏭ Passed', value: 'passed' },
]

const STATUS_STYLES: Record<string, string> = {
  watching: 'bg-warn/10 text-warn',
  ready: 'bg-success/10 text-success',
  entered: 'bg-primary/10 text-primary',
  win: 'bg-success/10 text-success',
  loss: 'bg-danger/10 text-danger',
  passed: 'bg-surface2 text-muted',
}
const STATUS_LABELS: Record<string, string> = {
  watching:'👀 Watching', ready:'✅ Ready', entered:'📈 Entered',
  win:'🏆 Win', loss:'❌ Loss', passed:'⏭ Passed'
}

function LodCell({ val }: { val: number | null }) {
  if (val == null) return <span className="text-muted">—</span>
  const color = val <= 60 ? 'text-success' : val <= 100 ? 'text-warn' : 'text-danger'
  return <span className={`mono font-bold ${color}`}>{val}%</span>
}

export function WatchlistTable({ ideas, loading, filter, onFilterChange, onRefresh, onEdit, onDelete }: {
  ideas: Idea[]
  loading: boolean
  filter: string
  onFilterChange: (f: any) => void
  onRefresh: (idea: Idea) => Promise<void>
  onEdit: (idea: Idea) => void
  onDelete: (id: string) => void
}) {
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const handleRefresh = async (idea: Idea) => {
    setRefreshing(idea.id)
    await onRefresh(idea)
    setRefreshing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="text-base font-semibold text-white">Ideas from Jeff's Posts</div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => onFilterChange(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filter === f.value
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-surface2 text-muted border-border hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted text-sm">Loading…</div>
        ) : ideas.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-white font-medium mb-1">No ideas yet</div>
            <div className="text-muted text-sm max-w-xs mx-auto">When Jeff posts a ticker on X, click "Add Idea" to track it here.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Ticker','Added','Price','LoD','ATR','RVOL','ATR×50MA','Status','Checked',''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ideas.map(idea => (
                  <tr key={idea.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                    <td className="px-3 py-3">
                      <div className="text-primary font-bold mono text-sm">${idea.ticker}</div>
                      <div className="text-xs text-muted truncate max-w-[120px]" title={idea.jeff_notes || ''}>{idea.jeff_notes || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted mono">{idea.date_added}</td>
                    <td className="px-3 py-3 mono text-sm font-medium">{idea.current_price ? '$'+idea.current_price.toFixed(2) : '—'}</td>
                    <td className="px-3 py-3"><LodCell val={idea.lod_dist_pct} /></td>
                    <td className="px-3 py-3 mono text-xs text-muted">{idea.atr ? '$'+idea.atr.toFixed(2) : '—'}</td>
                    <td className="px-3 py-3 mono text-xs" style={{ color: idea.rvol_at_post && idea.rvol_at_post >= 2 ? 'var(--tw-color-success, #6daa45)' : '' }}>
                      <span className={idea.rvol_at_post && idea.rvol_at_post >= 2 ? 'text-success' : 'text-muted'}>
                        {idea.rvol_at_post ? idea.rvol_at_post.toFixed(1)+'×' : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 mono text-xs">
                      <span className={idea.atr_x_50ma && idea.atr_x_50ma > 4 ? 'text-danger' : 'text-muted'}>
                        {idea.atr_x_50ma ? idea.atr_x_50ma.toFixed(1)+'×' : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[idea.status]||''}`}>
                        {STATUS_LABELS[idea.status]||idea.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted mono">
                      {idea.last_checked ? new Date(idea.last_checked).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleRefresh(idea)} disabled={refreshing === idea.id}
                          className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-surface2 transition-colors disabled:opacity-40"
                          title="Refresh live data">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className={refreshing === idea.id ? 'animate-spin' : ''}>
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
                          </svg>
                        </button>
                        <button onClick={() => onEdit(idea)}
                          className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface2 transition-colors" title="Update status">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => onDelete(idea.id)}
                          className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-surface2 transition-colors" title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
