"use client"
import { useState } from 'react'

export function EntryChecker() {
  const [form, setForm] = useState({
    ticker: '', price: '', lod: '', atr: '',
    rvol: '', atrMa: '', above200: '', minsOpen: ''
  })
  const [result, setResult] = useState<any>(null)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const check = () => {
    const price = parseFloat(form.price)
    const lod = parseFloat(form.lod)
    const atr = parseFloat(form.atr)
    const rvol = parseFloat(form.rvol)
    const atrMa = parseFloat(form.atrMa)
    const minsOpen = parseFloat(form.minsOpen)
    if (!price || !lod || !atr) return
    const lodDist = price - lod
    const lodPct = (lodDist / atr) * 100
    const checks = [
      { label: 'LoD Distance ≤ 60% ATR', value: lodPct.toFixed(1)+'%', pass: lodPct <= 60, warn: lodPct > 60 && lodPct <= 100 },
      ...(!isNaN(atrMa) ? [{ label: 'ATR× from 50-MA ≤ 4×', value: atrMa.toFixed(1)+'×', pass: atrMa <= 4, warn: atrMa > 4 && atrMa <= 5 }] : []),
      ...(!isNaN(rvol) ? [{ label: 'RVOL ≥ 2×', value: rvol.toFixed(1)+'×', pass: rvol >= 2, warn: false }] : []),
      ...(!isNaN(minsOpen) ? [{ label: 'Wait 30 min after open', value: minsOpen+'min', pass: minsOpen >= 30, warn: false }] : []),
      ...(form.above200 ? [{ label: 'Price above 200-MA', value: form.above200 === 'yes' ? 'Yes' : 'No', pass: form.above200 === 'yes', warn: false }] : []),
    ]
    const fails = checks.filter(c => !c.pass && !c.warn).length
    const warns = checks.filter(c => c.warn).length
    const verdict = fails > 0 ? 'NO' : warns > 0 ? 'WAIT' : 'GO'
    setResult({ checks, verdict, lodPct, lodDist, lod, price })
  }

  const inputCls = "w-full px-3 py-2 bg-[#1c1b19] border border-[#2e2d2b] rounded-lg text-sm text-[#d4d3d1] outline-none focus:border-[#4fa3ae]"

  return (
    <div className="bg-[#161614] border border-[#2e2d2b] rounded-2xl p-6">
      <div className="text-base font-semibold text-white mb-5">🔍 Real-Time Entry Checker</div>
      <div className="p-3 mb-5 bg-[#4fa3ae]/10 text-[#4fa3ae] border border-[#4fa3ae]/20 rounded-lg text-sm">
        Enter live values from TradingView. The checker tells you instantly if Jeff's criteria are met.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { k:'ticker', label:'Ticker', ph:'QUBT' },
          { k:'price', label:'Current Price ($)', ph:'14.30', type:'number' },
          { k:'lod', label:'Low of Day ($)', ph:'12.50', type:'number' },
          { k:'atr', label:'ATR ($)', ph:'0.97', type:'number' },
          { k:'rvol', label:'RVOL', ph:'9.0', type:'number' },
          { k:'atrMa', label:'ATR× from 50-MA', ph:'4.5', type:'number' },
          { k:'minsOpen', label:'Mins after open', ph:'35', type:'number' },
        ].map(f => (
          <div key={f.k} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">{f.label}</label>
            <input type={f.type||'text'} placeholder={f.ph} value={(form as any)[f.k]}
              onChange={e => set(f.k, f.k==='ticker' ? e.target.value.toUpperCase() : e.target.value)}
              className={inputCls} step="0.01" />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#7a7977] uppercase tracking-wider">Above 200-MA?</label>
          <select value={form.above200} onChange={e => set('above200', e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            <option value="yes">Yes ✅</option>
            <option value="no">No ❌</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mb-6">
        <button onClick={() => { setForm({ ticker:'',price:'',lod:'',atr:'',rvol:'',atrMa:'',above200:'',minsOpen:'' }); setResult(null) }}
          className="px-4 py-2 bg-[#1c1b19] border border-[#2e2d2b] rounded-lg text-sm text-[#7a7977] hover:text-white transition-colors">Clear</button>
        <button onClick={check}
          className="px-4 py-2 bg-[#4fa3ae] text-white rounded-lg text-sm font-semibold hover:bg-[#3a8f9a] transition-colors">▶ Check Entry</button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1c1b19] border border-[#2e2d2b] rounded-xl p-4 flex flex-col gap-2">
            {result.checks.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#2e2d2b] last:border-0">
                <span className={c.pass ? 'text-[#6daa45]' : c.warn ? 'text-[#e8a034]' : 'text-[#d16374]'}>
                  {c.pass ? '✅' : c.warn ? '⚠️' : '❌'}
                </span>
                <span className="flex-1 text-sm">{c.label}</span>
                <span className={`text-xs font-mono font-bold ${c.pass ? 'text-[#6daa45]' : c.warn ? 'text-[#e8a034]' : 'text-[#d16374]'}`}>{c.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className={`p-4 rounded-xl text-center font-bold text-base border ${
              result.verdict === 'GO' ? 'bg-[#6daa45]/10 text-[#6daa45] border-[#6daa45]'
              : result.verdict === 'WAIT' ? 'bg-[#e8a034]/10 text-[#e8a034] border-[#e8a034]'
              : 'bg-[#d16374]/10 text-[#d16374] border-[#d16374]'
            }`}>
              {result.verdict === 'GO' ? `✅ ENTER — Criteria Met` : result.verdict === 'WAIT' ? `⚠️ BORDERLINE — Reduce size` : `❌ DO NOT ENTER`}
              {form.ticker && <div className="text-sm font-normal opacity-80 mt-1">${form.ticker}</div>}
            </div>
            <div className="bg-[#1c1b19] border border-[#2e2d2b] rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">📍 Stop Loss Info</div>
              {[
                { label: 'Stop Loss (LoD)', value: '$'+result.lod.toFixed(2), color: 'text-[#d16374]' },
                { label: 'Risk per share', value: '$'+result.lodDist.toFixed(2), color: 'text-white' },
                { label: 'LoD % of ATR', value: result.lodPct.toFixed(1)+'%', color: result.lodPct <= 60 ? 'text-[#6daa45]' : 'text-[#d16374]' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-[#2e2d2b] last:border-0">
                  <span className="text-xs text-[#7a7977]">{r.label}</span>
                  <span className={`mono font-bold text-sm ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
