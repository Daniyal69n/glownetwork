import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import User from "../../../../models/User.js"
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth.js"

export async function GET(request) {
  try {
    await connectDB()

    // Get token from request
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Find user
    const user = await User.findById(decoded.userId).select("-passwordHash")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rank: user.rank,
        referralCode: user.referralCode,
        packageCredit: user.packageCredit,
        totalIncome: user.totalIncome,
        pendingIncome: user.pendingIncome,
        releasedIncome: user.releasedIncome,
      },
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
