import { NextRequest, NextResponse } from 'next/server'
import { getTickerSnapshot, checkCriteria } from '@/lib/massive'

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const snap = await getTickerSnapshot(params.symbol.toUpperCase())
    const criteria = checkCriteria(snap)
    return NextResponse.json({ snap, criteria })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
