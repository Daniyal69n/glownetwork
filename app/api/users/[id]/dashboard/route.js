import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import User from "../../../../../models/User.js"
import PackagePurchase from "../../../../../models/PackagePurchase.js"
import Payout from "../../../../../models/Payout.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"

export async function GET(request, { params }) {
  try {
    await connectDB()

    // Get and verify token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id } = params

    // Check if user is accessing their own dashboard or admin accessing any
    if (decoded.userId !== id && decoded.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get user data
    const user = await User.findById(id)
      .populate("directDownline", "name email rank")
      .populate("referredBy", "name email referralCode")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get package purchases
    const packagePurchases = await PackagePurchase.find({ userId: id })
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)

    // Get payouts
    const payouts = await Payout.find({ userId: id })
      .populate("fromUserId", "name email")
      .sort({ createdAt: -1 })
      .limit(10)

    // Calculate payout summaries
    const payoutSummary = await Payout.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    const payoutStats = {
      pending: 0,
      released: 0,
      paid: 0,
    }

    payoutSummary.forEach((stat) => {
      payoutStats[stat._id] = stat.total
    })

    // Get downline count by rank
    const downlineStats = await User.aggregate([
      { $match: { referredBy: user._id } },
      {
        $group: {
          _id: "$rank",
          count: { $sum: 1 },
        },
      },
    ])

    const rankCounts = {}
    downlineStats.forEach((stat) => {
      rankCounts[stat._id] = stat.count
    })

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rank: user.rank,
        referralCode: user.referralCode,
        packageCredit: user.packageCredit,
        totalIncome: user.totalIncome,
        pendingIncome: user.pendingIncome,
        releasedIncome: user.releasedIncome,
        directDownline: user.directDownline,
        referredBy: user.referredBy,
      },
      packagePurchases,
      payouts,
      payoutStats,
      rankCounts,
      stats: {
        totalDownline: user.directDownline.length,
        packageCredit: user.packageCredit,
        totalEarnings: user.totalIncome,
        pendingPayouts: payoutStats.pending,
        releasedPayouts: payoutStats.released,
      },
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
