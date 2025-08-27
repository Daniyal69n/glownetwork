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
import { checkAndPromoteUser, checkPackageBasedPromotion, promoteUplineChain } from "../../../../../../lib/ranks.js"

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
    // Safely parse body; default to approve if none provided
    let action = "approve"
    let rejectionReason = undefined
    try {
      const body = await request.json()
      action = body?.action || action
      rejectionReason = body?.rejectionReason
    } catch (_) {
      // No JSON body provided; proceed with defaults
    }

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

    // Update user's package credit (apply delivery charge deduction for credit only)
    const getDeliveryCharge = (amount) => {
      if (amount === 20000) return 1000
      if (amount === 50000) return 1500
      if (amount === 100000) return 2000
      return 0
    }

    const deliveryCharge = getDeliveryCharge(packageAmount)
    const netCredit = packageAmount - deliveryCharge
    user.packageCredit += netCredit
    await user.save()

    // Check for package-based rank promotion
    const packagePromotion = await checkPackageBasedPromotion(user._id, packageAmount)

    // Create payouts for uplines only (buyer gets no payout)
    let directPayoutAmount = 0
    if (user.referredBy) {
      const firstUpline = await User.findById(user.referredBy)
      if (firstUpline) {
        // Direct payout to referrer
        directPayoutAmount = calculateDirectPayout(packageAmount, user.rank)
        await Payout.create({
          userId: firstUpline._id,
          amount: directPayoutAmount,
          type: "direct",
          status: "pending",
          relatedPackagePurchaseId: packagePurchase._id,
        })
        firstUpline.pendingIncome += directPayoutAmount
        await firstUpline.save()

        // Passive income to referrer's referrer (second level only)
        if (firstUpline.referredBy) {
          const secondUpline = await User.findById(firstUpline.referredBy)
          if (secondUpline) {
            const passiveAmount = calculatePassiveIncome(packageAmount)
            await Payout.create({
              userId: secondUpline._id,
              amount: passiveAmount,
              type: "passive",
              fromUserId: user._id,
              status: "pending",
              relatedPackagePurchaseId: packagePurchase._id,
              level: 2,
            })
            secondUpline.pendingIncome += passiveAmount
            await secondUpline.save()
          }
        }
      }
    }

    // Check for rank promotions (for the buyer and entire upline chain)
    await checkAndPromoteUser(user._id)
    await promoteUplineChain(user._id)

    return NextResponse.json({
      message: `Package approved - Rs ${netCredit.toLocaleString()} credited after Rs ${deliveryCharge.toLocaleString()} delivery charges`,
      purchase: packagePurchase,
      directPayout: directPayoutAmount,
    })
  } catch (error) {
    console.error("Package approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
