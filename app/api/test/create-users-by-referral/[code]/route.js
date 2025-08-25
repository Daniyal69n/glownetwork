import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import User from "../../../../../models/User.js"
import { hashPassword } from "../../../../../lib/auth.js"
import { checkPackageBasedPromotion, checkAndPromoteUser } from "../../../../../lib/ranks.js"

// POST /api/test/create-users-by-referral/[code]
// Creates 5 test users referred by the user owning the provided referral code
export async function POST(req, { params }) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 })
    }

    const { code } = params || {}
    if (!code) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    await connectDB()

    const referrer = await User.findOne({ referralCode: code })
    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found for given code" }, { status: 404 })
    }

    const url = req?.nextUrl
    const desiredRank = url?.searchParams?.get("rank") || "senior_manager"
    const countParam = url?.searchParams?.get("count")
    const defaultCount = desiredRank === "global_manager" ? 4 : 5
    const createCount = Math.max(1, Number(countParam || defaultCount) || defaultCount)

    const createdUsers = []
    const passwordHash = await hashPassword("password123")
    const now = Date.now()

    for (let i = 0; i < createCount; i++) {
      const email = `test+ref_${code}_${now}_${i}@example.com`
      const phone = `90${(now + i).toString().slice(-8)}`

      const user = await User.create({
        name: `Test User ${i + 1} (${code})`,
        email,
        phone,
        passwordHash,
        role: "member",
        referredBy: referrer._id,
      })

      await User.findByIdAndUpdate(referrer._id, { $addToSet: { directDownline: user._id } })
      
      // Promote each created user to requested rank
      // Step 1: ensure base user becomes senior_manager via package credit
      await User.findByIdAndUpdate(user._id, { $inc: { packageCredit: 100000 } })
      await checkPackageBasedPromotion(user._id, 100000)

      if (desiredRank === "diamond_manager" || desiredRank === "global_manager") {
        // Create 5 senior managers under this user to satisfy diamond promotion rule
        for (let j = 0; j < 5; j++) {
          const cEmail = `test+ref_${code}_${now}_${i}_c${j}@example.com`
          const cPhone = `98${(now + i * 10 + j).toString().slice(-8)}`
          const child = await User.create({
            name: `Child Senior ${i + 1}-${j + 1} (${code})`,
            email: cEmail,
            phone: cPhone,
            passwordHash,
            role: "member",
            referredBy: user._id,
          })
          await User.findByIdAndUpdate(user._id, { $addToSet: { directDownline: child._id } })
          // Make each child a senior_manager
          await User.findByIdAndUpdate(child._id, { $inc: { packageCredit: 100000 } })
          await checkPackageBasedPromotion(child._id, 100000)
        }
        // Evaluate promotion for the base user to diamond_manager
        await checkAndPromoteUser(user._id)

        if (desiredRank === "global_manager") {
          // Build 5 diamond managers under this base user
          for (let d = 0; d < 5; d++) {
            const dmEmail = `test+ref_${code}_${now}_${i}_dm${d}@example.com`
            const dmPhone = `97${(now + i * 10 + d).toString().slice(-8)}`
            const dm = await User.create({
              name: `Child Diamond ${i + 1}-${d + 1} (${code})`,
              email: dmEmail,
              phone: dmPhone,
              passwordHash,
              role: "member",
              referredBy: user._id,
            })
            await User.findByIdAndUpdate(user._id, { $addToSet: { directDownline: dm._id } })
            // Ensure diamond candidate reaches senior_manager via package credit first
            await User.findByIdAndUpdate(dm._id, { $inc: { packageCredit: 100000 } })
            await checkPackageBasedPromotion(dm._id, 100000)
            // For each diamond candidate, create 5 seniors beneath
            for (let s = 0; s < 5; s++) {
              const sEmail = `test+ref_${code}_${now}_${i}_dm${d}_s${s}@example.com`
              const sPhone = `96${(now + i * 100 + d * 10 + s).toString().slice(-8)}`
              const sm = await User.create({
                name: `DM${d + 1}-Senior ${s + 1} (${code})`,
                email: sEmail,
                phone: sPhone,
                passwordHash,
                role: "member",
                referredBy: dm._id,
              })
              await User.findByIdAndUpdate(dm._id, { $addToSet: { directDownline: sm._id } })
              await User.findByIdAndUpdate(sm._id, { $inc: { packageCredit: 100000 } })
              await checkPackageBasedPromotion(sm._id, 100000)
            }
            // Promote this child to diamond_manager
            await checkAndPromoteUser(dm._id)
          }
          // Re-evaluate base user to global_manager
          await checkAndPromoteUser(user._id)
          await checkAndPromoteUser(user._id)
        }
      }

      const updated = await User.findById(user._id).select("name email phone rank packageCredit")
      createdUsers.push({ _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, rank: updated.rank, packageCredit: updated.packageCredit })
    }

    // If we created diamond managers, attempt to advance the referrer up to global_manager
    let referrerAfter = await User.findById(referrer._id).select("name rank packageCredit referralCode")
    if (desiredRank === "diamond_manager") {
      // Ensure referrer hits package threshold to unlock senior_manager
      if ((referrerAfter.packageCredit || 0) < 100000) {
        await User.findByIdAndUpdate(referrer._id, { $set: { packageCredit: 100000 } })
      }
      // Re-evaluate rank multiple times so sequential promotions can apply
      await checkAndPromoteUser(referrer._id) // -> senior_manager (via package)
      await checkAndPromoteUser(referrer._id) // -> diamond_manager (5 seniors in downline)
      await checkAndPromoteUser(referrer._id) // -> global_manager (5 diamonds in downline)
      referrerAfter = await User.findById(referrer._id).select("name rank packageCredit referralCode")
    }

    return NextResponse.json({
      message: `Created ${createdUsers.length} users as ${desiredRank} referred by ${referrer.name}`,
      referrer: { _id: referrerAfter._id, name: referrerAfter.name, referralCode: referrerAfter.referralCode, rank: referrerAfter.rank, packageCredit: referrerAfter.packageCredit },
      users: createdUsers,
    })
  } catch (error) {
    console.error("Create test users by referral error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Allow triggering via browser (GET) by delegating to POST logic in non-production
export async function GET(req, ctx) {
  return POST(req, ctx)
}


