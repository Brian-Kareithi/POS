import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  return NextResponse.json({
    token: "jwt-token-" + Date.now(),
    refreshToken: "refresh-token-" + Date.now(),
    user: {
      id: "1",
      email,
      name: "John Smith",
      role: "business_owner",
    },
  })
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
