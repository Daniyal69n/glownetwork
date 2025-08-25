import User from "../models/User.js"
import RankChange from "../models/RankChange.js"

// Rank requirements for display
export const RANK_REQUIREMENTS = {
  assistant: {
    packageCredit: 20000,
    description: "Buy package worth Rs 20,000"
  },
  manager: {
    packageCredit: 50000,
    description: "Buy package worth Rs 50,000"
  },
  senior_manager: {
    packageCredit: 100000,
    description: "Buy package worth Rs 1,00,000 (1 Lakh)"
  },
  diamond_manager: {
    seniorManagers: 5,
    description: "Have 5 Senior Managers in your downline"
  },
  global_manager: {
    diamondManagers: 5,
    description: "Have 5 Diamond Managers in your downline"
  },
  director: {
    globalManagers: 4,
    description: "Have 4 Global Managers in your downline"
  }
}

// Function to get next rank requirements for a user
export function getNextRankRequirements(user) {
  const currentRank = user.rank
  const packageCredit = user.packageCredit

  switch (currentRank) {
    case "guest":
      return {
        nextRank: "assistant",
        requirement: RANK_REQUIREMENTS.assistant,
        progress: Math.min((packageCredit / RANK_REQUIREMENTS.assistant.packageCredit) * 100, 100),
        remaining: Math.max(RANK_REQUIREMENTS.assistant.packageCredit - packageCredit, 0)
      }
    case "assistant":
      return {
        nextRank: "manager",
        requirement: RANK_REQUIREMENTS.manager,
        progress: Math.min((packageCredit / RANK_REQUIREMENTS.manager.packageCredit) * 100, 100),
        remaining: Math.max(RANK_REQUIREMENTS.manager.packageCredit - packageCredit, 0)
      }
    case "manager":
      return {
        nextRank: "senior_manager",
        requirement: RANK_REQUIREMENTS.senior_manager,
        progress: Math.min((packageCredit / RANK_REQUIREMENTS.senior_manager.packageCredit) * 100, 100),
        remaining: Math.max(RANK_REQUIREMENTS.senior_manager.packageCredit - packageCredit, 0)
      }
    case "senior_manager":
      return {
        nextRank: "diamond_manager",
        requirement: RANK_REQUIREMENTS.diamond_manager,
        progress: 0, // Will be calculated based on downline (computed in API)
        remaining: 0
      }
    case "diamond_manager":
      return {
        nextRank: "global_manager",
        requirement: RANK_REQUIREMENTS.global_manager,
        progress: 0, // Will be calculated based on downline (computed in API)
        remaining: 0
      }
    case "global_manager":
      return {
        nextRank: "director",
        requirement: RANK_REQUIREMENTS.director,
        progress: 0, // Will be calculated based on downline (computed in API)
        remaining: 0
      }
    case "director":
      return {
        nextRank: null,
        requirement: null,
        progress: 100,
        remaining: 0
      }
    default:
      return {
        nextRank: "assistant",
        requirement: RANK_REQUIREMENTS.assistant,
        progress: Math.min((packageCredit / RANK_REQUIREMENTS.assistant.packageCredit) * 100, 100),
        remaining: Math.max(RANK_REQUIREMENTS.assistant.packageCredit - packageCredit, 0)
      }
  }
}

export async function checkAndPromoteUser(userId) {
  const user = await User.findById(userId).populate("directDownline")
  if (!user) return null

  const currentRank = user.rank
  let newRank = null
  let reason = ""

  // Get all users in the downline tree (recursive)
  const downlineTree = await getDownlineTree(userId)

  // Check package-based promotions first
  const totalPackageCredit = user.packageCredit

  // Package-based rank promotions
  if (totalPackageCredit >= 100000 && currentRank !== "senior_manager") {
    newRank = "senior_manager"
    reason = "Package credit reached 1,00,000 (1 Lakh)"
  } else if (totalPackageCredit >= 50000 && currentRank !== "manager" && currentRank !== "senior_manager") {
    newRank = "manager"
    reason = "Package credit reached 50,000"
  } else if (totalPackageCredit >= 20000 && currentRank !== "assistant" && currentRank !== "manager" && currentRank !== "senior_manager") {
    newRank = "assistant"
    reason = "Package credit reached 20,000"
  }

  // Referral-based promotions (only if no package-based promotion)
  if (!newRank) {
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

// Function to check and promote user based on package purchase
export async function checkPackageBasedPromotion(userId, packageAmount) {
  const user = await User.findById(userId)
  if (!user) return null

  const currentRank = user.rank
  let newRank = null
  let reason = ""

  // Calculate total package credit after this purchase
  const totalPackageCredit = user.packageCredit + packageAmount

  // Package-based rank promotions
  if (totalPackageCredit >= 100000 && currentRank !== "senior_manager") {
    newRank = "senior_manager"
    reason = "Package credit reached 1,00,000 (1 Lakh)"
  } else if (totalPackageCredit >= 50000 && currentRank !== "manager" && currentRank !== "senior_manager") {
    newRank = "manager"
    reason = "Package credit reached 50,000"
  } else if (totalPackageCredit >= 20000 && currentRank !== "assistant" && currentRank !== "manager" && currentRank !== "senior_manager") {
    newRank = "assistant"
    reason = "Package credit reached 20,000"
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

// Exported helper to count ranks across entire downline tree
export async function getDownlineRankCounts(userId) {
  const downline = await getDownlineTree(userId)
  const counts = {
    guest: 0,
    assistant: 0,
    manager: 0,
    senior_manager: 0,
    diamond_manager: 0,
    global_manager: 0,
    director: 0,
  }
  downline.forEach((member) => {
    if (counts[member.rank] !== undefined) counts[member.rank] += 1
  })
  return counts
}

// Promote all uplines in the referral chain by re-evaluating their rank
export async function promoteUplineChain(startUserId) {
  let current = await User.findById(startUserId).select("_id referredBy")
  const visited = new Set()
  while (current && current.referredBy && !visited.has(String(current.referredBy))) {
    visited.add(String(current.referredBy))
    await checkAndPromoteUser(current.referredBy)
    current = await User.findById(current.referredBy).select("_id referredBy")
  }
}
