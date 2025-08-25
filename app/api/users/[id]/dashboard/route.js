import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import User from "../../../../../models/User.js"
import PackagePurchase from "../../../../../models/PackagePurchase.js"
import Payout from "../../../../../models/Payout.js"
import Order from "../../../../../models/Order.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"
import { getNextRankRequirements, getDownlineRankCounts, checkAndPromoteUser } from "../../../../../lib/ranks.js"

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

    // Re-evaluate promotions so rank reflects latest downline before rendering
    await checkAndPromoteUser(id)

    // Get user data (after possible promotion)
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

    // Get recent orders
    const orders = await Order.find({ userId: id })
      .populate("items.productId", "name image")
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)

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

    // Get downline count by rank (entire tree, not only direct)
    const rankCounts = await getDownlineRankCounts(user._id)

    // Get next rank requirements
    const nextRankInfo = getNextRankRequirements(user)

    // Compute progress for downline-based ranks
    if (nextRankInfo?.nextRank === "diamond_manager") {
      const have = rankCounts.senior_manager || 0
      const need = 5
      nextRankInfo.progress = Math.min((have / need) * 100, 100)
      nextRankInfo.remaining = Math.max(need - have, 0)
    } else if (nextRankInfo?.nextRank === "global_manager") {
      const have = rankCounts.diamond_manager || 0
      const need = 5
      nextRankInfo.progress = Math.min((have / need) * 100, 100)
      nextRankInfo.remaining = Math.max(need - have, 0)
    } else if (nextRankInfo?.nextRank === "director") {
      const have = rankCounts.global_manager || 0
      const need = 4
      nextRankInfo.progress = Math.min((have / need) * 100, 100)
      nextRankInfo.remaining = Math.max(need - have, 0)
    }

    // Safety: if API ever returns progress for the same rank the user already has
    // (e.g., just promoted but stale computation), force next target and reset progress.
    if (nextRankInfo?.nextRank === user.rank) {
      const nextMap = {
        guest: "assistant",
        assistant: "manager",
        manager: "senior_manager",
        senior_manager: "diamond_manager",
        diamond_manager: "global_manager",
        global_manager: "director",
        director: null,
      }
      const forcedNext = nextMap[user.rank]
      nextRankInfo.nextRank = forcedNext
      // Reset progress for new target
      if (forcedNext === "global_manager") {
        nextRankInfo.progress = Math.min(((rankCounts.diamond_manager || 0) / 5) * 100, 100)
        nextRankInfo.remaining = Math.max(5 - (rankCounts.diamond_manager || 0), 0)
      } else if (forcedNext === "director") {
        nextRankInfo.progress = Math.min(((rankCounts.global_manager || 0) / 4) * 100, 100)
        nextRankInfo.remaining = Math.max(4 - (rankCounts.global_manager || 0), 0)
      } else {
        nextRankInfo.progress = 0
        nextRankInfo.remaining = 0
      }
    }

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
      orders,
      payoutStats,
      rankCounts,
      stats: {
        totalDownline: Object.values(rankCounts).reduce((a, b) => a + b, 0),
        packageCredit: user.packageCredit,
        totalEarnings: user.totalIncome,
        pendingPayouts: payoutStats.pending,
        releasedPayouts: payoutStats.released,
      },
      nextRankInfo,
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
