import { NextResponse } from "next/server"
import { isSupabaseConfigured, supabaseAdmin } from "@/server/db/supabase"

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      ok: true,
      database: "unconfigured",
      mode: "dev-local-adapter",
      timestamp: new Date().toISOString(),
    })
  }

  try {
    const { error, count } = await supabaseAdmin
      .from("stores")
      .select("id", { count: "exact", head: true })

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          database: "error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      ok: true,
      database: "connected",
      storesCount: count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        message: err instanceof Error ? err.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
