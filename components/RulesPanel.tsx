"use client"

const ENTRY_RULES = [
  { n:'1', title:'LoD Distance ≤ 60% ATR', desc:'Distance from price to Low of Day must be ≤ 60% of ATR. If 100–200%+ away → SKIP.' },
  { n:'2', title:'ATR× from 50-MA ≤ 4×', desc:'If stock is more than 4× ATR extended from its 50-day MA it is overextended. Pass.' },
  { n:'3', title:'Strong RVOL ≥ 2×', desc:'Relative volume must be elevated. Confirms real buying. Never the sole reason to enter.' },
  { n:'4', title:'Wait 30 min after open', desc:'Always wait 30 minutes post-open before entering. Prevents chasing the opening spike.' },
  { n:'5', title:'Price above 200-day MA', desc:'Never trade a stock below its 200-MA. Downtrend stocks have no institutional support.' },
  { n:'6', title:'No entry before earnings', desc:'Avoid entering right before earnings or major macro events. Setup can change overnight.' },
]

const STOP_RULES = [
  { n:'A', title:'Stop = Low of Day', desc:'Always place stop just below the Low of Day at time of entry. This is your invalidation point.' },
  { n:'B', title:'3-Stop Strategy', desc:'Split your exit into 3 layers. Exit in thirds if trade goes against you — limits avg loss to −0.67R instead of −1R.' },
  { n:'C', title:'Risk ≤ 1% of account', desc:'Never risk more than 1% of total account on a single idea. Size position based on price-to-LoD distance.' },
  { n:'D', title:"Jeff's post = Watchlist alert", desc:'When Jeff posts a ticker it goes on your watchlist. You wait for criteria — sometimes that takes days.' },
]

export function RulesPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="text-base font-semibold text-white mb-4">📋 Entry Criteria (All must pass)</div>
        <div className="flex flex-col gap-3">
          {ENTRY_RULES.map(r => (
            <div key={r.n} className="flex gap-3 p-3 bg-[#1c1b19] border border-[#2e2d2b] rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#4fa3ae]/10 text-[#4fa3ae] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{r.n}</div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">{r.title}</div>
                <div className="text-xs text-[#7a7977]">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-base font-semibold text-white mb-4">🛑 Stop Loss & Risk Rules</div>
        <div className="flex flex-col gap-3">
          {STOP_RULES.map(r => (
            <div key={r.n} className="flex gap-3 p-3 bg-[#1c1b19] border border-[#2e2d2b] rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#4fa3ae]/10 text-[#4fa3ae] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{r.n}</div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">{r.title}</div>
                <div className="text-xs text-[#7a7977]">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-[#e8a034]/10 text-[#e8a034] border border-[#e8a034]/20 rounded-xl text-xs">
          ⚠️ The RRR and position sizing relationship is <strong>non-linear — exponential</strong> when risk is tightly controlled. A 0.5R risk winning 3× beats a 2R risk winning 3× every time.
        </div>
      </div>
    </div>
  )
}
