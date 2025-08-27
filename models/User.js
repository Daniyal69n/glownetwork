import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    rank: {
      type: String,
      enum: ["guest", "assistant", "manager", "senior_manager", "diamond_manager", "global_manager", "director"],
      default: "guest",
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    packageCredit: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
    pendingIncome: {
      type: Number,
      default: 0,
    },
    releasedIncome: {
      type: Number,
      default: 0,
    },
    directDownline: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Incentive statuses
    umrahTicketStatus: {
      type: String,
      enum: ["locked", "pending", "approved"],
      default: "locked",
    },
    fixedSalaryStatus: {
      type: String,
      enum: ["locked", "pending", "approved"],
      default: "locked",
    },
    carPlanStatus: {
      type: String,
      enum: ["locked", "pending", "approved"],
      default: "locked",
    },
  },
  {
    timestamps: true,
  },
)

// Generate sequential numeric referral code starting from 1000
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isNew || this.referralCode) return next()

    const Model = this.constructor

    // Find the highest numeric referral code currently in use
    const last = await Model.aggregate([
      { $match: { referralCode: { $regex: /^\d+$/ } } },
      { $addFields: { refNum: { $toInt: "$referralCode" } } },
      { $sort: { refNum: -1 } },
      { $limit: 1 },
    ])

    const lastNum = last.length > 0 ? last[0].refNum : 999
    const nextNum = lastNum + 1

    this.referralCode = String(nextNum)
    return next()
  } catch (err) {
    return next(err)
  }
})

export default mongoose.models.User || mongoose.model("User", UserSchema)
