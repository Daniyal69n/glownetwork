import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import Order from "../../../../../../models/Order.js"
import Product from "../../../../../../models/Product.js"
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
    const { action, rejectionReason } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 })
    }

    // Find order
    const order = await Order.findById(id).populate("userId").populate("items.productId")
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 })
    }

    if (action === "reject") {
      // Reject order
      order.status = "rejected"
      order.adminId = decoded.userId
      order.rejectionReason = rejectionReason || "No reason provided"
      await order.save()

      return NextResponse.json({
        message: "Order rejected",
        order,
      })
    }

    // Approve order
    const user = order.userId

    // Check if user still has sufficient package credit
    if (user.packageCredit < order.total) {
      return NextResponse.json(
        {
          error: `User has insufficient package credit. Required: ₹${order.total.toLocaleString()}, Available: ₹${user.packageCredit.toLocaleString()}`,
        },
        { status: 400 },
      )
    }

    // Check stock availability again
    for (const item of order.items) {
      const product = await Product.findById(item.productId._id)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.productId.title}. Available: ${product?.stock || 0}`,
          },
          { status: 400 },
        )
      }
    }

    // Update order status
    order.status = "approved"
    order.adminId = decoded.userId
    await order.save()

    // Deduct package credit from user
    user.packageCredit -= order.total
    await user.save()

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity },
      })
    }

    return NextResponse.json({
      message: `Order approved - ₹${order.total.toLocaleString()} deducted from user's package credit`,
      order,
    })
  } catch (error) {
    console.error("Order approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
