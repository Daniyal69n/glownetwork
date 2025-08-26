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

// Generate unique referral code
UserSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode =
      this.name.replace(/\s+/g, "").toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
  }
  next()
})

export default mongoose.models.User || mongoose.model("User", UserSchema)
