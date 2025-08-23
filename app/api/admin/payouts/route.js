import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import Payout from "../../../../models/Payout.js"
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth.js"

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
    const status = searchParams.get("status") || "all"
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20

    // Build query
    const query = {}
    if (status !== "all") {
      query.status = status
    }

    // Get payouts with pagination
    const payouts = await Payout.find(query)
      .populate("userId", "name email rank referralCode")
      .populate("fromUserId", "name email referralCode")
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalPayouts = await Payout.countDocuments(query)

    // Get summary statistics
    const summaryStats = await Payout.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    const summary = {
      pending: { total: 0, count: 0 },
      released: { total: 0, count: 0 },
      paid: { total: 0, count: 0 },
    }

    summaryStats.forEach((stat) => {
      summary[stat._id] = { total: stat.total, count: stat.count }
    })

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total: totalPayouts,
        pages: Math.ceil(totalPayouts / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Admin payouts fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
