import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import Payout from "../../../../../models/Payout.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"

export async function POST(request) {
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

    const { payoutIds } = await request.json()

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json({ error: "Invalid payout IDs provided" }, { status: 400 })
    }

    // Find all pending payouts
    const payouts = await Payout.find({
      _id: { $in: payoutIds },
      status: "pending",
    }).populate("userId")

    if (payouts.length === 0) {
      return NextResponse.json({ error: "No pending payouts found" }, { status: 404 })
    }

    let totalReleased = 0
    const userUpdates = new Map()

    // Process each payout
    for (const payout of payouts) {
      // Update payout
      payout.status = "released"
      payout.adminId = decoded.userId
      payout.releasedAt = new Date()
      await payout.save()

      totalReleased += payout.amount

      // Accumulate user updates
      const userId = payout.userId._id.toString()
      if (!userUpdates.has(userId)) {
        userUpdates.set(userId, {
          user: payout.userId,
          pendingDecrease: 0,
          releasedIncrease: 0,
        })
      }

      const userUpdate = userUpdates.get(userId)
      userUpdate.pendingDecrease += payout.amount
      userUpdate.releasedIncrease += payout.amount
    }

    // Update all affected users
    for (const [userId, update] of userUpdates) {
      const user = update.user
      user.pendingIncome -= update.pendingDecrease
      user.releasedIncome += update.releasedIncrease
      user.totalIncome = user.pendingIncome + user.releasedIncome
      await user.save()
    }

    return NextResponse.json({
      message: `Successfully released ${payouts.length} payouts totaling ₹${totalReleased.toLocaleString()}`,
      releasedCount: payouts.length,
      totalAmount: totalReleased,
      affectedUsers: userUpdates.size,
    })
  } catch (error) {
    console.error("Bulk payout release error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
