import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import PackagePurchase from "../../../../../../models/PackagePurchase.js"
import User from "../../../../../../models/User.js"
import Payout from "../../../../../../models/Payout.js"
import { verifyToken, getTokenFromRequest } from "../../../../../../lib/auth.js"
import {
  calculateDirectPayout,
  calculatePassiveIncome,
  isEligibleForPassiveIncome,
} from "../../../../../../lib/payouts.js"
import { checkAndPromoteUser } from "../../../../../../lib/ranks.js"

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

    // Find package purchase
    const packagePurchase = await PackagePurchase.findById(id).populate("userId")
    if (!packagePurchase) {
      return NextResponse.json({ error: "Package purchase not found" }, { status: 404 })
    }

    if (packagePurchase.status !== "pending") {
      return NextResponse.json({ error: "Package purchase is not pending" }, { status: 400 })
    }

    if (action === "reject") {
      // Reject package purchase
      packagePurchase.status = "rejected"
      packagePurchase.adminId = decoded.userId
      packagePurchase.rejectionReason = rejectionReason || "No reason provided"
      await packagePurchase.save()

      return NextResponse.json({
        message: "Package purchase rejected",
        purchase: packagePurchase,
      })
    }

    // Approve package purchase
    packagePurchase.status = "approved"
    packagePurchase.adminId = decoded.userId
    packagePurchase.approvedAt = new Date()
    await packagePurchase.save()

    const user = packagePurchase.userId
    const packageAmount = packagePurchase.packageAmount

    // Update user's package credit
    user.packageCredit += packageAmount
    await user.save()

    // Calculate and create direct payout for the buyer
    const directPayoutAmount = calculateDirectPayout(packageAmount, user.rank)
    await Payout.create({
      userId: user._id,
      amount: directPayoutAmount,
      type: "direct",
      status: "pending",
      relatedPackagePurchaseId: packagePurchase._id,
    })

    // Update user's pending income
    user.pendingIncome += directPayoutAmount
    await user.save()

    // Calculate passive income for uplines (1st and 2nd level)
    if (user.referredBy) {
      // First level upline
      const firstUpline = await User.findById(user.referredBy)
      if (firstUpline && isEligibleForPassiveIncome(firstUpline.rank, 1)) {
        const passiveAmount = calculatePassiveIncome(packageAmount)
        await Payout.create({
          userId: firstUpline._id,
          amount: passiveAmount,
          type: "passive",
          fromUserId: user._id,
          status: "pending",
          relatedPackagePurchaseId: packagePurchase._id,
          level: 1,
        })

        // Update first upline's pending income
        firstUpline.pendingIncome += passiveAmount
        await firstUpline.save()

        // Second level upline
        if (firstUpline.referredBy) {
          const secondUpline = await User.findById(firstUpline.referredBy)
          if (secondUpline && isEligibleForPassiveIncome(secondUpline.rank, 2)) {
            const secondPassiveAmount = calculatePassiveIncome(packageAmount)
            await Payout.create({
              userId: secondUpline._id,
              amount: secondPassiveAmount,
              type: "passive",
              fromUserId: user._id,
              status: "pending",
              relatedPackagePurchaseId: packagePurchase._id,
              level: 2,
            })

            // Update second upline's pending income
            secondUpline.pendingIncome += secondPassiveAmount
            await secondUpline.save()
          }
        }
      }
    }

    // Check for rank promotions (for the buyer and uplines)
    await checkAndPromoteUser(user._id)
    if (user.referredBy) {
      await checkAndPromoteUser(user.referredBy)
      const firstUpline = await User.findById(user.referredBy)
      if (firstUpline?.referredBy) {
        await checkAndPromoteUser(firstUpline.referredBy)
      }
    }

    return NextResponse.json({
      message: `Package approved - ${packageAmount.toLocaleString()} credited to user's account`,
      purchase: packagePurchase,
      directPayout: directPayoutAmount,
    })
  } catch (error) {
    console.error("Package approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
