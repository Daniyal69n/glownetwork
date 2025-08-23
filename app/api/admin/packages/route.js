import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import PackagePurchase from "../../../../models/PackagePurchase.js"
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10

    // Build query
    const query = {}
    if (status !== "all") {
      query.status = status
    }

    // Get total count
    const total = await PackagePurchase.countDocuments(query)

    // Get packages with pagination
    const packages = await PackagePurchase.find(query)
      .populate("userId", "name email referralCode")
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get admin packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
