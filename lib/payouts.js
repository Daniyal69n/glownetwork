// Payout calculation logic according to exact specifications

export const RANK_PERCENTAGES = {
  assistant: 30,
  manager: 35,
  senior_manager: 40,
  diamond_manager: 40,
  global_manager: 40,
  director: 40,
}

export const PASSIVE_INCOME_RATE = 5 // 5% for eligible ranks

export function calculateDirectPayout(packageAmount, rank) {
  const percentage = RANK_PERCENTAGES[rank]
  return (packageAmount * percentage) / 100
}

export function calculatePassiveIncome(packageAmount) {
  return (packageAmount * PASSIVE_INCOME_RATE) / 100
}

export function isEligibleForPassiveIncome(rank, level) {
  // Assistant: no passive income
  if (rank === "assistant") return false

  // Manager and above: eligible for 1st and 2nd level passive income
  if (["manager", "senior_manager", "diamond_manager", "global_manager", "director"].includes(rank)) {
    return level <= 2
  }

  return false
}

export function getRankPromotionRequirements(currentRank) {
  const requirements = {
    assistant: { nextRank: "manager", requirement: "Purchase any package" },
    manager: { nextRank: "senior_manager", requirement: "Purchase any package" },
    senior_manager: { nextRank: "diamond_manager", requirement: "5 Senior Managers in downline" },
    diamond_manager: { nextRank: "global_manager", requirement: "5 Diamond Managers in downline" },
    global_manager: { nextRank: "director", requirement: "4 Global Managers in downline" },
    director: { nextRank: null, requirement: "Maximum rank achieved" },
  }

  return requirements[currentRank]
}
