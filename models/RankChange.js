import mongoose from "mongoose"

const RankChangeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    oldRank: {
      type: String,
      enum: ["assistant", "manager", "senior_manager", "diamond_manager", "global_manager", "director"],
      required: true,
    },
    newRank: {
      type: String,
      enum: ["assistant", "manager", "senior_manager", "diamond_manager", "global_manager", "director"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    adminNotified: {
      type: Boolean,
      default: false,
    },
    userNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.RankChange || mongoose.model("RankChange", RankChangeSchema)
