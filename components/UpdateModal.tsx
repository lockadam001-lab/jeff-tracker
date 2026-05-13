"use client"
import { useState } from 'react'
import { supabase, type Idea, type TradeStatus } from '@/lib/supabase'

const STATUSES: { value: TradeStatus; label: string }[] = [
  { value: 'watching', label: '👀 Watching' },
  { value: 'ready', label: '✅ Ready to Trade' },
  { value: 'entered', label: '📈 Trade Entered' },
  { value: 'win', label: '🏆 Win' },
  { value: 'loss', label: '❌ Loss' },
  { value: 'passed', label: '⏭ Passed (Jeff skipped)' },
]

export function UpdateModal({ idea, onClose, onSaved }: { idea: Idea; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<TradeStatus>(idea.status)
  const [entryPrice, setEntryPrice] = useState(idea.entry_price?.toString() || '')
  const [stopLoss, setStopLoss] = useState(idea.stop_loss?.toString() || idea.lod?.toString() || '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const entry = parseFloat(entryPrice)
  const sl = parseFloat(stopLoss)
  const risk = !isNaN(entry) && !isNaN(sl) ? entry - sl : null
  const tp1 = risk ? entry + risk * 1 : null
  const tp2 = risk ? entry + risk * 2 : null
  const tp3 = risk ? entry + risk * 3 : null

  const save = async () => {
    setSaving(true)
    const update: Partial<Idea> = { status }
    if (entryPrice) update.entry_price = parseFloat(entryPrice)
    if (stopLoss) update.stop_loss = parseFloat(stopLoss)
    await supabase.from('ideas').update(update).eq('id', idea.id)
    await supabase.from('idea_history').insert({
      idea_id: idea.id,
      old_status: idea.status,
      new_status: status,
      note: notes || null,
      price: idea.current_price,
      lod_dist_pct: idea.lod_dist_pct,
      rvol: idea.rvol_at_post,
    })
    setSaving(false)
    onSaved(); onClose()
  }

  const inputCls = "w-full px-3 py-2 bg-[#1c1b19] border border-[#2e2d2b] rounded-lg text-sm text-[#d4d3d1] outline-none focus:border-[#4fa3ae]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#161614] border border-[#2e2d2b] rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Update ${idea.ticker}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#7a7977] hover:text-white hover:bg-[#1c1b19] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TradeStatus)} className={inputCls}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Entry + SL */}
          {(status === 'entered' || status === 'win' || status === 'loss') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">Entry Price ($)</label>
                <input type="number" value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  placeholder={idea.current_price?.toFixed(2) || '0.00'}
                  step="0.01" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">Stop Loss / LoD ($)</label>
                <input type="number" value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  placeholder={idea.lod?.toFixed(2) || '0.00'}
                  step="0.01" className={inputCls} />
              </div>
            </div>
          )}

          {/* R Levels — auto calculated */}
          {risk && risk > 0 && (
            <div className="bg-[#1c1b19] border border-[#2e2d2b] rounded-xl p-4">
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">📊 Jeff's R Levels (Auto-Calculated)</div>
              <div className="flex flex-col gap-2">

                {/* Risk row */}
                <div className="flex justify-between items-center py-2 border-b border-[#2e2d2b]">
                  <div>
                    <div className="text-xs font-semibold text-[#d16374]">🛑 Stop Loss</div>
                    <div className="text-xs text-[#7a7977]">Exit 100% if hit — max loss</div>
                  </div>
                  <div className="text-right">
                    <div className="mono font-bold text-[#d16374]">${sl.toFixed(2)}</div>
                    <div className="text-xs text-[#7a7977]">−${risk.toFixed(2)} / share</div>
                  </div>
                </div>

                {/* TP1 */}
                <div className="flex justify-between items-center py-2 border-b border-[#2e2d2b]">
                  <div>
                    <div className="text-xs font-semibold text-[#e8a034]">🎯 TP1 — 1R</div>
                    <div className="text-xs text-[#7a7977]">Sell ⅓ position here</div>
                  </div>
                  <div className="text-right">
                    <div className="mono font-bold text-[#e8a034]">${tp1!.toFixed(2)}</div>
                    <div className="text-xs text-[#7a7977]">+${risk.toFixed(2)} / share</div>
                  </div>
                </div>

                {/* TP2 */}
                <div className="flex justify-between items-center py-2 border-b border-[#2e2d2b]">
                  <div>
                    <div className="text-xs font-semibold text-[#4fa3ae]">🎯 TP2 — 2R</div>
                    <div className="text-xs text-[#7a7977]">Sell another ⅓ here</div>
                  </div>
                  <div className="text-right">
                    <div className="mono font-bold text-[#4fa3ae]">${tp2!.toFixed(2)}</div>
                    <div className="text-xs text-[#7a7977]">+${(risk * 2).toFixed(2)} / share</div>
                  </div>
                </div>

                {/* TP3 */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-xs font-semibold text-[#6daa45]">🎯 TP3 — 3R</div>
                    <div className="text-xs text-[#7a7977]">Let last ⅓ run to here</div>
                  </div>
                  <div className="text-right">
                    <div className="mono font-bold text-[#6daa45]">${tp3!.toFixed(2)}</div>
                    <div className="text-xs text-[#7a7977]">+${(risk * 3).toFixed(2)} / share</div>
                  </div>
                </div>

              </div>

              {/* RRR summary */}
              <div className="mt-3 p-3 bg-[#0f0f0d] rounded-lg border border-[#2e2d2b]">
                <div className="text-xs text-[#7a7977] mb-2 font-semibold uppercase tracking-wider">Jeff's 3-Part Exit Strategy</div>
                <div className="text-xs text-[#7a7977] leading-relaxed">
                  Sell <span className="text-white font-semibold">⅓ at TP1</span>, move stop to breakeven →
                  Sell <span className="text-white font-semibold">⅓ at TP2</span> →
                  Let <span className="text-white font-semibold">⅓ run to TP3+</span>
                  <br/>Max loss capped at <span className="text-[#d16374] font-semibold">−0.67R</span> with this strategy.
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Why entering? What changed?" rows={2}
              className={inputCls + " resize-none"} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1c1b19] text-[#7a7977] border border-[#2e2d2b] text-sm hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#4fa3ae] text-white text-sm font-semibold hover:bg-[#3a8f9a] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
