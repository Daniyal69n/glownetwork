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
  // Fixed payout amounts based on package value
  const fixedPayouts = {
    20000: 6000,   // Rs 20,000 package = Rs 6,000 payout
    50000: 17500,  // Rs 50,000 package = Rs 17,500 payout  
    100000: 40000  // Rs 100,000 package = Rs 40,000 payout
  }
  
  // Return fixed amount if defined, otherwise use percentage calculation
  if (fixedPayouts[packageAmount]) {
    return fixedPayouts[packageAmount]
  }
  
  // Fallback to percentage calculation for any other amounts
  const percentage = RANK_PERCENTAGES[rank]
  return (packageAmount * percentage) / 100
}

export function calculatePassiveIncome(packageAmount) {
  return (packageAmount * PASSIVE_INCOME_RATE) / 100
}

export function isEligibleForPassiveIncome(rank, level) {
  // Guest and Assistant: no passive income
  if (["guest", "assistant"].includes(rank)) return false

  // Manager and above: eligible for 1st and 2nd level passive income
  if (["manager", "senior_manager", "diamond_manager", "global_manager", "director"].includes(rank)) {
    return level <= 2
  }

  return false
}

export function getRankPromotionRequirements(currentRank) {
  const requirements = {
    guest: { nextRank: "assistant", requirement: "Purchase any package" },
    assistant: { nextRank: "manager", requirement: "Purchase any package" },
    manager: { nextRank: "senior_manager", requirement: "Purchase any package" },
    senior_manager: { nextRank: "diamond_manager", requirement: "5 Senior Managers in downline" },
    diamond_manager: { nextRank: "global_manager", requirement: "5 Diamond Managers in downline" },
    global_manager: { nextRank: "director", requirement: "4 Global Managers in downline" },
    director: { nextRank: null, requirement: "Maximum rank achieved" },
  }

  return requirements[currentRank]
}
