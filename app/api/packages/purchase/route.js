import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import PackagePurchase from "../../../../models/PackagePurchase.js"
import User from "../../../../models/User.js"
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth.js"

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

    const { packageAmount } = await request.json()

    // Validate package amount
    if (![20000, 50000, 100000].includes(packageAmount)) {
      return NextResponse.json({ error: "Invalid package amount" }, { status: 400 })
    }

    // Check if user exists and is active
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 404 })
    }

    // Check if user already has a pending package purchase
    const existingPendingPurchase = await PackagePurchase.findOne({
      userId: decoded.userId,
      status: "pending",
    })

    if (existingPendingPurchase) {
      return NextResponse.json(
        { error: "You already have a pending package purchase. Please wait for admin approval." },
        { status: 400 },
      )
    }

    // Create package purchase record
    const packagePurchase = await PackagePurchase.create({
      userId: decoded.userId,
      packageAmount,
      status: "pending",
    })

    // Populate user data for response
    await packagePurchase.populate("userId", "name email")

    return NextResponse.json({
      message: "Package purchase request submitted successfully. Awaiting admin approval.",
      purchase: {
        _id: packagePurchase._id,
        packageAmount: packagePurchase.packageAmount,
        status: packagePurchase.status,
        createdAt: packagePurchase.createdAt,
      },
    })
  } catch (error) {
    console.error("Package purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
