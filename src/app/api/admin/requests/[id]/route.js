// Phase 2: POST approve/reject an access request
// Guards: authenticated session + admin identity + Origin validation + service role RPC
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
}
