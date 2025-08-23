import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import User from "../../../../models/User.js"
import { hashPassword } from "../../../../lib/auth.js"

// Creates an admin account if none exists. Safe to call repeatedly.
export async function POST() {
  try {
    await connectDB()

    const existingAdmin = await User.findOne({ role: "admin" })
    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists" }, { status: 409 })
    }

    const email = process.env.ADMIN_EMAIL || "admin@glownetwork.com"
    const password = process.env.ADMIN_PASSWORD || "admin123"

    const passwordHash = await hashPassword(password)

    const admin = await User.create({
      name: "Admin User",
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
      rank: "director",
      referralCode: "ADMIN001",
    })

    return NextResponse.json({
      message: "Admin created",
      admin: {
        _id: admin._id,
        email: admin.email,
      },
    })
  } catch (e) {
    console.error("Bootstrap admin error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
