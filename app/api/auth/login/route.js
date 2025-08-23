import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import User from "../../../../models/User.js"
import { comparePassword, generateToken } from "../../../../lib/auth.js"

export async function POST(request) {
  try {
    await connectDB()

    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated. Please contact support." }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      rank: user.rank,
    })

    // Return user data (without password hash)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rank: user.rank,
      referralCode: user.referralCode,
      packageCredit: user.packageCredit,
      totalIncome: user.totalIncome,
      pendingIncome: user.pendingIncome,
      releasedIncome: user.releasedIncome,
    }

    const res = NextResponse.json({
      message: "Login successful",
      user: userData,
      token,
    })

    // Set httpOnly auth cookie so middleware can authorize protected routes
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
