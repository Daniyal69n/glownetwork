import { NextResponse } from "next/server"
import connectDB from "../../../lib/mongodb.js"

export async function GET() {
  try {
    await connectDB()

    // Available packages with exact amounts as specified
    const packages = [
      {
        id: "starter",
        name: "Starter Package",
        amount: 20000,
        description: "Perfect for beginners starting their beauty business journey",
        features: [
          "Access to premium beauty products",
          "30% direct payout on investment",
          "Basic training materials",
          "Referral system access",
        ],
        popular: false,
      },
      {
        id: "professional",
        name: "Professional Package",
        amount: 50000,
        description: "Ideal for serious entrepreneurs ready to scale",
        features: [
          "Extended product catalog access",
          "35% direct payout on investment",
          "Advanced training & support",
          "Passive income eligibility",
          "Priority customer support",
        ],
        popular: true,
      },
      {
        id: "premium",
        name: "Premium Package",
        amount: 100000,
        description: "Maximum earning potential for dedicated professionals",
        features: [
          "Full product catalog access",
          "40% direct payout on investment",
          "VIP training & mentorship",
          "Maximum passive income potential",
          "Exclusive business tools",
          "Direct admin support",
        ],
        popular: false,
      },
    ]

    return NextResponse.json({ packages })
  } catch (error) {
    console.error("Get packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
