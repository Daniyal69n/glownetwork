import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import Order from "../../../../../../models/Order.js"
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
    const { trackingNumber } = await request.json()

    // Find order
    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "approved") {
      return NextResponse.json({ error: "Order must be approved before dispatch" }, { status: 400 })
    }

    // Update order status to dispatched
    order.status = "dispatched"
    order.trackingNumber = trackingNumber || null
    order.dispatchedAt = new Date()
    order.adminId = decoded.userId
    await order.save()

    return NextResponse.json({
      message: "Order marked as dispatched",
      order,
    })
  } catch (error) {
    console.error("Order dispatch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
