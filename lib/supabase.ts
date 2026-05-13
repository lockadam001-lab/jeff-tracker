import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type TradeStatus =
  | 'watching'    // Jeff posted it — waiting for setup
  | 'ready'       // All entry criteria currently met
  | 'entered'     // Trade taken
  | 'win'         // Closed as winner
  | 'loss'        // Hit stop loss
  | 'passed'      // Jeff or you decided to skip

export interface Idea {
  id: string
  ticker: string
  date_added: string
  jeff_notes: string | null
  atr: number | null
  rvol_at_post: number | null
  atr_x_50ma: number | null
  lod_dist_pct: number | null    // current LoD dist as % of ATR
  current_price: number | null
  lod: number | null
  stop_loss: number | null       // = LoD at entry
  entry_price: number | null
  status: TradeStatus
  last_checked: string | null
  created_at: string
}
