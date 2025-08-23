import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import Payout from "../../../../../models/Payout.js"
import User from "../../../../../models/User.js"
import PackagePurchase from "../../../../../models/PackagePurchase.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // month, week, year
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Calculate date range
    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    } else {
      const now = new Date()
      const start = new Date()

      switch (period) {
        case "week":
          start.setDate(now.getDate() - 7)
          break
        case "month":
          start.setMonth(now.getMonth() - 1)
          break
        case "year":
          start.setFullYear(now.getFullYear() - 1)
          break
      }

      dateFilter = {
        createdAt: { $gte: start, $lte: now },
      }
    }

    // Get payout statistics
    const payoutStats = await Payout.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            status: "$status",
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    // Get package purchase statistics
    const packageStats = await PackagePurchase.aggregate([
      { $match: { ...dateFilter, status: "approved" } },
      {
        $group: {
          _id: "$packageAmount",
          total: { $sum: "$packageAmount" },
          count: { $sum: 1 },
        },
      },
    ])

    // Get top earners
    const topEarners = await User.find({})
      .select("name email rank totalIncome releasedIncome pendingIncome")
      .sort({ totalIncome: -1 })
      .limit(10)

    // Get rank distribution
    const rankDistribution = await User.aggregate([
      {
        $group: {
          _id: "$rank",
          count: { $sum: 1 },
          totalIncome: { $sum: "$totalIncome" },
          avgIncome: { $avg: "$totalIncome" },
        },
      },
    ])

    // Format payout statistics
    const formattedPayoutStats = {
      direct: { pending: 0, released: 0, paid: 0 },
      passive: { pending: 0, released: 0, paid: 0 },
      totals: { pending: 0, released: 0, paid: 0 },
    }

    payoutStats.forEach((stat) => {
      const { status, type } = stat._id
      formattedPayoutStats[type][status] = stat.total
      formattedPayoutStats.totals[status] += stat.total
    })

    // Calculate overall totals
    const overallStats = {
      totalPayouts: Object.values(formattedPayoutStats.totals).reduce((a, b) => a + b, 0),
      totalPackageSales: packageStats.reduce((sum, stat) => sum + stat.total, 0),
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ totalIncome: { $gt: 0 } }),
    }

    return NextResponse.json({
      period,
      dateRange: dateFilter,
      payoutStats: formattedPayoutStats,
      packageStats,
      topEarners,
      rankDistribution,
      overallStats,
    })
  } catch (error) {
    console.error("Earnings report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
