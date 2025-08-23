import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import Payout from "../../../../../../models/Payout.js"
import { verifyToken, getTokenFromRequest } from "../../../../../../lib/auth.js"

export async function POST(request, { params }) {
  try {
    await connectDB()

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = params

    // Find payout
    const payout = await Payout.findById(id).populate("userId")
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    if (payout.status !== "pending") {
      return NextResponse.json({ error: "Payout is not pending" }, { status: 400 })
    }

    // Update payout status
    payout.status = "released"
    payout.adminId = decoded.userId
    payout.releasedAt = new Date()
    await payout.save()

    // Update user's income tracking
    const user = payout.userId
    user.pendingIncome -= payout.amount
    user.releasedIncome += payout.amount
    user.totalIncome = user.pendingIncome + user.releasedIncome
    await user.save()

    return NextResponse.json({
      message: `Payout of ₹${payout.amount.toLocaleString()} released to ${user.name}`,
      payout,
    })
  } catch (error) {
    console.error("Payout release error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
