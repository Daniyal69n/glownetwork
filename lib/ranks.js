import User from "../models/User.js"
import RankChange from "../models/RankChange.js"

export async function checkAndPromoteUser(userId) {
  const user = await User.findById(userId).populate("directDownline")
  if (!user) return null

  const currentRank = user.rank
  let newRank = null
  let reason = ""

  // Get all users in the downline tree (recursive)
  const downlineTree = await getDownlineTree(userId)

  switch (currentRank) {
    case "senior_manager":
      const seniorManagerCount = countRankInDownline(downlineTree, "senior_manager")
      if (seniorManagerCount >= 5) {
        newRank = "diamond_manager"
        reason = "5 Senior Managers in downline achieved"
      }
      break

    case "diamond_manager":
      const diamondManagerCount = countRankInDownline(downlineTree, "diamond_manager")
      if (diamondManagerCount >= 5) {
        newRank = "global_manager"
        reason = "5 Diamond Managers in downline achieved"
      }
      break

    case "global_manager":
      const globalManagerCount = countRankInDownline(downlineTree, "global_manager")
      if (globalManagerCount >= 4) {
        newRank = "director"
        reason = "4 Global Managers in downline achieved"
      }
      break
  }

  if (newRank && newRank !== currentRank) {
    // Update user rank
    user.rank = newRank
    await user.save()

    // Log rank change
    await RankChange.create({
      userId,
      oldRank: currentRank,
      newRank,
      reason,
    })

    return { oldRank: currentRank, newRank, reason }
  }

  return null
}

async function getDownlineTree(userId) {
  const user = await User.findById(userId).populate("directDownline")
  if (!user || !user.directDownline.length) return []

  let allDownline = [...user.directDownline]

  // Recursively get downline of each direct member
  for (const directMember of user.directDownline) {
    const subDownline = await getDownlineTree(directMember._id)
    allDownline = [...allDownline, ...subDownline]
  }

  return allDownline
}

function countRankInDownline(downlineArray, targetRank) {
  return downlineArray.filter((user) => user.rank === targetRank).length
}
