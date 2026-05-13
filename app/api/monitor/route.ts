import { NextRequest, NextResponse } from 'next/server'
import { supabase, type Idea } from '@/lib/supabase'
import { getTickerSnapshot, checkCriteria } from '@/lib/massive'

// Vercel Cron: called every minute Mon–Fri 9:30–16:00 ET
// vercel.json crons config is at bottom of this file as comment

export async function GET(req: NextRequest) {
  // Simple secret check so only Vercel Cron can call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all active (non-terminal) ideas
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .in('status', ['watching', 'ready', 'entered'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!ideas || ideas.length === 0) return NextResponse.json({ checked: 0 })

  const results: string[] = []

  for (const idea of ideas as Idea[]) {
    try {
      const snap = await getTickerSnapshot(idea.ticker)
      const criteria = checkCriteria(snap)

      let newStatus = idea.status
      let note = ''

      // ── If trade is ENTERED: check if price hit stop loss ──────────────────
      if (idea.status === 'entered' && idea.stop_loss) {
        if (snap.low <= idea.stop_loss) {
          newStatus = 'loss'
          note = `🛑 Stop hit! Low ${snap.low} touched stop ${idea.stop_loss}`
        }
      }

      // ── If WATCHING: check if criteria now met ─────────────────────────────
      if (idea.status === 'watching' && criteria.verdict === 'GO') {
        newStatus = 'ready'
        note = `✅ Entry criteria met! LoD: ${snap.lodDistPct}% ATR, RVOL: ${snap.rvol.toFixed(1)}×`
      }

      // ── If READY: check if criteria dropped (extended again) ───────────────
      if (idea.status === 'ready' && criteria.verdict === 'PASS') {
        newStatus = 'watching'
        note = `⚠️ Criteria no longer met — LoD dist: ${snap.lodDistPct}% ATR`
      }

      // Update the idea
      const updatePayload: Partial<Idea> = {
        current_price: snap.price,
        lod: snap.low,
        lod_dist_pct: snap.lodDistPct,
        rvol_at_post: snap.rvol,
        atr: snap.atr,
        atr_x_50ma: snap.atrX50ma,
        last_checked: new Date().toISOString(),
        status: newStatus,
      }

      await supabase.from('ideas').update(updatePayload).eq('id', idea.id)

      // Log history if status changed
      if (newStatus !== idea.status) {
        await supabase.from('idea_history').insert({
          idea_id: idea.id,
          old_status: idea.status,
          new_status: newStatus,
          note,
          price: snap.price,
          lod_dist_pct: snap.lodDistPct,
          rvol: snap.rvol,
        })
        results.push(`${idea.ticker}: ${idea.status} → ${newStatus} | ${note}`)
      }
    } catch (err: any) {
      results.push(`${idea.ticker}: ERROR — ${err.message}`)
    }
  }

  return NextResponse.json({ checked: ideas.length, changes: results })
}

/*
  ── Vercel Cron Configuration ──────────────────────────────────────────────────
  Add this to your vercel.json to run monitor every minute on weekdays:

  "crons": [
    {
      "path": "/api/monitor",
      "schedule": "* 14-21 * * 1-5"
    }
  ]

  14:00–21:00 UTC = 9:30 AM–4:30 PM ET (covers full market hours)
  ──────────────────────────────────────────────────────────────────────────────
*/
