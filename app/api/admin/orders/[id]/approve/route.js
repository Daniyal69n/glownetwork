import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import Order from "../../../../../../models/Order.js"
import Product from "../../../../../../models/Product.js"
import { verifyToken, getTokenFromRequest } from "../../../../../../lib/auth.js"

export async function POST(request, { params }) {
  try {
    console.log("=== Order Approval API Called ===")
    console.log("Params:", params)
    
    // Connect to database
    try {
      await connectDB()
      console.log("Database connected successfully")
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    console.log("Token received:", token ? "Yes" : "No")
    
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let decoded
    try {
      decoded = verifyToken(token)
      console.log("Token decoded successfully, role:", decoded?.role)
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (!decoded || decoded.role !== "admin") {
      console.log("User is not admin, role:", decoded?.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = params
    console.log("Order ID:", id)
    
    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
      console.log("Request body:", requestBody)
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    
    const { action, rejectionReason } = requestBody

    if (!action) {
      console.log("No action provided in request body")
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      console.log("Invalid action:", action)
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 })
    }

    // Find order
    console.log("Finding order with ID:", id)
    const order = await Order.findById(id).populate("userId").populate("items.productId")
    console.log("Order found:", order ? "Yes" : "No")
    
    if (!order) {
      console.log("Order not found")
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("Order status:", order.status)
    if (order.status !== "pending") {
      console.log("Order is not pending, current status:", order.status)
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 })
    }

    if (action === "reject") {
      console.log("Rejecting order")
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
    console.log("Approving order")
    const user = order.userId
    console.log("User found:", user ? "Yes" : "No")
    
    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user still has sufficient package credit
    const orderTotal = order.total || 0
    const userCredit = user.packageCredit || 0
    
    console.log(`Order approval check - Order total: ${orderTotal}, User credit: ${userCredit}`)
    
    if (userCredit < orderTotal) {
      console.log("Insufficient credit")
      return NextResponse.json(
        {
          error: `User has insufficient package credit. Required: Rs ${orderTotal.toLocaleString()}, Available: Rs ${userCredit.toLocaleString()}`,
        },
        { status: 400 },
      )
    }

    // Check stock availability again
    console.log("Checking stock availability")
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        console.log("Checking item:", item)
        if (!item.productId) {
          console.log("Product not found for item")
          return NextResponse.json(
            { error: "Product not found for one or more items" },
            { status: 400 },
          )
        }
        
        const product = await Product.findById(item.productId._id)
        console.log("Product found:", product ? "Yes" : "No")
        
        if (!product) {
          console.log("Product not found in database")
          return NextResponse.json(
            { error: `Product ${item.productId?.title || 'Unknown'} not found` },
            { status: 400 },
          )
        }
        
        console.log(`Stock check - Available: ${product.stock}, Required: ${item.quantity}`)
        if (product.stock < item.quantity) {
          console.log("Insufficient stock")
          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.productId?.title || 'Unknown Product'}. Available: ${product.stock}, Required: ${item.quantity}`,
            },
            { status: 400 },
          )
        }
      }
    }

    // Update order status
    console.log("Updating order status to approved")
    order.status = "approved"
    order.adminId = decoded.userId
    order.approvedAt = new Date()
    await order.save()
    console.log("Order saved successfully")

    // Deduct package credit from user
    console.log("Deducting package credit from user")
    user.packageCredit = Math.max(0, userCredit - orderTotal)
    await user.save()
    console.log("User credit updated successfully")

    // Update product stock
    console.log("Updating product stock")
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.productId && item.productId._id) {
          await Product.findByIdAndUpdate(item.productId._id, {
            $inc: { stock: -item.quantity },
          })
          console.log(`Stock updated for product ${item.productId._id}`)
        }
      }
    }

    console.log(`Order ${order._id} approved successfully`)

    return NextResponse.json({
      message: `Order approved - Rs ${orderTotal.toLocaleString()} deducted from user's package credit`,
      order,
    })
  } catch (error) {
    console.error("=== Order Approval Error ===")
    console.error("Error details:", error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
