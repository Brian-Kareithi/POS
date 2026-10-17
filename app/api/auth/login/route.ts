import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Server authentication is not configured. Use the demo sign-in in this environment." },
    { status: 501 }
  )
}
