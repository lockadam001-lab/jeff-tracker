"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AddIdeaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    ticker: '', date_added: new Date().toISOString().split('T')[0],
    jeff_notes: '', atr: '', rvol_at_post: '', atr_x_50ma: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.ticker.trim()) { setError('Ticker is required'); return }
    setSaving(true)
    const { error: err } = await supabase.from('ideas').insert({
      ticker: form.ticker.trim().toUpperCase(),
      date_added: form.date_added,
      jeff_notes: form.jeff_notes || null,
      atr: form.atr ? parseFloat(form.atr) : null,
      rvol_at_post: form.rvol_at_post ? parseFloat(form.rvol_at_post) : null,
      atr_x_50ma: form.atr_x_50ma ? parseFloat(form.atr_x_50ma) : null,
      status: 'watching',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Add Jeff's Idea to Watchlist</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface2 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-danger/10 text-danger border border-danger/20 rounded-lg text-sm">{error}</div>}

        <div className="flex flex-col gap-4">
          <Field label="Ticker Symbol *">
            <input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())}
              placeholder="e.g. QUBT" className="input-field" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Jeff Posted">
              <input type="date" value={form.date_added} onChange={e => set('date_added', e.target.value)} className="input-field" />
            </Field>
            <Field label="ATR (from TradingView)">
              <input type="number" value={form.atr} onChange={e => set('atr', e.target.value)} placeholder="0.97" step="0.01" className="input-field" />
            </Field>
            <Field label="RVOL at time of post">
              <input type="number" value={form.rvol_at_post} onChange={e => set('rvol_at_post', e.target.value)} placeholder="9.0" step="0.1" className="input-field" />
            </Field>
            <Field label="ATR× from 50-MA">
              <input type="number" value={form.atr_x_50ma} onChange={e => set('atr_x_50ma', e.target.value)} placeholder="4.5" step="0.1" className="input-field" />
            </Field>
          </div>
          <Field label="Notes from Jeff's Post">
            <textarea value={form.jeff_notes} onChange={e => set('jeff_notes', e.target.value)}
              placeholder="Post-earnings gap up, 900% RVOL, already 200% LoD — watching for pullback…"
              rows={3} className="input-field resize-none" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-surface2 text-muted border border-border text-sm hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-[#3a8f9a] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Add to Watchlist'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
