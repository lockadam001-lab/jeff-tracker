/**
 * Massive.com REST API helpers
 * Docs: https://massive.com/docs/rest/quickstart
 */

const BASE = 'https://api.massive.com/v2'
const KEY = process.env.MASSIVE_API_KEY!

export interface TickerSnapshot {
  ticker: string
  price: number          // last trade price
  open: number
  high: number
  low: number            // LoD
  prevClose: number
  volume: number
  avgVolume: number      // 30-day avg daily volume (used for RVOL)
  rvol: number           // volume / avgVolume  (computed)
  atr: number            // 14-day ATR (fetched from indicators or computed)
  sma50: number | null   // 50-day SMA
  sma200: number | null  // 200-day SMA
  atrX50ma: number | null // (price - sma50) / atr
  lodDistPct: number     // (price - low) / atr * 100
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}&apiKey=${KEY}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Massive API error ${res.status} on ${path}`)
  return res.json()
}

/** Fetch daily aggregates for the last N days */
async function getDailyAggs(ticker: string, days = 30) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days * 2) // buffer for weekends/holidays
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const data = await get(`/aggs/ticker/${ticker}/range/1/day/${fmt(from)}/${fmt(to)}?adjusted=true&sort=asc&limit=${days + 10}`)
  return (data.results || []) as { o: number; h: number; l: number; c: number; v: number; t: number }[]
}

/** Compute 14-day ATR from daily bars */
function computeATR(bars: { h: number; l: number; c: number }[], period = 14): number {
  if (bars.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].c
    trs.push(Math.max(bars[i].h - bars[i].l, Math.abs(bars[i].h - prev), Math.abs(bars[i].l - prev)))
  }
  const recent = trs.slice(-period)
  return recent.reduce((a, b) => a + b, 0) / period
}

/** Compute simple moving average */
function computeSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

/** Compute 30-day average volume */
function avgVol(bars: { v: number }[], period = 30): number {
  const slice = bars.slice(-period)
  if (!slice.length) return 1
  return slice.reduce((a, b) => a + b.v, 0) / slice.length
}

export async function getTickerSnapshot(ticker: string): Promise<TickerSnapshot> {
  const [snapData, bars] = await Promise.all([
    get(`/snapshot/locale/us/markets/stocks/tickers/${ticker}?`),
    getDailyAggs(ticker, 60),
  ])

  const snap = snapData?.ticker?.day || {}
  const prevClose = snapData?.ticker?.prevDay?.c || 0
  const lastTrade = snapData?.ticker?.lastTrade?.p || snap.c || prevClose

  const closes = bars.map((b: any) => b.c)
  const atr = computeATR(bars)
  const sma50 = computeSMA(closes, 50)
  const sma200 = computeSMA(closes, 200)

  const todayBars = bars.slice(-1)[0] || {}
  const todayLow = snap.l || todayBars.l || lastTrade
  const todayVol = snap.v || 0
  const av = avgVol(bars)

  const price = lastTrade
  const lodDist = price - todayLow
  const lodDistPct = atr > 0 ? (lodDist / atr) * 100 : 0
  const atrX50ma = sma50 && atr > 0 ? (price - sma50) / atr : null

  return {
    ticker: ticker.toUpperCase(),
    price,
    open: snap.o || todayBars.o || price,
    high: snap.h || todayBars.h || price,
    low: todayLow,
    prevClose,
    volume: todayVol,
    avgVolume: av,
    rvol: av > 0 ? todayVol / av : 0,
    atr: Math.round(atr * 100) / 100,
    sma50,
    sma200,
    atrX50ma: atrX50ma ? Math.round(atrX50ma * 10) / 10 : null,
    lodDistPct: Math.round(lodDistPct * 10) / 10,
  }
}

/** Jeff's entry criteria check */
export interface CriteriaResult {
  lodOk: boolean       // lodDistPct <= 60
  atrMaOk: boolean     // atrX50ma <= 4 (or null = can't check)
  rvolOk: boolean      // rvol >= 2
  above200Ok: boolean  // price > sma200
  allPass: boolean
  verdict: 'GO' | 'WAIT' | 'PASS' | 'UNKNOWN'
}

export function checkCriteria(snap: TickerSnapshot): CriteriaResult {
  const lodOk = snap.lodDistPct <= 60
  const atrMaOk = snap.atrX50ma == null ? true : snap.atrX50ma <= 4
  const rvolOk = snap.rvol >= 2
  const above200Ok = snap.sma200 == null ? true : snap.price > snap.sma200
  const allPass = lodOk && atrMaOk && rvolOk && above200Ok
  const verdict = !above200Ok ? 'PASS' : !lodOk || !atrMaOk ? 'PASS' : !rvolOk ? 'WAIT' : 'GO'
  return { lodOk, atrMaOk, rvolOk, above200Ok, allPass, verdict }
}
