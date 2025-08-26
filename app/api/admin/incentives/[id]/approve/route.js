import { NextResponse } from "next/server"
import connectDB from "../../../../../../lib/mongodb.js"
import User from "../../../../../../models/User.js"
import { verifyToken, getTokenFromRequest } from "../../../../../../lib/auth.js"

export async function POST(request, { params }) {
  try {
    await connectDB()

    // Authenticate admin
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = params
    let type = null
    try {
      const body = await request.json()
      type = body?.type
    } catch (_) {
      // ignore json parse errors
    }
    if (!type) {
      const url = new URL(request.url)
      type = url.searchParams.get('type')
    }

    if (!id || !["umrah", "salary", "car"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Map type to field
    const fieldMap = {
      umrah: "umrahTicketStatus",
      salary: "fixedSalaryStatus",
      car: "carPlanStatus",
    }

    const field = fieldMap[type]
    user[field] = "approved"
    await user.save()

    return NextResponse.json({
      message: "Incentive approved",
      user: {
        _id: user._id,
        name: user.name,
        rank: user.rank,
        umrahTicketStatus: user.umrahTicketStatus,
        fixedSalaryStatus: user.fixedSalaryStatus,
        carPlanStatus: user.carPlanStatus,
      },
    })
  } catch (error) {
    console.error("Approve incentive error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


