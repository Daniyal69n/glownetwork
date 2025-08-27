import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import User from "../../../../models/User.js"
import { hashPassword, generateToken } from "../../../../lib/auth.js"

export async function POST(request) {
  try {
    await connectDB()

    const { name, email, phone, password, referralCode } = await request.json()

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Name, email, phone, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Handle referral code
    let referredBy = null
    let uplineUser = null

    if (referralCode) {
      uplineUser = await User.findOne({ referralCode: referralCode.toUpperCase() })
      if (uplineUser) {
        referredBy = uplineUser._id
      }
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      referredBy,
      role: "member",
      rank: "guest",
    })

    // Ensure numeric referral code for the new user (sequential from 1000)
    if (!newUser.referralCode || !/^\d+$/.test(newUser.referralCode)) {
      try {
        const last = await User.aggregate([
          { $match: { referralCode: { $regex: /^\d+$/ } } },
          { $addFields: { refNum: { $toInt: "$referralCode" } } },
          { $sort: { refNum: -1 } },
          { $limit: 1 },
        ])
        const lastNum = last.length > 0 ? last[0].refNum : 999
        const nextNum = lastNum + 1
        newUser.referralCode = String(nextNum)
        await newUser.save()
      } catch (_) {
        // ignore and continue; signup should not fail due to referral assignment
      }
    }

    // Add new user to upline's direct downline
    if (uplineUser) {
      uplineUser.directDownline.push(newUser._id)
      await uplineUser.save()
    }

    // Generate JWT token
    const token = generateToken({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      rank: newUser.rank,
    })

    // Return user data (without password hash)
    const userData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      rank: newUser.rank,
      referralCode: newUser.referralCode,
      packageCredit: newUser.packageCredit,
      totalIncome: newUser.totalIncome,
      pendingIncome: newUser.pendingIncome,
      releasedIncome: newUser.releasedIncome,
    }

    const res = NextResponse.json({
      message: "Account created successfully",
      user: userData,
      token,
      referredBy: uplineUser ? uplineUser.name : null,
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
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
