import { NextResponse } from "next/server"
import connectDB from "../../../lib/mongodb.js"
import Order from "../../../models/Order.js"
import Product from "../../../models/Product.js"
import User from "../../../models/User.js"
import { verifyToken, getTokenFromRequest } from "../../../lib/auth.js"

export async function POST(request) {
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

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 })
    }

    // Get user and check package credit
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 404 })
    }

    // Validate and calculate order total
    let orderTotal = 0
    const validatedItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive) {
        return NextResponse.json({ error: `Product ${item.productId} not found or inactive` }, { status: 400 })
      }

      if (item.quantity <= 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}. Available: ${product.stock}` },
          { status: 400 },
        )
      }

      const itemTotal = product.price * item.quantity
      orderTotal += itemTotal

      validatedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // Check if user has sufficient package credit
    if (user.packageCredit < orderTotal) {
      return NextResponse.json(
        {
          error: `Insufficient package credit. Required: ₹${orderTotal.toLocaleString()}, Available: ₹${user.packageCredit.toLocaleString()}`,
        },
        { status: 400 },
      )
    }

    // Create order
    const order = await Order.create({
      userId: decoded.userId,
      items: validatedItems,
      total: orderTotal,
      status: "pending",
    })

    // Populate order with product details
    await order.populate("items.productId", "title sku images")
    await order.populate("userId", "name email")

    return NextResponse.json({
      message: "Order created successfully. Awaiting admin approval.",
      order: {
        _id: order._id,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10

    // Get user's orders
    const total = await Order.countDocuments({ userId: decoded.userId })

    const orders = await Order.find({ userId: decoded.userId })
      .populate("items.productId", "title sku images")
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
