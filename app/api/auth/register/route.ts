import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Server registration is not configured in this environment." },
    { status: 501 }
  )
}
