import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ message: "Registration successful", userId: "new-user-id" })
}
