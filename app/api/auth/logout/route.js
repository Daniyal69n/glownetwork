import { NextResponse } from "next/server"

export async function POST() {
  // Clear the httpOnly auth cookie
  const res = NextResponse.json({ message: "Logged out" })
  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return res
}
