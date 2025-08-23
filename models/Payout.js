import mongoose from "mongoose"

const PayoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["direct", "passive"],
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for direct payouts, userId for passive payouts
    },
    status: {
      type: String,
      enum: ["pending", "released", "paid"],
      default: "pending",
    },
    relatedPackagePurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackagePurchase",
      default: null,
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    level: {
      type: Number,
      default: null, // 1 for first level, 2 for second level passive income
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Payout || mongoose.model("Payout", PayoutSchema)
