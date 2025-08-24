import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import Order from "../../../../../models/Order.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"

export async function GET(request, { params }) {
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

    // Find order
    const order = await Order.findById(id).populate("userId").populate("items.productId")
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
