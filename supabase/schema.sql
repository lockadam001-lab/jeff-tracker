-- ============================================================
-- Jeff Trade Tracker — Supabase Schema
-- Go to: supabase.com → Your Project → SQL Editor → New Query
-- Paste this entire file and click "Run"
-- ============================================================

create extension if not exists "pgcrypto";

-- ── 1. IDEAS TABLE (main watchlist) ──────────────────────────────────────────
create table if not exists public.ideas (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null,
  date_added      date not null default current_date,
  jeff_notes      text,

  -- Values at time of Jeff's post (entered manually or auto-filled)
  atr             numeric(10,4),
  rvol_at_post    numeric(10,2),
  atr_x_50ma      numeric(10,2),

  -- Live values updated by monitor every minute
  lod_dist_pct    numeric(10,2),   -- (price - lod) / atr * 100
  current_price   numeric(10,4),
  lod             numeric(10,4),   -- Low of Day
  sma50           numeric(10,4),
  sma200          numeric(10,4),

  -- Set when you manually mark trade as "entered"
  entry_price     numeric(10,4),
  stop_loss       numeric(10,4),   -- = LoD at time of entry

  -- Status machine
  status          text not null default 'watching'
                  check (status in (
                    'watching',   -- Jeff posted it, waiting for setup
                    'ready',      -- All criteria met RIGHT NOW
                    'entered',    -- You took the trade
                    'win',        -- Closed as winner
                    'loss',       -- Hit stop loss (auto or manual)
                    'passed'      -- Skipped (Jeff or you decided to pass)
                  )),

  last_checked    timestamptz,     -- Last time monitor ran for this ticker
  created_at      timestamptz default now()
);

-- ── 2. HISTORY TABLE (log every status change) ───────────────────────────────
create table if not exists public.idea_history (
  id            uuid primary key default gen_random_uuid(),
  idea_id       uuid references public.ideas(id) on delete cascade,
  old_status    text,
  new_status    text,
  note          text,
  price         numeric(10,4),
  lod_dist_pct  numeric(10,2),
  rvol          numeric(10,2),
  created_at    timestamptz default now()
);

-- ── 3. ROW LEVEL SECURITY (open access — add auth later if needed) ────────────
alter table public.ideas enable row level security;
alter table public.idea_history enable row level security;

-- Allow full access (no login required for now)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ideas' and policyname = 'Allow all ideas'
  ) then
    create policy "Allow all ideas"
      on public.ideas for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'idea_history' and policyname = 'Allow all history'
  ) then
    create policy "Allow all history"
      on public.idea_history for all using (true) with check (true);
  end if;
end $$;

-- ── 4. REALTIME (so app updates live without refresh) ─────────────────────────
alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.idea_history;

-- ── 5. INDEXES (faster queries) ───────────────────────────────────────────────
create index if not exists idx_ideas_status     on public.ideas(status);
create index if not exists idx_ideas_ticker     on public.ideas(ticker);
create index if not exists idx_history_idea_id  on public.idea_history(idea_id);

-- ── DONE ─────────────────────────────────────────────────────────────────────
-- You should see two new tables in your Supabase Table Editor:
--   • ideas
--   • idea_history
