"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase, type Idea, type TradeStatus } from '@/lib/supabase'
import { AddIdeaModal } from '@/components/AddIdeaModal'
import { UpdateModal } from '@/components/UpdateModal'
import { EntryChecker } from '@/components/EntryChecker'
import { RulesPanel } from '@/components/RulesPanel'
import { StatsRow } from '@/components/StatsRow'
import { WatchlistTable } from '@/components/WatchlistTable'

type Tab = 'watchlist' | 'checker' | 'rules'
type Filter = 'all' | TradeStatus

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [tab, setTab] = useState<Tab>('watchlist')
  const [filter, setFilter] = useState<Filter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editIdea, setEditIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchIdeas = useCallback(async () => {
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false })
    if (data) setIdeas(data as Idea[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchIdeas()
    // Real-time subscription
    const channel = supabase
      .channel('ideas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchIdeas())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchIdeas])

  // Manual refresh for live price check
  const refreshTicker = async (idea: Idea) => {
    try {
      const res = await fetch(`/api/ticker/${idea.ticker}`)
      const { snap, criteria } = await res.json()
      const newStatus: TradeStatus =
        idea.status === 'entered' && idea.stop_loss && snap.low <= idea.stop_loss ? 'loss'
        : criteria.verdict === 'GO' && idea.status === 'watching' ? 'ready'
        : idea.status
      await supabase.from('ideas').update({
        current_price: snap.price,
        lod: snap.low,
        lod_dist_pct: snap.lodDistPct,
        rvol_at_post: snap.rvol,
        atr: snap.atr,
        atr_x_50ma: snap.atrX50ma,
        last_checked: new Date().toISOString(),
        status: newStatus,
      }).eq('id', idea.id)
    } catch {}
  }

  const deleteIdea = async (id: string) => {
    if (!confirm('Remove this idea?')) return
    await supabase.from('ideas').delete().eq('id', id)
    fetchIdeas()
  }

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#4fa3ae" fillOpacity="0.15"/>
            <path d="M8 24 L16 8 L24 24" stroke="#4fa3ae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.5 19 L21.5 19" stroke="#4fa3ae" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="16" cy="8" r="2" fill="#4fa3ae"/>
          </svg>
          <div>
            <div className="font-bold text-base tracking-tight text-white">Jeff Tracker</div>
            <div className="text-xs text-muted">Live via Massive.com · Supabase</div>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-[#3a8f9a] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Idea
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <StatsRow ideas={ideas} />

        {/* TABS */}
        <div className="flex gap-1 p-1 bg-surface2 rounded-xl w-fit mb-6">
          {(['watchlist','checker','rules'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-surface text-white shadow' : 'text-muted hover:text-white'
              }`}>
              {t === 'watchlist' ? '📋 Watchlist' : t === 'checker' ? '✅ Entry Checker' : '📖 Rules'}
            </button>
          ))}
        </div>

        {tab === 'watchlist' && (
          <WatchlistTable
            ideas={filtered}
            loading={loading}
            filter={filter}
            onFilterChange={setFilter}
            onRefresh={refreshTicker}
            onEdit={setEditIdea}
            onDelete={deleteIdea}
          />
        )}
        {tab === 'checker' && <EntryChecker />}
        {tab === 'rules' && <RulesPanel />}
      </main>

      {showAdd && <AddIdeaModal onClose={() => setShowAdd(false)} onSaved={fetchIdeas} />}
      {editIdea && <UpdateModal idea={editIdea} onClose={() => setEditIdea(null)} onSaved={fetchIdeas} />}
    </div>
  )
}
